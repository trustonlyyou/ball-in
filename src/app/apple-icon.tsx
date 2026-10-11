import { renderAppIcon } from "@/lib/appIcon";

// 아이폰 홈 화면 아이콘 (iOS 가 모서리를 자동으로 둥글게 처리)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(180);
}
