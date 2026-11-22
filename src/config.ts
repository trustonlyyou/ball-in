// 팀별 설정. 같은 코드를 팀마다 따로 배포하고, 배포(Vercel 프로젝트)별 환경변수로 지정한다.
// 환경변수가 없으면 처음 만든 팀(JUST SHOOT) 값으로 동작한다.

/** 팀 이름. 헤더·탭 제목·앱 이름에 쓰인다. */
export const TEAM_NAME = process.env.NEXT_PUBLIC_TEAM_NAME?.trim() || "JUST SHOOT";

/** 로고·앱 아이콘에 들어가는 1~3글자. 지정하지 않으면 팀 이름 단어의 첫 글자들 (JUST SHOOT → JS). */
export const TEAM_SHORT =
  process.env.NEXT_PUBLIC_TEAM_SHORT?.trim() ||
  (TEAM_NAME.split(/\s+/).length > 1
    ? TEAM_NAME.split(/\s+/).map((w) => w[0]).join("")
    : TEAM_NAME
  ).slice(0, 3).toUpperCase();
