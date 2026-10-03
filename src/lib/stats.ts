import { boxScores, games, players, tournaments } from "@/data/sample";
import type { BoxScoreLine, Game, Player } from "./types";

export const points = (l: BoxScoreLine) => 2 * (l.fgm - l.tpm) + 3 * l.tpm + l.ftm;
export const rebounds = (l: BoxScoreLine) => l.oreb + l.dreb;

const pct = (made: number, att: number) => (att > 0 ? made / att : 0);
const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

export type GameResult = Game & {
  tournamentName: string;
  ourScore: number;
  won: boolean;
  margin: number;
};

function toResult(g: Game): GameResult {
  const lines = boxScores[g.id] ?? [];
  const ourScore = sum(lines, points);
  return {
    ...g,
    tournamentName: tournaments.find((t) => t.id === g.tournamentId)?.name ?? "",
    ourScore,
    won: ourScore > g.opponentScore,
    margin: ourScore - g.opponentScore,
  };
}

/** 완료된 경기, 최신순 */
export function completedGames(): GameResult[] {
  return games
    .filter((g) => g.isComplete)
    .map(toResult)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function upcomingGames(): Game[] {
  return games.filter((g) => !g.isComplete).sort((a, b) => a.date.localeCompare(b.date));
}

export function seasonRecord(results: GameResult[]) {
  const wins = results.filter((r) => r.won).length;
  let streak = 0;
  for (const r of results) {
    if (r.won !== results[0].won) break;
    streak++;
  }
  return {
    wins,
    losses: results.length - wins,
    total: results.length,
    streak: results.length ? { count: streak, type: results[0].won ? "W" : "L" } : null,
  };
}

export type Leader = { player: Player; value: number };

export function leaders(results: GameResult[]) {
  const ids = new Set(results.map((r) => r.id));
  const byPlayer = players.map((p) => {
    const lines = Object.entries(boxScores)
      .filter(([gid]) => ids.has(gid))
      .flatMap(([, ls]) => ls.filter((l) => l.playerId === p.id));
    const gp = lines.length;
    const pts = sum(lines, points);
    const fga = sum(lines, (l) => l.fga);
    const fta = sum(lines, (l) => l.fta);
    const tpa = sum(lines, (l) => l.tpa);
    return {
      player: p,
      gp,
      ppg: gp ? pts / gp : 0,
      rpg: gp ? sum(lines, rebounds) / gp : 0,
      apg: gp ? sum(lines, (l) => l.ast) / gp : 0,
      fg3Pct: pct(sum(lines, (l) => l.tpm), tpa),
      tsPct: fga + fta > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0,
      tpa,
      fga,
    };
  });
  const played = byPlayer.filter((p) => p.gp > 0);
  const top = (list: typeof played, key: "ppg" | "rpg" | "apg" | "fg3Pct" | "tsPct"): Leader | null => {
    const best = [...list].sort((a, b) => b[key] - a[key])[0];
    return best ? { player: best.player, value: best[key] } : null;
  };
  // 성공률은 시도 수가 너무 적은 선수를 제외 (경기당 3점 1개, 야투 3개 이상)
  return {
    ppg: top(played, "ppg"),
    rpg: top(played, "rpg"),
    apg: top(played, "apg"),
    fg3Pct: top(played.filter((p) => p.tpa >= p.gp), "fg3Pct"),
    tsPct: top(played.filter((p) => p.fga >= p.gp * 3), "tsPct"),
  };
}

export function teamAverages(results: GameResult[]) {
  const lines = results.flatMap((r) => boxScores[r.id] ?? []);
  const n = results.length || 1;
  return {
    ptsAvg: sum(results, (r) => r.ourScore) / n,
    oppAvg: sum(results, (r) => r.opponentScore) / n,
    fgPct: pct(sum(lines, (l) => l.fgm), sum(lines, (l) => l.fga)),
    fg3Pct: pct(sum(lines, (l) => l.tpm), sum(lines, (l) => l.tpa)),
    ftPct: pct(sum(lines, (l) => l.ftm), sum(lines, (l) => l.fta)),
  };
}

export type TeamRecord = { label: string; value: number; game: GameResult };

export function teamRecords(results: GameResult[]): TeamRecord[] {
  if (!results.length) return [];
  const teamTotal = (r: GameResult, f: (l: BoxScoreLine) => number) => sum(boxScores[r.id] ?? [], f);
  const pick = (label: string, f: (r: GameResult) => number, dir: "max" | "min", pool = results): TeamRecord => {
    const game = [...pool].sort((a, b) => (dir === "max" ? f(b) - f(a) : f(a) - f(b)))[0];
    return { label, value: f(game), game };
  };
  const wins = results.filter((r) => r.won);
  return [
    pick("최다 득점", (r) => r.ourScore, "max"),
    pick("최소 득점", (r) => r.ourScore, "min"),
    pick("최다 실점", (r) => r.opponentScore, "max"),
    pick("최소 실점", (r) => r.opponentScore, "min"),
    pick("최다 3점슛", (r) => teamTotal(r, (l) => l.tpm), "max"),
    pick("최다 턴오버", (r) => teamTotal(r, (l) => l.tov), "max"),
    ...(wins.length ? [pick("최다 점수차 승리", (r) => r.margin, "max", wins)] : []),
  ];
}
