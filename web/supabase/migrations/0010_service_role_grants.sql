-- The server-side (service role) client is used after its own checks to sync deal stages,
-- notify admins and send pushes. This project was created without table grants for it.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
