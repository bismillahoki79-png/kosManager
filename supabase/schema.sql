-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enum Types
do $$ begin
  create type user_role as enum ('owner', 'tenant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type room_status as enum ('Available', 'Occupied', 'Storage');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type invoice_status as enum ('unpaid', 'pending_verification', 'paid');
exception when duplicate_object then null;
end $$;

-- Create Profiles Table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role user_role default 'tenant',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Rooms Table
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status room_status default 'Available',
  base_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Leases Table
create table if not exists leases (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references profiles(id) not null,
  room_id uuid references rooms(id) not null,
  start_date date not null,
  end_date date,
  billing_cycle integer default 1, -- in months
  custom_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Invoices Table
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  lease_id uuid references leases(id) not null,
  amount numeric not null,
  due_date date not null,
  status invoice_status default 'unpaid',
  proof_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Room History Table
create table if not exists room_history (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) not null,
  tenant_id uuid references profiles(id),
  action text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table if exists profiles enable row level security;
alter table if exists rooms enable row level security;
alter table if exists leases enable row level security;
alter table if exists invoices enable row level security;
alter table if exists room_history enable row level security;

-- Drop existing policies before recreating
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Rooms are viewable by everyone" on rooms;
drop policy if exists "Only owner can insert/update/delete rooms" on rooms;
drop policy if exists "Owners can view all leases" on leases;
drop policy if exists "Tenants can view own leases" on leases;
drop policy if exists "Only owner can manage leases" on leases;
drop policy if exists "Owners can view all invoices" on invoices;
drop policy if exists "Tenants can view own invoices via lease" on invoices;
drop policy if exists "Only owner can insert/delete invoices" on invoices;
drop policy if exists "Only owner can delete invoices" on invoices;
drop policy if exists "Tenants can update invoice (upload proof)" on invoices;
drop policy if exists "Owners can update invoice (verify status)" on invoices;
drop policy if exists "Owners can view room history" on room_history;
drop policy if exists "Only owner can insert room history" on room_history;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Policies for Rooms
create policy "Rooms are viewable by everyone"
  on rooms for select
  using ( true );

create policy "Only owner can insert/update/delete rooms"
  on rooms for all
  using ( auth.uid() in (select id from profiles where role = 'owner') );

-- Policies for Leases
create policy "Owners can view all leases"
  on leases for select
  using ( auth.uid() in (select id from profiles where role = 'owner') );

create policy "Tenants can view own leases"
  on leases for select
  using ( auth.uid() = tenant_id );

create policy "Only owner can manage leases"
  on leases for all
  using ( auth.uid() in (select id from profiles where role = 'owner') );

-- Policies for Invoices
create policy "Owners can view all invoices"
  on invoices for select
  using ( auth.uid() in (select id from profiles where role = 'owner') );

create policy "Tenants can view own invoices via lease"
  on invoices for select
  using ( 
    lease_id in (
      select id from leases where tenant_id = auth.uid()
    )
  );

create policy "Only owner can insert/delete invoices"
  on invoices for insert
  with check ( auth.uid() in (select id from profiles where role = 'owner') );

create policy "Only owner can delete invoices"
  on invoices for delete
  using ( auth.uid() in (select id from profiles where role = 'owner') );

create policy "Tenants can update invoice (upload proof)"
  on invoices for update
  using ( 
    lease_id in (
      select id from leases where tenant_id = auth.uid()
    )
  )
  with check (
    lease_id in (
      select id from leases where tenant_id = auth.uid()
    )
  );
  
create policy "Owners can update invoice (verify status)"
  on invoices for update
  using ( auth.uid() in (select id from profiles where role = 'owner') );


-- Policies for Room History
create policy "Owners can view room history"
  on room_history for select
  using ( auth.uid() in (select id from profiles where role = 'owner') );

create policy "Only owner can insert room history"
  on room_history for insert
  with check ( auth.uid() in (select id from profiles where role = 'owner') );


-- Storage Policies (Buckets)
do $$ begin
  insert into storage.buckets (id, name, public) 
  values ('payment_proofs', 'payment_proofs', true);
exception when unique_violation then null;
end $$;

-- Drop existing storage policies
drop policy if exists "Payment proofs are publicly accessible" on storage.objects;
drop policy if exists "Tenants can upload payment proofs" on storage.objects;
drop policy if exists "Owners can delete payment proofs" on storage.objects;

-- Recreate storage policies
create policy "Payment proofs are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'payment_proofs' );

create policy "Tenants can upload payment proofs"
  on storage.objects for insert
  with check ( 
    bucket_id = 'payment_proofs' 
    and auth.role() = 'authenticated'
  );
  
create policy "Owners can delete payment proofs"
  on storage.objects for delete
  using ( 
    bucket_id = 'payment_proofs' 
    and auth.uid() in (select id from profiles where role = 'owner')
  );


-- Functions & Triggers
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'tenant'); -- Default to tenant
  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to create first invoice when lease is created
drop function if exists public.create_first_invoice_on_lease();
create or replace function public.create_first_invoice_on_lease()
returns trigger as $$
declare
  due_date_calc date;
begin
  -- Calculate due date: start_date + billing_cycle months
  due_date_calc := (new.start_date + (new.billing_cycle || ' months')::interval)::date;
  
  -- Insert first invoice
  insert into public.invoices (lease_id, amount, due_date, status)
  values (new.id, new.custom_price, due_date_calc, 'unpaid');
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger and recreate
drop trigger if exists on_lease_created on public.leases;
create trigger on_lease_created
  after insert on public.leases
  for each row execute procedure public.create_first_invoice_on_lease();

-- Function to generate pending invoices based on billing cycle
DROP FUNCTION IF EXISTS public.generate_pending_invoices();
create or replace function public.generate_pending_invoices()
returns table(
  invoice_id uuid,
  lease_id uuid,
  amount numeric,
  due_date date,
  message text
) as $$
declare
  v_lease record;
  v_last_invoice record;
  v_new_due_date date;
  v_new_invoice_id uuid;
begin
  -- Loop through all active leases (where room is occupied and end_date is null or in future)
  for v_lease in
    select 
      l.id,
      l.tenant_id,
      l.room_id,
      l.billing_cycle,
      l.custom_price,
      l.start_date,
      l.end_date
    from public.leases l
    inner join public.rooms r on l.room_id = r.id
    where r.status = 'Occupied'
      and (l.end_date is null or l.end_date > current_date)
  loop
    -- Get the most recent invoice for this lease
    select * into v_last_invoice
    from public.invoices
    where lease_id = v_lease.id
    order by created_at desc
    limit 1;

    if v_last_invoice is not null then
      -- Check if it's time for the next invoice
      -- Calculate when next invoice should be created
      v_new_due_date := (v_last_invoice.due_date + (v_lease.billing_cycle || ' months')::interval)::date;
      
      -- If new due date is today or in the past, create a new invoice
      if v_new_due_date <= current_date then
        insert into public.invoices (lease_id, amount, due_date, status)
        values (v_lease.id, v_lease.custom_price, v_new_due_date, 'unpaid')
        returning id into v_new_invoice_id;
        
        return query select 
          v_new_invoice_id, 
          v_lease.id,
          v_lease.custom_price,
          v_new_due_date,
          'Invoice created for lease ' || v_lease.id::text;
      end if;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

