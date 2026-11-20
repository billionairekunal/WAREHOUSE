-- Owners need to know when a visitor is actually coming, so a visit offer records the platform's final call.
alter table public.visit_offers drop constraint visit_offers_status_check;
alter table public.visit_offers add constraint visit_offers_status_check
  check (status in ('requested','available','unavailable','confirmed','cancelled','closed'));
update public.visit_offers o set status = 'confirmed' from public.visits v where v.id = o.visit_id and v.status = 'confirmed' and o.status = 'closed';
