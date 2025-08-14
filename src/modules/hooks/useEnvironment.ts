import { useState, useEffect } from 'react';
import { initializeEnvironment, config } from '../ClientEnv';

export const useEnvironment = () => {
    const [isReady, setIsReady] = useState(() => {
        // 초기 상태를 즉시 계산
        try {
            initializeEnvironment();
            return true;
        } catch (err) {
            return false;
        }
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 이미 초기화되었으면 추가 작업 불필요
        if (isReady) {
            console.log('useEnvironment: Already initialized, skipping...');
            return;
        }

        const initEnv = () => {
            try {
                console.log('useEnvironment: Starting environment initialization...');
                console.log('useEnvironment: Current config:', config);
                
                // initializeEnvironment는 항상 true를 반환하므로 직접 호출
                initializeEnvironment();
                console.log('useEnvironment: Environment initialized successfully');
                
                // 상태 업데이트를 즉시 수행
                setIsReady(true);
                setError(null);
                console.log('useEnvironment: isReady set to true');
            } catch (err) {
                console.error('useEnvironment: Error during initialization:', err);
                setIsReady(false);
                setError(err instanceof Error ? err.message : 'Unknown environment error');
            }
        };

        // 즉시 초기화 실행
        initEnv();
    }, [isReady]);

    // 디버깅을 위한 로그
    useEffect(() => {
        console.log('useEnvironment: State changed - isReady:', isReady, 'error:', error);
    }, [isReady, error]);

    return {
        config,
        isReady,
        error,
        retry: () => {
            setError(null);
            setIsReady(false);
            const initEnv = () => {
                try {
                    initializeEnvironment();
                    setIsReady(true);
                    setError(null);
                } catch (err) {
                    setIsReady(false);
                    setError(err instanceof Error ? err.message : 'Unknown environment error');
                }
            };
            initEnv();
        }
    };
};
