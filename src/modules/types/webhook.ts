export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface WebhookEvent {
    event: string;
    data: any;
}
export interface UseWebhookConnectionProps {
    onSessionIdChange: (sessionId: string) => void;
    onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

