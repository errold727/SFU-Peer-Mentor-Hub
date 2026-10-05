import { createContext, useContext } from 'react';

export type AccessRole = 'mentor' | 'mentee';
export const ROLE_KEY = 'pmh-role';
// Convenience gate only: client code and session state are inspectable and editable.
export const MENTOR_CODE_SHA256 =
  'bda6fa59e461716eb787b554811ab1af2839461e3e53b70015e2ecaea7bb1387';

export function readSessionRole(): AccessRole | null {
  try {
    const value = sessionStorage.getItem(ROLE_KEY);
    return value === 'mentor' || value === 'mentee' ? value : null;
  } catch {
    return null;
  }
}

export function writeSessionRole(role: AccessRole | null) {
  try {
    if (role) sessionStorage.setItem(ROLE_KEY, role);
    else sessionStorage.removeItem(ROLE_KEY);
  } catch {
    // Restricted storage keeps the role in the current React session only.
  }
}

export async function verifyMentorCode(code: string) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
    return (
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('') ===
      MENTOR_CODE_SHA256
    );
  } catch {
    return false;
  }
}

export const RoleContext = createContext<{ role: AccessRole | null }>({ role: null });
export const useRole = () => useContext(RoleContext);
