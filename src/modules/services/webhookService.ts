import { isDevelopment } from '../ClientEnv';
import { ConnectionStatus, WebhookEvent } from '../types/webhook';
import { 
    validateSecureConnection, 
    checkBrowserTLSSupport, 
    isTLSError, 
    monitorConnectionQuality 
} from '../utils/connectionUtils';
import { openTomoAuthPopup } from '../utils/popupUtils';

export interface WebhookConnectionConfig {
    webhookUrl: string;
    tomoIdvUrl: string;
    maxRetries?: number;
}

export interface WebhookConnectionCallbacks {
    onStatusChange: (status: ConnectionStatus) => void;
    onSessionIdChange: (sessionId: string) => void;
    onTlsErrorChange: (error: string | null) => void;
    onTlsInfoChange: (info: string | null) => void;
    onConnectionAttemptChange: (attempt: number) => void;
}

export interface WebhookConnectionState {
    tlsError: string | null;
    tlsInfo: string | null;
    connectionAttempt: number;
    maxRetries: number;
}

export class WebhookConnectionService {
    private config: WebhookConnectionConfig;
    private callbacks: WebhookConnectionCallbacks;
    private state: WebhookConnectionState;
    private eventSource: EventSource | null = null;
    private cleanupMonitoring: (() => void) | null = null;
    private popupWindow: Window | null = null;
    private popupMonitorInterval: number | null = null;
    private messageHandler: ((event: MessageEvent) => void) | null = null;

    constructor(config: WebhookConnectionConfig, callbacks: WebhookConnectionCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
        this.state = {
            tlsError: null,
            tlsInfo: null,
            connectionAttempt: 0,
            maxRetries: config.maxRetries || 3
        };
    }

    public async establishConnection(): Promise<void> {
        try {
            this.callbacks.onStatusChange('connecting' as ConnectionStatus);
            this.callbacks.onTlsErrorChange(null);

            const isDevMode = isDevelopment();
            console.log(`Environment: ${isDevMode ? 'Development' : 'Production'}`);

            const browserTLS = checkBrowserTLSSupport();
            if (!browserTLS.supported && !isDevMode) {
                this.state.tlsError = browserTLS.info;
            this.callbacks.onTlsErrorChange(browserTLS.info);
                this.callbacks.onStatusChange('disconnected' as ConnectionStatus);
                return;
            }

            this.state.tlsInfo = browserTLS.info;
            this.callbacks.onTlsInfoChange(browserTLS.info);
            console.log('Browser check:', browserTLS.info);

            const { isSecure, tlsInfo: serverTlsInfo } = await validateSecureConnection(this.config.webhookUrl);
            if (!isSecure) {
                const errorMsg = isDevMode
                    ? 'Connection validation failed in development mode'
                    : 'Secure HTTPS/TLS connection required. TLS 1.2+ is mandatory for security in production.';
                this.state.tlsError = errorMsg;
                this.callbacks.onTlsErrorChange(errorMsg);
                this.callbacks.onStatusChange('disconnected' as ConnectionStatus);
                return;
            }

            if (serverTlsInfo) {
                const currentInfo = this.state.tlsInfo || '';
                const newInfo = `${currentInfo} | Server: ${serverTlsInfo}`;
                this.state.tlsInfo = newInfo;
                this.callbacks.onTlsInfoChange(newInfo);
            }

            this.eventSource = new EventSource(this.config.webhookUrl, {
                withCredentials: false
            });

            this.cleanupMonitoring = monitorConnectionQuality(this.eventSource);

            this.setupEventListeners(isDevMode);

        } catch (error) {
            console.error('Failed to establish connection:', error);

            if (isTLSError(error) && !isDevelopment()) {
                const tlsError = 'TLS handshake failed. This application requires TLS 1.2 or higher for security.';
                this.state.tlsError = tlsError;
                this.callbacks.onTlsErrorChange(tlsError);
            } else {
                const errorMsg = isDevelopment()
                    ? 'Connection failed in development mode. Please check the server configuration.'
                    : 'Connection failed. Please ensure the server supports secure HTTPS connections.';
                this.state.tlsError = errorMsg;
                this.callbacks.onTlsErrorChange(errorMsg);
            }

            this.callbacks.onStatusChange('disconnected' as ConnectionStatus);
        }
    }

    private setupEventListeners(isDevMode: boolean): void {
        if (!this.eventSource) return;

        this.eventSource.onopen = () => {
            const connectionMsg = isDevMode
                ? 'Webhook connection established (development mode)'
                : 'Secure webhook connection established with TLS 1.2+';
            console.log(connectionMsg);
            this.callbacks.onStatusChange('connected' as ConnectionStatus);
            this.state.connectionAttempt = 0;
            this.callbacks.onConnectionAttemptChange(0);

            const tlsMsg = isDevMode
                ? 'Connected in development mode'
                : 'Connected with secure TLS';
            const currentInfo = this.state.tlsInfo || '';
            const newInfo = `${currentInfo} | ${tlsMsg}`;
            this.state.tlsInfo = newInfo;
            this.callbacks.onTlsInfoChange(newInfo);
        };

        this.eventSource.onmessage = (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Received webhook event:', webhookEvent);

                switch (webhookEvent.event) {
                    case 'connection':
                        const connectMsg = isDevMode
                            ? 'Connected to webhook stream (development)'
                            : 'Connected to secure webhook stream';
                        console.log(connectMsg);
                        this.callbacks.onStatusChange('connected' as ConnectionStatus);
                        break;
                    case 'session.opened':
                        console.log('Session opened:', webhookEvent.data);
                        const session_id = webhookEvent.data;
                        this.callbacks.onSessionIdChange(session_id);
                        break;
                    default:
                        console.log('Unknown event type:', webhookEvent.event);
                }
            } catch (error) {
                console.error('Error parsing webhook event:', error);
            }
        };

        this.eventSource.addEventListener('session.opened', (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Session opened event:', webhookEvent);
                this.callbacks.onSessionIdChange(webhookEvent.data);
            } catch (error) {
                console.error('Error parsing session.opened event:', error);
            }
        }, false);

        this.eventSource.addEventListener('connection', (event) => {
            try{ 
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Connection event:', webhookEvent);
                const eventMsg = isDevMode
                    ? 'Connection event received (development)'
                    : 'Secure connection event received';
                console.log(eventMsg, event.data);

                console.log('webhookService: About to open popup with data:', webhookEvent.data);
                const popup = openTomoAuthPopup(webhookEvent.data);
                console.log('webhookService: Popup result:', popup);
                console.log('webhookService: Popup type:', typeof popup);
                console.log('webhookService: Popup closed property:', popup?.closed);
                
                if (popup) {
                    console.log('webhookService: TomoIDV popup window opened successfully');
                    this.startPopupMonitoring(popup);
                } else {
                    console.error('webhookService: Failed to open TomoIDV popup window');
                    console.error('webhookService: This could be due to popup blocker or invalid URL');
                }

            } catch (error) {
                console.error('Error parsing connection event:', error);
            }
        }, false);

        this.eventSource.onerror = (error) => {
            console.error('Webhook connection error:', error);

            if (isTLSError(error) && !isDevMode) {
                const tlsError = 'TLS connection failed. Only TLS 1.2+ is supported. Please ensure your server supports modern TLS versions.';
                this.state.tlsError = tlsError;
                this.callbacks.onTlsErrorChange(tlsError);
            } else if (this.state.connectionAttempt < this.state.maxRetries) {
                const newAttempt = this.state.connectionAttempt + 1;
                this.state.connectionAttempt = newAttempt;
                this.callbacks.onConnectionAttemptChange(newAttempt);
                console.log(`Retrying connection (${newAttempt}/${this.state.maxRetries})`);
                setTimeout(() => this.establishConnection(), 2000 * newAttempt);
                return;
            }

            this.callbacks.onStatusChange('disconnected' as ConnectionStatus);
            this.cleanup();
        };
    }


    private startPopupMonitoring(popup: Window): void {
        this.popupWindow = popup;
        
        // COOP 정책을 우회하기 위한 여러 방법으로 팝업창 상태 확인
        this.popupMonitorInterval = window.setInterval(() => {
            try {
                // 방법 1: window.closed 속성 확인 (COOP 정책에 따라 실패할 수 있음)
                if (popup.closed) {
                    console.log('TomoIDV popup window closed (detected via closed property), cleaning up webhook connection');
                    this.stopPopupMonitoring();
                    this.cleanup();
                    return;
                }
                
                // 방법 2: postMessage를 통한 연결 상태 확인
                try {
                    popup.postMessage({ type: 'ping' }, '*');
                } catch (error) {
                    console.log('TomoIDV popup window closed (detected via postMessage error), cleaning up webhook connection');
                    this.stopPopupMonitoring();
                    this.cleanup();
                    return;
                }
                
                // 방법 3: window.focus() 시도 (닫힌 창에서는 에러 발생)
                try {
                    popup.focus();
                } catch (error) {
                    console.log('TomoIDV popup window closed (detected via focus error), cleaning up webhook connection');
                    this.stopPopupMonitoring();
                    this.cleanup();
                    return;
                }
                
            } catch (error) {
                // COOP 정책으로 인한 에러 처리
                console.log('TomoIDV popup window monitoring error (likely COOP policy), cleaning up webhook connection');
                this.stopPopupMonitoring();
                this.cleanup();
            }
        }, 2000); // 2초마다 확인 (COOP 정책 고려하여 간격 증가)
        
        // 추가: 팝업창에서 메시지 수신 리스너 추가
        const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'popup_closed') {
                console.log('TomoIDV popup window closed (detected via message), cleaning up webhook connection');
                this.stopPopupMonitoring();
                this.cleanup();
                window.removeEventListener('message', messageHandler);
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        // 메시지 핸들러 정리를 위한 참조 저장
        this.messageHandler = messageHandler;
    }

    private stopPopupMonitoring(): void {
        if (this.popupMonitorInterval) {
            clearInterval(this.popupMonitorInterval);
            this.popupMonitorInterval = null;
        }
        
        // 메시지 핸들러 정리
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = null;
        }
        
        this.popupWindow = null;
    }

    public cleanup(): void {
        // 팝업 모니터링 정리
        this.stopPopupMonitoring();
        
        // 팝업창이 열려있으면 닫기 (COOP 정책 고려)
        if (this.popupWindow) {
            try {
                if (!this.popupWindow.closed) {
                    this.popupWindow.close();
                }
            } catch (error) {
                console.log('Cannot close popup window due to COOP policy:', error);
            }
        }
        
        // 웹훅 연결 정리
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.callbacks.onStatusChange('disconnected' as ConnectionStatus);
        }
    }
}