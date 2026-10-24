# cogs/premium.py — site <-> bot premium sync
# Backend (api-nbcprime) se premium list pull karke premium_users.json update karta hai.
import os
import json
import time
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import aiohttp
import discord
from discord.ext import commands, tasks

SITE_API = os.getenv("SITE_API_URL", "https://api-nbcprime.vercel.app").rstrip("/")
SITE_KEY = os.getenv("SITE_INGEST_KEY", "")

PREMIUM_FILE = "premium_users.json"
DETAILS_FILE = "premium_details.json"

SYNC_MINUTES = int(os.getenv("PREMIUM_SYNC_MINUTES", "10"))
BOOST_PREFIX = "server_boost:"


def _read(path: str, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception:
        return default


def _write(path: str, data: Any) -> None:
    tmp = f"{path}.tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        os.replace(tmp, path)
    except OSError as e:
        print(f"[Premium] write {path} failed: {e}")


def load_premium() -> Dict[str, Any]:
    data = _read(PREMIUM_FILE, {})
    return data if isinstance(data, dict) else {}


def is_premium(user_id) -> bool:
    uid = str(user_id)
    if uid in load_premium():
        details = _read(DETAILS_FILE, {})
        rec = details.get(uid) if isinstance(details, dict) else None
        until = (rec or {}).get("until")
        if until:
            try:
                if datetime.fromisoformat(str(until).replace("Z", "+00:00")) < datetime.now(timezone.utc):
                    return False
            except Exception:
                pass
        return True
    return False


class Premium(commands.Cog):
    """Keeps premium_users.json in sync with the website."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_sync: Optional[float] = None
        self.last_count = 0

    async def cog_load(self):
        self.session = aiohttp.ClientSession()
        if SITE_KEY:
            self.sync_loop.start()
            self.expiry_loop.start()
        else:
            print("[Premium] SITE_INGEST_KEY missing — sync disabled")

    async def cog_unload(self):
        for loop in (self.sync_loop, self.expiry_loop):
            if loop.is_running():
                loop.cancel()
        if self.session and not self.session.closed:
            await self.session.close()

    # ---------------- network ----------------
    async def fetch_snapshot(self) -> Optional[dict]:
        if self.session is None or self.session.closed:
            return None
        url = f"{SITE_API}/api/premium/snapshot"
        try:
            async with self.session.get(
                url,
                headers={"X-Ingest-Key": SITE_KEY},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status != 200:
                    print(f"[Premium] snapshot {resp.status}")
                    return None
                return await resp.json(content_type=None)
        except Exception as e:
            print(f"[Premium] snapshot failed: {e}")
            return None

    async def sync_now(self) -> int:
        data = await self.fetch_snapshot()
        if not data or not data.get("ok"):
            return 0

        users = data.get("users") or {}
        details = {uid: {"until": rec.get("until"), "source": rec.get("source")}
                   for uid, rec in users.items() if isinstance(rec, dict)}

        # boost se mile premium ko overwrite na karo
        local = load_premium()
        merged = {uid: src for uid, src in local.items() if str(src).startswith(BOOST_PREFIX)}
        for uid, rec in users.items():
            merged[str(uid)] = str((rec or {}).get("source") or "site")

        _write(PREMIUM_FILE, merged)
        _write(DETAILS_FILE, details)

        self.last_sync = time.time()
        self.last_count = len(merged)
        return len(users)

    # ---------------- loops ----------------
    @tasks.loop(minutes=SYNC_MINUTES)
    async def sync_loop(self):
        try:
            count = await self.sync_now()
            print(f"[Premium] synced {count} site-premium user(s)")
        except Exception as e:
            print(f"[Premium] sync error: {e}")

    @sync_loop.before_loop
    async def _before_sync(self):
        await self.bot.wait_until_ready()
        await asyncio.sleep(5)

    @tasks.loop(hours=1)
    async def expiry_loop(self):
        """Local file se expired entries hatao (site down ho to bhi)."""
        try:
            details = _read(DETAILS_FILE, {})
            if not isinstance(details, dict) or not details:
                return
            now = datetime.now(timezone.utc)
            users = load_premium()
            removed = []
            for uid, rec in list(details.items()):
                until = (rec or {}).get("until")
                if not until:
                    continue
                try:
                    if datetime.fromisoformat(str(until).replace("Z", "+00:00")) < now:
                        if not str(users.get(uid, "")).startswith(BOOST_PREFIX):
                            users.pop(uid, None)
                        details.pop(uid, None)
                        removed.append(uid)
                except Exception:
                    pass
            if removed:
                _write(PREMIUM_FILE, users)
                _write(DETAILS_FILE, details)
                print(f"[Premium] expired removed: {len(removed)}")
        except Exception as e:
            print(f"[Premium] expiry error: {e}")

    # ---------------- listeners ----------------
    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        """Boost = premium. main.py wala logic yahan bhi safe rakha gaya hai."""
        guild_id = int(os.getenv("BOOST_GUILD_ID", "0") or 0)
        if guild_id and after.guild.id != guild_id:
            return
        if (before.premium_since is None) == (after.premium_since is None):
            return

        source = f"{BOOST_PREFIX}{after.guild.id}"
        users = load_premium()
        uid = str(after.id)

        if after.premium_since is not None:
            if uid not in users:
                users[uid] = source
                _write(PREMIUM_FILE, users)
        elif users.get(uid) == source:
            users.pop(uid, None)
            _write(PREMIUM_FILE, users)

    # ---------------- commands ----------------
    @commands.group(name="psync", invoke_without_command=True)
    async def psync(self, ctx):
        msg = await ctx.send("🔄 Site se premium sync kar raha hoon...")
        count = await self.sync_now()
        await msg.edit(content=f"✅ Sync complete. `{count}` site-premium users loaded.")

    @psync.command(name="status")
    async def psync_status(self, ctx):
        users = load_premium()
        when = "never" if not self.last_sync else f"<t:{int(self.last_sync)}:R>"
        await ctx.send(
            f"📦 **Premium sync**\nTotal entries: `{len(users)}`\nLast sync: {when}\nSite: `{SITE_API}`"
        )

    @commands.command(name="pcheck")
    async def pcheck(self, ctx, user: discord.User = None):
        target = user or ctx.author
        if is_premium(target.id):
            await ctx.send(f"👑 **{target.name}** is premium.")
        else:
            await ctx.send(f"❌ **{target.name}** is not premium.")


async def setup(bot):
    await bot.add_cog(Premium(bot))
