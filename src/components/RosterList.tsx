"use client";

import { useState } from "react";
import { POSITIONS, type Player, type Position } from "@/lib/types";

export type RosterPlayer = Player & { age?: number; gamesPlayed: number };

/** 포지션별 색. 색만으로 구분하지 않도록 항상 G/F/C 글자와 함께 쓴다. */
const POSITION_STYLE: Record<Position, { text: string; stripe: string; glow: string }> = {
  G: { text: "text-sky-300", stripe: "bg-sky-400", glow: "from-sky-500/15" },
  F: { text: "text-emerald-300", stripe: "bg-emerald-400", glow: "from-emerald-500/15" },
  C: { text: "text-violet-300", stripe: "bg-violet-400", glow: "from-violet-500/15" },
};

// 값이 없는 선수는 항상 뒤로
const desc = (a?: number, b?: number) => (b ?? -Infinity) - (a ?? -Infinity);

const SORTS = {
  number: { label: "등번호", compare: (a: RosterPlayer, b: RosterPlayer) => Number(a.number) - Number(b.number) },
  age: { label: "나이", compare: (a: RosterPlayer, b: RosterPlayer) => desc(a.age, b.age) },
  height: { label: "키", compare: (a: RosterPlayer, b: RosterPlayer) => desc(a.heightCm, b.heightCm) },
  games: { label: "출전", compare: (a: RosterPlayer, b: RosterPlayer) => b.gamesPlayed - a.gamesPlayed },
} as const;
type SortKey = keyof typeof SORTS;

export function RosterList({ players }: { players: RosterPlayer[] }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [sort, setSort] = useState<SortKey>("number");

  const shown = players
    .filter((p) => !position || p.positions.includes(position))
    .sort(SORTS[sort].compare);
  const countOf = (pos: Position | null) => (pos ? players.filter((p) => p.positions.includes(pos)).length : players.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 포지션 필터 */}
        <div role="group" aria-label="포지션 필터" className="flex gap-1 rounded-xl bg-gray-900 p-1">
          {[null, ...POSITIONS].map((pos) => {
            const active = position === pos;
            return (
              <button
                key={pos ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setPosition(pos)}
                className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:flex-none sm:px-4 ${
                  active ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                }`}
              >
                {pos ?? "전체"}
                <span className={`text-xs tabular-nums ${active ? "text-blue-100" : "text-gray-500"}`}>{countOf(pos)}</span>
              </button>
            );
          })}
        </div>

        {/* 정렬 */}
        <div role="group" aria-label="정렬" className="flex items-center gap-1 self-end text-sm sm:self-auto">
          <SortIcon />
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`min-h-11 cursor-pointer rounded-lg px-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 ${
                sort === key ? "font-bold text-blue-300" : "text-gray-500 hover:text-gray-200"
              }`}
            >
              {SORTS[key].label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">
          {players.length === 0 ? "등록된 선수가 없습니다" : "해당 포지션 선수가 없습니다"}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
          {shown.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ player: p }: { player: RosterPlayer }) {
  const main = POSITION_STYLE[p.positions[0]] ?? { text: "text-gray-300", stripe: "bg-gray-600", glow: "from-gray-500/10" };

  return (
    <li
      className={`group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b ${main.glow} to-gray-900 to-60% transition duration-200 hover:border-gray-600 motion-safe:hover:-translate-y-0.5`}
    >
      {/* 포지션 색 띠 */}
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${main.stripe}`} />

      <div className="relative p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          {/* 등번호 */}
          <p className="font-display text-6xl leading-[0.85] tabular-nums sm:text-7xl">
            <span className="sr-only">등번호 </span>
            {p.number}
          </p>
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 외부(Supabase Storage) 이미지
            <img src={p.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-800" />
          ) : (
            <div
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-black text-gray-300"
            >
              {p.name.slice(-2)}
            </div>
          )}
        </div>

        <p className="mt-3 truncate text-lg font-bold">{p.name}</p>

        <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-1.5">
          {p.positions.map((pos) => (
            <span key={pos} className={`rounded-md bg-gray-800 px-2 py-0.5 text-xs font-bold ${POSITION_STYLE[pos]?.text ?? ""}`}>
              {pos}
            </span>
          ))}
          {p.isElite && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
              <StarIcon />
              선출
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-gray-800 rounded-xl bg-gray-950/60 py-2 text-center">
          <Info label="나이" value={p.age} />
          <Info label="키" value={p.heightCm} />
          <Info label="출전" value={p.gamesPlayed} />
        </dl>
      </div>
    </li>
  );
}

function Info({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-display text-2xl leading-tight tabular-nums">{value ?? "-"}</dd>
    </div>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L10 14.9l-5.25 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-gray-500">
      <path d="M6 3v14M6 17l-3-3M6 17l3-3M14 17V3M14 3l-3 3M14 3l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
