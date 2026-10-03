"use client";

import { useState } from "react";
import { fmtPct } from "@/lib/format";
import type { BoxScoreLine, Player } from "@/lib/types";

export type PlayerStatsRow = { player: Player; gp: number; totals: BoxScoreLine; pts: number; reb: number };

type Mode = "avg" | "total";

type Column = {
  key: string;
  label: string;
  title: string;
  /** mode 에 따라 평균 또는 합계로 나뉘는 카운팅 스탯 */
  count?: (r: PlayerStatsRow) => number;
  /** 성공률처럼 mode 와 무관한 값. -1 = 시도 없음 */
  rate?: (r: PlayerStatsRow) => number;
  /** 성공-시도 표기 */
  made?: (r: PlayerStatsRow) => [number, number];
  strong?: boolean;
};

const rate = (made: number, att: number) => (att > 0 ? made / att : -1);
const ts = (r: PlayerStatsRow) => {
  const den = 2 * (r.totals.fga + 0.44 * r.totals.fta);
  return den > 0 ? r.pts / den : -1;
};

const COLUMNS: Column[] = [
  { key: "gp", label: "GP", title: "출전 경기", count: (r) => r.gp },
  { key: "pts", label: "PTS", title: "득점", count: (r) => r.pts, strong: true },
  { key: "reb", label: "REB", title: "리바운드", count: (r) => r.reb },
  { key: "ast", label: "AST", title: "어시스트", count: (r) => r.totals.ast },
  { key: "stl", label: "STL", title: "스틸", count: (r) => r.totals.stl },
  { key: "blk", label: "BLK", title: "블락", count: (r) => r.totals.blk },
  { key: "fg", label: "FG", title: "야투 성공-시도", made: (r) => [r.totals.fgm, r.totals.fga] },
  { key: "fgp", label: "FG%", title: "야투율", rate: (r) => rate(r.totals.fgm, r.totals.fga) },
  { key: "3p", label: "3P", title: "3점 성공-시도", made: (r) => [r.totals.tpm, r.totals.tpa] },
  { key: "3pp", label: "3P%", title: "3점 성공률", rate: (r) => rate(r.totals.tpm, r.totals.tpa) },
  { key: "ft", label: "FT", title: "자유투 성공-시도", made: (r) => [r.totals.ftm, r.totals.fta] },
  { key: "ftp", label: "FT%", title: "자유투 성공률", rate: (r) => rate(r.totals.ftm, r.totals.fta) },
  { key: "ts", label: "TS%", title: "슈팅 효율 (자유투 포함)", rate: ts },
  { key: "oreb", label: "OR", title: "공격 리바운드", count: (r) => r.totals.oreb },
  { key: "dreb", label: "DR", title: "수비 리바운드", count: (r) => r.totals.dreb },
  { key: "tov", label: "TO", title: "턴오버", count: (r) => r.totals.tov },
  { key: "pf", label: "PF", title: "파울", count: (r) => r.totals.pf },
];

/** 정렬 기준 값 */
function sortValue(c: Column, r: PlayerStatsRow, mode: Mode) {
  if (c.rate) return c.rate(r);
  if (c.made) return c.made(r)[0] / (mode === "avg" ? r.gp : 1);
  // GP 는 평균 모드에서도 그대로
  return c.count!(r) / (mode === "avg" && c.key !== "gp" ? r.gp : 1);
}

function display(c: Column, r: PlayerStatsRow, mode: Mode) {
  if (c.rate) {
    const v = c.rate(r);
    return v < 0 ? "-" : fmtPct(v);
  }
  if (c.made) {
    const [m, a] = c.made(r);
    return mode === "avg" ? `${(m / r.gp).toFixed(1)}-${(a / r.gp).toFixed(1)}` : `${m}-${a}`;
  }
  const v = c.count!(r);
  return mode === "avg" && c.key !== "gp" ? (v / r.gp).toFixed(1) : String(v);
}

export function PlayerStatsTable({ rows, team }: { rows: PlayerStatsRow[]; team: PlayerStatsRow }) {
  const [mode, setMode] = useState<Mode>("avg");
  const [sortKey, setSortKey] = useState("pts");
  const [asc, setAsc] = useState(false);

  const column = COLUMNS.find((c) => c.key === sortKey) ?? COLUMNS[1];
  const sorted = [...rows].sort((a, b) => {
    const d = sortValue(column, a, mode) - sortValue(column, b, mode);
    return (asc ? d : -d) || Number(a.player.number) - Number(b.player.number);
  });

  const onSort = (key: string) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  return (
    <div className="space-y-3">
      <div role="group" aria-label="표시 방식" className="inline-flex gap-1 rounded-xl bg-gray-900 p-1">
        {(["avg", "total"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 cursor-pointer rounded-lg px-5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 ${
              mode === m ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            }`}
          >
            {m === "avg" ? "경기당 평균" : "합계"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-max border-collapse text-sm tabular-nums">
          <thead className="bg-gray-900 text-xs text-gray-400">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-gray-900 px-3 py-2 text-left font-medium">
                선수
              </th>
              {COLUMNS.map((c) => {
                const active = c.key === sortKey;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (asc ? "ascending" : "descending") : undefined} className="p-0 font-medium">
                    <button
                      type="button"
                      title={c.title}
                      onClick={() => onSort(c.key)}
                      className={`min-h-11 w-full cursor-pointer px-2.5 whitespace-nowrap transition-colors hover:text-gray-100 focus-visible:outline-2 focus-visible:outline-blue-400 ${
                        active ? "text-blue-300" : ""
                      }`}
                    >
                      {c.label}
                      <span aria-hidden className="ml-0.5 inline-block w-2">
                        {active ? (asc ? "↑" : "↓") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/70">
            {sorted.map((r) => (
              <tr key={r.player.id} className="bg-gray-950 transition-colors hover:bg-gray-900/60">
                <th scope="row" className="sticky left-0 z-10 bg-gray-950 px-3 py-2.5 text-left font-medium whitespace-nowrap">
                  <span className="inline-block w-7 font-display text-lg leading-none text-gray-500">{r.player.number}</span>
                  {r.player.name}
                </th>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`px-2.5 py-2.5 text-center whitespace-nowrap ${c.strong ? "font-bold text-white" : "text-gray-300"} ${
                      c.key === sortKey ? "bg-blue-500/5" : ""
                    }`}
                  >
                    {display(c, r, mode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-700 bg-gray-900 font-bold">
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-gray-900 px-3 py-2.5 text-left">
                팀
              </th>
              {COLUMNS.map((c) => (
                <td key={c.key} className="px-2.5 py-2.5 text-center whitespace-nowrap">
                  {display(c, team, mode)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        평균은 실제 출전 경기 기준이에요. 팀 줄은 경기당 팀 기록이에요. 헤더를 누르면 정렬돼요.
      </p>
    </div>
  );
}
