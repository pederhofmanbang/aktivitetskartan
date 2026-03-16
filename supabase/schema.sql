-- Aktivitetskartan – Supabase schema
-- Run this in the Supabase SQL Editor to create the tables

-- 1. Overrides: per-initiative user edits (fields, maturity, QA, jurisdictions, etc.)
create table if not exists overrides (
  nr int primary key,               -- initiative number, matches DATA[].nr
  data jsonb not null default '{}',  -- the full override object
  updated_at timestamptz not null default now()
);

-- 2. Deepdives: per-initiative deep-dive data
create table if not exists deepdives (
  nr int primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- 3. Suggestions: per-initiative free-text suggestions
create table if not exists suggestions (
  nr int primary key,
  text text not null default '',
  updated_at timestamptz not null default now()
);

-- 4. Candidates: the full candidates list (single row, JSON array)
create table if not exists candidates (
  id int primary key default 1 check (id = 1),  -- singleton row
  data jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on every change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger overrides_updated before update on overrides for each row execute function set_updated_at();
create trigger deepdives_updated before update on deepdives for each row execute function set_updated_at();
create trigger suggestions_updated before update on suggestions for each row execute function set_updated_at();
create trigger candidates_updated before update on candidates for each row execute function set_updated_at();

-- Enable Row Level Security (open for now – all authenticated/anon can read+write)
alter table overrides enable row level security;
alter table deepdives enable row level security;
alter table suggestions enable row level security;
alter table candidates enable row level security;

create policy "Allow all access" on overrides for all using (true) with check (true);
create policy "Allow all access" on deepdives for all using (true) with check (true);
create policy "Allow all access" on suggestions for all using (true) with check (true);
create policy "Allow all access" on candidates for all using (true) with check (true);

-- Enable Realtime for all tables
alter publication supabase_realtime add table overrides;
alter publication supabase_realtime add table deepdives;
alter publication supabase_realtime add table suggestions;
alter publication supabase_realtime add table candidates;
