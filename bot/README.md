# Bot bridge

1. `cogs/web_api.py` ko apne bot ke `cogs/` folder me copy karo.
2. Bot ke `.env` me:

```env
WEB_API_KEY=openssl_rand_hex_32
WEB_API_PORT=8080
SITE_INGEST_URL=https://api.yourdomain.com/api/ingest/event
SITE_INGEST_KEY=openssl_rand_hex_32_other
```

3. `main.py` `on_ready()` me:

```python
if not hasattr(bot, "_boot_time"):
    bot._boot_time = time.time()
```

4. Firewall:

```bash
ufw allow from <BACKEND_IP> to any port 8080
```

5. Test:

```bash
curl -H "X-API-Key: YOUR_KEY" http://localhost:8080/api/health
```

Website backend me BOT_API_KEY = WEB_API_KEY,
aur INGEST_KEY = SITE_INGEST_KEY hona chahiye.
