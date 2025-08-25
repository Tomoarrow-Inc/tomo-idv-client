

export interface Config {
    webhookUrl: string;
    tomoIdvUrl: string;
    tomoIdvAppUrl: string;
    storeKycEndpoint: string;
    storeJpKycEndpoint: string;
    generateLinkTokenEndpoint: string;
    environment: 'development' | 'test' | 'production';
}

// 기존 isDevelopment 함수와 호환성을 위한 함수들
export const isDevelopment = (): boolean => {
    return false;
};

export const isTest = (): boolean => {
    return true;
};

export const isProduction = (): boolean => {
    return false;
};

// 환경별 설정 관리
const getEnvironmentConfig = (): Config => {
    return {
        webhookUrl: 'https://test.tomopayment.com/v1/webhook/session',
        tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
        tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
        storeKycEndpoint: 'https://test.tomopayment.com/v1/us/store',
        storeJpKycEndpoint: 'https://test.tomopayment.com/v1/jp/store',
        generateLinkTokenEndpoint: 'https://test.tomopayment.com/v1/us/generate_link_token',
        environment: 'test'
    };

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