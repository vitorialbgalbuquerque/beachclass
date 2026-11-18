-- Rode no Supabase > SQL Editor > Run. Recria a função do calendário e testa.
drop function if exists public.availability();
create function public.availability()
returns table (flat text, checkin date, checkout date)
language sql security definer set search_path = public as $$
  select flat, checkin, checkout from bookings
  where status not in ('cancelada','pre') and checkout >= current_date - 1;
$$;
revoke all on function public.availability() from public;
grant execute on function public.availability() to anon, authenticated;

-- Teste: deve listar as reservas confirmadas (ou ficar vazio, sem erro).
select * from public.availability();
