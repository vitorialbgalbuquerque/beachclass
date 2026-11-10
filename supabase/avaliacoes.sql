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
