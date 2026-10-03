"use client";

import { useState, useTransition } from "react";
import { addEvent, addOpponentScore, deleteEvent, setAssist } from "@/app/admin/actions";
import { TEAM_NAME } from "@/config";
import { EVENT_POINTS, eventLabel, quarterLabel } from "@/lib/events";
import type { EventType, Game, GameEvent, Player } from "@/lib/types";
import { fmtVideoTs, youtubeId } from "@/lib/youtube";
import { useYouTube } from "../useYouTube";

type ShotKind = "layup" | "post" | "mid";
type Action = { type: EventType; label: string; shotKind?: ShotKind; tone: "made" | "miss" | "other" };

const ACTIONS: Action[] = [
  { type: "fg2_made", shotKind: "layup", label: "레이업", tone: "made" },
  { type: "fg2_made", shotKind: "post", label: "골밑슛", tone: "made" },
  { type: "fg2_made", shotKind: "mid", label: "미들슛", tone: "made" },
  { type: "fg3_made", label: "3점 성공", tone: "made" },
  { type: "ft_made", label: "자유투 성공", tone: "made" },
  { type: "fg2_miss", label: "2점 실패", tone: "miss" },
  { type: "fg3_miss", label: "3점 실패", tone: "miss" },
  { type: "ft_miss", label: "자유투 실패", tone: "miss" },
  { type: "oreb", label: "공격 리바", tone: "other" },
  { type: "dreb", label: "수비 리바", tone: "other" },
  { type: "stl", label: "스틸", tone: "other" },
  { type: "blk", label: "블락", tone: "other" },
  { type: "tov", label: "턴오버", tone: "other" },
  { type: "pf", label: "파울", tone: "other" },
];

const TONE = {
  made: "bg-blue-500 text-white hover:bg-blue-400",
  miss: "bg-gray-700 text-gray-100 hover:bg-gray-600",
  other: "bg-gray-800 text-gray-100 hover:bg-gray-700",
};

const QUARTERS = [1, 2, 3, 4, 5];

// ── 기록 화면 ────────────────────────────────────────

export function Recorder({ game, players, initialEvents }: { game: Game; players: Player[]; initialEvents: GameEvent[] }) {
  const videoId = youtubeId(game.youtubeUrl);
  const { el, player } = useYouTube(videoId);

  const [events, setEvents] = useState(initialEvents);
  const [opponentScore, setOpponentScore] = useState(game.opponentScore);
  const [quarter, setQuarter] = useState(initialEvents.at(-1)?.quarter ?? 1);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [assistFor, setAssistFor] = useState<GameEvent | null>(null); // 어시스트 선택 대기 중인 슛
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = new Map(players.map((p) => [p.id, p]));
  const who = (id?: string) => {
    const p = id ? byId.get(id) : undefined;
    return p ? `#${p.number} ${p.name}` : "?";
  };
  const ourScore = events.reduce((sum, e) => sum + (EVENT_POINTS[e.type] ?? 0), 0);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      }
    });

  const record = (a: Action) => {
    if (!playerId) return;
    const videoTs = player.current?.getCurrentTime();
    run(async () => {
      const ev = await addEvent({ gameId: game.id, playerId, type: a.type, quarter, shotKind: a.shotKind, videoTs });
      setEvents((xs) => [...xs, ev]);
      setAssistFor(ev.type === "fg2_made" || ev.type === "fg3_made" ? ev : null);
    });
  };

  const pickAssist = (assistId: string | null) => {
    const target = assistFor;
    setAssistFor(null);
    if (!target || !assistId) return;
    run(async () => {
      const ev = await setAssist(target.id, assistId);
      setEvents((xs) => xs.map((x) => (x.id === ev.id ? ev : x)));
    });
  };

  const remove = (ev: GameEvent) => {
    if (!confirm(`${quarterLabel(ev.quarter)} ${who(ev.playerId)} ${eventLabel(ev)} 기록을 삭제할까요?`)) return;
    run(async () => {
      await deleteEvent(ev.id);
      setEvents((xs) => xs.filter((x) => x.id !== ev.id));
      if (assistFor?.id === ev.id) setAssistFor(null);
    });
  };

  const opp = (delta: number) =>
    run(async () => {
      setOpponentScore(await addOpponentScore(game.id, delta));
    });

  const seek = (ts?: number) => {
    if (ts === undefined || !player.current) return;
    player.current.seekTo(Math.max(0, ts - 3), true);
    player.current.playVideo();
  };

  return (
    <div className="space-y-4">
      {/* 점수 */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-400">{TEAM_NAME}</p>
          <p className="font-display text-5xl leading-none tabular-nums text-blue-300">{ourScore}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">vs</p>
          {pending && <p className="text-xs text-amber-300">저장 중…</p>}
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate text-xs text-gray-400">{game.opponent}</p>
          <p className="font-display text-5xl leading-none tabular-nums">{opponentScore}</p>
          <div className="mt-1 flex justify-end gap-1">
            {[-1, 1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => opp(d)}
                className="min-h-9 min-w-9 cursor-pointer rounded-md bg-gray-800 px-2 text-xs font-bold text-gray-200 hover:bg-gray-700"
                aria-label={`상대 점수 ${d > 0 ? "+" : ""}${d}`}
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {/* 영상 */}
          {videoId ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <div ref={el} className="h-full w-full" />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-400">
              유튜브 주소가 없어서 영상 시간은 저장되지 않아요. 아래 &lsquo;경기 정보 수정&rsquo;에서 영상 주소를 넣으면 하이라이트용 시간이 함께 기록돼요.
            </p>
          )}

          {/* 쿼터 */}
          <div role="group" aria-label="쿼터" className="flex gap-1 rounded-xl bg-gray-900 p-1">
            {QUARTERS.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={quarter === q}
                onClick={() => setQuarter(q)}
                className={`min-h-11 flex-1 cursor-pointer rounded-lg text-sm font-bold transition-colors ${
                  quarter === q ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                {quarterLabel(q)}
              </button>
            ))}
          </div>

          {/* 어시스트 선택 (슛 성공 직후) */}
          {assistFor ? (
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-3">
              <p className="mb-2 text-sm font-bold">
                {who(assistFor.playerId)} {eventLabel(assistFor)} — 어시스트한 선수는?
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => pickAssist(null)}
                  className="min-h-11 cursor-pointer rounded-lg bg-gray-800 px-4 text-sm font-bold text-gray-200 hover:bg-gray-700"
                >
                  없음
                </button>
                {players
                  .filter((p) => p.id !== assistFor.playerId)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickAssist(p.id)}
                      className="min-h-11 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm hover:bg-gray-800"
                    >
                      <span className="font-display text-base text-gray-400">{p.number}</span> {p.name}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <>
              {/* 선수 */}
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">1. 선수 선택</p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={playerId === p.id}
                      onClick={() => setPlayerId(p.id)}
                      className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg transition-colors ${
                        playerId === p.id ? "bg-blue-500 text-white ring-2 ring-blue-300" : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      <span className="font-display text-2xl leading-none">{p.number}</span>
                      <span className="text-xs">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 기록 버튼 */}
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">2. 기록 {playerId && <span className="text-blue-300">({who(playerId)})</span>}</p>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      disabled={!playerId || pending}
                      onClick={() => record(a)}
                      className={`min-h-12 cursor-pointer rounded-lg text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONE[a.tone]}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 기록 목록 */}
        <section aria-label="기록 목록" className="rounded-xl border border-gray-800 bg-gray-900">
          <p className="border-b border-gray-800 px-4 py-2 text-sm font-bold">
            기록 <span className="text-gray-500 tabular-nums">{events.length}</span>
          </p>
          {events.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">아직 기록이 없어요.</p>
          ) : (
            <ol className="max-h-[32rem] divide-y divide-gray-800 overflow-y-auto">
              {[...events].reverse().map((e) => (
                <li key={e.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="w-9 shrink-0 text-xs text-gray-500">{quarterLabel(e.quarter)}</span>
                  {e.videoTs !== undefined ? (
                    <button
                      type="button"
                      onClick={() => seek(e.videoTs)}
                      className="w-14 shrink-0 cursor-pointer rounded text-left font-mono text-xs text-blue-300 hover:underline"
                      title="영상에서 보기"
                    >
                      {fmtVideoTs(e.videoTs)}
                    </button>
                  ) : (
                    <span className="w-14 shrink-0 text-xs text-gray-600">-</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {who(e.playerId)} <span className={EVENT_POINTS[e.type] ? "font-bold text-blue-300" : "text-gray-300"}>{eventLabel(e)}</span>
                    </p>
                    {e.assistPlayerId && <p className="truncate text-xs text-gray-500">어시스트 {who(e.assistPlayerId)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(e)}
                    aria-label="기록 삭제"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
