"use server";

import { redirect } from "next/navigation";
import { toGameEvent } from "@/lib/data";
import { adminDb, checkPin, endSession, requireAdmin, startSession } from "@/lib/admin";
import { POSITIONS, type EventType, type GameEvent } from "@/lib/types";

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
    // 같은 이름의 대회가 이미 있으면 재사용
    const existing = await adminDb().from("tournaments").select("id").eq("name", newName).limit(1);
    if (existing.error) throw existing.error;
    if (existing.data.length) return existing.data[0].id as string;
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

// ── 선수 ────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 검증 실패 시 입력값을 그대로 돌려줘 폼이 비워지지 않게 한다 */
export type PlayerFormState = { error: string; values: Record<string, string | string[]> } | undefined;

/** 선수 추가(playerId = null) 또는 수정 */
export async function savePlayer(playerId: string | null, _prev: PlayerFormState, fd: FormData): Promise<PlayerFormState> {
  await requireAdmin();
  const positions = fd.getAll("positions").filter((v): v is string => typeof v === "string");
  const values = {
    name: text(fd, "name") ?? "",
    number: text(fd, "number") ?? "",
    heightCm: text(fd, "heightCm") ?? "",
    birthDate: text(fd, "birthDate") ?? "",
    positions,
    isElite: fd.get("isElite") === "on" ? "on" : "",
    isActive: fd.get("isActive") === "on" ? "on" : "",
  };
  const fail = (error: string): PlayerFormState => ({ error, values });

  if (playerId !== null && !UUID.test(playerId)) return fail("잘못된 선수예요.");
  if (!values.name) return fail("이름을 입력해주세요.");
  if (!/^\d{1,3}$/.test(values.number)) return fail("등번호는 숫자 1~3자리로 입력해주세요.");
  if (positions.some((p) => !(POSITIONS as readonly string[]).includes(p))) return fail("잘못된 포지션이에요.");
  const height = values.heightCm ? Number(values.heightCm) : null;
  if (height !== null && !(Number.isInteger(height) && height >= 100 && height <= 250)) return fail("키는 100~250 사이 숫자(cm)로 입력해주세요.");
  if (values.birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate) || Number.isNaN(Date.parse(values.birthDate)))) {
    return fail("생년월일 형식이 올바르지 않아요.");
  }
  // 새 선수는 항상 활동 중으로 추가
  const isActive = playerId === null || values.isActive === "on";

  const db = adminDb();
  if (isActive) {
    // 활동 중인 선수끼리는 등번호가 겹치면 안 된다 (기록 화면에서 구분 불가)
    let dup = db.from("players").select("id, name").eq("number", values.number).eq("is_active", true);
    if (playerId) dup = dup.neq("id", playerId);
    const { data, error } = await dup.limit(1);
    if (error) throw error;
    if (data.length) return fail(`등번호 ${values.number}번은 ${data[0].name} 선수가 쓰고 있어요.`);
  }

  const row = {
    name: values.name,
    number: values.number,
    positions,
    height_cm: height,
    birth_date: values.birthDate || null,
    is_elite: values.isElite === "on",
    is_active: isActive,
  };
  const { error } = playerId ? await db.from("players").update(row).eq("id", playerId) : await db.from("players").insert(row);
  if (error) throw error;
  redirect("/admin/players");
}

/** 기록이 하나도 없는 선수만 삭제 가능. 기록이 있으면 비활성화로 대신한다 (삭제하면 지난 경기 점수가 바뀜). */
export async function deletePlayer(playerId: string) {
  await requireAdmin();
  if (!UUID.test(playerId)) throw new Error("잘못된 선수예요.");
  const db = adminDb();
  const used = await db
    .from("game_events")
    .select("id", { count: "exact", head: true })
    .or(`player_id.eq.${playerId},assist_player_id.eq.${playerId}`);
  if (used.error) throw used.error;
  if (used.count) throw new Error("기록이 있는 선수는 삭제할 수 없어요. 대신 '활동 중' 체크를 해제해주세요.");
  const { error } = await db.from("players").delete().eq("id", playerId);
  if (error) throw error;
  redirect("/admin/players");
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
