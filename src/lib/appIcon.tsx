import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { TEAM_SHORT } from "@/config";

/**
 * 앱 아이콘: 파란 바탕 + 흰 팀 약자 (Bebas Neue) + 농구공 선.
 * 글자는 가운데 60% 안에 두어 안드로이드 maskable(원형 잘림)에서도 안전.
 */
export async function renderAppIcon(size: number) {
  const font = await readFile(join(process.cwd(), "src/assets/fonts/BebasNeue-Regular.ttf"));
  const line = Math.max(1, Math.round(size * 0.018));
  // 아이콘 폰트(Bebas Neue)에는 한글이 없다. 영문·숫자가 아니면 글자 없이 농구공 선만 그린다.
  const text = /^[\x21-\x7e]+$/.test(TEAM_SHORT) ? TEAM_SHORT : "";
  const lineColor = `rgba(255,255,255,${text ? 0.14 : 0.5})`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(145deg, #3b82f6 0%, #1d4ed8 60%, #172554 100%)",
        }}
      >
        {/* 농구공 선 */}
        <div
          style={{
            position: "absolute",
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: "50%",
            border: `${line}px solid ${lineColor}`,
            left: -size * 0.55,
            top: -size * 0.05,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: "50%",
            border: `${line}px solid ${lineColor}`,
            right: -size * 0.55,
            top: -size * 0.05,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: size / 2, height: line, background: lineColor }} />
        <div
          style={{
            fontFamily: "Bebas Neue",
            // 3글자면 가운데 안전 영역(60%) 안에 들어오도록 줄인다
            fontSize: size * (text.length > 2 ? 0.42 : 0.56),
            lineHeight: 1,
            color: "white",
            letterSpacing: size * 0.01,
            marginTop: size * 0.06,
          }}
        >
          {text}
        </div>
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Bebas Neue", data: font, style: "normal", weight: 400 }] },
  );
}
