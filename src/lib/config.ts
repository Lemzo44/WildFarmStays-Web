export const loginUrl = (import.meta as any)?.env?.VITE_LOGIN_URL || (typeof window !== 'undefined' ? `${window.location.origin}/login` : '');
export const messageEmailWebhook = (import.meta as any)?.env?.VITE_MESSAGE_EMAIL_WEBHOOK || '';


