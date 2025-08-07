import { useEffect, useState } from "react";

interface Config {
    webhookUrl: string;
    tomoIdvUrl: string;
    tomoIdvAppUrl: string; // 추가된 속성
    storeKycEndpoint: string;
    generateLinkTokenEndpoint: string;
    verifySessionEndpoint: string;
    resultsEndpoint: string;
    environment: 'development' | 'test' | 'production';
}

// 환경 감지 함수 개선
export const getEnvironment = (): 'development' | 'test' | 'production' => {
    const env = process.env.REACT_APP_ENV?.toLowerCase();
    
    if (env === 'development' || env === 'dev') return 'development';
    if (env === 'test') return 'test';
    
    // REACT_APP_ENV가 없거나 다른 값이면 production으로 처리
    return 'production';
};

// 기존 isDevelopment 함수와 호환성을 위한 함수들
export const isDevelopment = (): boolean => {
    return getEnvironment() === 'development';
};

export const isTest = (): boolean => {
    return getEnvironment() === 'test';
};

export const isProduction = (): boolean => {
    return getEnvironment() === 'production';
};

// 환경별 설정 관리
const getEnvironmentConfig = (): Config => {
    const environment = getEnvironment();
    
    switch (environment) {
        case 'development':
            return {
                // NOTE : port 80 이 idv-server
                webhookUrl: 'http://localhost:80/webhook/session',
                tomoIdvUrl: 'http://localhost:8080/auth/tomo-idv',
                tomoIdvAppUrl: 'http://localhost:8080/idv',
                storeKycEndpoint: 'http://localhost:80/us/store',
                generateLinkTokenEndpoint: 'http://localhost:80/us/generate_link_token',
                verifySessionEndpoint: 'http://localhost:80/verify/session',
                resultsEndpoint: 'http://localhost:80/results',
                environment: 'development'
            };
            
        case 'test':
            return {
                webhookUrl: 'https://test.tomopayment.com/webhook/session',
                tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
                storeKycEndpoint: 'https://test.tomopayment.com/us/store',
                generateLinkTokenEndpoint: 'https://test.tomopayment.com/us/generate_link_token',
                verifySessionEndpoint: 'https://test.tomopayment.com/verify/session',
                resultsEndpoint: 'https://test.tomopayment.com/results',
                environment: 'test'
            };
            
        case 'production':
            // tomoIdvUrl, tomoIdvAppUrl 을 prod CF 도메인으로 바꿔야함. (CF도 만들어야함)
            return {
                webhookUrl: 'https://api.tomopayment.com/webhook/session',
                tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
                storeKycEndpoint: 'https://api.tomopayment.com/us/store',
                generateLinkTokenEndpoint: 'https://api.tomopayment.com/us/generate_link_token',
                verifySessionEndpoint: 'https://api.tomopayment.com/verify/session',
                resultsEndpoint: 'https://api.tomopayment.com/results',
                environment: 'production'
            };
    }
};

const validateEnvironmentVariables = (): Config => {
    // 모든 환경이 내부 설정을 사용하므로 환경 변수 검증 불필요
    return getEnvironmentConfig();
};

export const config = validateEnvironmentVariables();

// React 앱에서 환경변수 에러를 표시할 컴포넌트
export const EnvironmentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        try {
            validateEnvironmentVariables();
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Configuration error'));
        }
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Configuration Error
                    </h1>
                    <div className="bg-red-100 border-l-4 border-red-500 p-4">
                        <p className="text-red-700 whitespace-pre-wrap font-mono text-sm">
                            {error.message}
                        </p>
                    </div>
                    <p className="mt-4 text-gray-600">
                        Please check your environment configuration and restart the application.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};