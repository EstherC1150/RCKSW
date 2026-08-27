import useUserStore, { isJwtExpired, isJwtExpiringSoon } from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";

let refreshPromise: Promise<string | null> | null = null;

// 요청 전 액세스 토큰의 유효성을 검사하고, 만료 임박 시 백그라운드에서 자동 갱신(Silent Refresh)하는 핵심 함수
export const ensureValidAccessToken = async (): Promise<string | null> => {
  const store = useUserStore.getState();
  const accessToken = store.tokens?.accessToken;
  const refreshToken = store.tokens?.refreshToken;

  // 1. 유효한 액세스 토큰이 있고, 아직 만료되지 않았다면 (60초 버퍼) 그대로 사용
  if (accessToken && !isJwtExpiringSoon(accessToken, 60)) {
    return accessToken;
  }

  // 2. 액세스 토큰이 만료되었거나 임박했는데 리프레시 토큰도 없거나 만료된 경우
  if (!refreshToken || isJwtExpired(refreshToken)) {
    return null;
  }

  // 3. 다중 API 호출 시 중복 갱신 요청 방지를 위한 Promise 공유 (Mutex 패턴)
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const refreshResponse = await fetch(`${apiUrl}/api/users/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data.accessToken;
        store.updateTokens({ accessToken: newAccessToken });
        return newAccessToken as string;
      } else if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        // 서버에서 Refresh Token 만료/무효 판정 -> 명확한 세션 만료 처리
        handleSessionExpired();
        return null;
      } else {
        // 500 서버 장애 등 일시적 오류인 경우 세션을 즉시 폭파하지 않고 기존 세션 유지 시도
        console.warn(`토큰 갱신 중 일시적 서버 오류 (HTTP ${refreshResponse.status})`);
        return null;
      }
    } catch (error) {
      // 와이파이 단선/오프라인 등 네트워크 단절 오류 시 세션을 파기하지 않음
      console.warn("네트워크 일시 오류로 토큰 갱신 요청 실패:", error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  // 요청 전 유효한 토큰 확보 (만료 시 백그라운드 자동 갱신)
  const token = await ensureValidAccessToken();

  if (!token) {
    handleSessionExpired();
    throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // 서버에서 401을 반환한 경우 (토큰 무효화 등) 2차 리프레시 시도 후 재요청
  if (response.status === 401) {
    const store = useUserStore.getState();
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

    // 갱신 실패 시 로그아웃 & 로그인 페이지 리다이렉트
    handleSessionExpired();
    throw new Error("인증이 만료되었습니다. 다시 로그인해 주세요.");
  }

  return response;
};

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const authenticatedUpload = async (
  url: string,
  formData: FormData,
  method: "POST" | "PATCH" | "PUT" = "POST",
  onProgress?: (progress: UploadProgress) => void
): Promise<any> => {
  // 대용량 파일 업로드 시작 전 사전 silent refresh로 만료되지 않은 깨끗한 토큰 확보!
  const accessToken = await ensureValidAccessToken();

  if (!accessToken) {
    handleSessionExpired();
    throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(
          Math.round((event.loaded / event.total) * 100),
          99
        );
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent,
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 401) {
        handleSessionExpired();
        return reject(
          new Error("인증이 만료되었습니다. 다시 로그인해 주세요.")
        );
      }

      if (onProgress) {
        onProgress({ loaded: 1, total: 1, percent: 100 });
      }

      try {
        const responseData = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          reject(
            new Error(
              responseData.message || `업로드 실패 (HTTP ${xhr.status})`
            )
          );
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`서버 응답 오류 (HTTP ${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("네트워크 오류로 업로드에 실패했습니다."));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("업로드 시간이 초과되었습니다."));
    });

    xhr.open(method, url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.send(formData);
  });
};

let isHandlingSessionExpired = false;

export const handleSessionExpired = async (
  message = "로그인 세션이 만료되었습니다.\n다시 로그인해 주세요.",
  title = "세션 만료"
) => {
  if (isHandlingSessionExpired) return;
  isHandlingSessionExpired = true;

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    try {
      // 사용자가 팝업의 [확인] 버튼을 누를 때까지 대기
      await useAlertStore.getState().showAlert(message, {
        title,
        type: "warning",
        confirmText: "확인",
      });
    } catch {
      // 모달 닫힘 예외 무시
    } finally {
      const store = useUserStore.getState();
      store.clearAll();
      window.location.href = "/login";
    }
  } else {
    const store = useUserStore.getState();
    store.clearAll();
  }

  isHandlingSessionExpired = false;
};
