# NBCPrime — Website + Bot Bridge

Discord nuke bot ka pura website: React frontend + Node/Postgres backend + bot bridge.
Backend **PostgreSQL (Supabase)** pe chalta hai. Bot alag server pe rehta hai.

```
nbcprime-web/
├── backend/    Node + Express + PostgreSQL (Supabase)
├── frontend/   React + Vite + Tailwind
└── bot/        cogs/web_api.py  <- ye apne bot me daalna hai
```

---

# A TO Z SETUP

## PHASE 0 — Requirements

| Cheez | Link |
|---|---|
| Node.js 20 LTS | https://nodejs.org |
| VS Code | https://code.visualstudio.com |
| Git | https://git-scm.com |
| Supabase account | https://supabase.com |
| Railway account | https://railway.app |
| Vercel account | https://vercel.com |
| Domain | Namecheap / Cloudflare (~Rs 100/saal) |

Check karo:

```bash
node -v     # v20.x
npm -v      # 10.x
git --version
```

---

## PHASE 1 — Supabase (database)

1. https://supabase.com -> Sign in with GitHub
2. New Project
   - Name: `nbcprime`
   - Database Password: Generate -> COPY KARKE SAVE KARO
   - Region: apna sabse paas wala
   - Create (2 min lagenge)
3. Settings -> Database -> Connection string -> **Session pooler** -> URI copy karo

Format:

```
postgresql://postgres.ABCDEFGH:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

Session pooler hi lena (Transaction pooler nahi).

Ye tumhara `DATABASE_URL` hai.

---

## PHASE 2 — Discord Developer Portal

1. https://discord.com/developers/applications
2. Apni bot app select karo
3. OAuth2 -> Client Secret -> Reset Secret -> copy karo
4. OAuth2 -> Redirects -> Add Redirect:

```
http://localhost:4000/api/auth/discord/callback
```

5. Save Changes

Production redirect PHASE 8 me add karenge.

---

## PHASE 3 — Backend local chalao

```bash
cd backend
cp .env.example .env
```

Windows me `cp` na chale to `copy .env.example .env`.

`.env` bharo:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres.ABCDEFGH:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DB_SSL=true

JWT_SECRET=CHANGE_ME_LONG_RANDOM
JWT_EXPIRES=7d
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

FRONTEND_URL=http://localhost:5173

DISCORD_CLIENT_ID=1492941499099516998
DISCORD_CLIENT_SECRET=yahan_secret_paste_karo
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/discord/callback

BOT_API_URL=http://YOUR_BOT_VPS_IP:8080
BOT_API_KEY=dev_key_123
INGEST_KEY=dev_ingest_key_456

OWNER_DISCORD_ID=1213850390202810458
ADMIN_DISCORD_IDS=1213850390202810458
```

JWT_SECRET generate karo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Chalao:

```bash
npm install
npm run migrate     # tables banata hai
npm run seed        # demo posts
npm run dev
```

Test:

```bash
curl http://localhost:4000/api/health
```

Supabase -> Table Editor me `users`, `guilds`, `posts` dikhne chahiye.

---

## PHASE 4 — Frontend local chalao

NAYA terminal:

```bash
cd frontend
cp .env.example .env
```

`.env`:

```env
VITE_API_URL=http://localhost:4000
```

```bash
npm install
npm run dev
```

Browser me http://localhost:5173 kholo -> Sign in with Discord -> dashboard aana chahiye.

frontend/public/logo.png ko apne logo se replace kar do.

---

## PHASE 5 — Bot bridge

```bash
cp bot/cogs/web_api.py /path/to/your-bot/cogs/
```

Bot ke `.env` me:

```env
WEB_API_KEY=dev_key_123
WEB_API_PORT=8080
SITE_INGEST_URL=http://localhost:4000/api/ingest/event
SITE_INGEST_KEY=dev_ingest_key_456
```

`main.py` ke `on_ready()` me ye add karo:

```python
if not hasattr(bot, "_boot_time"):
    bot._boot_time = time.time()
```

Bot restart karo. Console me dikhna chahiye:

```
[WebAPI] bridge listening on 0.0.0.0:8080
```

Test:

```bash
curl -H "X-API-Key: dev_key_123" http://localhost:8080/api/health
```

---

## PHASE 6 — GitHub push

```bash
cd nbcprime-web
git init
git add .
git commit -m "nbcprime web"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nbcprime-web.git
git push -u origin main
```

`.gitignore` already hai so node_modules aur .env push nahi honge.

---

## PHASE 7 — Railway (backend deploy)

1. https://railway.app -> GitHub se login
2. New Project -> Deploy from GitHub repo -> repo select
3. Settings -> Root Directory -> `backend`
4. Variables -> ye sab add karo:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.ABCDEFGH:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DB_SSL=true
JWT_SECRET=wahi_long_random_string
JWT_EXPIRES=7d
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
FRONTEND_URL=https://yourdomain.com
DISCORD_CLIENT_ID=1492941499099516998
DISCORD_CLIENT_SECRET=tera_secret
DISCORD_REDIRECT_URI=https://api.yourdomain.com/api/auth/discord/callback
BOT_API_URL=http://YOUR_BOT_VPS_IP:8080
BOT_API_KEY=dev_key_123
INGEST_KEY=dev_ingest_key_456
OWNER_DISCORD_ID=1213850390202810458
ADMIN_DISCORD_IDS=1213850390202810458
```

5. Settings -> Deploy -> Start Command: `npm start`
6. Settings -> Networking -> Generate Domain

Schema server start pe auto-apply hota hai.

---

## PHASE 8 — Domain + Vercel

### 8.1 DNS

| Type | Name | Value |
|---|---|---|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | api | Railway ka target (Networking -> Custom Domain) |

### 8.2 Vercel

1. https://vercel.com -> Add New Project -> repo import
2. Root Directory -> `frontend`
3. Environment Variable: `VITE_API_URL = https://api.yourdomain.com`
4. Deploy
5. Settings -> Domains -> yourdomain.com add karo

### 8.3 Production URLs update karo

Discord Portal -> OAuth2 -> Redirects -> add:

```
https://api.yourdomain.com/api/auth/discord/callback
```

Railway variables update:

```
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
FRONTEND_URL=https://yourdomain.com
DISCORD_REDIRECT_URI=https://api.yourdomain.com/api/auth/discord/callback
```

Bot `.env`:

```
SITE_INGEST_URL=https://api.yourdomain.com/api/ingest/event
```

Bot VPS firewall:

```bash
ufw allow 22
ufw allow 8080
ufw enable
```

CUSTOM DOMAIN NAHI LIYA? To `backend/src/middleware/auth.js` me
`sameSite: 'lax'` ko `sameSite: 'none'` karo, warna login tootegi.

---

## PHASE 9 — Final checklist

- [ ] https://yourdomain.com khulta hai
- [ ] Sign in with Discord -> dashboard aata hai
- [ ] Admin Panel sidebar me dikhta hai
- [ ] Servers page pe bot ke servers dikhte hain
- [ ] Ek server pe Create Channels dabao -> Discord me channels bane
- [ ] Bot me `>ping` chalao -> Top Users me entry aaye
- [ ] Blogs page pe 2 posts dikhein
- [ ] Admin -> Posts -> naya post -> publish -> site pe live

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| password authentication failed | Supabase password me special char hain -> URL encode karo (@ -> %40) |
| ENOTFOUND aws-0-... | Region galat, string dobara copy karo |
| self signed certificate | DB_SSL=true hai? |
| too many connections | db.js me max kam karo |
| Login ke baad wapas login page | COOKIE_DOMAIN / sameSite issue |
| Railway build fail | Root Directory backend set hai? |
| Vercel build fail | Root Directory frontend set hai? |
| Bot API unreachable | BOT_API_URL aur firewall check |
| Leaderboard khaali | Bot restart, SITE_INGEST_URL check |
| redirect_uri mismatch | Portal me URI exactly same hona chahiye |

---

## SECURITY

1. Bot token aur Discord secret .env me daalo (code me hardcoded the)
2. Discord secret public ho gaya tha -> Portal me Reset Secret karo
3. WEB_API_KEY lamba rakho: `openssl rand -hex 32`
4. JWT_SECRET kabhi GitHub pe push mat karo

---

## COMMANDS

Backend:
- `npm run dev` - dev server
- `npm run start` - production
- `npm run migrate` - schema apply
- `npm run seed` - demo data

Frontend:
- `npm run dev` - dev
- `npm run build` - production build
