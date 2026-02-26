# project-kos

A kos management web application built with Next.js 14, TypeScript, TailwindCSS, Prisma, and Midtrans.

## Features

- Admin-only authentication via NextAuth credentials
- Room and tenant management with drag-and-drop transfers
- Invoice and payment system with Midtrans Snap integration
- Monthly invoice generation (rent/storage)
- Room status tracking (AVAILABLE / OCCUPIED / RESERVED / MAINTENANCE)
- Zod validation on API routes

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up PostgreSQL and update `.env` with your credentials:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/mydb
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secret
   MIDTRANS_SERVER_KEY=your_key
   ```

3. Run Prisma migrations (requires running Postgres):

   ```bash
   npx prisma migrate dev --name init
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Visit http://localhost:3000 and log in with admin credentials.

> **Note:** database must be available locally. Use `npx prisma dev` or a
> remote Postgres instance.
