import React from "react";
import { ConnectionStatus } from "./models";

interface WebhookStatusProps {
    session_id: string | null;
    connectionStatus: ConnectionStatus;
}

const WebhookStatus = ({ session_id, connectionStatus }: WebhookStatusProps) => {

    return (
        <div className="p-4 bg-slate-800 rounded text-white">
            <div className="mb-2">
                <span className="font-semibold">Connection Status: </span>
                <span className={`${connectionStatus === 'connected' ? 'text-emerald-400' :
                        connectionStatus === 'connecting' ? 'text-amber-400' :
                            'text-rose-400'
                    }`}>
                    {connectionStatus}
                </span>
            </div>
            <div>
                <span className="font-semibold">Session ID: </span>
                <span className="font-mono text-sky-300">{session_id || 'Not available'}</span>
            </div>
        </div>
    )
}

export default WebhookStatus;