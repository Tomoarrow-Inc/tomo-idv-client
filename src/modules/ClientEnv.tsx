import { useEffect, useState } from "react";

interface Config {
    webhookUrl: string;
    tomoIdvUrl: string;
    tomoIdvAppUrl: string; // 추가된 속성
    storeKycEndpoint: string;
    generateLinkTokenEndpoint: string;
  }
  
  const validateEnvironmentVariables = (): Config => {
    const requiredEnvVars = {
      webhookUrl: process.env.REACT_APP_WEBHOOK_URL,
      tomoIdvUrl: process.env.REACT_APP_TOMO_IDV_URL,
      tomoIdvAppUrl: process.env.REACT_APP_TOMO_IDV_APP_URL,
      storeKycEndpoint: process.env.REACT_APP_STORE_KYC_ENDPOINT,
      generateLinkTokenEndpoint: process.env.REACT_APP_GENERATE_LINK_TOKEN_ENDPOINT,
    };
  
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
  
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
  
    return requiredEnvVars as Config;
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