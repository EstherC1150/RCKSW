"use client";

import React from "react";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ComponentPageLayout from "@/app/_components/common/manage/ComponentPageLayout";

const NSModelClientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    if (!pageParam || isNaN(page) || page < 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`/manage/ns-model?${params.toString()}`);
    }
  }, [pageParam, page, router, searchParams]);

  return (
    <ComponentPageLayout
      type="ns_model"
      initialPage={!pageParam || isNaN(page) || page < 1 ? 1 : page}
    />
  );
};

export default NSModelClientPage;
