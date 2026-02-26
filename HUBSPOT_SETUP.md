# HubSpot OAuth Setup Guide

## Step 1: Create a HubSpot Developer Account

1. Go to [developers.hubspot.com](https://developers.hubspot.com)
2. Sign in with your HubSpot account (or create one)
3. Go to "My Apps" in the top right

## Step 2: Create a New App

1. Click "Create App"
2. Name it: "HubSpot Health Checker"
3. In the "Auth" tab:
   - Scroll to "Redirect URLs"
   - Add your redirect URLs:
     - For local development: `http://localhost:3000/api/auth/callback`
     - For production (Vercel): `https://your-app.vercel.app/api/auth/callback`

## Step 3: Set Required Scopes

In the "Scopes" section, search for and select:
- `crm.objects.contacts.read` - Read access to contacts
- `crm.objects.companies.read` - Read access to companies
- `crm.objects.deals.read` - Read access to deals
- `crm.schemas.contacts.read` - Read contact schemas

Click "Save"

## Step 4: Get Your Credentials

1. Go to the "Auth" tab
2. Copy these values:
   - **Client ID** (under "Credentials")
   - **Client Secret** (under "Credentials" - click "Show")

## Step 5: Configure Environment Variables

### For Local Development:

Create `.env.local` in the project root:

```
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=dev-secret-key-change-in-production
```

### For Vercel Deployment:

1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add the following:

```
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
SESSION_SECRET=your-production-secret-key (use a strong random string)
```

## Step 6: Test Locally

1. Make sure env variables are in `.env.local`
2. Run `npm run dev`
3. Visit `http://localhost:3000`
4. Click "Connect HubSpot"
5. You should be redirected to HubSpot to authorize

## Step 7: Test with Figmints Account (Optional)

If you want to test with the Figmints HubSpot instance:

1. Ask the team for the Figmints HubSpot portal credentials
2. Use them to log in when authenticating
3. The audit will run against the Figmints instance

## Troubleshooting

### "Invalid redirect URI"
- Make sure the redirect URI in your `.env.local` exactly matches what you configured in the HubSpot app settings

### "Client authentication failed"
- Double-check your Client ID and Client Secret are correct
- Make sure you didn't accidentally include extra spaces

### "Scopes not granted"
- The user's HubSpot account needs permission to approve the requested scopes
- If using a business account, you may need admin approval

### OAuth Loop (keeps redirecting)
- Clear your browser cache and cookies
- Check that SESSION_SECRET is set in .env.local

## Production Deployment

Before deploying to Vercel:

1. Update HUBSPOT_REDIRECT_URI to your production domain
2. Update SESSION_SECRET to a strong random string
3. Test in staging environment first
4. Monitor logs after deployment

## Security Notes

- **Never commit `.env.local`** to git (it's in .gitignore)
- **SESSION_SECRET** should be a strong random string in production
- Rotate your Client Secret regularly
- Monitor for unauthorized access to your HubSpot data
