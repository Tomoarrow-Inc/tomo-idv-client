import React, { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

import { config, EnvironmentErrorBoundary } from "./ClientEnv";

interface StartTomoIDVProps {
    session_id: string | null;
    className?: string;
    label?: string;
}

const StartTomoIDV = ({ session_id, className = '', label = 'Start Identity Verification' }: StartTomoIDVProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

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


  return (
    <EnvironmentErrorBoundary>
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
    </EnvironmentErrorBoundary>
  );
}

export default StartTomoIDV;