# Daily Invoice Generation Setup

## Komponen yang Sudah Dibuat

### 1. Database Functions (schema.sql)

#### a. `create_first_invoice_on_lease()`

- Dipanggil otomatis ketika lease baru dibuat (via trigger `on_lease_created`)
- Membuat invoice pertama dengan:
  - `due_date` = `start_date` + `billing_cycle` months
  - `amount` = `custom_price` dari lease
  - `status` = 'unpaid'

#### b. `generate_pending_invoices()`

- Function yang mengecek semua leases dengan status room 'Occupied'
- Membandingkan tanggal invoice terakhir dengan billing cycle
- Otomatis membuat invoice baru jika sudah waktunya
- Return: table dengan detail invoice yang dibuat

### 2. Edge Function (Supabase)

- **File**: `supabase/functions/daily-invoice/index.ts`
- **Tujuan**: Endpoint untuk memanggil `generate_pending_invoices()` function
- **Cara Kerja**:
  - Menerima request dengan Bearer token
  - Memanggil database function
  - Return hasil generate invoices

---

## Setup Instructions

### Step 1: Apply Database Changes

```bash
# Run the updated schema.sql to add functions and triggers
# Via Supabase Dashboard atau CLI
supabase db pull
# atau push changes langsung ke database
```

### Step 2: Deploy Edge Function

```bash
# Deploy ke Supabase
supabase functions deploy daily-invoice
```

### Step 3: Set Environment Variable

Di Supabase Dashboard → Project Settings → Edge Function Secrets:

```
INVOICE_CRON_KEY = your-secret-key-here
```

### Step 4: Setup External Cron Scheduler

**Option A: Menggunakan Supabase Cron (jika available)**

- Masih dalam beta, lihat dokumentasi Supabase terbaru

**Option B: Menggunakan External Service (Recommended)**

Gunakan salah satu dari:

#### CronJobs.io (Free)

1. Buka https://cron-job.org
2. Create new cron job
3. Settings:
   - URL: `https://your-project.supabase.co/functions/v1/daily-invoice`
   - Method: POST
   - Headers: `Authorization: Bearer your-secret-key-here`
   - Schedule: Daily (e.g., 00:00 UTC)

#### CRON-job.com

1. Buka https://www.cron-job.org/en/
2. Buat scheduled job yang hit endpoint setiap hari

#### Serverless Alternative (AWS Lambda, Google Cloud Functions)

```javascript
// Setup automatic trigger
// atau gunakan Keep Alive service
```

---

## Testing

### Test Edge Function Secara Manual

```bash
curl -X POST https://your-project.supabase.co/functions/v1/daily-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-here"
```

### Via Supabase CLI

```bash
supabase functions invoke daily-invoice --no-verify-jwt
```

---

## How It Works (Flow)

### Scenario 1: Lease Baru Dibuat

```
1. Owner buat lease baru untuk tenant
2. Trigger: on_lease_created dipanggil
3. Function: create_first_invoice_on_lease() running
4. Invoice pertama dibuat dengan due_date = start_date + billing_cycle
✓ Tenant langsung bisa lihat invoice
```

### Scenario 2: Daily Invoice Check

```
1. Cron job hit endpoint /functions/v1/daily-invoice setiap hari
2. Edge function memanggil generate_pending_invoices()
3. Database check semua leases dengan room status = 'Occupied'
4. Untuk setiap lease:
   - Ambil last invoice created_at
   - Hitung: next due = last_due_date + billing_cycle
   - Jika next due <= hari ini, buat invoice baru dengan amount = custom_price
5. Return daftar invoice yang dibuat
✓ Invoices dibuat otomatis tanpa manual
```

---

## Configuration Customization

### Mengubah Waktu Eksekusi

Edit di cron scheduler Anda (e.g., 00:00 UTC → 08:00 UTC)

### Mengubah Amount Invoice

Menggunakan `lease.custom_price` (dari database saat lease dibuat)
Jika ingin berbeda, modify function di schema.sql

### Mengubah Due Date Calculation

Edit di `create_first_invoice_on_lease()` atau `generate_pending_invoices()`

```sql
-- Current: start_date + billing_cycle months
v_new_due_date := (v_last_invoice.due_date + (v_lease.billing_cycle || ' months')::interval)::date;
```

---

## Troubleshooting

### Invoice tidak terbuat

1. Check apakah room status = 'Occupied'
2. Check apakah lease.end_date = null atau di masa depan
3. Verify trigger `on_lease_created` sudah active
4. Check logs di dashboard

### Cron job tidak jalan

1. Verify INVOICE_CRON_KEY environment variable sudah set
2. Test manual via curl/Postman
3. Check response dari endpoint
4. Verify cron service status

### Edge function error

1. Check Supabase dashboard → Logging
2. Verify SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
3. Test database function langsung via SQL editor
