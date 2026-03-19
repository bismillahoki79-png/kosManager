-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enum Types
create type user_role as enum ('owner', 'tenant');
create type room_status as enum ('Available', 'Occupied', 'Storage');
create type invoice_status as enum ('unpaid', 'pending_verification', 'paid');

-- Create Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role user_role default 'tenant',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Rooms Table
create table rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status room_status default 'Available',
  base_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Leases Table
create table leases (
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
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  lease_id uuid references leases(id) not null,
  amount numeric not null,
  due_date date not null,
  status invoice_status default 'unpaid',
  proof_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Room History Table
create table room_history (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) not null,
  tenant_id uuid references profiles(id),
  action text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table leases enable row level security;
alter table invoices enable row level security;
alter table room_history enable row level security;

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
insert into storage.buckets (id, name, public) 
values ('payment_proofs', 'payment_proofs', true);

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

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
