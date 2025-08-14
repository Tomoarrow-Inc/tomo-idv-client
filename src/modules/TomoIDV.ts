// TomoIDV 모듈 - 모든 TomoIDV 관련 훅들을 네임스페이스로 제공
import { useWebhookConnection } from './hooks/useWebhookConnection';
import { usePopup, UsePopupReturn } from './hooks/usePopup';

// TomoIDV 네임스페이스 객체
export const TomoIDV = {
  // Webhook 연결 관련 훅
  useTomoAuth: useWebhookConnection,
  // 팝업 관련 훅
  useTomoIDV: usePopup,
} as const;

// 기본 export로 TomoIDV 객체 제공
export default TomoIDV;
