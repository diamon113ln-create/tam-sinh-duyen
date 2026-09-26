-- =========================================================
-- Tam Sinh Duyên – tạo bảng dữ liệu và phân quyền
-- Chạy 1 lần trong Supabase: SQL Editor → New query → dán → Run
-- =========================================================

-- Hồ sơ người dùng (gắn với tài khoản đăng nhập)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  role text not null default 'member' check (role in ('admin','lead','member')),
  created_at timestamptz default now()
);

-- Công việc và mẫu bài (nội dung lưu dạng JSON cho linh hoạt)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Hàm lấy vai trò của người đang đăng nhập
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Chỉ Trưởng nhóm / Admin được chuyển việc sang "Hoàn thành"
create or replace function public.guard_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if (new.data->>'status') = 'done'
     and (tg_op = 'INSERT' or coalesce(old.data->>'status','') <> 'done')
     and coalesce(public.my_role(),'') not in ('admin','lead') then
    raise exception 'Chỉ Trưởng nhóm hoặc Admin được chuyển sang Hoàn thành';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_task on public.tasks;
create trigger trg_guard_task before insert or update on public.tasks
  for each row execute function public.guard_task();

create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_touch_tpl on public.templates;
create trigger trg_touch_tpl before update on public.templates
  for each row execute function public.touch();

-- Bật phân quyền theo dòng (RLS)
alter table public.profiles  enable row level security;
alter table public.tasks     enable row level security;
alter table public.templates enable row level security;

-- Người có hồ sơ trong app mới được đọc/ghi
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (public.my_role() is not null);
-- Tạo/sửa/xóa tài khoản chỉ qua hàm admin-users (dùng khóa bí mật phía máy chủ)

drop policy if exists "tasks read"   on public.tasks;
drop policy if exists "tasks insert" on public.tasks;
drop policy if exists "tasks update" on public.tasks;
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks read"   on public.tasks for select to authenticated using (public.my_role() is not null);
create policy "tasks insert" on public.tasks for insert to authenticated with check (public.my_role() is not null);
create policy "tasks update" on public.tasks for update to authenticated using (public.my_role() is not null);
create policy "tasks delete" on public.tasks for delete to authenticated using (public.my_role() in ('admin','lead'));

drop policy if exists "tpl read"   on public.templates;
drop policy if exists "tpl insert" on public.templates;
drop policy if exists "tpl update" on public.templates;
drop policy if exists "tpl delete" on public.templates;
create policy "tpl read"   on public.templates for select to authenticated using (public.my_role() is not null);
create policy "tpl insert" on public.templates for insert to authenticated with check (public.my_role() is not null);
create policy "tpl update" on public.templates for update to authenticated using (public.my_role() is not null);
create policy "tpl delete" on public.templates for delete to authenticated using (public.my_role() in ('admin','lead'));

-- Cập nhật trực tiếp: người này sửa, máy người kia tự hiện
do $$ begin
  begin alter publication supabase_realtime add table public.tasks;     exception when others then null; end;
  begin alter publication supabase_realtime add table public.templates; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles;  exception when others then null; end;
end $$;

-- =========================================================
-- KHO ẢNH (thêm sau): bảng thông tin ảnh + nơi lưu file ảnh
-- Nếu đã chạy phần trên từ trước, chỉ cần chạy file supabase/kho-anh.sql
-- =========================================================
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

-- =========================================================
-- TẠO ADMIN ĐẦU TIÊN (chạy riêng, SAU khi đã tạo user ở mục Authentication)
-- Sửa 'admin' và 'Tên của bạn' rồi bỏ dấu -- ở 2 dòng dưới và chạy:
-- insert into public.profiles (id, username, name, role)
--   select id, 'admin', 'Tên của bạn', 'admin' from auth.users where email = 'admin@tsd-app.com';
-- =========================================================
