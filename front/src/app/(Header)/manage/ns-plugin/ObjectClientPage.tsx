import ComponentPageLayout from "@/app/_components/common/manage/ComponentPageLayout";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

const ObjectClientPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    if (!pageParam || isNaN(page) || page < 1) {
      router.replace("/manage/ns-plugin?page=1");
    }
  }, [pageParam, page, router]);

  return (
    <ComponentPageLayout
      type="ns_plugin"
      initialPage={!pageParam || isNaN(page) || page < 1 ? 1 : page}
    />
  );
};

export default ObjectClientPage;
