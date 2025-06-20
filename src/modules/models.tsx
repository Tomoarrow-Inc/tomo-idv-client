
export interface WebhookEvent {
    id: string;
    event: string;
    data: string;
    timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';