import useUserStore from "@/app/stores/UserStore";

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const store = useUserStore.getState();
  const accessToken = store.getAccessToken();

  if (!accessToken) {
    throw new Error("인증 토큰이 없습니다.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    // 토큰 갱신 시도
    const refreshToken = store.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
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
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        }
      } catch (error) {
        console.error("토큰 갱신 실패:", error);
      }
    }

    // 토큰 갱신 실패 시 로그아웃
    store.clearAll();
    throw new Error("인증이 만료되었습니다.");
  }

  return response;
};
