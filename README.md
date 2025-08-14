# TomoIDV Client Deverloper Guide

TomoIDV는 해외 고객의 신분증(ID)를 검증(Verification)하는 서비스입니다. 크게 OAuth 2.0 인증과 IDV 서비스로 이루어져있으며, OAuth 2.0 인증이 된 회원만 IDV를 수행할 수 있습니다.

## 🚀 설치 및 설정

### 1. 패키지 설치

```bash
# npm을 사용하는 경우
npm install tomo-idv-client

# yarn을 사용하는 경우
yarn add tomo-idv-client
```

### 2. 기본 import

```typescript
import { ConnectionStatus, TomoIDV } from 'tomo-idv-client';
// type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
```

## 🔄 서비스 구조

### 가맹사 사이트에서 OAuth Sign in, IDV Service

가맹사 사이트에서 TomoIDV 서비스에 OAuth Sign In시 session_id가 발급됩니다. 이 session_id를 IDV Service에 전달하여 신분증 인증(IDV)를 수행할 수 있습니다.

```

┌─────────────┐      Webhook    ┌─────────────┐      session_id    ┌─────────────┐
│    OAuth    │ ◄────────────── │   Merchant  │ ─────────────────► │     IDV     │
│   Sign In   │ ──────────────► │     Site    │ ◄───────────────── │   Service   │
└─────────────┘    session_id   └─────────────┘    verified: y/n   └─────────────┘

```

### 구현

#### 1단계: Google OAuth 인증

`TomoIDV.useTomoAuth` Hook을 사용하여 `establishConnection()` 함수를 얻을 수 있습니다. 이 함수를 이용해 Webhook 연결 하고, Sign in이 끝나면 `onSessionIdChange`에서`session_id`를 얻어올 수 있습니다. Webhook 연결 상태를 확인하려면 `onConnectionStatusChange`를 이용할 수 있습니다.

```typescript

export default function TomoIDVClient() {

  const [session_id, setSessionId] = useState<string | null>(null);
  const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const { establishConnection } = TomoIDV.useTomoAuth({
    onConnectionStatusChange: setConnectionStatus,
    onSessionIdChange: setSessionId
  });

  const handleLogin = async () => {
    await establishConnection();
  };

  ...

  return (
    <button onClick={handleLogin}>
      'Login with TomoIDV'
    </button>
  )
}

```

#### 2단계: 신분증 검증(Identity Verification)

`TomoIDV.useTomoIDV()` hook을 통해 `openTomoIDVPopup()` 함수를 얻을 수 있습니다. OAuth Sing in을 통해 얻은 `seession_id`를 이용하여 IDV를 시작할 수 있습니다. IDV를 위한 팝업창이 뜨고, 사용자는 국가별 IDV 절차를 진행하게 됩니다.

```typescript
import { ConnectionStatus, TomoIDV } from 'tomo-idv-client';

export default function TomoIDVClient() {
  const [session_id, setSessionId] = useState<string | null>(null);
  const { openTomoIDVPopup } = TomoIDV.useTomoIDV();

  const handleStartIDV = async () => {
    openTomoIDVPopup(session_id);
  };

  ... 

  return (
    <button onClick={handleStartIDV}>
      Start Identity Verification
    </button>
  )
}
```

#### 3단계: 인증/검증 여부 확인

사용자의 접근제한을 위해 `session_id` 유효성 검사와 사용자의 IDV 수행 여부를 검사할 수 있습니다.

사용 가능한 국가 코드(`<country_code>`)는 `jp, us, uk, ca`(일본, 미국, 영국, 캐나다) 입니다.

Base url: `https://test.tomopayment.com/v1`

* `POST /verify/session`: 로그인된 사용자의 Session이 유효한지 검사 (만료: 생성 후 1h)

  * Request Body Type: `{ session_id: string }`
  * Response Body Type: `{ verified: bool }`
* `POST /<country_code>/verify/kyc`: 로그인된 사용자가 IDV 인증을 성공적으로 수행했는지 여부 검사

  * Request Body Type: `{ session_id: string }`
  * Response Body Type: `{ verified: bool }`
