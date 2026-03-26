import React from "react";
import { Suspense } from "react";
import NSModelClientPage from "@/app/(Header)/manage/ns-model/NSModelClientPage";

const Page = () => {
  return (
    <Suspense fallback={<div className="text-white">로딩 중...</div>}>
      <NSModelClientPage />
    </Suspense>
  );
};

export default Page;
