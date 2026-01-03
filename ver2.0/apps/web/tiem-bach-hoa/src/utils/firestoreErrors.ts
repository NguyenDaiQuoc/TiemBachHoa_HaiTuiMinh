import { showError } from './toast';

export function handleFirestoreError(err: any, context?: string) {
  try {
    console.error(context || 'Firestore error', err);
    const msg = (err && (err.message || err.toString())) || String(err || 'Unknown error');
    const lowered = msg.toLowerCase();
    if (lowered.includes('err_blocked_by_client') || lowered.includes('err_blocked_by_client') || lowered.includes('blocked_by_client') || lowered.includes('err_blocked_by_client') || lowered.includes('blocked')) {
      showError('Kết nối đến Firestore có thể bị chặn bởi trình chặn quảng cáo (adblock). Vui lòng thử tắt adblock cho trang này và làm mới.');
      return;
    }
    // generic user-friendly fallback
    showError('Lỗi kết nối dữ liệu: ' + (msg || 'Không xác định'));
  } catch (e) {
    // swallow
    console.error('handleFirestoreError failed', e);
  }
}
