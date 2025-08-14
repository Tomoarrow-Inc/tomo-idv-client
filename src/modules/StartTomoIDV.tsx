import React, { useState, useEffect } from "react";
// import { usePlaidLink } from "react-plaid-link";

import { config, EnvironmentErrorBoundary } from "./ClientEnv";

interface StartTomoIDVProps {
    session_id: string | null;
    className?: string;
    label?: string;
}

const StartTomoIDV = ({ session_id, className = '', label = 'Start Identity Verification' }: StartTomoIDVProps) => {
  // const [linkToken, setLinkToken] = useState<string | null>(null);

  // 기존 Plaid Link 관련 코드 주석 처리
  /*
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      await fetch(config.storeKycEndpoint, {
        method: 'POST',
        body: JSON.stringify({ idv_session_id: metadata.link_session_id, session_id: session_id }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(`Finished with IDV! ${JSON.stringify(metadata, null, 2)}`);
  
    },
    onExit: async (err, metadata) => {
      console.log(
        `Exited early. Error: ${JSON.stringify(err, null, 2)} Metadata: ${JSON.stringify(
          metadata
        )}`
      );
    },
    onEvent: (eventName, metadata) => {
      console.log(`Event ${eventName}, Metadata: ${JSON.stringify(metadata, null, 2)}`);
      if (eventName === 'IDENTITY_VERIFICATION_START_STEP') {
      }
    },
  });

  useEffect(() => {
    if (linkToken && ready) {
        open();
    }
  }, [linkToken, ready, open]);
  */

  // 새로운 팝업 창 열기 함수
  const openIdvPopup = () => {
    if (!session_id) {
      console.error('Session ID is required to open IDV popup');
      return;
    }

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // session_id를 쿼리 스트링으로 추가
    const url = `${config.tomoIdvAppUrl}?sessionId=${encodeURIComponent(session_id)}`;

    // 팝업 창 열기
    const popup = window.open(
      url,
      'TomoIDV',
      `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer,scrollbars=yes,resizable=yes`
    );

    // 팝업이 차단되었는지 확인
    // if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    //   alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
    // }

    console.log(`IDV popup opened with session ID: ${session_id}`);
  };

  return (
    <EnvironmentErrorBoundary>
    {/* 기존 Plaid 버튼 코드 주석 처리
    <button
      onClick={() => {
        fetch(config.generateLinkTokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id })
        })
          .then(response => response.json())
          .then(data => data.link_token)
          .then(setLinkToken)
          .catch(error => {
            console.error('Failed to fetch link token:', error);
          })
        }
      }
      className={`${className} ${!session_id ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!session_id}
      >
        {label}
      </button>
    */}
    
    {/* 새로운 IDV 팝업 버튼 */}
    <button
      onClick={openIdvPopup}
      className={`${className} ${!session_id ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={!session_id}
      >
        {label}
      </button>
    </EnvironmentErrorBoundary>
  );
}

export default StartTomoIDV;