# 버미쌤 주제 연구소

웹사이트: https://saebom7.github.io/bummy-research/

## 구성
- GitHub Pages: `index.html` (사용자 화면)
- Node.js API 서버: `server.mjs` (YouTube 및 네이버 API 키 보호)
- `package.json`: 서버 실행 명령 `npm start`

## Render 서버 배포 (웹 서비스)
1. https://dashboard.render.com/ 접속, GitHub 연결
2. New > Web Service > `saebom7/bummy-research` 선택
3. Language: Node / Branch: main / Build Command: `npm install` / Start Command: `npm start`
4. 환경변수(서버 설정 메뉴에서만 입력, 공개 GitHub에 절대 입력 금지)
   - `YOUTUBE_API_KEY`: Google Cloud에서 만든 YouTube Data API v3 키
   - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 개발자센터 뉴스 검색 API 인증 정보 (나중에 추가 가능)
5. 서버 배포가 끝나면 Render가 발급한 `https://...onrender.com` 주소를 GitHub Pages 첫 화면의 '서버 연결' 칸에 입력

## 보안
- API 키는 GitHub 저장소, 브라우저 개발자 도구, 채팅, 스크린샷에 노출하지 마세요.
- 서버 환경변수에서만 보관하세요.
- Google Cloud API 키는 YouTube Data API v3로 제한하고, 배포 플랫폼의 고정 IP 제공 여부에 따라 추가 제한을 검토하세요.
- 공개 서버에는 남용 방지를 위한 접근 제어/속도 제한이 추가로 필요합니다. 현재 코드는 개인 테스트용입니다.
- 공개 API 데이터는 최신 조회수이며 과거 특정 시점 조회수를 보장하지 않습니다.

## 제한
- 네이버 검색 API는 5년치 전체 기사 아카이브를 제공하지 않습니다.
- 유튜브 영상 목록은 페이지당 최대 50개, 추가 페이지로 탐색합니다.
- Render 무료 인스턴스는 유휴 시 잠들어 첫 호출이 느릴 수 있으며 무료 플랜 정책은 변동될 수 있습니다.
