"use client";

import { Suspense } from "react";
import SearchClientPage from "./SearchClientPage";

const SearchPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">검색 결과를 불러오는 중...</div>}>
      <SearchClientPage />
    </Suspense>
  );
};

export default SearchPage;
