# project-kos

A kos management web application built with Next.js 14, TypeScript, TailwindCSS, Prisma, and Midtrans.

## Features

- Admin-only authentication via NextAuth credentials
- Room and tenant management with drag-and-drop transfers
- Tenant checkout dan relokasi kamar via tombol / drag
- Invoice and payment system with Midtrans Snap integration
- Automatic invoice creation on lease assignment
- Daily recurring invoice generation via Supabase function + scheduler
- Room status tracking (Available / Occupied)
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
>
> ## Supabase setup
>
> 1. Deploy schema
>
> ```bash
> npx supabase db push
> ```
>
> 2. Deploy edge function
>
> ```bash
> npx supabase functions deploy daily-invoice
> ```
>
> 3. Set secrets:
>
> ```bash
> npx supabase secrets set INVOICE_CRON_KEY=your-secret-key
> ```
>
> 4. Trigger scheduler (external cron / local PM2):
>
> ```bash
> npm run invoice-scheduler
> ```
>
> 5. Supabase function URL:
>    `https://<project>.supabase.co/functions/v1/daily-invoice`
> 6. Pastikan API call termasuk header `Authorization: Bearer your-secret-key`
>
> ## Bekerja dengan tenancy
>
> - `RoomManagement` menampilkan `Daftar Penyewa` dan room grid.
> - Tenant yang tidak aktif akan berada di `Daftar Penyewa`, dapat assignment ke kamar.
> - Tombol `Keluar` di dalam kamar tersedia untuk checkout tenant.
> - Action `on_lease_created` otomatis membuat invoice pertama.
> - Function `generate_pending_invoices` membuat invoice lanjut harian.
