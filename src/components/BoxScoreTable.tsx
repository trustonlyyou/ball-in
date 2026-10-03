"use client";

import { useState } from "react";
import { fmtPct } from "@/lib/format";
import type { BoxScoreLine, Player } from "@/lib/types";

export type BoxScoreRow = BoxScoreLine & { player: Player; pts: number; reb: number };

type Totals = Omit<BoxScoreRow, "player" | "playerId">;

const pct = (made: number, att: number) => (att > 0 ? made / att : -1);
const shooting = (made: number, att: number) => `${made}-${att}`;
const pctText = (made: number, att: number) => (att > 0 ? fmtPct(made / att) : "-");

type Column = {
  key: string;
  label: string;
  title: string;
  value: (r: Totals) => number; // 정렬 기준
  render?: (r: Totals) => string;
  strong?: boolean;
};

const COLUMNS: Column[] = [
  { key: "pts", label: "PTS", title: "득점", value: (r) => r.pts, strong: true },
  { key: "reb", label: "REB", title: "리바운드", value: (r) => r.reb },
  { key: "ast", label: "AST", title: "어시스트", value: (r) => r.ast },
  { key: "stl", label: "STL", title: "스틸", value: (r) => r.stl },
  { key: "blk", label: "BLK", title: "블락", value: (r) => r.blk },
  { key: "fg", label: "FG", title: "야투 성공-시도", value: (r) => r.fgm, render: (r) => shooting(r.fgm, r.fga) },
  { key: "fgp", label: "FG%", title: "야투율", value: (r) => pct(r.fgm, r.fga), render: (r) => pctText(r.fgm, r.fga) },
  { key: "3p", label: "3P", title: "3점 성공-시도", value: (r) => r.tpm, render: (r) => shooting(r.tpm, r.tpa) },
  { key: "3pp", label: "3P%", title: "3점 성공률", value: (r) => pct(r.tpm, r.tpa), render: (r) => pctText(r.tpm, r.tpa) },
  { key: "ft", label: "FT", title: "자유투 성공-시도", value: (r) => r.ftm, render: (r) => shooting(r.ftm, r.fta) },
  { key: "ftp", label: "FT%", title: "자유투 성공률", value: (r) => pct(r.ftm, r.fta), render: (r) => pctText(r.ftm, r.fta) },
  { key: "oreb", label: "OR", title: "공격 리바운드", value: (r) => r.oreb },
  { key: "dreb", label: "DR", title: "수비 리바운드", value: (r) => r.dreb },
  { key: "tov", label: "TO", title: "턴오버", value: (r) => r.tov },
  { key: "pf", label: "PF", title: "파울", value: (r) => r.pf },
];

const NUMERIC_KEYS = ["fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "ast", "stl", "blk", "tov", "pf", "pts", "reb"] as const;

function totalsOf(rows: BoxScoreRow[]): Totals {
  const t = Object.fromEntries(NUMERIC_KEYS.map((k) => [k, 0])) as Totals;
  for (const r of rows) for (const k of NUMERIC_KEYS) t[k] += r[k];
  return t;
}

export function BoxScoreTable({ rows }: { rows: BoxScoreRow[] }) {
  // 기본: 득점 내림차순
  const [sortKey, setSortKey] = useState("pts");
  const [asc, setAsc] = useState(false);

  const column = COLUMNS.find((c) => c.key === sortKey) ?? COLUMNS[0];
  const sorted = [...rows].sort((a, b) => {
    const d = column.value(a) - column.value(b);
    return (asc ? d : -d) || Number(a.player.number) - Number(b.player.number);
  });
  const totals = totalsOf(rows);

  const onSort = (key: string) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  return (
    <div>
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
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (asc ? "ascending" : "descending") : undefined}
                    className="p-0 font-medium"
                  >
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
              <tr key={r.playerId} className="bg-gray-950 transition-colors hover:bg-gray-900/60">
                <th scope="row" className="sticky left-0 z-10 bg-gray-950 px-3 py-2.5 text-left font-medium whitespace-nowrap">
                  <span className="inline-block w-7 font-display text-lg leading-none text-gray-500">{r.player.number}</span>
                  {r.player.name}
                </th>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`px-2.5 py-2.5 text-center whitespace-nowrap ${
                      c.strong ? "font-bold text-white" : "text-gray-300"
                    } ${c.key === sortKey ? "bg-blue-500/5" : ""}`}
                  >
                    {c.render ? c.render(r) : c.value(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-700 bg-gray-900 font-bold">
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-gray-900 px-3 py-2.5 text-left">
                팀 합계
              </th>
              {COLUMNS.map((c) => (
                <td key={c.key} className="px-2.5 py-2.5 text-center whitespace-nowrap">
                  {c.render ? c.render(totals) : c.value(totals)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">헤더를 누르면 해당 기록 기준으로 정렬돼요 (한 번 더 누르면 반대로).</p>
    </div>
  );
}
