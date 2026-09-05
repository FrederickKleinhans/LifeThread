-- LifeThread profile-backed journal schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  folder text not null check (folder in ('Life', 'Doing', 'Ideas', 'Archive')),
  subfolder text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz,
  abandoned_at timestamptz
);

create table public.entries (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  type text not null check (
    type in ('log', 'note', 'blocker', 'waiting', 'decision', 'milestone', 'completed', 'attachment')
  ),
  body text not null,
  attachment_url text,
  created_at timestamptz not null
);

create table public.tags (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null,
  unique (user_id, name)
);

create index threads_user_updated_idx on public.threads (user_id, updated_at desc);
create index entries_user_created_idx on public.entries (user_id, created_at desc);
create index entries_thread_created_idx on public.entries (thread_id, created_at);
create index tags_user_name_idx on public.tags (user_id, name);

alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.entries enable row level security;
alter table public.tags enable row level security;

create policy "Users can view their profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can create their profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage their threads"
  on public.threads for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their entries"
  on public.entries for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.threads
      where threads.id = entries.thread_id
        and threads.user_id = (select auth.uid())
    )
  );

create policy "Users can manage their tags"
  on public.tags for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
