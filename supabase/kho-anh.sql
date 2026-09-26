-- Tam Sinh Duyên – Kho ảnh. Chạy 1 lần: Supabase → SQL Editor → New query → dán → Run
-- (cần đã chạy schema.sql trước đó)
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_touch_art on public.artworks;
create trigger trg_touch_art before update on public.artworks
  for each row execute function public.touch();
alter table public.artworks enable row level security;
drop policy if exists "art read"   on public.artworks;
drop policy if exists "art insert" on public.artworks;
drop policy if exists "art update" on public.artworks;
drop policy if exists "art delete" on public.artworks;
create policy "art read"   on public.artworks for select to authenticated using (public.my_role() is not null);
create policy "art insert" on public.artworks for insert to authenticated with check (public.my_role() is not null);
create policy "art update" on public.artworks for update to authenticated using (public.my_role() is not null);
create policy "art delete" on public.artworks for delete to authenticated using (public.my_role() in ('admin','lead'));
do $$ begin
  begin alter publication supabase_realtime add table public.artworks; exception when others then null; end;
end $$;

-- Thư mục lưu ảnh (công khai để web đọc được ảnh, tối đa 5 MB mỗi ảnh)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('artworks', 'artworks', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = true;
drop policy if exists "art upload" on storage.objects;
drop policy if exists "art remove" on storage.objects;
create policy "art upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artworks' and public.my_role() is not null);
create policy "art remove" on storage.objects for delete to authenticated
  using (bucket_id = 'artworks' and public.my_role() in ('admin','lead'));
