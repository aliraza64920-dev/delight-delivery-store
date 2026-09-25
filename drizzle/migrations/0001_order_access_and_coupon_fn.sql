
alter table public.orders add column access_token uuid not null default gen_random_uuid();
create or replace function public.redeem_coupon(_coupon_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin update coupons set used_count = used_count + 1 where id=_coupon_id and (usage_limit is null or used_count < usage_limit); return found; end $$;
revoke all on function public.redeem_coupon(uuid) from public, anon, authenticated;
grant execute on function public.redeem_coupon(uuid) to service_role;
create policy "admin read product images" on storage.objects for select to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
