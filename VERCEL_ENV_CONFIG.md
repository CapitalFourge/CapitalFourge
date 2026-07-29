# Vercel Environment Variables Configuration

## Required Environment Variables for Production (Vercel Dashboard → Settings → Environment Variables)

### 1. API Base URL (CRITICAL - Fixes CORS & 404 errors)
```
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://capital-fourge-production.up.railway.app
Environment: Production, Preview, Development
```
**Why:** Used by:
- `lib/auth/AuthContext.tsx` (login, logout, token refresh, user fetch)
- `lib/apollo-client.ts` (GraphQL endpoint)
- `app/register/page.tsx` (registration)

Without this, the frontend defaults to `http://localhost:8080` or the hardcoded Railway URL, causing CORS errors when deployed to `https://www.capitalfourge.com`.

---

### 2. Vercel Analytics (Auto-configured)
```
Name: NEXT_PUBLIC_VERCEL_ANALYTICS_ID
Value: (auto-generated when you enable Analytics in Vercel Dashboard)
Environment: Production
```
**Note:** The `@vercel/analytics` package is already installed (v2.0.1) and `<Analytics />` component is added to `app/layout.tsx`.

---

## Quick Setup Checklist

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_BASE_URL` = `https://capital-fourge-production.up.railway.app`
3. Enable "Production", "Preview", "Development"
4. Redeploy: Vercel Dashboard → Deployments → "..." → Redeploy

---

## Verify Fix Works

After redeploy, check browser console on `https://www.capitalfourge.com`:
- ✅ No 404 for `/privacy?_rsc`, `/terms?_rsc`, `/about?_rsc` (pages now exist)
- ✅ No CORS error on `/api/auth/login` (correct origin allowed)
- ✅ Vercel Analytics script loads (check Network tab for `/_vercel/insights/script.js`)

---

## Backend CORS (Already Configured)

`portfolio-manager/src/main/java/.../SecurityConfig.java` lines 39-47 & 64-72 already include:
- `https://capitalfourge.com`
- `https://www.capitalfourge.com`
- `https://capital-fourge-*.vercel.app`

No backend changes needed if frontend env var is set correctly.