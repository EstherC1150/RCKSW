import ComponentPageLayout from "@/app/_components/common/manage/ComponentPageLayout";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

const EtcClientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    if (!pageParam || isNaN(page) || page < 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`/manage/etc?${params.toString()}`);
    }
  }, [pageParam, page, router, searchParams]);

  return (
    <ComponentPageLayout
      type="etc"
      initialPage={!pageParam || isNaN(page) || page < 1 ? 1 : page}
    />
  );
};

export default EtcClientPage;
