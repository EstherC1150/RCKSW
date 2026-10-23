"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ManageRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/manage/search${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageRedirect />
    </Suspense>
  );
}
