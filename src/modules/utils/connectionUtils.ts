import { isDevelopment } from '../ClientEnv';

// TLS 버전 및 보안 검증을 위한 유틸리티 함수
export const validateSecureConnection = async (url: string): Promise<{ isSecure: boolean; tlsInfo?: string }> => {
    try {
        const urlObj = new URL(url);
        
        if (isDevelopment()) {
            console.log('Development environment: allowing HTTP connections');
            if (urlObj.protocol === 'http:') {
                return { isSecure: true, tlsInfo: 'HTTP connection (development mode)' };
            }
        }
        
        if (urlObj.protocol !== 'https:') {
            const message = isDevelopment() 
                ? 'HTTPS recommended even in development for security testing'
                : 'HTTPS is required for secure communication in production';
            console.warn(`Insecure connection detected. ${message}`);
            return { isSecure: !isDevelopment() ? false : true };
        }

        const testResponse = await fetch(url.replace('/webhook/session', '/test'), {
            method: 'HEAD',
            mode: 'cors',
            credentials: 'omit',
            headers: isDevelopment() ? {} : {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

        const securityState = (testResponse as any).securityState;
        let tlsInfo = urlObj.protocol === 'https:' ? 'TLS connection established' : 'HTTP connection';
        
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

// 브라우저 TLS 지원 확인
export const checkBrowserTLSSupport = (): { supported: boolean; info: string } => {
    if (isDevelopment()) {
        return {
            supported: true,
            info: 'Development environment: TLS checks bypassed'
        };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    
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

    return {
        supported: true,
        info: 'Browser TLS support assumed (modern browser detected)'
    };
};

// TLS 에러 감지를 위한 헬퍼 함수
export const isTLSError = (error: any): boolean => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorTypes = ['ssl', 'tls', 'certificate', 'handshake', 'cipher', 'protocol'];
    return errorTypes.some(type => errorMessage.includes(type));
};

// 연결 품질 모니터링
export const monitorConnectionQuality = (eventSource: EventSource): (() => void) => {
    let lastHeartbeat = Date.now();
    let missedHeartbeats = 0;
    
    const heartbeatInterval = setInterval(() => {
        if (Date.now() - lastHeartbeat > 30000) {
            missedHeartbeats++;
            console.warn(`Missed heartbeat #${missedHeartbeats} - connection may be unstable`);
            
            if (missedHeartbeats >= 3) {
                console.error('Connection appears to be lost - too many missed heartbeats');
                eventSource.close();
                clearInterval(heartbeatInterval);
            }
        }
    }, 10000);

    const updateHeartbeat = () => {
        lastHeartbeat = Date.now();
        missedHeartbeats = 0;
    };

    eventSource.addEventListener('message', updateHeartbeat);
    eventSource.addEventListener('open', updateHeartbeat);

    return () => {
        clearInterval(heartbeatInterval);
        eventSource.removeEventListener('message', updateHeartbeat);
        eventSource.removeEventListener('open', updateHeartbeat);
    };
};
