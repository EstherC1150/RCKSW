"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore, { isJwtExpired } from "../stores/UserStore";
import { useAlertStore } from "../stores/alertStore";
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

    const checkAuth = () => {
      const store = useUserStore.getState();
      const token = store.tokens?.accessToken;
      const isExpired = !token || isJwtExpired(token);

      if (!store.user || isExpired) {
        store.clearAll();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          useAlertStore.getState().showAlert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.", {
            title: "세션 만료",
            type: "warning",
          });
          router.replace("/login");
        }
      }
    };

    // 마운트 및 경로 이동 시 즉시 인증/만료 검증
    checkAuth();

    // 5초마다 만료 체크 및 창 포커스 복귀 시 즉시 체크 (실시간 세션 만료 감지)
    const timer = setInterval(checkAuth, 5 * 1000);
    window.addEventListener("focus", checkAuth);
    document.addEventListener("visibilitychange", checkAuth);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", checkAuth);
      document.removeEventListener("visibilitychange", checkAuth);
    };
  }, [isMounted, pathname, router]);

  if (!isMounted) {
    return null;
  }

  // 비로그인 또는 토큰 만료 상태면 페이지 콘텐츠 렌더링을 차단하고 리다이렉트 대기
  if (!user || !tokens?.accessToken || isJwtExpired(tokens.accessToken)) {
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
