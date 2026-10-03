import { createClient } from "@supabase/supabase-js";

/** 읽기 전용 클라이언트 (anon key, RLS 의 public read 정책만 통과) */
export function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase 환경변수가 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
