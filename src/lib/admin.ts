import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const COOKIE = "admin_session";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 없습니다.`);
  return v;
}

/** 쓰기용 클라이언트 (secret key, RLS 우회). 서버에서만 사용. */
export function adminDb() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });
}

/** PIN 이 바뀌면 기존 세션도 무효가 되도록 PIN+secret 으로 토큰을 만든다 */
function sessionToken() {
  return createHash("sha256").update(`${env("ADMIN_PIN")}:${env("SUPABASE_SECRET_KEY")}`).digest("hex");
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPin(pin: string) {
  return same(createHash("sha256").update(pin).digest("hex"), createHash("sha256").update(env("ADMIN_PIN")).digest("hex"));
}

export async function startSession() {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  return !!v && same(v, sessionToken());
}

/** 모든 서버 액션 첫 줄에서 호출 */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("관리자 로그인이 필요합니다.");
}
