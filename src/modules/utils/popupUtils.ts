import { config } from '../ClientEnv';

export const openTomoAuthPopup = (conn_id: string): Window | null => {
    console.log('openTomoAuthPopup: Starting popup creation...');
    console.log('openTomoAuthPopup: conn_id:', conn_id);
    console.log('openTomoAuthPopup: config.tomoIdvUrl:', config.tomoIdvUrl);
    
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const url = new URL(config.tomoIdvUrl);
    url.searchParams.set('conn_id', conn_id);
    
    console.log('openTomoAuthPopup: Final URL:', url.toString());
    console.log('openTomoAuthPopup: Popup features:', `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer`);

    // 팝업 차단을 방지하기 위한 개선된 설정
    const popupFeatures = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
        'toolbar=no',
        'menubar=no',
        'location=no',
        'status=no',
        'directories=no'
    ].join(',');

    console.log('openTomoAuthPopup: Using popup features:', popupFeatures);

    const popup = window.open(
        url.toString(),
        'TomoIDV',
        popupFeatures
    );

    console.log('openTomoAuthPopup: window.open result:', popup);
    
    // 팝업 차단 감지
    if (!popup) {
        console.error('openTomoAuthPopup: Popup was blocked by browser');
        console.error('openTomoAuthPopup: This usually happens due to popup blocker or security settings');
        
        // 사용자에게 팝업 차단 알림
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        
        return null;
    }
    
    // 팝업이 열렸지만 즉시 닫힌 경우 감지 (COOP 정책 고려)
    try {
        if (popup.closed) {
            console.error('openTomoAuthPopup: Popup was opened but immediately closed');
            return null;
        }
    } catch (error) {
        console.log('openTomoAuthPopup: Cannot check popup.closed due to COOP policy, continuing...');
    }
    
    console.log('openTomoAuthPopup: Popup opened successfully');
    return popup;
};
