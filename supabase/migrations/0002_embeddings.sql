-- embedding 基盤（ADR-015）
-- Supabase dashboard の SQL Editor で実行する。

create extension if not exists vector;

alter table entries add column if not exists embedding vector(768);

-- 意味検索（MCP search_entries）。コサイン距離 <=> を類似度 1-dist に変換して返す
create or replace function match_entries(query_embedding vector(768), match_count int default 5)
returns table (id text, title text, body text, category_id text, similarity real)
language sql stable
as $$
  select e.id, e.title, e.body, e.category_id,
         (1 - (e.embedding <=> query_embedding))::real as similarity
  from entries e
  where e.embedding is not null
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- 誌面の Affinity 項（ADR-008 / ADR-015）。
-- 直近閲覧エントリ群の平均ベクトルをシードに、全エントリの類似度を返す。
-- シードが作れない（閲覧ゼロ・embedding 未計算）場合は空を返す
create or replace function feed_affinity(recent_ids text[])
returns table (id text, affinity real)
language sql stable
as $$
  with seed as (
    select avg(embedding) as v
    from entries
    where id = any(recent_ids) and embedding is not null
  )
  select e.id, greatest(0, 1 - (e.embedding <=> seed.v))::real as affinity
  from entries e, seed
  where e.embedding is not null and seed.v is not null;
$$;
