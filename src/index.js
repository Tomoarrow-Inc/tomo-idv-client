import React from "react";
import { usePlaidLink } from "react-plaid-link";


export const StartTomoIDV = ({ linkTokenData }) => {

  const { open, ready } = usePlaidLink({
    token: linkTokenData?.link_token ?? "",
    onSuccess: async (publicToken, metadata) => {
      console.log(`Finished with IDV! ${JSON.stringify(metadata, null, 2)}`);
    //   await tellServerUserIsDoneWithIDV(metadata.link_session_id);
      // await refreshIDVStatus(signedInUser);
    //   console.log(`Finished with IDV! ${JSON.stringify(metadata, null, 2)}`);
    },
    onExit: async (err, metadata) => {
      console.log(
        `Exited early. Error: ${JSON.stringify(err, null, 2)} Metadata: ${JSON.stringify(
          metadata
        )}`
      );
    //   await tellServerUserIsDoneWithIDV(metadata.link_session_id);
      // await refreshIDVStatus(signedInUser);
    },
    onEvent: (eventName, metadata) => {
      console.log(`Event ${eventName}, Metadata: ${JSON.stringify(metadata, null, 2)}`);
      if (eventName === 'IDENTITY_VERIFICATION_START_STEP') {
        
        // if (signedInUser.userId) {
        //   console.log(`setting recent idv session for ${signedInUser.userId} with ${metadata["link_session_id"]}`)
        //   callMyServer("/server/set_recent_idv_session", true, {
        //     userId: signedInUser.userId,
        //     idvSession: metadata["link_session_id"],
        //   });
        // } else {
        //   console.error(`No user id found for signed in user - signedInUser.userId: ${signedInUser.userId}`)
        // }
      }
    },
  });


  return (
    <div>
        {linkTokenData ? (
            <div className="space-x-8 flex justify-center mt-6">
                <button 
                    onClick={() => open()} 
                    disabled={!ready}
                    className="w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white bg-gray-800 hover:bg-[#222] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Start Identity Verification
                </button>
            </div>
        ) : (
            <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                    Identity verification not available
                </p>
            </div>
        )}
    </div>
  );
}