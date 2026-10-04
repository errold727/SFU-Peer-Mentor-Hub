// Owner-supplied responder URL, checked signed out on 2026-10-04.
// "Peer Mentor Hub" accepts responses; Google sign-in is optional to save progress.
// Set to null if access is withdrawn. Recheck any replacement in a browser before shipping.
export const FEEDBACK_RESPONDER_URL: string | null =
  'https://docs.google.com/forms/d/e/1FAIpQLSc_9CUif3rzQLiJ9dpKlHqtXGfXfzbNY3kq_nq4Vt4uPYRMfg/viewform';

// Only a clean published responder URL is supported. Never use editor URLs or
// append poster content, recipient fields, or prefilled/query parameters.
export function isFeedbackResponderUrl(url: string | null): url is string {
  return url !== null && /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform$/.test(url);
}
