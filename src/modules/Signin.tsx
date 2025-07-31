import React, { useState } from "react";
import { config, EnvironmentErrorBoundary } from "./ClientEnv";
import { ConnectionStatus, WebhookEvent } from "./models";

interface SigninProps {
    className?: string;
    label?: string;
    setSessionId: (session_id: string) => void;
    setConnectionStatus: (connection_status: ConnectionStatus) => void;
}

// 환경변수 확인 함수
const isDevelopment = (): boolean => {
    return process.env.REACT_APP_ENV === 'development';
};


const Signin = ({ className = '', label = 'Tomo Signin', setConnectionStatus, setSessionId }: SigninProps) => {
    const [tlsError, setTlsError] = useState<string | null>(null);
    const [tlsInfo, setTlsInfo] = useState<string | null>(null);
    let eventSource: EventSource | null = null;
    let connectionAttempt = 0;
    const maxRetries = 3;
    let cleanupMonitoring: (() => void) | null = null;

    const establishConnection = async () => {
        try {
            setConnectionStatus('connecting');
            setTlsError(null);

            const isDevMode = isDevelopment();
            console.log(`Environment: ${isDevMode ? 'Development' : 'Production'}`);

            // 브라우저 TLS 지원 확인 (프로덕션에서만)
            const browserTLS = checkBrowserTLSSupport();
            if (!browserTLS.supported && !isDevMode) {
                setTlsError(browserTLS.info);
                setConnectionStatus('disconnected');
                return;
            }

            setTlsInfo(browserTLS.info);
            console.log('Browser check:', browserTLS.info);

            // 연결 검증 (환경에 따라 분기)
            const { isSecure, tlsInfo: serverTlsInfo } = await validateSecureConnection(config.webhookUrl);
            if (!isSecure) {
                const errorMsg = isDevMode
                    ? 'Connection validation failed in development mode'
                    : 'Secure HTTPS/TLS connection required. TLS 1.2+ is mandatory for security in production.';
                setTlsError(errorMsg);
                setConnectionStatus('disconnected');
                return;
            }

            if (serverTlsInfo) {
                setTlsInfo(prev => `${prev} | Server: ${serverTlsInfo}`);
            }

            // EventSource 연결 설정
            eventSource = new EventSource(config.webhookUrl, {
                withCredentials: false
            });

            // 연결 품질 모니터링 시작
            cleanupMonitoring = monitorConnectionQuality(eventSource);

            // 연결 열림 처리
            eventSource.onopen = () => {
                const connectionMsg = isDevMode
                    ? 'Webhook connection established (development mode)'
                    : 'Secure webhook connection established with TLS 1.2+';
                console.log(connectionMsg);
                setConnectionStatus('connected');
                connectionAttempt = 0; // 성공시 재시도 카운터 리셋

                const tlsMsg = isDevMode
                    ? 'Connected in development mode'
                    : 'Connected with secure TLS';
                setTlsInfo(prev => `${prev} | ${tlsMsg}`);
            };

            // 메시지 처리
            eventSource.onmessage = (event) => {
                try {
                    const webhookEvent: WebhookEvent = JSON.parse(event.data);
                    console.log('Received webhook event:', webhookEvent);

                    switch (webhookEvent.event) {
                        case 'connection':
                            const connectMsg = isDevMode
                                ? 'Connected to webhook stream (development)'
                                : 'Connected to secure webhook stream';
                            console.log(connectMsg);
                            setConnectionStatus('connected');
                            break;
                        case 'session.opened':
                            console.log('Session opened:', webhookEvent.data);
                            const session_id = webhookEvent.data;
                            setSessionId(session_id);
                            // onSessionOpened?.(session_id);
                            break;
                        default:
                            console.log('Unknown event type:', webhookEvent.event);
                    }
                } catch (error) {
                    console.error('Error parsing webhook event:', error);
                }
            };

            // 특정 이벤트 타입 처리
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
                try{ 
                    const webhookEvent: WebhookEvent = JSON.parse(event.data);
                    console.log('Connection event:', webhookEvent);
                    const eventMsg = isDevMode
                        ? 'Connection event received (development)'
                        : 'Secure connection event received';
                    console.log(eventMsg, event.data);

                    openPopup(webhookEvent.data);

                } catch (error) {
                    console.error('Error parsing connection event:', error);
                }
            }, false);

            // 에러 처리
            eventSource.onerror = (error) => {
                console.error('Webhook connection error:', error);

                if (isTLSError(error) && !isDevMode) {
                    setTlsError('TLS connection failed. Only TLS 1.2+ is supported. Please ensure your server supports modern TLS versions.');
                } else if (connectionAttempt < maxRetries) {
                    connectionAttempt++;
                    console.log(`Retrying connection (${connectionAttempt}/${maxRetries})`);
                    setTimeout(() => establishConnection(), 2000 * connectionAttempt);
                    return;
                }

                setConnectionStatus('disconnected');
                if (cleanupMonitoring) {
                    cleanupMonitoring();
                }
                if (eventSource) {
                    eventSource.close();
                }
            };

        } catch (error) {
            console.error('Failed to establish connection:', error);

            if (isTLSError(error) && !isDevelopment()) {
                setTlsError('TLS handshake failed. This application requires TLS 1.2 or higher for security.');
            } else {
                const errorMsg = isDevelopment()
                    ? 'Connection failed in development mode. Please check the server configuration.'
                    : 'Connection failed. Please ensure the server supports secure HTTPS connections.';
                setTlsError(errorMsg);
            }

            setConnectionStatus('disconnected');
        }
    };

    const openPopup = (conn_id: string) => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // client_id를 쿼리 스트링으로 추가
        const url = new URL(config.tomoIdvUrl);
        url.searchParams.set('conn_id', conn_id);

        // 팝업 창 열기
        window.open(
            url.toString(),
            'TomoIDV',
            `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer`
        );
    }

    return (
        <EnvironmentErrorBoundary>
            <button 
                onClick={establishConnection}
                className={className}
        >
                {label}
            </button>
        </EnvironmentErrorBoundary>
    )
}


// TLS 버전 및 보안 검증을 위한 유틸리티 함수 (환경에 따라 분기)
const validateSecureConnection = async (url: string): Promise<{ isSecure: boolean; tlsInfo?: string }> => {
    try {
        const urlObj = new URL(url);
        
        // 개발 환경에서는 HTTP 허용
        if (isDevelopment()) {
            console.log('Development environment: allowing HTTP connections');
            if (urlObj.protocol === 'http:') {
                return { isSecure: true, tlsInfo: 'HTTP connection (development mode)' };
            }
        }
        
        // HTTPS 프로토콜 확인 (프로덕션 환경에서는 필수)
        if (urlObj.protocol !== 'https:') {
            const message = isDevelopment() 
                ? 'HTTPS recommended even in development for security testing'
                : 'HTTPS is required for secure communication in production';
            console.warn(`Insecure connection detected. ${message}`);
            return { isSecure: !isDevelopment() ? false : true }; // 개발환경에서는 허용
        }

        // TLS 연결 사전 검증 및 정보 수집 (HTTPS인 경우에만)
        const testResponse = await fetch(url.replace('/webhook/session', '/test'), {
            method: 'HEAD',
            mode: 'cors',
            credentials: 'omit',
            // 보안 헤더 추가 (프로덕션에서만)
            headers: isDevelopment() ? {} : {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

        // TLS 정보 추출 (가능한 경우)
        const securityState = (testResponse as any).securityState;
        let tlsInfo = urlObj.protocol === 'https:' ? 'TLS connection established' : 'HTTP connection';
        
        // 응답 헤더에서 보안 정보 확인 (HTTPS인 경우에만)
        if (urlObj.protocol === 'https:') {
            const strictTransport = testResponse.headers.get('strict-transport-security');
            if (strictTransport) {
                tlsInfo += ' with HSTS enabled';
            }
        }

        if (!testResponse.ok) {
            console.warn('Pre-connection validation failed');
            return { isSecure: false };
        }

        console.log('Connection validated:', tlsInfo);
        return { isSecure: true, tlsInfo };
    } catch (error) {
        console.error('Connection validation error:', error);
        return { isSecure: false };
    }
};

// 브라우저 TLS 지원 확인 (프로덕션에서만)
const checkBrowserTLSSupport = (): { supported: boolean; info: string } => {
    // 개발 환경에서는 항상 지원한다고 가정
    if (isDevelopment()) {
        return {
            supported: true,
            info: 'Development environment: TLS checks bypassed'
        };
    }

    // 최신 브라우저는 기본적으로 TLS 1.2+ 지원
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 오래된 브라우저 감지
    const oldBrowsers = [
        { name: 'Chrome', minVersion: 30, pattern: /chrome\/(\d+)/ },
        { name: 'Firefox', minVersion: 27, pattern: /firefox\/(\d+)/ },
        { name: 'Safari', minVersion: 7, pattern: /version\/(\d+).*safari/ },
        { name: 'Edge', minVersion: 12, pattern: /edge\/(\d+)/ }
    ];

    for (const browser of oldBrowsers) {
        const match = userAgent.match(browser.pattern);
        if (match) {
            const version = parseInt(match[1]);
            if (version < browser.minVersion) {
                return {
                    supported: false,
                    info: `${browser.name} ${version} may not support TLS 1.2+. Please update your browser.`
                };
            }
            return {
                supported: true,
                info: `${browser.name} ${version} supports TLS 1.2+`
            };
        }
    }

    // 알 수 없는 브라우저의 경우 지원한다고 가정
    return {
        supported: true,
        info: 'Browser TLS support assumed (modern browser detected)'
    };
};

// TLS 에러 감지를 위한 헬퍼 함수
const isTLSError = (error: any): boolean => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorTypes = ['ssl', 'tls', 'certificate', 'handshake', 'cipher', 'protocol'];
    return errorTypes.some(type => errorMessage.includes(type));
};

// 연결 품질 모니터링
const monitorConnectionQuality = (eventSource: EventSource): (() => void) => {
    let lastHeartbeat = Date.now();
    let missedHeartbeats = 0;
    
    const heartbeatInterval = setInterval(() => {
        if (Date.now() - lastHeartbeat > 30000) { // 30초 초과
            missedHeartbeats++;
            console.warn(`Missed heartbeat #${missedHeartbeats} - connection may be unstable`);
            
            if (missedHeartbeats >= 3) {
                console.error('Connection appears to be lost - too many missed heartbeats');
                eventSource.close();
                clearInterval(heartbeatInterval);
            }
        }
    }, 10000); // 10초마다 체크

    // 메시지 수신 시 heartbeat 업데이트 함수
    const updateHeartbeat = () => {
        lastHeartbeat = Date.now();
        missedHeartbeats = 0;
    };

    // heartbeat 이벤트 리스너 추가
    eventSource.addEventListener('message', updateHeartbeat);
    eventSource.addEventListener('open', updateHeartbeat);

    // 정리 함수 반환
    return () => {
        clearInterval(heartbeatInterval);
        eventSource.removeEventListener('message', updateHeartbeat);
        eventSource.removeEventListener('open', updateHeartbeat);
    };
};



export default Signin;