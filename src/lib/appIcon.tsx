import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * 앱 아이콘: 파란 바탕 + 흰 "JS" (Bebas Neue) + 농구공 선.
 * 글자는 가운데 60% 안에 두어 안드로이드 maskable(원형 잘림)에서도 안전.
 */
export async function renderAppIcon(size: number) {
  const font = await readFile(join(process.cwd(), "src/assets/fonts/BebasNeue-Regular.ttf"));
  const line = Math.max(1, Math.round(size * 0.018));
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
            border: `${line}px solid rgba(255,255,255,0.14)`,
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
            border: `${line}px solid rgba(255,255,255,0.14)`,
            right: -size * 0.55,
            top: -size * 0.05,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: size / 2, height: line, background: "rgba(255,255,255,0.14)" }} />
        <div
          style={{
            fontFamily: "Bebas Neue",
            fontSize: size * 0.56,
            lineHeight: 1,
            color: "white",
            letterSpacing: size * 0.01,
            marginTop: size * 0.06,
          }}
        >
          JS
        </div>
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Bebas Neue", data: font, style: "normal", weight: 400 }] },
  );
}
