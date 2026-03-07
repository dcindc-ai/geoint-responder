# GEOINT Discussion Responder

A tool for generating personalized discussion post responses for Fundamentals of Geospatial Intelligence at UMD.

## Deploy to Vercel

### Step 1 — Push to GitHub
1. Create a new repository on github.com (name it `geoint-responder`)
2. Upload all these files to the repo

### Step 2 — Connect to Vercel
1. Go to vercel.com and sign in with your GitHub account
2. Click "Add New Project"
3. Select the `geoint-responder` repo
4. Click Deploy (Vercel auto-detects Next.js — no config needed)

### Step 3 — Add your API key
1. In Vercel, go to your project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = your Anthropic API key
3. Click Save, then go to Deployments and click "Redeploy"

### Step 4 — Done
Vercel gives you a permanent URL like `geoint-responder.vercel.app`. Bookmark it — it's yours forever.

## Getting your Anthropic API key
Go to console.anthropic.com → API Keys → Create Key
