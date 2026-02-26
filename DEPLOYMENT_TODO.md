# Deployment TODO - HubSpot Health Checker

**Status:** App built ✅ | GitHub pushed ✅ | Deployment BLOCKED ⏸️

## What's Done
- ✅ MVP app complete (OAuth, audit engine, UI)
- ✅ Pushed to GitHub: https://github.com/figmints/hubspot-health-checker
- ✅ Running locally: http://localhost:3470
- ✅ Cloudflare config updated for `hubspot-health.figmints.net`

## What's Blocked

### 1. HubSpot OAuth App Creation
**Need:** Login to developers.hubspot.com with james@figmints.com

**Steps:**
1. Go to https://developers.hubspot.com
2. Sign in with Google (james@figmints.com)
3. Go to "My Apps" → "Create App"
4. Name: "HubSpot Health Checker"
5. Auth tab → Redirect URLs:
   - `http://localhost:3470/api/auth/callback` (dev)
   - `https://hubspot-health.figmints.net/api/auth/callback` (prod)
6. Scopes → Add:
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
   - `crm.schemas.contacts.read`
7. Copy Client ID and Client Secret

### 2. Cloudflare DNS Route
**Need:** Re-authenticate cloudflared CLI

```bash
cloudflared login
cloudflared tunnel route dns 0d928a85-8e48-40ce-a68f-471befee6077 hubspot-health.figmints.net
```

### 3. Environment Variables
Create `.env.local` in project root:
```
HUBSPOT_CLIENT_ID=<from step 1>
HUBSPOT_CLIENT_SECRET=<from step 1>
HUBSPOT_REDIRECT_URI=https://hubspot-health.figmints.net/api/auth/callback
SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### 4. Start Production
```bash
cd /Users/brad/projects/hubspot-health-checker
npm run build
PORT=3470 npm start &

# Restart the tunnel (already configured in config-cmo.yml)
cloudflared tunnel --config ~/.cloudflared/config-cmo.yml run 0d928a85-8e48-40ce-a68f-471befee6077 &
```

## Quick Deploy (Once Creds Ready)

```bash
# 1. Add env vars to .env.local
# 2. Build and run
cd /Users/brad/projects/hubspot-health-checker
npm run build && PORT=3470 npm start &

# 3. Restart tunnel (if not running)
ps aux | grep cloudflared | grep -v grep || \
  cloudflared tunnel --config ~/.cloudflared/config-cmo.yml run 0d928a85-8e48-40ce-a68f-471befee6077 &

# 4. Test at https://hubspot-health.figmints.net
```

## Alternative: Vercel Deploy
If you prefer Vercel:
```bash
vercel login
cd /Users/brad/projects/hubspot-health-checker
vercel --prod
# Add env vars in Vercel dashboard
```

---
*Brad couldn't complete these because isolated browser doesn't have Google session cached.*
