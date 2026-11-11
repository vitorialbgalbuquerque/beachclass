-- Cole este arquivo inteiro em Supabase > SQL Editor > Run.

create table if not exists flats (
  id text primary key,
  name text, loc text,
  base numeric, cleaning numeric
);

create table if not exists rates (
  id uuid primary key default gen_random_uuid(),
  flat text not null,
  type text not null check (type in ('season','especial')),
  name text,
  from_date date, to_date date,
  price numeric
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  flat text not null,
  kind text not null default 'reserva' check (kind in ('reserva','bloqueio')),
  guest text, phone text, guests int,
  checkin date not null, checkout date not null,
  status text not null default 'confirmada' check (status in ('confirmada','pre','cancelada')),
  adjust numeric default 0, rent numeric default 0, cleaning numeric default 0, total numeric default 0,
  payments jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  flat text not null,
  cat text, descr text, amount numeric not null
);

-- Segurança: só usuários logados (vocês dois) leem e editam as tabelas.
alter table flats enable row level security;
alter table rates enable row level security;
alter table bookings enable row level security;
alter table expenses enable row level security;

create policy "equipe flats" on flats for all to authenticated using (true) with check (true);
create policy "equipe rates" on rates for all to authenticated using (true) with check (true);
create policy "equipe bookings" on bookings for all to authenticated using (true) with check (true);
create policy "equipe expenses" on expenses for all to authenticated using (true) with check (true);

-- O hóspede (sem login) só consegue chamar esta função, que devolve apenas
-- o flat e as datas ocupadas. Nomes, valores e pagamentos nunca saem daqui.
create or replace function public.availability()
returns table (flat text, checkin date, checkout date)
language sql security definer set search_path = public as $$
  select flat, checkin, checkout from bookings
  where status not in ('cancelada','pre') and checkout >= current_date - 1;
$$;
revoke all on function public.availability() from public;
grant execute on function public.availability() to anon, authenticated;

-- Preço de fim de semana (noites de sexta e sábado). Vazio = igual ao da semana.
alter table flats add column if not exists base_we numeric;
alter table rates add column if not exists price_we numeric;

-- Avaliações dos hóspedes (rodar uma vez em Supabase > SQL Editor > Run).
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  flat text, guest text,
  stars int check (stars between 1 and 5),
  text text, stay text,
  published boolean not null default true,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
drop policy if exists "equipe reviews" on reviews;
create policy "equipe reviews" on reviews for all to authenticated using (true) with check (true);
create or replace function public.public_reviews()
returns table (id uuid, flat text, guest text, stars int, text text, stay text)
language sql security definer set search_path = public as $$
  select id, flat, guest, stars, text, stay from reviews where published order by created_at desc;
$$;
revoke all on function public.public_reviews() from public;
grant execute on function public.public_reviews() to anon, authenticated;
