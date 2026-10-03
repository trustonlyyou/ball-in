"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { quarterLabel } from "@/lib/events";
import { CLIP_KINDS as KINDS, KIND_STYLE, type Clip, type ClipKind } from "@/lib/highlights";
import { fmtVideoTs } from "@/lib/youtube";
import { useYouTube } from "./useYouTube";

/** 기록 시점 기준 재생 구간 (버튼을 장면보다 조금 늦게 누르는 걸 감안) */
const BEFORE = 7;
const AFTER = 3;
const startOf = (c: Clip) => Math.max(0, c.ts - BEFORE);
const kindLabel = (k: ClipKind) => KINDS.find((x) => x.key === k)?.label ?? "";

export function HighlightPlayer({
  clips,
  players,
  initial,
  showPlayerFilter = true,
}: {
  clips: Clip[];
  players: { id: string; label: string }[];
  initial: { player?: string; kind?: string; clip: number };
  /** 선수 전용 페이지에서는 false */
  showPlayerFilter?: boolean;
}) {
  const [playerId, setPlayerId] = useState<string | null>(players.some((p) => p.id === initial.player) ? initial.player! : null);
  const [kind, setKind] = useState<ClipKind | null>(KINDS.some((k) => k.key === initial.kind) ? (initial.kind as ClipKind) : null);
  const [autoNext, setAutoNext] = useState(true);
  // 자동 재생하지 않음: 사용자가 재생을 눌러야 시작 (데이터·소리 배려)
  const [started, setStarted] = useState(false);

  // 필터가 바뀔 때만 새 배열 → current 의 동일성이 유지되어 무관한 리렌더에 영상이 되감기지 않음
  const byPlayer = useMemo(() => clips.filter((c) => !playerId || c.playerId === playerId), [clips, playerId]);
  const list = useMemo(() => byPlayer.filter((c) => !kind || c.kind === kind), [byPlayer, kind]);
  const [index, setIndex] = useState(Math.min(Math.max(0, initial.clip), Math.max(0, list.length - 1)));
  const current = list[index];

  // 첫 클립으로 플레이어 생성 (시작 위치만 맞춰두고 재생은 안 함)
  const [first] = useState(() => list[index] ?? clips[0]);
  const { el, player, ready } = useYouTube(first.videoId, startOf(first));
  const loadedVideo = useRef(first.videoId);
  const shownClip = useRef<string>(first.id); // 플레이어가 현재 맞춰져 있는 클립

  /** 클립 재생. 사용자 클릭 핸들러에서 직접 불러야 모바일에서도 재생이 허용됨 */
  const playClip = (c: Clip) => {
    const p = player.current;
    if (!p) return;
    if (loadedVideo.current !== c.videoId) {
      p.loadVideoById({ videoId: c.videoId, startSeconds: startOf(c) });
      loadedVideo.current = c.videoId;
    } else {
      p.seekTo(startOf(c), true);
      p.playVideo();
    }
    shownClip.current = c.id;
  };

  // 클립이 바뀌었을 때: 재생 전이면 위치만 맞추고, 재생 중이면 바로 재생 (자동 넘김 등)
  useEffect(() => {
    const p = player.current;
    if (!ready || !p || !current || shownClip.current === current.id) return;
    if (started) {
      playClip(current);
    } else {
      p.cueVideoById({ videoId: current.videoId, startSeconds: startOf(current) });
      loadedVideo.current = current.videoId;
      shownClip.current = current.id;
    }
    // playClip 은 ref 만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, current, started]);

  // 구간이 끝나면 다음 클립으로
  useEffect(() => {
    if (!ready || !current || !started || !autoNext) return;
    const end = current.ts + AFTER;
    const timer = setInterval(() => {
      const t = player.current?.getCurrentTime() ?? 0;
      // 사용자가 영상을 멀리 넘긴 경우는 무시
      if (t >= end && t < end + 3) {
        if (index < list.length - 1) setIndex(index + 1);
        else player.current?.pauseVideo();
      }
    }, 400);
    return () => clearInterval(timer);
  }, [ready, current, started, autoNext, index, list.length, player]);

  // 공유용 URL 동기화
  useEffect(() => {
    const q = new URLSearchParams();
    if (playerId) q.set("p", playerId);
    if (kind) q.set("k", kind);
    if (index) q.set("c", String(index));
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [playerId, kind, index]);

  const select = (i: number) => {
    const c = list[i];
    if (!c) return;
    setIndex(i);
    setStarted(true);
    playClip(c);
  };
  const choosePlayer = (id: string | null) => {
    setPlayerId(id);
    setKind(null);
    setIndex(0);
  };
  const chooseKind = (k: ClipKind | null) => {
    setKind(k);
    setIndex(0);
  };

  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 권한 없음 */
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_23rem]">
      <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        {/* 영상 */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <div ref={el} className="h-full w-full" />
          {!started && current && (
            <button
              type="button"
              onClick={() => select(index)}
              disabled={!ready}
              className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-black/20 text-white disabled:cursor-wait"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 transition-transform duration-200 motion-safe:group-hover:scale-105">
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="ml-1 h-7 w-7">
                  <path d="M6 4.5v11l9-5.5-9-5.5z" />
                </svg>
              </span>
              <span className="text-sm font-bold">{ready ? `하이라이트 재생 · ${list.length}개 클립` : "영상 불러오는 중…"}</span>
            </button>
          )}
        </div>

        {/* NOW PLAYING */}
        {current ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[0.2em] text-blue-300">{started ? "NOW PLAYING" : "UP NEXT"}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${KIND_STYLE[current.kind].badge}`}>{kindLabel(current.kind)}</span>
              <span className="ml-auto text-sm text-gray-400 tabular-nums">
                {index + 1} / {list.length}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold">
                  {current.player} <span className="text-blue-300">{current.label}</span>
                </p>
                <p className="truncate text-sm text-gray-400">
                  {current.assist && <>어시스트 {current.assist} · </>}
                  {quarterLabel(current.quarter)} · {current.game}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <NavButton label="이전 클립" disabled={index === 0} onClick={() => select(index - 1)} dir="prev" />
                <NavButton label="다음 클립" disabled={index >= list.length - 1} onClick={() => select(index + 1)} dir="next" />
              </div>
            </div>
            {/* 클립 진행 */}
            <div className="mt-3 flex gap-0.5" aria-hidden>
              {list.length <= 40 &&
                list.map((c, i) => (
                  <span key={c.id} className={`h-1 flex-1 rounded-full ${i < index ? "bg-blue-500/50" : i === index ? "bg-blue-400" : "bg-gray-800"}`} />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-800 pt-2 text-sm">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-gray-300">
                <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                다음 클립 자동 재생
              </label>
              <button type="button" onClick={share} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-gray-300 hover:text-white">
                <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M8 12l4-4M7 9.5l-1.5 1.5a2.5 2.5 0 003.5 3.5L10.5 13M13 10.5l1.5-1.5A2.5 2.5 0 0011 5.5L9.5 7" strokeLinecap="round" />
                </svg>
                <span aria-live="polite">{copied ? "링크 복사됨" : "링크 복사"}</span>
              </button>
              <Link href={`/games/${current.gameId}`} className="inline-flex min-h-11 items-center text-gray-400 hover:text-blue-300">
                박스스코어 →
              </Link>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">조건에 맞는 클립이 없어요.</p>
        )}
      </div>

      <div className="space-y-4">
        {/* 필터 */}
        <div className="space-y-2 rounded-2xl border border-gray-800 bg-gray-900 p-3">
          {showPlayerFilter && (
            <ChipRow label="선수">
              <Chip active={!playerId} onClick={() => choosePlayer(null)} count={clips.length}>
                전체
              </Chip>
              {players.map((p) => (
                <Chip key={p.id} active={playerId === p.id} onClick={() => choosePlayer(p.id)} count={clips.filter((c) => c.playerId === p.id).length}>
                  {p.label}
                </Chip>
              ))}
            </ChipRow>
          )}
          <ChipRow label="종류">
            <Chip active={!kind} onClick={() => chooseKind(null)} count={byPlayer.length}>
              전체
            </Chip>
            {KINDS.map((k) => {
              const n = byPlayer.filter((c) => c.kind === k.key).length;
              return n ? (
                <Chip key={k.key} active={kind === k.key} onClick={() => chooseKind(k.key)} count={n}>
                  {k.label}
                </Chip>
              ) : null;
            })}
          </ChipRow>
        </div>

        {/* 클립 목록 */}
        <section aria-label="클립 목록" className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <p className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5 text-sm font-bold">
            재생 목록 <span className="text-xs font-medium text-gray-500 tabular-nums">{list.length}개</span>
          </p>
          <ol className="max-h-[28rem] overflow-y-auto lg:max-h-[calc(100vh-22rem)]">
            {list.map((c, i) => {
              const active = i === index;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-current={active ? "true" : undefined}
                    className={`relative flex w-full cursor-pointer items-center gap-3 py-2.5 pr-4 pl-5 text-left text-sm transition-colors duration-150 ${
                      active ? "bg-blue-500/10" : "hover:bg-gray-800/60"
                    }`}
                  >
                    <span aria-hidden className={`absolute top-2 bottom-2 left-1.5 w-1 rounded-full ${KIND_STYLE[c.kind].bar} ${active ? "" : "opacity-40"}`} />
                    <span className={`w-5 shrink-0 font-display text-lg leading-none tabular-nums ${active ? "text-blue-300" : "text-gray-600"}`}>
                      {active && started ? <Equalizer /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.player}</span>
                      <span className="block truncate text-xs text-gray-400">
                        <span className={active ? "text-blue-300" : "text-gray-300"}>{c.label}</span> · {quarterLabel(c.quarter)} · {c.game}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-gray-500">{fmtVideoTs(c.ts)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

/** 재생 중 표시 (동작 줄이기 설정이면 정지) */
function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-label="재생 중">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-1 rounded-sm bg-blue-400 motion-safe:animate-[eq_0.9s_ease-in-out_infinite]" style={{ height: "60%", animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

function NavButton({ label, disabled, onClick, dir }: { label: string; disabled: boolean; onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-100 transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d={dir === "prev" ? "M12.5 4.5L7 10l5.5 5.5" : "M7.5 4.5L13 10l-5.5 5.5"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={`${label} 필터`} className="flex flex-wrap items-center gap-1.5">
      <span className="w-9 shrink-0 text-xs font-bold text-gray-500">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 ${
        active ? "bg-blue-500 text-white" : "bg-gray-950 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
      }`}
    >
      {children}
      <span className={`text-xs tabular-nums ${active ? "text-blue-100" : "text-gray-600"}`}>{count}</span>
    </button>
  );
}
