"use server";

import { redirect } from "next/navigation";
import { toGameEvent } from "@/lib/data";
import { adminDb, checkPin, endSession, requireAdmin, startSession } from "@/lib/admin";
import type { EventType, GameEvent } from "@/lib/types";

const EVENT_TYPES: EventType[] = [
  "fg2_made", "fg2_miss", "fg3_made", "fg3_miss", "ft_made", "ft_miss",
  "oreb", "dreb", "stl", "blk", "tov", "pf",
];
const SHOT_KINDS = ["layup", "post", "mid"] as const;

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

// ── 로그인 ──────────────────────────────────────────

export async function login(_prev: { error: string; at: number } | undefined, fd: FormData) {
  if (!checkPin(String(fd.get("pin") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1000)); // 무차별 대입 지연
    return { error: "PIN이 맞지 않아요.", at: Date.now() };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

// ── 경기 ────────────────────────────────────────────

async function resolveTournament(fd: FormData) {
  const newName = text(fd, "newTournament");
  if (newName) {
    const { data, error } = await adminDb().from("tournaments").insert({ name: newName }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }
  return text(fd, "tournamentId");
}

function gameFields(fd: FormData) {
  const date = text(fd, "date");
  const opponent = text(fd, "opponent");
  if (!date || !opponent) throw new Error("날짜와 상대팀은 필수예요.");
  return {
    date,
    opponent,
    round: text(fd, "round"),
    venue: text(fd, "venue"),
    youtube_url: text(fd, "youtubeUrl"),
  };
}

export async function createGame(fd: FormData) {
  await requireAdmin();
  const { data, error } = await adminDb()
    .from("games")
    .insert({ ...gameFields(fd), tournament_id: await resolveTournament(fd) })
    .select("id")
    .single();
  if (error) throw error;
  redirect(`/admin/games/${data.id}`);
}

export async function updateGame(gameId: string, fd: FormData) {
  await requireAdmin();
  const { error } = await adminDb()
    .from("games")
    .update({
      ...gameFields(fd),
      tournament_id: await resolveTournament(fd),
      opponent_score: Math.max(0, Number(fd.get("opponentScore")) || 0),
      is_complete: fd.get("isComplete") === "on",
    })
    .eq("id", gameId);
  if (error) throw error;
  redirect(`/admin/games/${gameId}`);
}

export async function deleteGame(gameId: string) {
  await requireAdmin();
  const { error } = await adminDb().from("games").delete().eq("id", gameId);
  if (error) throw error;
  redirect("/admin");
}

/** 상대 점수 +/- (기록 화면의 빠른 버튼) */
export async function addOpponentScore(gameId: string, delta: number): Promise<number> {
  await requireAdmin();
  const db = adminDb();
  const { data, error } = await db.from("games").select("opponent_score").eq("id", gameId).single();
  if (error) throw error;
  const score = Math.max(0, data.opponent_score + Math.trunc(delta));
  const res = await db.from("games").update({ opponent_score: score }).eq("id", gameId);
  if (res.error) throw res.error;
  return score;
}

// ── 기록 ────────────────────────────────────────────

export async function addEvent(input: {
  gameId: string;
  playerId: string;
  type: EventType;
  quarter: number;
  shotKind?: (typeof SHOT_KINDS)[number];
  videoTs?: number;
}): Promise<GameEvent> {
  await requireAdmin();
  if (!EVENT_TYPES.includes(input.type)) throw new Error("잘못된 기록 종류예요.");
  if (input.shotKind && !SHOT_KINDS.includes(input.shotKind)) throw new Error("잘못된 슛 종류예요.");
  const { data, error } = await adminDb()
    .from("game_events")
    .insert({
      game_id: input.gameId,
      player_id: input.playerId,
      type: input.type,
      quarter: input.quarter,
      shot_kind: input.type === "fg2_made" ? (input.shotKind ?? null) : null,
      video_ts: typeof input.videoTs === "number" && Number.isFinite(input.videoTs) ? Math.round(input.videoTs * 10) / 10 : null,
    })
    .select()
    .single();
  if (error) throw error;
  return toGameEvent(data);
}

export async function setAssist(eventId: string, assistPlayerId: string | null): Promise<GameEvent> {
  await requireAdmin();
  const { data, error } = await adminDb()
    .from("game_events")
    .update({ assist_player_id: assistPlayerId })
    .eq("id", eventId)
    .in("type", ["fg2_made", "fg3_made"]) // 성공한 야투에만
    .select()
    .single();
  if (error) throw error;
  return toGameEvent(data);
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  const { error } = await adminDb().from("game_events").delete().eq("id", eventId);
  if (error) throw error;
}
