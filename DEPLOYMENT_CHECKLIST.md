# HubSpot Health Checker - Deployment Checklist

## ✅ Development Complete

- [x] Next.js 14 project initialized with TypeScript
- [x] Tailwind CSS configured
- [x] Landing page with OAuth button
- [x] OAuth flow (auth/hubspot + auth/callback)
- [x] Audit API endpoint
- [x] Results storage and retrieval
- [x] Results display page with email capture
- [x] 5-category audit scoring system
- [x] Contact quality analysis
- [x] Deal pipeline health analysis
- [x] Company data quality analysis
- [x] Engagement health analysis
- [x] Data hygiene checks
- [x] Project builds successfully
- [x] No TypeScript errors
- [x] Git repository initialized
- [x] All documentation complete

## 🚀 Pre-Deployment

### Code Quality
- [x] No console.errors in production
- [x] Error handling implemented
- [x] TypeScript strict mode enabled
- [x] No any types (except necessary)

### Configuration
- [x] .env.example created
- [x] .env.local in .gitignore
- [x] .vercelignore configured
- [x] next.config.mjs configured
- [x] tailwind.config.ts configured

### Security
- [x] No secrets in code
- [x] No API keys hardcoded
- [x] SESSION_SECRET required
- [x] OAuth tokens secured in session
- [x] CORS headers correct

### Documentation
- [x] README.md complete
- [x] HUBSPOT_SETUP.md complete
- [x] DEPLOYMENT_GUIDE.md complete
- [x] REQUIREMENTS.md complete
- [x] PROGRESS.md complete

## 📋 Deployment Steps (For Brad)

### Step 1: Create HubSpot App
Follow `HUBSPOT_SETUP.md`:
- [ ] Create app at developers.hubspot.com
- [ ] Set name to "HubSpot Health Checker"
- [ ] Add scopes (contacts, deals, companies, schemas)
- [ ] Get Client ID and Client Secret
- [ ] Set redirect URI to `http://localhost:3000/api/auth/callback` for testing

### Step 2: Test Locally
```bash
cd /Users/brad/projects/hubspot-health-checker
echo "HUBSPOT_CLIENT_ID=your_id" >> .env.local
echo "HUBSPOT_CLIENT_SECRET=your_secret" >> .env.local
echo "HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback" >> .env.local
echo "SESSION_SECRET=dev-secret" >> .env.local
npm run dev
# Visit http://localhost:3000
```

- [ ] Landing page loads
- [ ] "Connect HubSpot" button works
- [ ] OAuth redirects to HubSpot
- [ ] Callback handles authorization code
- [ ] Audit runs and shows results
- [ ] Email capture works

### Step 3: Deploy to Vercel
Choose one deployment method:

**Option A: GitHub (Recommended)**
```bash
# Create GitHub repo and push
git remote add origin https://github.com/YOUR_ORG/hubspot-health-checker
git push -u origin main

# In Vercel dashboard:
# 1. Import from GitHub
# 2. Select hubspot-health-checker repo
# 3. Configure environment variables
# 4. Deploy
```

**Option B: Vercel CLI**
```bash
vercel --prod
# Select Jam's account
# Follow prompts
```

### Step 4: Configure Environment Variables in Vercel
Add to Vercel project settings → Environment Variables:

```
HUBSPOT_CLIENT_ID = [your_production_client_id]
HUBSPOT_CLIENT_SECRET = [your_production_client_secret]
HUBSPOT_REDIRECT_URI = https://your-app.vercel.app/api/auth/callback
SESSION_SECRET = [use node crypto to generate]
```

To generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Update HubSpot App Settings
1. Go to HubSpot Developer Portal
2. Edit "HubSpot Health Checker" app
3. Update redirect URI to: `https://your-app.vercel.app/api/auth/callback`
4. Save changes

### Step 6: Test Production
- [ ] Visit `https://your-app.vercel.app`
- [ ] Click "Connect HubSpot"
- [ ] Complete OAuth flow
- [ ] Run test audit
- [ ] Email capture form works
- [ ] Results display correctly
- [ ] Print report works

## 📊 Testing Scenarios

### Scenario 1: Fresh User
- [ ] User can connect without auth
- [ ] OAuth redirects work
- [ ] Session stores token securely

### Scenario 2: First Audit
- [ ] Audit completes in < 30 seconds
- [ ] Score is reasonable (0-100)
- [ ] All 5 categories show data
- [ ] Issues are relevant
- [ ] Recommendations are actionable

### Scenario 3: Multiple Audits
- [ ] Can run audit multiple times
- [ ] Results update properly
- [ ] No data leakage between users
- [ ] Session clears on logout

### Scenario 4: Error Handling
- [ ] Invalid OAuth code → error page with retry
- [ ] Network error during audit → error message
- [ ] Empty CRM (no data) → score of 0 with explanation
- [ ] Rate limit → graceful degradation

## 🎯 Post-Deployment Tasks

### Immediate
- [ ] Verify app loads
- [ ] Test OAuth flow end-to-end
- [ ] Run audit with real HubSpot data
- [ ] Verify email capture
- [ ] Check error logs

### Short Term
- [ ] Set up monitoring/alerting
- [ ] Create support documentation
- [ ] Brief team on features
- [ ] Set up analytics tracking

### Long Term
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Plan V2 features
- [ ] Optimize performance

## 📱 Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## ⚡ Performance Checklist

- [ ] First Load JS: < 100 KB
- [ ] Audit completes: < 30 seconds
- [ ] Results page loads: < 2 seconds
- [ ] OAuth round trip: < 10 seconds
- [ ] Mobile load time: < 3 seconds

## 🔐 Security Checklist

- [ ] No console.log of tokens
- [ ] SESSION_SECRET is strong (32+ bytes)
- [ ] HTTPS enforced
- [ ] CORS headers correct
- [ ] Environment variables are "Sensitive"
- [ ] No local storage of tokens
- [ ] Audit data not logged
- [ ] Email capture secured

## 📞 Support Resources

### If Things Break
1. Check Vercel logs: `vercel logs`
2. Check HubSpot status: https://status.hubapi.com
3. Review error messages in browser console
4. Check environment variables are set correctly

### Documentation
- `HUBSPOT_SETUP.md` - OAuth configuration
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `README.md` - Project overview and API reference
- `REQUIREMENTS.md` - Original specifications

## ✨ Success Criteria

App is live when:
- [ ] Publicly accessible URL works
- [ ] OAuth flow completes successfully
- [ ] Audit runs and returns scores
- [ ] Results page displays properly
- [ ] Email capture works
- [ ] No errors in browser console
- [ ] Mobile responsive
- [ ] Performance acceptable

---

**Status:** Ready for deployment ✅
**Last Updated:** 2026-02-26 00:25 EST
**Built By:** Subagent (HubSpot Health Checker MVP)
