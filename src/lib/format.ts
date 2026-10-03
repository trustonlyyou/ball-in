/** 2026-09-20 → 9.20 */
export const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(m)}.${Number(day)}`;
};

/** 2026-09-20 → 2026년 9월 20일 (일) */
export const fmtLongDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const weekday = "일월화수목금토"[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
  return `${y}년 ${m}월 ${day}일 (${weekday})`;
};

export const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
