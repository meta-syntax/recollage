-- ADR-013: Supabase 移行 初期スキーマ
-- 既存 text ID をそのまま主キーにする（uuid 化して remap する利益が単一ユーザーには無い）。

create table categories (
  id         text primary key,
  name       text not null,
  parent_id  text references categories (id),
  sort_order integer not null
);

create table entries (
  id             text primary key,
  title          text,
  body           text not null,
  key_points     text[] not null default '{}',
  background     text,
  -- カテゴリ削除時のエントリ退避（ADR-011「書きつけへ戻す」）を DB 側で原子的に行う
  category_id    text references categories (id) on delete set null,
  visual         jsonb,
  source         jsonb not null,
  created_at     timestamptz not null,
  updated_at     timestamptz not null,
  last_viewed_at timestamptz,
  view_count     integer not null default 0
);

alter table categories enable row level security;
alter table entries enable row level security;

-- authenticated ロールに全行 CRUD を許可（Supabase Auth の1アカウント運用）。
-- anon ロールにはポリシーを作らない＝一切アクセス不可、が意図。
create policy "authenticated_all" on categories
  for all to authenticated using (true) with check (true);
create policy "authenticated_all" on entries
  for all to authenticated using (true) with check (true);
