"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserStore, { isJwtExpired } from "@/app/stores/UserStore";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const store = useUserStore.getState();
    const accessValid = store.tokens?.accessToken && !isJwtExpired(store.tokens.accessToken);
    const refreshValid = store.tokens?.refreshToken && !isJwtExpired(store.tokens.refreshToken);

    if (store.user && (accessValid || refreshValid)) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
