# TAP KLASS Cloud Deployment Guide

This project is now structured as a cloud-ready SaaS application shell.

## Frontend
- React + Vite + TailwindCSS + Framer Motion.
- Deploy to Vercel using `vercel.json`.
- Set environment variables from `.env.example` in Vercel.

## Backend
- Express REST API scaffold in `backend/`.
- Deploy to Render or Railway.
- Set `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN`.

## Database
- PostgreSQL schema is in `supabase/schema.sql`.
- Works with Supabase or Neon Postgres.

## Authentication
- Frontend supports Supabase Auth when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- Frontend can also use the hosted backend with `VITE_API_URL`.
- If neither is configured, the app uses a local preview fallback only.

## Production Checklist
- Create Supabase or Neon Postgres database.
- Run `supabase/schema.sql`.
- Deploy `backend/` to Railway or Render.
- Deploy frontend to Vercel.
- Configure environment variables.
- Point your custom domain to Vercel.

## Note On Next.js
The current build environment is Vite-based and is kept functional for this repository. The architecture added here mirrors the same frontend/backend/cloud separation used by Next.js SaaS apps and can be migrated into an `/app` Next.js router later without changing the backend/database contract.