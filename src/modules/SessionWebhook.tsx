import React, { useEffect, useState } from "react";
import { ConnectionStatus, WebhookEvent } from "./models";
import { config, EnvironmentErrorBoundary } from "./ClientEnv";


interface SessionWebHookProps {
    children: ( connection_status: ConnectionStatus, 
                session_id: string | null) => React.ReactNode;
                onSessionOpened?: (session_id: string) => void;
}

const SessionWebHook = ({ children, onSessionOpened }: SessionWebHookProps) => {
    const [session_id, setSessionId] = useState<string | null>(null);
    const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

    useEffect(() => {
        // SSE connection to the Haskell webhook server
        const eventSource = new EventSource(config.webhookUrl, {
            // withCredentials: true // Include credentials if needed
        });

        // Handle connection opened
        eventSource.onopen = () => {
            console.log('Webhook connection opened');
            setConnectionStatus('connected');
        };

        // Handle general messages
        eventSource.onmessage = (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Received webhook event:', webhookEvent);
                
                // Handle different event types
                switch (webhookEvent.event) {
                    case 'connection':
                        console.log('Connected to webhook stream');
                        setConnectionStatus('connected');
                        break;
                    case 'session.opened':
                        console.log('Session opened:', webhookEvent.data);
                        const session_id = webhookEvent.data;
                        setSessionId(session_id);
                        onSessionOpened?.(session_id);
                        break;
                    default:
                        console.log('Unknown event type:', webhookEvent.event);
                }
            } catch (error) {
                console.error('Error parsing webhook event:', error);
            }
        };

        // Handle specific event types (if the server sends typed events)
        eventSource.addEventListener('session.opened', (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Session opened event:', webhookEvent);
                setSessionId(webhookEvent.data);
            } catch (error) {
                console.error('Error parsing session.opened event:', error);
            }
        }, false);

        eventSource.addEventListener('connection', (event) => {
            console.log('Connection event received:', event.data);
        }, false);

        // Handle errors
        eventSource.onerror = (error) => {
            console.error('Webhook connection error:', error);
            setConnectionStatus('disconnected');
        };

        // Cleanup function to close the connection when component unmounts
        return () => {
            console.log('Closing webhook connection');
            eventSource.close();
            setConnectionStatus('disconnected');
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <EnvironmentErrorBoundary>
            <div className="space-y-4">
                {children(connection_status, session_id)}
            </div>
        </EnvironmentErrorBoundary>
    )
};


export default SessionWebHook;