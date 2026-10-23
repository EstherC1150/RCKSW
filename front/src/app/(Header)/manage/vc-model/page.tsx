import React from "react";
import { Suspense } from "react";
import VCModelClientPage from "@/app/(Header)/manage/vc-model/VCModelClientPage";

const Page = () => {
  return (
    <Suspense fallback={<div className="text-muted p-4">로딩 중...</div>}>
      <VCModelClientPage />
    </Suspense>
  );
};

export default Page;
