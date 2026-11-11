-- Pré-reserva (pedido de orçamento) NÃO bloqueia o calendário do hóspede.
-- Rodar uma vez em Supabase > SQL Editor > Run.
create or replace function public.availability()
returns table (flat text, checkin date, checkout date)
language sql security definer set search_path = public as $$
  select flat, checkin, checkout from bookings
  where status not in ('cancelada','pre') and checkout >= current_date - 1;
$$;
grant execute on function public.availability() to anon, authenticated;
