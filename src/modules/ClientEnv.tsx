// 빌드 시점에 주입되는 전역 상수들
declare global {
    const __IS_TEST__: boolean;
}

export interface Config {
    webhookUrl: string;
    tomoIdvUrl: string;
    tomoIdvAppUrl: string;
    storeKycEndpoint: string;
    storeJpKycEndpoint: string;
    generateLinkTokenEndpoint: string;
    environment: 'test' | 'production';
}

// 빌드 시점에 주입되는 환경 정보를 기반으로 환경 감지
const getBuildEnvironment = (): 'test' | 'production' => {
    // 빌드 시점에 주입되는 상수 사용
    if (typeof __IS_TEST__ !== 'undefined' && __IS_TEST__) {
        return 'test';
    }
    // 기본값은 production
    return 'production';
};

// 환경 감지 함수
export const getEnvironment = (): 'test' | 'production' => {
    return getBuildEnvironment();
};

// 기존 isDevelopment 함수와 호환성을 위한 함수들
export const isDevelopment = (): boolean => {
    return getEnvironment() === 'test';
};

export const isTest = (): boolean => {
    return true;
};

export const isProduction = (): boolean => {
    return false;
};

// 환경별 설정 관리
const getEnvironmentConfig = (): Config => {
    const env = getEnvironment();
    
    switch (env) {
        case 'test':
            return {
                webhookUrl: 'https://test.tomopayment.com/v1/webhook/session',
                tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
                storeKycEndpoint: 'https://test.tomopayment.com/v1/us/store',
                storeJpKycEndpoint: 'https://test.tomopayment.com/v1/jp/store',
                generateLinkTokenEndpoint: 'https://test.tomopayment.com/v1/us/generate_link_token',
                environment: 'test'
            };
            
        case 'production':
            return {
                webhookUrl: 'https://api.tomopayment.com/v1/webhook/session',
                tomoIdvUrl: 'https://app.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app.tomopayment.com/idv',
                storeKycEndpoint: 'https://api.tomopayment.com/v1/us/store',
                storeJpKycEndpoint: 'https://api.tomopayment.com/v1/jp/store',
                generateLinkTokenEndpoint: 'https://api.tomopayment.com/v1/us/generate_link_token',
                environment: 'production'
            };
            
        default:
            return {
                webhookUrl: 'https://test.tomopayment.com/v1/webhook/session',
                tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
                storeKycEndpoint: 'https://test.tomopayment.com/v1/us/store',
                storeJpKycEndpoint: 'https://test.tomopayment.com/v1/jp/store',
                generateLinkTokenEndpoint: 'https://test.tomopayment.com/v1/us/generate_link_token',
                environment: 'test'
            };
    }
};

const validateEnvironmentVariables = (): Config => {
    return getEnvironmentConfig();
};

export const config = validateEnvironmentVariables();

// 환경 검증 함수
export const validateEnvironment = (): { isValid: boolean; error?: Error } => {
    try {
        validateEnvironmentVariables();
        return { isValid: true };
    } catch (e) {
        const error = e instanceof Error ? e : new Error('Configuration error');
        return { isValid: false, error };
    }
};

// 환경 에러 처리 함수
export const handleEnvironmentError = (error: Error): void => {
    console.error('Environment configuration error:', error);
    
    // 개발 환경에서는 더 자세한 에러 정보를 제공
    if (isDevelopment()) {
        console.error('Environment validation failed. Please check your configuration.');
        console.error('Error details:', error.message);
    }
    
    // 프로덕션 환경에서는 사용자 친화적인 메시지만 표시
    if (isProduction()) {
        console.error('Application configuration error. Please contact support.');
    }
};

// 환경 초기화 함수
export const initializeEnvironment = (): boolean => {
    const { isValid, error } = validateEnvironment();
    
    if (!isValid && error) {
        handleEnvironmentError(error);
        return false;
    }
    
    return true;
};