"use client";

import Link from "next/link";
import { useState } from "react";

export type PickerPlayer = {
  id: string;
  name: string;
  number: string;
  photoUrl?: string;
  positions: string[];
  clips: number;
  top: { label: string; n: number }[];
};

/** 하이라이트 선수 선택: 이름·등번호 검색 + 선수 카드 */
export function HighlightPlayerPicker({ players }: { players: PickerPlayer[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().replace(/^#/, "");
  const shown = players.filter((p) => !query || p.name.includes(query) || p.number === query || p.number.startsWith(query));

  return (
    <section aria-labelledby="by-player" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="by-player" className="text-lg font-bold">
          선수별 보기 <span className="text-sm font-medium text-gray-500 tabular-nums">{shown.length}명</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <label htmlFor="player-search" className="sr-only">
            선수 이름 또는 등번호 검색
          </label>
          <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" strokeLinecap="round" />
          </svg>
          <input
            id="player-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 또는 등번호"
            className="block min-h-11 w-full rounded-xl border border-gray-800 bg-gray-900 pr-10 pl-9 text-base outline-none placeholder:text-gray-500 focus:border-blue-400"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:text-gray-100"
            >
              <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500" role="status">
          {players.length === 0 ? "등록된 선수가 없습니다." : `‘${q.trim()}’ 와 일치하는 선수가 없습니다.`}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id}>
              <PlayerCard player={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayerCard({ player: p }: { player: PickerPlayer }) {
  const has = p.clips > 0;
  const body = (
    <>
      <span aria-hidden className="pointer-events-none absolute -top-3 -right-1 font-display text-7xl leading-none text-white/[0.05] select-none">
        {p.number}
      </span>
      <span className="relative flex items-center gap-3">
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(Supabase Storage) 이미지
          <img src={p.photoUrl} alt={`${p.name} 선수 사진`} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-black text-gray-300">
            {p.name.slice(-2)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-display text-2xl leading-none text-gray-400">#{p.number}</span>
          <span className="block truncate font-bold">{p.name}</span>
        </span>
      </span>
      <span className="relative mt-3 flex items-end justify-between gap-2 border-t border-gray-800 pt-3">
        <span className="min-w-0 truncate text-xs text-gray-400">
          {has ? p.top.map((k) => `${k.label} ${k.n}`).join(" · ") : "클립 없음"}
        </span>
        <span className="shrink-0 text-right">
          <span className={`font-display text-3xl leading-none tabular-nums ${has ? "text-blue-300" : "text-gray-600"}`}>{p.clips}</span>
          <span className="ml-0.5 text-xs text-gray-500">클립</span>
        </span>
      </span>
    </>
  );

  const base = "relative block h-full overflow-hidden rounded-2xl border bg-gray-900 p-4";
  // 클립이 없는 선수는 링크 대신 흐리게
  return has ? (
    <Link
      href={`/highlights/player/${p.id}`}
      className={`${base} border-gray-800 transition duration-200 hover:border-blue-500/50 focus-visible:outline-2 focus-visible:outline-blue-400 motion-safe:hover:-translate-y-0.5`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${base} border-gray-900 opacity-50`} aria-disabled>
      {body}
    </div>
  );
}
