-- 기록에 쿼터 추가 (1~4, 연장은 5 이상)
alter table game_events add column quarter int check (quarter between 1 and 9);
