-- Tam Sinh Duyên – chỉ Admin xem được danh sách tài khoản (tên đăng nhập, vai trò).
-- Chạy 1 lần: Supabase → SQL Editor → New query → dán → Run
-- Thành viên / Trưởng nhóm chỉ đọc được hồ sơ của chính mình, còn tên hiển thị của mọi người
-- (để giao việc, hiện "người phát") lấy qua hàm member_names() – không có tên đăng nhập, vai trò.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() = 'admin');

create or replace function public.member_names() returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name from public.profiles p where public.my_role() is not null
$$;
revoke all on function public.member_names() from public, anon;
grant execute on function public.member_names() to authenticated;
