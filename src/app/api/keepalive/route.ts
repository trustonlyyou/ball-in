import { supabase } from "@/lib/supabase";

/**
 * Supabase 무료 플랜은 7일간 사용이 없으면 프로젝트를 일시정지한다.
 * Vercel Cron 이 하루 한 번 호출해 가벼운 조회로 활성 상태를 유지한다 (vercel.json).
 * CRON_SECRET 이 설정되어 있으면 Vercel Cron 요청(Authorization: Bearer)만 허용.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const { error } = await supabase().from("players").select("id").limit(1);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 503 });
  return Response.json({ ok: true, at: new Date().toISOString() });
}
