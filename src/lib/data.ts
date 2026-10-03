import { supabase } from "./supabase";
import type { BoxScoreLine, Game, GameEvent, Player, Tournament } from "./types";

export type Season = {
  players: Player[];
  tournaments: Tournament[];
  games: Game[];
  /** gameId → 선수별 박스스코어 */
  boxScores: Record<string, BoxScoreLine[]>;
  /** 원본 기록 (쿼터별 집계 등에 사용) */
  events: GameEvent[];
};

const emptyLine = (playerId: string): BoxScoreLine => ({
  playerId, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
  oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
});

/** play-by-play 이벤트를 경기·선수별 박스스코어로 집계 */
export function aggregateBoxScores(events: GameEvent[]): Record<string, BoxScoreLine[]> {
  const lines = new Map<string, Map<string, BoxScoreLine>>();
  const line = (gameId: string, playerId: string) => {
    if (!lines.has(gameId)) lines.set(gameId, new Map());
    const byPlayer = lines.get(gameId)!;
    if (!byPlayer.has(playerId)) byPlayer.set(playerId, emptyLine(playerId));
    return byPlayer.get(playerId)!;
  };

  for (const e of events) {
    const l = line(e.gameId, e.playerId);
    switch (e.type) {
      case "fg2_made": l.fgm++; l.fga++; break;
      case "fg2_miss": l.fga++; break;
      case "fg3_made": l.fgm++; l.fga++; l.tpm++; l.tpa++; break;
      case "fg3_miss": l.fga++; l.tpa++; break;
      case "ft_made": l.ftm++; l.fta++; break;
      case "ft_miss": l.fta++; break;
      default: l[e.type]++;
    }
    if (e.assistPlayerId) line(e.gameId, e.assistPlayerId).ast++;
  }

  return Object.fromEntries([...lines].map(([gameId, byPlayer]) => [gameId, [...byPlayer.values()]]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase 행 (타입 생성 안 함)
export function toGameEvent(e: any): GameEvent {
  return {
    id: e.id,
    gameId: e.game_id,
    playerId: e.player_id,
    type: e.type,
    shotKind: e.shot_kind ?? undefined,
    assistPlayerId: e.assist_player_id ?? undefined,
    videoTs: e.video_ts === null || e.video_ts === undefined ? undefined : Number(e.video_ts),
    quarter: e.quarter ?? undefined,
  };
}

const PAGE = 1000; // Supabase 기본 최대 반환 행 수

/** 1000행 제한을 넘는 테이블을 끝까지 읽는다 */
async function selectAll(table: string) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase().from(table).select("*").order("id").range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function getSeason(): Promise<Season> {
  const db = supabase();
  const [players, tournaments, games, eventRows] = await Promise.all([
    db.from("players").select("*"),
    db.from("tournaments").select("*").order("created_at"),
    db.from("games").select("*").order("date"),
    selectAll("game_events"),
  ]);
  for (const r of [players, tournaments, games]) if (r.error) throw r.error;
  const events = eventRows.map(toGameEvent);

  return {
    players: players.data!
      .map((p) => ({
        id: p.id,
        name: p.name,
        number: p.number,
        positions: p.positions ?? [],
        heightCm: p.height_cm ?? undefined,
        birthDate: p.birth_date ?? undefined,
        isElite: p.is_elite ?? false,
        photoUrl: p.photo_url ?? undefined,
      }))
      .sort((a, b) => Number(a.number) - Number(b.number)),
    tournaments: tournaments.data!.map((t) => ({ id: t.id, name: t.name })),
    games: games.data!.map((g) => ({
      id: g.id,
      tournamentId: g.tournament_id,
      date: g.date,
      opponent: g.opponent,
      round: g.round ?? undefined,
      venue: g.venue ?? undefined,
      youtubeUrl: g.youtube_url ?? undefined,
      opponentScore: g.opponent_score,
      isComplete: g.is_complete,
    })),
    boxScores: aggregateBoxScores(events),
    events,
  };
}

/** 한 경기의 기록 (기록 순서대로) */
export async function getGameEvents(gameId: string): Promise<GameEvent[]> {
  const { data, error } = await supabase()
    .from("game_events")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at")
    .range(0, 4999);
  if (error) throw error;
  return data.map(toGameEvent);
}
