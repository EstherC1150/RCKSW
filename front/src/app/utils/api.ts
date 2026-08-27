import useUserStore, { isJwtExpired } from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const store = useUserStore.getState();
  const accessToken = store.getAccessToken();

  if (!accessToken || isJwtExpired(accessToken)) {
    handleSessionExpired();
    throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // 토큰 갱신 시도
    const refreshToken = store.getRefreshToken();
    if (refreshToken && !isJwtExpired(refreshToken)) {
      try {
        const refreshResponse = await fetch(
          `${apiUrl}/api/users/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (refreshResponse.ok) {
          const { accessToken: newAccessToken } = await refreshResponse.json();
          store.updateTokens({ accessToken: newAccessToken });

          // 새 토큰으로 원래 요청 재시도
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          if (response.ok) {
            return response;
          }
        }
      } catch (error) {
        console.error("토큰 갱신 실패:", error);
      }
    }

    // 토큰 갱신 실패 또는 401 재발생 시 로그아웃 & 로그인 페이지 리다이렉트
    handleSessionExpired();
    throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
  }

  return response;
};

const handleSessionExpired = () => {
  const store = useUserStore.getState();
  store.clearAll();

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    useAlertStore.getState().showAlert("로그인 세션(24시간)이 만료되었습니다. 다시 로그인해 주세요.", {
      title: "세션 만료",
      type: "warning",
    });
    window.location.href = "/login";
  }
};
