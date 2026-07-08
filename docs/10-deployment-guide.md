# Deployment Guide

## Overview

AuthForge is deployed using a modern cloud infrastructure:

- **Frontend:** Vercel (serverless static hosting)
- **Backend:** Render (Node.js web service)
- **Database:** Supabase PostgreSQL (managed database)
- **Domain:** Custom domain via Vercel + Render

## Architecture Diagram (Production)

```
User → DNS → Vercel (Frontend) → Render (Backend API) → Supabase (PostgreSQL)
         ↕
    Cloudflare (Optional - CDN + DDoS protection)
```

---

## Prerequisites

### Accounts

- [Vercel](https://vercel.com) account
- [Render](https://render.com) account
- [Supabase](https://supabase.com) account
- Domain name (optional)
- GitHub repository

### Tools

- Git
- Node.js 18+
- npm/yarn
- Vercel CLI (optional): `npm i -g vercel`

---

## 1. Database Deployment (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password
3. Select a region closest to your users
4. Wait for project initialization (~2 minutes)

### Step 2: Get Connection String

1. Go to Project Settings → Database
2. Find "Connection string" → "URI"
3. Copy the URI: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres`
4. Replace `[YOUR-PASSWORD]` with the database password you created

### Step 3: Run Migrations

```bash
# Navigate to backend directory
cd backend

# Set DATABASE_URL in .env
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres"

# Run migrations
npx prisma migrate deploy
```

---

## 2. Backend Deployment (Render)

### Step 1: Prepare Backend

**Ensure your `package.json` has these scripts:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  }
}
```

**Set Node version:**
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

### Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `authforge-api` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install && npm run db:generate && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

### Step 3: Set Environment Variables

Add these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=10000

DATABASE_URL=<supabase-connection-string>

JWT_ACCESS_SECRET=<generate-a-strong-random-secret>
JWT_REFRESH_SECRET=<generate-a-different-strong-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://authforge-api.onrender.com/api/v1/oauth/google/callback

GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
GITHUB_CALLBACK_URL=https://authforge-api.onrender.com/api/v1/oauth/github/callback

SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
FROM_EMAIL=noreply@authforge.com

FRONTEND_URL=https://authforge.vercel.app

CORS_ORIGIN=https://authforge.vercel.app
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for build and deploy (~3-5 minutes)
3. Verify: `https://authforge-api.onrender.com/api/v1/health`

---

## 3. Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

**Set environment variables:**
```env
VITE_API_URL=https://authforge-api.onrender.com/api/v1
VITE_APP_URL=https://authforge.vercel.app
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Framework Preset | `Vite` |

5. Add environment variables:
   - `VITE_API_URL`: `https://authforge-api.onrender.com/api/v1`

6. Click "Deploy"

#### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

1. In Vercel dashboard → Project → Settings → Domains
2. Add your domain: `authforge.com`
3. Update DNS records as instructed by Vercel
4. Update `FRONTEND_URL` and `CORS_ORIGIN` in Render environment variables

---

## 4. OAuth Provider Configuration

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → "APIs & Services" → "Credentials"
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI:
   - `https://authforge-api.onrender.com/api/v1/oauth/google/callback`
5. Copy Client ID and Client Secret to Render environment variables

### GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Authorization callback URL:
   - `https://authforge-api.onrender.com/api/v1/oauth/github/callback`
4. Copy Client ID and Client Secret to Render environment variables

---

## 5. Email Service Configuration

### Option A: Mailtrap (Development)

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Go to Email Testing → Inboxes → SMTP Settings
3. Copy credentials to environment variables

### Option B: SendGrid (Production)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Verify sender email
4. Configure environment variables

### Option C: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Verify domain
4. Configure:
   ```env
   RESEND_API_KEY=re_...
   FROM_EMAIL=noreply@authforge.com
   ```

---

## 6. Post-Deployment Checklist

### Health Checks

- [ ] `GET /api/v1/health` returns 200
- [ ] Frontend loads without errors
- [ ] Registration works end-to-end
- [ ] Login works end-to-end
- [ ] Token refresh works
- [ ] Logout works
- [ ] OAuth login works (Google + GitHub)
- [ ] Password reset flow works
- [ ] Email delivery works
- [ ] MFA setup and verification works

### Security Checks

- [ ] HTTPS is enforced
- [ ] No sensitive data in client-side code
- [ ] CORS headers are correctly configured
- [ ] Rate limiting is active
- [ ] Environment variables are properly set
- [ ] Database is not publicly accessible

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] API response times < 500ms
- [ ] No memory leaks
- [ ] Database queries are optimized

---

## 7. CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST "https://api.render.com/deploy/srv/${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 8. Monitoring & Maintenance

### Monitoring Tools

- **Uptime Monitoring:** Render's built-in health checks
- **Error Tracking:** Sentry (optional)
- **Performance:** Vercel Analytics
- **Database:** Supabase dashboard (query performance, connections)

### Backup Strategy

- **Database:** Supabase automatic backups (daily)
- **Environment Variables:** Stored securely in Render/Vercel dashboards
- **Code:** GitHub repository (always backed up)

### Update Process

1. Make changes in development branch
2. Test locally
3. Create pull request to main
4. CI/CD runs tests
5. Merge to main → automatic deployment

---

## 9. Rollback Procedure

### Frontend Rollback

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Backend Rollback

1. Render Dashboard → Environment
2. Click "Manual Rollback"
3. Select previous version

### Database Rollback

1. Supabase Dashboard → Database → Backups
2. Restore from backup (destructive - last resort)
3. Or create a migration to revert changes

---

## Quick Reference

### URLs

| Service | URL |
|---------|-----|
| Frontend | `https://authforge.vercel.app` |
| Backend API | `https://authforge-api.onrender.com` |
| API Base | `https://authforge-api.onrender.com/api/v1` |
| Database | Supabase project dashboard |

### Commands

```bash
# Deploy frontend
cd frontend && vercel --prod

# Deploy backend (push to main)
git push origin main

# Run database migrations
cd backend && npx prisma migrate deploy

# Open Prisma Studio (dev only)
npx prisma studio
```
