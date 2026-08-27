import { create } from "zustand";
import { persist } from "zustand/middleware";

// 사용자 정보 타입 정의
interface User {
  id: number;
  username: string;
  email: string;
  department: string; // 부서
  position: string; // 직책
  phone_number: string; // 전화번호
  isLoggedIn: boolean;
  role: "user" | "developer" | "admin";
  log: string;
}

// 인증 토큰 타입 정의
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// 스토어 상태 타입 정의
interface UserState {
  user: User | null;
  tokens: AuthTokens | null;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  updateUser: (userData: Partial<User>) => void;
  updateTokens: (tokens: Partial<AuthTokens>) => void;
  clearUser: () => void;
  clearTokens: () => void;
  clearAll: () => void;
  isAuthenticated: () => boolean;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

// JWT 토큰 만료 여부 확인 함수 (Base64Url 디코딩)
export const isJwtExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const decoded = typeof window !== "undefined" 
      ? window.atob(base64) 
      : Buffer.from(base64, "base64").toString("binary");
    const payload = JSON.parse(decoded);
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  } catch (error) {
    console.error("JWT 만료 확인 실패:", error);
    return true;
  }
};

// JWT 토큰 만료 임박 여부 확인 함수 (기본 60초 버퍼)
export const isJwtExpiringSoon = (
  token: string | null | undefined,
  bufferSeconds = 60
): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const decoded = typeof window !== "undefined" 
      ? window.atob(base64) 
      : Buffer.from(base64, "base64").toString("binary");
    const payload = JSON.parse(decoded);
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= (payload.exp - bufferSeconds);
  } catch {
    return true;
  }
};

// JWT 토큰 남은 유효 시간 (초 단위) 반환 함수
export const getJwtRemainingSeconds = (token: string | null | undefined): number => {
  if (!token) return 0;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return 0;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const decoded = typeof window !== "undefined" 
      ? window.atob(base64) 
      : Buffer.from(base64, "base64").toString("binary");
    const payload = JSON.parse(decoded);
    if (!payload.exp) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  } catch {
    return 0;
  }
};

// Zustand 스토어 생성
const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,

      // 사용자 정보 설정
      setUser: (user: User) => set({ user }),

      // 토큰 설정
      setTokens: (tokens: AuthTokens) => set({ tokens }),

      // 사용자 정보 업데이트
      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // 토큰 업데이트
      updateTokens: (newTokens: Partial<AuthTokens>) =>
        set((state) => ({
          tokens: state.tokens ? { ...state.tokens, ...newTokens } : null,
        })),

      // 사용자 정보 초기화
      clearUser: () => set({ user: null }),

      // 토큰 초기화
      clearTokens: () => set({ tokens: null }),

      // 모든 인증 정보 초기화 (전체 로그아웃)
      clearAll: () => set({ user: null, tokens: null }),

      // 인증 상태 확인 (Access Token 또는 Refresh Token 중 하나라도 유효하면 true)
      isAuthenticated: () => {
        const state = get();
        if (!state.user) return false;
        const accessValid = state.tokens?.accessToken && !isJwtExpired(state.tokens.accessToken);
        const refreshValid = state.tokens?.refreshToken && !isJwtExpired(state.tokens.refreshToken);
        if (!accessValid && !refreshValid) {
          get().clearAll();
          return false;
        }
        return true;
      },

      // 액세스 토큰 가져오기
      getAccessToken: () => get().tokens?.accessToken || null,

      // 리프레시 토큰 가져오기
      getRefreshToken: () => get().tokens?.refreshToken || null,
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
      // 민감한 정보 보호 및 만료 세션 정리
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            const accessToken = data?.state?.tokens?.accessToken;
            const refreshToken = data?.state?.tokens?.refreshToken;
            const hasValidAccess = accessToken && !isJwtExpired(accessToken);
            const hasValidRefresh = refreshToken && !isJwtExpired(refreshToken);

            // Access Token과 Refresh Token이 모두 만료된 경우에만 localStorage에서 세션 정리
            if (!hasValidAccess && !hasValidRefresh) {
              localStorage.removeItem(name);
              return null;
            }
            return data;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);

export default useUserStore;
