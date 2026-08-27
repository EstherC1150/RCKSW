"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore, { isJwtExpired, isJwtExpiringSoon } from "../stores/UserStore";
import { useAlertStore } from "../stores/alertStore";
import { ensureValidAccessToken } from "../utils/api";
import Header from "../_components/common/Header";
import Sidebar from "../_components/common/Sidebar";

type Props = {
  children: React.ReactNode;
};

const ClientLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tokens, clearAll } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      const store = useUserStore.getState();
      const accessToken = store.tokens?.accessToken;
      const refreshToken = store.tokens?.refreshToken;

      // 1. 비로그인 상태이거나 토큰이 아예 없는 경우
      if (!store.user || (!accessToken && !refreshToken)) {
        store.clearAll();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", {
            title: "로그인 필요",
            type: "warning",
          });
          window.location.href = "/login";
        }
        return;
      }

      // 2. 리프레시 토큰까지 완전히 만료된 경우 (장기 미접속)
      if (refreshToken && isJwtExpired(refreshToken)) {
        store.clearAll();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          useAlertStore.getState().showAlert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.", {
            title: "세션 만료",
            type: "warning",
          });
          window.location.href = "/login";
        }
        return;
      }

      // 3. 액세스 토큰이 만료되었거나 임박했으면 백그라운드 Silent Refresh 진행
      if (!accessToken || isJwtExpiringSoon(accessToken, 60)) {
        const validToken = await ensureValidAccessToken();
        if (!validToken) {
          store.clearAll();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            useAlertStore.getState().showAlert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.", {
              title: "세션 만료",
              type: "warning",
            });
            window.location.href = "/login";
          }
        }
      }
    };

    // 마운트 및 라우트 이동 시 인증 검증
    checkAuth();

    // 탭 포커스 복귀 시에만 체크 (불필요한 setInterval 폴링 없음)
    window.addEventListener("focus", checkAuth);
    document.addEventListener("visibilitychange", checkAuth);

    return () => {
      window.removeEventListener("focus", checkAuth);
      document.removeEventListener("visibilitychange", checkAuth);
    };
  }, [isMounted, pathname, router]);

  if (!isMounted) {
    return null;
  }

  // 비로그인 상태이거나 리프레시 토큰까지 모두 만료된 경우 렌더링 차단
  const isRefreshExpired = !tokens?.refreshToken || isJwtExpired(tokens.refreshToken);
  const isAccessExpired = !tokens?.accessToken || isJwtExpired(tokens.accessToken);
  if (!user || (isRefreshExpired && isAccessExpired)) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar />}
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
};

export default ClientLayout;
