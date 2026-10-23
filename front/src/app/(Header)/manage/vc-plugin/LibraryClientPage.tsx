import React from "react";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ComponentPageLayout from "@/app/_components/common/manage/ComponentPageLayout";

const LibraryClientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    if (!pageParam || isNaN(page) || page < 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`/manage/vc-plugin?${params.toString()}`);
    }
  }, [pageParam, page, router, searchParams]);

  return (
    <ComponentPageLayout
      type="vc_plugin"
      initialPage={!pageParam || isNaN(page) || page < 1 ? 1 : page}
    />
  );
};

export default LibraryClientPage;
