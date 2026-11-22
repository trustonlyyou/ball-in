# ball-in

동호회 농구팀을 위한 기록 사이트. 경기 영상을 보면서 기록을 입력하면 박스스코어, 시즌 스탯, 하이라이트가 자동으로 만들어진다.

- **홈 · 경기 · 스탯 · 하이라이트 · 라커룸**: 누구나 볼 수 있는 공개 페이지
- **기록 관리 (`/admin`)**: PIN 으로 들어가서 경기를 만들고, 유튜브 영상을 보며 기록하고, 선수 명단을 관리
- **앱 설치 (PWA)**: 안드로이드·아이폰 홈 화면에 앱처럼 설치

Next.js (App Router) + Supabase + Vercel. 팀 하나 기준으로 모두 무료 플랜에서 동작한다.

## 여러 팀이 쓰는 방식

코드는 이 저장소 하나다. **팀마다 Vercel 프로젝트와 Supabase DB 를 따로 만들고**, 팀 이름·PIN·DB 주소는 Vercel 프로젝트의 환경변수로 넣는다.

```
GitHub: ball-in (코드 하나)
 ├─ Vercel 프로젝트 A  →  A팀 사이트  →  Supabase DB A
 └─ Vercel 프로젝트 B  →  B팀 사이트  →  Supabase DB B
```

- `main` 에 push 하면 모든 팀 사이트가 함께 새 버전으로 배포된다.
- 팀끼리 데이터는 완전히 분리된다 (DB 가 다르다).

## 새 팀 추가하기

15~20분쯤 걸린다.

### 1. Supabase 프로젝트 만들기

1. <https://supabase.com> 에서 **New project** (지역: Northeast Asia (Seoul)).
2. **SQL Editor → New query** 에 [`supabase/schema.sql`](supabase/schema.sql) 내용을 통째로 붙여넣고 **Run**.
   "Success. No rows returned" 가 나오면 된다.
3. **Project Settings → API Keys** 에서 세 값을 복사해 둔다.

   | 값 | 어디에 쓰나 |
   |---|---|
   | Project URL (`https://xxxx.supabase.co` 까지만, `/rest/v1/` 는 빼기) | `NEXT_PUBLIC_SUPABASE_URL` |
   | Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | Secret key (`sb_secret_…`, 복사 버튼으로 복사) | `SUPABASE_SECRET_KEY` |

   Secret key 는 DB 를 전부 고칠 수 있는 키다. 메신저나 저장소에 올리지 않는다.

`supabase/seeds/` 의 파일은 특정 팀 전용이니 실행하지 않는다.

### 2. Vercel 프로젝트 만들기

1. <https://vercel.com/new> 에서 이 저장소(`ball-in`)를 **Import**. 같은 저장소를 여러 프로젝트로 가져올 수 있다.
2. **Project Name** 이 사이트 주소가 된다 (`이름.vercel.app`).
3. **Environment Variables** 에 아래 값을 넣고 **Deploy**.

   | 이름 | 값 |
   |---|---|
   | `NEXT_PUBLIC_TEAM_NAME` | 팀 이름. 예: `UPTEMPO` |
   | `NEXT_PUBLIC_TEAM_SHORT` | 로고·앱 아이콘 글자. 영문·숫자 1~3자. 예: `UT` |
   | `NEXT_PUBLIC_SUPABASE_URL` | 1단계의 Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1단계의 Publishable key |
   | `SUPABASE_SECRET_KEY` | 1단계의 Secret key |
   | `ADMIN_PIN` | 기록 관리 PIN (숫자 4~6자리) |

   `NEXT_PUBLIC_` 값은 빌드할 때 사이트에 들어간다. 나중에 바꾸면 **Redeploy** 해야 반영된다.

### 3. 첫 설정

1. `https://사이트주소/admin` 에 PIN 으로 들어간다.
2. **선수 관리** 에서 선수를 추가한다 (이름·등번호는 필수, 포지션·키·생년월일·선출은 선택).
3. **새 경기 만들기** 로 경기를 만들고 기록한다. 유튜브 주소를 넣으면 기록한 장면이 하이라이트가 된다.
4. 경기가 끝나면 **경기 정보 수정 → 경기 종료** 를 체크해야 전적과 스탯에 반영된다.

### 4. 확인

- Vercel 프로젝트 **Settings → Cron Jobs** 에 `/api/keepalive` 가 보이는지 확인한다.
  Supabase 무료 플랜은 7일 동안 사용이 없으면 DB 를 일시정지하는데, 이 작업이 하루 한 번 DB 를 조회해서 막아준다.
- 휴대폰에서 사이트를 열고 헤더의 **앱 설치** 를 눌러본다 (아이폰은 Safari 에서).

## 알아둘 것

- **선수 삭제**: 기록이 있는 선수는 삭제할 수 없다 (지난 경기 점수가 바뀌기 때문). 선수 수정에서 "활동 중" 을 해제하면 라커룸과 기록 화면에서만 숨겨진다.
- **DB 구조 변경**: `supabase/migrations/` 에 새 SQL 파일을 추가하고 `supabase/schema.sql` 도 같이 고친다. 새 SQL 은 **운영 중인 팀 DB 마다 한 번씩** SQL Editor 에서 실행해야 한다. 코드를 push 하기 전에 먼저 실행한다.
- **무료 한도**: Supabase 무료 프로젝트는 계정(조직)당 개수 제한이 있다. 팀이 늘면 그 팀이 자기 Supabase 계정을 만드는 편이 낫다. Vercel 무료(Hobby) 플랜은 비상업적 용도만 허용한다.
- **팀 색상**: 지금은 모든 팀이 같은 파란색 테마를 쓴다.

## 로컬 개발

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` 의 DB 가 운영 DB 라면 로컬에서 기록한 내용도 실제 사이트에 반영된다.

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 폴더 구조

```
src/app/                 페이지 (홈, games, stats, highlights, locker, admin)
src/app/admin/actions.ts 기록·경기·선수를 고치는 서버 액션 (모두 PIN 세션 확인)
src/components/          화면 컴포넌트
src/lib/                 DB 조회(data), 통계 계산(stats), 하이라이트(highlights), 관리자 인증(admin)
src/config.ts            팀 이름·약자 (환경변수)
supabase/schema.sql      새 팀용 DB 초기화
supabase/migrations/     DB 구조 변경 이력
```
