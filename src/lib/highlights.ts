import type { Season } from "./data";
import { eventLabel } from "./events";
import { fmtDate } from "./format";
import type { GameEvent } from "./types";
import { youtubeId } from "./youtube";

export type ClipKind = "threes" | "layups" | "posts" | "mids" | "twos" | "freethrows" | "defense";

export const CLIP_KINDS: { key: ClipKind; label: string }[] = [
  { key: "threes", label: "3점" },
  { key: "layups", label: "레이업" },
  { key: "posts", label: "골밑슛" },
  { key: "mids", label: "미들슛" },
  { key: "twos", label: "2점" },
  { key: "freethrows", label: "자유투" },
  { key: "defense", label: "스틸·블락" },
];

/** 종류별 배지 색 (항상 글자와 함께 표시) */
export const KIND_STYLE: Record<ClipKind, { badge: string; bar: string }> = {
  threes: { badge: "bg-blue-500/20 text-blue-300", bar: "bg-blue-500" },
  layups: { badge: "bg-sky-500/15 text-sky-300", bar: "bg-sky-400" },
  posts: { badge: "bg-sky-500/15 text-sky-300", bar: "bg-sky-400" },
  mids: { badge: "bg-sky-500/15 text-sky-300", bar: "bg-sky-400" },
  twos: { badge: "bg-sky-500/15 text-sky-300", bar: "bg-sky-400" },
  freethrows: { badge: "bg-gray-700 text-gray-200", bar: "bg-gray-500" },
  defense: { badge: "bg-amber-400/15 text-amber-300", bar: "bg-amber-400" },
};

export type Clip = {
  id: string;
  videoId: string;
  ts: number;
  kind: ClipKind;
  label: string;
  playerId: string;
  player: string;
  assist?: string;
  quarter?: number;
  gameId: string;
  game: string;
  date: string;
};

function kindOf(e: GameEvent): ClipKind | null {
  switch (e.type) {
    case "fg3_made":
      return "threes";
    case "fg2_made":
      return e.shotKind === "layup" ? "layups" : e.shotKind === "post" ? "posts" : e.shotKind === "mid" ? "mids" : "twos";
    case "ft_made":
      return "freethrows";
    case "stl":
    case "blk":
      return "defense";
    default:
      return null;
  }
}

/** 영상 시간이 기록된 득점·수비 장면 → 클립 (최근 경기부터, 경기 안에서는 영상 순서) */
export function buildClips(season: Season): Clip[] {
  const players = new Map(season.players.map((p) => [p.id, p]));
  const games = new Map(season.games.map((g) => [g.id, g]));

  return season.events
    .flatMap((e) => {
      const game = games.get(e.gameId);
      const videoId = youtubeId(game?.youtubeUrl);
      const kind = kindOf(e);
      const player = players.get(e.playerId);
      if (!game || !videoId || e.videoTs === undefined || !kind || !player) return [];
      const assist = e.assistPlayerId ? players.get(e.assistPlayerId) : undefined;
      return [
        {
          id: e.id,
          videoId,
          ts: e.videoTs,
          kind,
          label: eventLabel(e),
          playerId: player.id,
          player: `#${player.number} ${player.name}`,
          assist: assist ? `#${assist.number} ${assist.name}` : undefined,
          quarter: e.quarter,
          gameId: game.id,
          game: `${fmtDate(game.date)} vs ${game.opponent}`,
          date: game.date,
        },
      ];
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.ts - b.ts);
}

export const searchParam = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** 대회 없이 만든 경기를 묶는 가상 대회 ID */
export const NO_TOURNAMENT = "none";
export const NO_TOURNAMENT_NAME = "친선·기타";

/** 대회별 경기 수·클립 수 (클립이 있는 대회만, 최근 경기 순) */
export function tournamentHighlights(season: Season, clips: Clip[]) {
  const key = (tid?: string | null) => tid || NO_TOURNAMENT;
  const groups = new Map<string, { id: string; name: string; games: Set<string>; clips: number; latest: string; videoId: string }>();
  for (const c of clips) {
    const game = season.games.find((g) => g.id === c.gameId)!;
    const id = key(game.tournamentId);
    const name = season.tournaments.find((t) => t.id === game.tournamentId)?.name ?? NO_TOURNAMENT_NAME;
    const g = groups.get(id) ?? { id, name, games: new Set<string>(), clips: 0, latest: "", videoId: c.videoId };
    g.games.add(c.gameId);
    g.clips++;
    if (c.date > g.latest) {
      g.latest = c.date;
      g.videoId = c.videoId; // 포스터는 가장 최근 경기 영상
    }
    groups.set(id, g);
  }
  return [...groups.values()]
    .sort((a, b) => b.latest.localeCompare(a.latest))
    .map((g) => ({ id: g.id, name: g.name, games: g.games.size, clips: g.clips, latest: g.latest, videoId: g.videoId }));
}
