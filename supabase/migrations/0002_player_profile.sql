-- 라커룸용 선수 프로필 컬럼
alter table players drop column position;
alter table players add column positions text[] not null default '{}'; -- PG, SG, SF, PF, C (복수)
alter table players add column height_cm int;
alter table players add column birth_date date;
alter table players add column is_elite boolean not null default false; -- 선출 여부
alter table players add column photo_url text;
