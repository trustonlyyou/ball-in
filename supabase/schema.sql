-- 새 팀용 DB 초기화. 빈 Supabase 프로젝트의 SQL Editor 에 통째로 붙여넣고 한 번 실행한다.
-- (migrations/ 의 0001~0003 을 합친 최종 상태. 이미 운영 중인 DB 에는 실행하지 말 것.)
-- 구조를 바꿀 때는 migrations/ 에 새 파일을 추가하고 이 파일도 함께 고친다.

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text not null,
  is_active boolean not null default true, -- false 면 명단·기록 화면에서 숨김 (지난 기록은 유지)
  created_at timestamptz not null default now(),
  positions text[] not null default '{}', -- G, F, C (복수)
  height_cm int,
  birth_date date,
  is_elite boolean not null default false, -- 선출 여부
  photo_url text
);

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments (id) on delete set null,
  date date not null,
  opponent text not null,
  round text,
  venue text,
  youtube_url text,
  opponent_score int not null default 0,
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- 경기 중 일어난 기록 하나하나 (play-by-play).
-- 박스스코어는 이 테이블을 집계해서 만든다. video_ts 가 있으면 하이라이트로 쓴다.
create table game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  type text not null check (type in (
    'fg2_made', 'fg2_miss', 'fg3_made', 'fg3_miss', 'ft_made', 'ft_miss',
    'oreb', 'dreb', 'stl', 'blk', 'tov', 'pf'
  )),
  shot_kind text check (shot_kind in ('layup', 'post', 'mid')), -- 2점슛 세부 종류 (선택)
  assist_player_id uuid references players (id) on delete set null, -- 성공한 슛에만
  video_ts numeric, -- 유튜브 영상 기준 초
  created_at timestamptz not null default now(),
  quarter int check (quarter between 1 and 9) -- 1~4, 연장은 5 이상
);

create index game_events_game_id_idx on game_events (game_id);
create index game_events_player_id_idx on game_events (player_id);

-- 누구나 읽기 가능. 쓰기는 서버(secret key)에서만 한다.
alter table players enable row level security;
alter table tournaments enable row level security;
alter table games enable row level security;
alter table game_events enable row level security;

create policy "public read" on players for select using (true);
create policy "public read" on tournaments for select using (true);
create policy "public read" on games for select using (true);
create policy "public read" on game_events for select using (true);
