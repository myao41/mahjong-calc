-- =============================================
-- 麻雀点数計算アプリ Supabase テーブル定義
-- =============================================

-- 1. 学習記録
create table learning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id text not null,
  timestamp timestamptz not null,
  source text not null,
  difficulty text,
  custom_problem_id text,
  question jsonb not null,
  correct jsonb not null,
  user_answer jsonb not null,
  errors jsonb not null,
  is_correct boolean not null,
  category text,
  created_at timestamptz default now()
);

alter table learning_records enable row level security;
create policy "Users can read own records" on learning_records for select using (auth.uid() = user_id);
create policy "Users can insert own records" on learning_records for insert with check (auth.uid() = user_id);
create policy "Users can delete own records" on learning_records for delete using (auth.uid() = user_id);
create index idx_learning_records_user on learning_records(user_id, timestamp desc);
create unique index idx_learning_records_local_id on learning_records(user_id, local_id);

-- 2. 自作問題
create table custom_problems (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  closed_tiles jsonb not null,
  open_melds jsonb not null,
  condition jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

alter table custom_problems enable row level security;
create policy "Users can read own problems" on custom_problems for select using (auth.uid() = user_id);
create policy "Users can insert own problems" on custom_problems for insert with check (auth.uid() = user_id);
create policy "Users can update own problems" on custom_problems for update using (auth.uid() = user_id);
create policy "Users can delete own problems" on custom_problems for delete using (auth.uid() = user_id);
create index idx_custom_problems_user on custom_problems(user_id);

-- 3. 検定記録
create table cert_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  level_id text not null,
  date timestamptz not null,
  correct integer not null,
  total integer not null,
  passed boolean not null,
  created_at timestamptz default now()
);

alter table cert_records enable row level security;
create policy "Users can read own cert records" on cert_records for select using (auth.uid() = user_id);
create policy "Users can insert own cert records" on cert_records for insert with check (auth.uid() = user_id);
create index idx_cert_records_user on cert_records(user_id);

-- 4. ユーザー設定
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answer_mode text not null default 'normal',
  time_limit integer not null default 0,
  honba boolean not null default false,
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;
create policy "Users can read own settings" on user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);
