import React from "react";
import { config, EnvironmentErrorBoundary } from "./ClientEnv";

interface SigninProps {
    className?: string;
    label?: string;
}

const Signin = ({ className = '', label = 'Tomo Signin' }: SigninProps) => {

    const openPopup = () => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // 팝업 창 열기
        window.open(
            config.tomoIdvUrl, // 'http://localhost:8081/auth/tomo-idv', // 외부 사이트 URL
            'TomoIDV',
            `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer`
        );
    }

    return (
        <EnvironmentErrorBoundary>
            <button 
                onClick={openPopup}
                className={className}
        >
                {label}
            </button>
        </EnvironmentErrorBoundary>
    )
}

export default Signin;