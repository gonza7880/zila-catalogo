-- Reemplazar el email por el usuario que hayas creado previamente en:
-- Supabase > Authentication > Users > Add user
--
-- Ejemplo:
-- insert into public.admin_users(email) values ('romi@ejemplo.com')
-- on conflict(email) do update set active=true;

select 'Primero creá el usuario en Authentication y luego agregá su email a public.admin_users.' as paso;
