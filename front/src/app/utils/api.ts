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

export const authenticatedUpload = (
  url: string,
  formData: FormData,
  method: "POST" | "PATCH" | "PUT" = "POST",
  onProgress?: (progress: UploadProgress) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const store = useUserStore.getState();
    const accessToken = store.getAccessToken();

    if (!accessToken || isJwtExpired(accessToken)) {
      handleSessionExpired();
      return reject(
        new Error("로그인 세션(24시간)이 만료되었습니다. 다시 로그인해 주세요.")
      );
    }

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

const handleSessionExpired = () => {
  const store = useUserStore.getState();
  store.clearAll();

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    useAlertStore.getState().showAlert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.", {
      title: "세션 만료",
      type: "warning",
    });
    window.location.href = "/login";
  }
};
