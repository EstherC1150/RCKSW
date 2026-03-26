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
  role: "user" | "admin";
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

      // 인증 상태 확인
      isAuthenticated: () => {
        const state = get();
        return !!(state.user?.isLoggedIn && state.tokens?.accessToken);
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
      // 민감한 정보 보호를 위한 storage 설정
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // 토큰 정보 복호화 로직을 추가할 수 있습니다
          return data;
        },
        setItem: (name, value) => {
          // 토큰 정보 암호화 로직을 추가할 수 있습니다
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export default useUserStore;
