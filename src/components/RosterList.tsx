"use client";

import { useState } from "react";
import { POSITIONS, type Player, type Position } from "@/lib/types";

export type RosterPlayer = Player & { age?: number; gamesPlayed: number };

const SORTS = {
  number: { label: "등번호", compare: (a: RosterPlayer, b: RosterPlayer) => Number(a.number) - Number(b.number) },
  age: {
    label: "나이",
    // 나이 정보 없는 선수는 뒤로
    compare: (a: RosterPlayer, b: RosterPlayer) => (b.age ?? -1) - (a.age ?? -1),
  },
  games: { label: "출전경기", compare: (a: RosterPlayer, b: RosterPlayer) => b.gamesPlayed - a.gamesPlayed },
} as const;
type SortKey = keyof typeof SORTS;

export function RosterList({ players }: { players: RosterPlayer[] }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [sort, setSort] = useState<SortKey>("number");

  const shown = players
    .filter((p) => !position || p.positions.includes(position))
    .sort(SORTS[sort].compare);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[null, ...POSITIONS].map((pos) => (
            <button
              key={pos ?? "all"}
              onClick={() => setPosition(pos)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                position === pos ? "bg-blue-500 text-white" : "bg-gray-900 text-gray-400 hover:text-gray-200"
              }`}
            >
              {pos ?? "전체"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-md px-2 py-1 ${sort === key ? "font-bold text-blue-300" : "text-gray-500 hover:text-gray-300"}`}
            >
              {SORTS[key].label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        <span className="font-bold text-gray-200">{shown.length}</span> 명
      </p>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
          {players.length === 0 ? "등록된 선수가 없습니다" : "해당 포지션 선수가 없습니다"}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ player: p }: { player: RosterPlayer }) {
  return (
    <li className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-4">
      {/* 배경 등번호 */}
      <span className="pointer-events-none absolute -right-1 -top-3 text-7xl font-black text-gray-800/70 tabular-nums select-none">
        {p.number}
      </span>

      <div className="relative">
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(Supabase Storage) 이미지
          <img src={p.photoUrl} alt={p.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-lg font-black text-blue-300">
            {p.name.slice(-2)}
          </div>
        )}

        <p className="mt-3 text-sm font-bold text-blue-300 tabular-nums">#{p.number}</p>
        <p className="flex items-center gap-1.5 text-lg font-bold">
          {p.name}
          {p.isElite && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">선출</span>}
        </p>

        <div className="mt-1 flex min-h-5 flex-wrap gap-1">
          {p.positions.map((pos) => (
            <span key={pos} className="rounded bg-gray-800 px-1.5 py-0.5 text-[11px] font-medium text-gray-300">
              {pos}
            </span>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-1 border-t border-gray-800 pt-3 text-center">
          <Info label="나이" value={p.age !== undefined ? `${p.age}` : "-"} />
          <Info label="키" value={p.heightCm ? `${p.heightCm}` : "-"} />
          <Info label="출전" value={`${p.gamesPlayed}`} />
        </dl>
      </div>
    </li>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-gray-500">{label}</dt>
      <dd className="text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}
