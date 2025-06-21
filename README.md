### 제공되는 Components

- `tomo-idv-client` 패키지에서는 아래 4개의 컴포넌트와 `ConnectionStatus` 타입을 export 합니다.

```tsx
export {
    type ConnectionStatus,
    StartTomoIDV,
    WebhookStatus,
    SessionWebHook,
    Signin
};
```

### Session Webhook Component

- SessionWebHook에서 서버로부터 `session_id` 를 수신합니다.
- `session_id` 를 `webhookHelper` 함수 파라메터를 통해 사용자 컴포넌트에 전달할 수 있습니다.

```tsx

function App() {

  function webhookHelper(connection_status: ConnectionStatus, session_id: string | null) {
    return (
      <TomoIDVClient connection_status={connection_status} session_id={session_id} />
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="flex space-x-4 items-center">
          <div>
            <SessionWebHook >
              { webhookHelper }
            </SessionWebHook>
          </div>
        </div>
      </header>
    </div>
  );
}
```

### Environment Variable setup

업데이트 시 바뀔 수 있음 

```shell
REACT_APP_WEBHOOK_URL=http://3.34.173.204:3000/webhook/session
REACT_APP_TOMO_IDV_URL=http://3.34.173.204:8081/auth/tomo-idv
REACT_APP_STORE_KYC_ENDPOINT=http://3.34.173.204:8080/plaid/store
REACT_APP_GENERATE_LINK_TOKEN_ENDPOINT=http://3.34.173.204:8080/plaid/generate_link_token
```

### 인증 및 고객 확인 화면

- `Signin`: 구글 로그인을 이용한 인증 및 `session_id` 발급
- `WebhookStatus`: 현재 webhook 연결상태 및 session_id 상태 확인
- `StartTomoIDV`: 고객 확인 절차 시작 (반드시 `session_id` 가 유효해야 진행 가능)

```tsx
	
interface TomoIDVClientProps { 
  connection_status: ConnectionStatus;
  session_id: string | null;
}

export default function TomoIDVClient({ connection_status, session_id }: TomoIDVClientProps) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      
      {/* Step 1: Login */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Signin
          className="w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150"
          label='로그인'
        />
      </div>

      {/* Step 2: Session Info and Monitor */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-gray-50 p-4 rounded">
          <WebhookStatus session_id={session_id} connectionStatus={connection_status} />
        </div>
      </div>

      {/* Step 3: IDV Process */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <StartTomoIDV
          session_id={session_id}
          className={`w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white transition duration-150 ${
            session_id 
              ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          label='고객 확인 시작'
        />
      </div>
    </div>
  );
}
```

Client 예제 
  https://github.com/Tomoarrow-Inc/TomoIDVQuickStart

TomoIDV API Document
  https://web.postman.co/workspace/812c5071-5235-4e35-80ac-57a78f7d5090/documentation/44525910-cea1a591-4484-4a0d-8947-c77eb4b91011

`/verify/session` 을 통해 세션이 유효한지 검증할 수 있습니다. 
`/results` 를 통해 로그인된 사용자의 고객 확인 정보를 얻어올 수 있습니다.
  
