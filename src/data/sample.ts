// ⚠️ 샘플 데이터입니다. 실제 선수·경기 기록으로 교체해서 사용하세요.
import type { BoxScoreLine, Game, Player, Tournament } from "@/lib/types";

export const TEAM_NAME = "잡솨";

export const players: Player[] = [
  { id: "p1", name: "선수1", number: "0", position: "G" },
  { id: "p2", name: "선수2", number: "3", position: "G" },
  { id: "p3", name: "선수3", number: "7", position: "F" },
  { id: "p4", name: "선수4", number: "11", position: "F" },
  { id: "p5", name: "선수5", number: "13", position: "C" },
  { id: "p6", name: "선수6", number: "23", position: "F" },
  { id: "p7", name: "선수7", number: "30", position: "G" },
  { id: "p8", name: "선수8", number: "33", position: "C" },
];

export const tournaments: Tournament[] = [
  { id: "t1", name: "2026 여름 동호회 리그" },
  { id: "t2", name: "2026 가을 오픈 대회" },
];

export const games: Game[] = [
  { id: "g1", tournamentId: "t1", date: "2026-06-14", opponent: "번개", round: "예선 1R", opponentScore: 61, isComplete: true },
  { id: "g2", tournamentId: "t1", date: "2026-06-21", opponent: "슬램덩크", round: "예선 2R", opponentScore: 82, isComplete: true },
  { id: "g3", tournamentId: "t1", date: "2026-06-28", opponent: "리바운더스", round: "8강", opponentScore: 70, isComplete: true },
  { id: "g4", tournamentId: "t2", date: "2026-08-30", opponent: "블루스톰", round: "조별예선", opponentScore: 80, isComplete: true },
  { id: "g5", tournamentId: "t2", date: "2026-09-06", opponent: "더 크루", round: "조별예선", opponentScore: 72, isComplete: true, youtubeUrl: "https://www.youtube.com/" },
  { id: "g6", tournamentId: "t2", date: "2026-09-20", opponent: "하이포스트", round: "조별예선", opponentScore: 58, isComplete: true, youtubeUrl: "https://www.youtube.com/" },
  { id: "g7", tournamentId: "t2", date: "2026-10-11", opponent: "나이트호크", round: "조별예선", opponentScore: 0, isComplete: false },
];

/** 순서: 선수, 야투성공, 야투시도, 3점성공, 3점시도, 자유투성공, 자유투시도, 공격리바, 수비리바, 어시, 스틸, 블락, 턴오버, 파울 */
function row(
  playerId: string,
  fgm: number, fga: number, tpm: number, tpa: number, ftm: number, fta: number,
  oreb: number, dreb: number, ast: number, stl: number, blk: number, tov: number, pf: number,
): BoxScoreLine {
  return { playerId, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, tov, pf };
}

export const boxScores: Record<string, BoxScoreLine[]> = {
  "g1": [
    row("p1", 1, 5, 0, 0, 4, 5, 1, 7, 6, 2, 1, 2, 4),
    row("p2", 5, 10, 0, 1, 0, 0, 1, 7, 8, 0, 1, 3, 3),
    row("p3", 8, 15, 1, 4, 0, 1, 3, 3, 1, 1, 0, 1, 4),
    row("p4", 4, 12, 2, 3, 1, 1, 2, 3, 1, 3, 0, 1, 1),
    row("p5", 3, 9, 2, 3, 1, 2, 1, 3, 1, 2, 1, 0, 4),
    row("p6", 4, 8, 1, 2, 2, 2, 2, 5, 1, 2, 0, 2, 1),
    row("p7", 3, 6, 0, 1, 0, 0, 0, 2, 0, 0, 2, 0, 3),
    row("p8", 1, 4, 0, 0, 2, 2, 3, 3, 3, 3, 0, 0, 1),
  ],
  "g2": [
    row("p1", 3, 10, 0, 0, 3, 5, 2, 2, 7, 0, 0, 3, 0),
    row("p2", 6, 15, 0, 3, 2, 5, 3, 2, 9, 2, 1, 1, 1),
    row("p3", 3, 3, 1, 1, 3, 3, 1, 1, 0, 3, 0, 2, 4),
    row("p4", 6, 9, 0, 0, 4, 4, 1, 2, 4, 3, 0, 0, 2),
    row("p5", 4, 9, 2, 5, 2, 3, 2, 3, 1, 1, 2, 3, 3),
    row("p6", 3, 7, 2, 4, 0, 0, 2, 4, 4, 1, 0, 1, 0),
    row("p7", 3, 6, 1, 2, 1, 2, 3, 1, 1, 2, 0, 2, 1),
    row("p8", 0, 3, 0, 0, 2, 2, 3, 3, 2, 3, 0, 3, 3),
  ],
  "g3": [
    row("p1", 3, 7, 3, 5, 0, 0, 0, 1, 4, 3, 0, 0, 1),
    row("p2", 5, 11, 0, 4, 2, 2, 3, 3, 4, 0, 0, 3, 4),
    row("p3", 3, 8, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 4),
    row("p4", 1, 4, 0, 0, 0, 0, 0, 2, 5, 3, 1, 1, 4),
    row("p5", 7, 12, 3, 5, 0, 1, 1, 3, 3, 2, 1, 2, 3),
    row("p6", 5, 12, 2, 4, 1, 1, 3, 2, 0, 1, 2, 2, 3),
    row("p7", 2, 6, 2, 3, 1, 2, 3, 4, 2, 2, 1, 1, 4),
    row("p8", 3, 5, 1, 2, 0, 1, 0, 2, 0, 3, 2, 1, 3),
  ],
  "g4": [
    row("p1", 3, 12, 0, 7, 0, 0, 1, 1, 5, 3, 0, 0, 4),
    row("p2", 1, 7, 0, 4, 0, 0, 2, 6, 1, 1, 1, 3, 2),
    row("p3", 7, 13, 2, 4, 1, 2, 0, 5, 1, 2, 0, 0, 3),
    row("p4", 5, 7, 2, 3, 0, 0, 1, 5, 3, 3, 0, 3, 2),
    row("p5", 6, 12, 1, 4, 3, 3, 3, 1, 4, 0, 0, 3, 4),
    row("p6", 2, 3, 0, 0, 3, 3, 1, 1, 0, 1, 1, 0, 1),
    row("p7", 0, 3, 0, 1, 0, 0, 1, 4, 2, 2, 2, 1, 3),
    row("p8", 5, 8, 2, 3, 1, 1, 0, 1, 2, 2, 1, 2, 1),
  ],
  "g5": [
    row("p1", 0, 5, 0, 3, 1, 2, 0, 6, 1, 0, 0, 3, 4),
    row("p2", 2, 5, 0, 0, 5, 5, 0, 7, 2, 2, 0, 0, 0),
    row("p3", 6, 9, 3, 5, 2, 4, 1, 3, 1, 3, 1, 2, 2),
    row("p4", 8, 14, 3, 5, 4, 4, 1, 5, 1, 3, 0, 3, 3),
    row("p5", 6, 12, 1, 4, 0, 0, 0, 1, 3, 3, 1, 3, 4),
    row("p6", 2, 9, 0, 4, 1, 1, 3, 3, 1, 1, 0, 2, 3),
    row("p7", 2, 6, 0, 1, 2, 2, 1, 3, 2, 2, 1, 0, 1),
    row("p8", 3, 4, 0, 0, 0, 1, 1, 2, 0, 0, 0, 1, 1),
  ],
  "g6": [
    row("p1", 3, 7, 0, 0, 0, 0, 1, 3, 0, 0, 0, 0, 3),
    row("p2", 6, 14, 2, 4, 4, 5, 0, 5, 7, 3, 1, 3, 1),
    row("p3", 0, 9, 0, 6, 4, 4, 2, 4, 1, 2, 1, 0, 4),
    row("p4", 5, 14, 1, 4, 0, 0, 2, 4, 4, 2, 0, 2, 4),
    row("p5", 3, 11, 2, 5, 2, 3, 1, 1, 5, 2, 2, 1, 3),
    row("p6", 2, 10, 1, 4, 0, 0, 1, 1, 2, 3, 2, 0, 1),
    row("p7", 0, 5, 0, 2, 0, 0, 1, 3, 2, 2, 1, 2, 4),
    row("p8", 4, 8, 1, 3, 0, 1, 2, 1, 1, 0, 2, 0, 1),
  ],

};
