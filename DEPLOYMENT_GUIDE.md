# Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Connect GitHub to Vercel (Easiest)

1. **Push to GitHub:**
   ```bash
   cd /Users/brad/projects/hubspot-health-checker
   git remote add origin https://github.com/YOUR_ORG/hubspot-health-checker.git
   git branch -M main
   git push -u origin main
   ```

2. **In Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repo
   - Framework: Auto-detect (Next.js)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Environment Variables:**
   - Add these to your Vercel project settings:
   ```
   HUBSPOT_CLIENT_ID=your_client_id
   HUBSPOT_CLIENT_SECRET=your_client_secret
   HUBSPOT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
   SESSION_SECRET=use-a-strong-random-string-here
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Option 2: Using Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /Users/brad/projects/hubspot-health-checker
   vercel
   ```
   - Select Jam's account when prompted
   - Project name: `hubspot-health-checker`
   - Framework: Next.js
   - Build: `npm run build`
   - Output: `.next`

3. **Set Environment Variables:**
   ```bash
   vercel env add HUBSPOT_CLIENT_ID
   vercel env add HUBSPOT_CLIENT_SECRET
   vercel env add HUBSPOT_REDIRECT_URI
   vercel env add SESSION_SECRET
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Post-Deployment

### 1. Update HubSpot OAuth Settings

After getting your Vercel domain:

1. Go to [HubSpot Developer App](https://developers.hubspot.com)
2. Select "HubSpot Health Checker" app
3. In "Auth" tab, update redirect URI:
   - Add: `https://your-app.vercel.app/api/auth/callback`

### 2. Test the Live App

1. Visit `https://your-app.vercel.app`
2. Click "Connect HubSpot"
3. Complete OAuth flow
4. Run a test audit

### 3. Monitor Logs

View deployment logs in Vercel dashboard:
```bash
vercel logs
```

## Environment Variables

Required variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `HUBSPOT_CLIENT_ID` | Your HubSpot app client ID | `abc123...` |
| `HUBSPOT_CLIENT_SECRET` | Your HubSpot app client secret | `xyz789...` |
| `HUBSPOT_REDIRECT_URI` | OAuth callback URL | `https://app.vercel.app/api/auth/callback` |
| `SESSION_SECRET` | Session encryption key | A long random string |

## Generate SESSION_SECRET

Use this command to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online tool: https://www.random.org/strings/

## Custom Domain (Optional)

After deployment:

1. In Vercel project settings → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update HUBSPOT_REDIRECT_URI in HubSpot app settings
5. Update SESSION_SECRET in Vercel environment variables

## Troubleshooting

### "Audit failed" on production

1. Check Vercel logs: `vercel logs`
2. Verify HUBSPOT_CLIENT_SECRET is correct
3. Verify HUBSPOT_REDIRECT_URI matches HubSpot app settings
4. Check HubSpot API status at [status.hubapi.com](https://status.hubapi.com)

### "Invalid redirect URI" error

1. Make sure HUBSPOT_REDIRECT_URI in Vercel env vars matches your actual domain
2. Update HubSpot app redirect URI if you changed the domain
3. Clear browser cookies and try again

### Slow performance

1. Check HubSpot API quotas in developer portal
2. Reduce audit size from 500 to 100 records in `lib/hubspot.ts`
3. Enable edge caching with Vercel Image Optimization

## Performance Tips

- The audit typically completes in 10-30 seconds
- Fetches up to 500 records per endpoint (contacts, deals, companies)
- To optimize:
  - Reduce record limits in `getContacts()`, `getDeals()`, `getCompanies()`
  - Implement background job processing for larger datasets
  - Add caching for repeated audits

## Security Checklist

- [ ] HubSpot app created with correct scopes
- [ ] CLIENT_SECRET is never exposed in code or logs
- [ ] SESSION_SECRET is a strong random string
- [ ] HTTPS enforced on custom domain
- [ ] Vercel production environment locked down
- [ ] Environment variables are "Sensitive"
- [ ] .env.local in .gitignore
- [ ] Regular SECRET rotation planned (monthly recommended)

## Monitoring & Analytics

After deployment, monitor:

1. **Vercel Dashboard:**
   - Build times
   - Function invocations
   - Error rates

2. **Custom Analytics:**
   - Add Vercel Web Analytics
   - Track audit conversion rates
   - Monitor email captures

## Rollback

To rollback to a previous deployment:

1. In Vercel dashboard, go to "Deployments"
2. Find the previous stable deployment
3. Click "..." → "Promote to Production"

## Questions?

Refer to:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [HubSpot OAuth Docs](https://developers.hubspot.com/docs/methods/oauth2/oauth2-overview)
