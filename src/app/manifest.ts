import type { MetadataRoute } from "next";
import { TEAM_NAME } from "@/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${TEAM_NAME} 농구팀`,
    short_name: TEAM_NAME,
    description: `${TEAM_NAME} 농구팀 경기 기록·스탯·하이라이트`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030712",
    theme_color: "#030712",
    lang: "ko",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // 글자가 가운데 안전 영역 안에 있어 같은 이미지를 maskable 로도 사용
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
