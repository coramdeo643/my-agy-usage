*Read this in [English](README.md)*

# My Antigravity Usage (Antigravity Lite)

100% 로컬 프라이버시를 보장하는 초경량 **(~30 KB)** 상태 표시줄 확장 프로그램입니다. Antigravity AI 모델의 사용량(Quota)을 클릭 없이 한눈에 모니터링할 수 있습니다. 외부 네트워크 호출, OAuth 인증, 백그라운드 프로세스가 전혀 없습니다.

<p align="center">
  <img src="dev.coramdeo_profile.png" alt="My Antigravity Usage Icon" width="128">
</p>

## 📸 미리보기

<p align="center">
  <img src="images/screenshot.png" alt="상태 표시줄에 표시되는 사용량과 툴팁" width="600">
</p>

## ✨ 주요 기능

- **미니멀리즘 상태 표시줄 (Status Bar)**: 길고 복잡한 모델명 대신 직관적인 커스텀 폰트 차트 아이콘(링 및 파이 차트)과 남은 퍼센트(%), 남은 시간 카운트다운을 상태 표시줄에 표시하여 작업 공간을 방해하지 않습니다.
- **깔끔한 툴팁 (Rich Tooltip)**: 상태 표시줄에 마우스를 올리면 "Gemini"와 "Claude/GPT" 모델 패밀리별 할당량과 정확한 리셋 시각을 한눈에 확인할 수 있습니다.
- **다채널 리셋 알림 & 사운드**: 할당량이 복구/초과 초기화될 때 3가지 채널로 즉시 알림을 제공합니다.
  1. 🖥️ **OS 데스크톱 시스템 알림**: Windows Toast 등 OS 기본 알림 배너.
  2. 💬 **인앱 토스트 알림**: IDE 우측 하단의 알림 팝업.
  3. 🔊 **효과음 사운드**: Antigravity IDE의 에이전틱 작업 완료 효과음 재생.

## 🔒 강력한 프라이버시 보호 (100% 로컬)

모든 데이터 처리는 **사용자의 컴퓨터 내에서 100% 로컬로 실행**됩니다. 확장 프로그램은 이미 로컬에서 실행 중인 Antigravity 프로세스에서 할당량 데이터를 직접 읽어옵니다. 그 어떤 요청도 `localhost`를 벗어나지 않습니다.

- 인터넷 요청 없음, 모든 호출은 `127.0.0.1` 내부에서만 처리
- Google 인증, OAuth 불필요, 토큰 저장 안 함
- 외부 서버로 전송되는 데이터 없음, 개인의 사용 패턴 완벽 보장

## 🪶 초경량 깃털 용량 (~30 KB)

`esbuild`를 통한 극한의 최적화로 전체 확장 프로그램이 약 30 KB 크기의 단일 자바스크립트 번들로 압축됩니다.

- 무거운 웹뷰(Webview)나 CSS 프레임워크 미사용
- 0.1초 만에 로드되는 초고속 활성화
- VS Code API 외에 어떠한 외부 라이브러리(Dependencies)도 사용하지 않음

## ⚙️ 설정 (Configuration)

| 설정 항목 | 기본값 | 범위 / 타입 | 설명 |
|---|---|---|---|
| `myAgyUsage.refreshInterval` | `20` | `20-3600` (초) | 로컬 서버로부터 사용량 데이터를 갱신하는 주기(초 단위). |
| `myAgyUsage.notifyOnReset` | `true` | `boolean` | 할당량 리셋 시 OS 시스템 알림, 인앱 토스트 및 효과음 재생 여부. |

## ⌨️ 명령어 (Commands)

| 명령어 | 단축키 | 설명 |
|---|---|---|
| `Antigravity Lite: Refresh Quota Data` | `Ctrl/Cmd+Shift+R` | 사용량 데이터를 즉시 새로고침합니다 |

## 🚀 설치 방법

1. VS Code(또는 Antigravity)를 열고 확장(Extensions) 탭(`Ctrl+Shift+X`)으로 이동합니다.
2. **My Antigravity Usage** 를 검색합니다.
3. **설치(Install)** 버튼을 클릭합니다.

## 📄 라이선스 (License)

[MIT License](LICENSE)
