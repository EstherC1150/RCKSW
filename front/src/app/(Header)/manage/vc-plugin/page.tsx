"use client";

import { Suspense } from "react";
import LibraryClientPage from "./LibraryClientPage";

const LibraryPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LibraryClientPage />
    </Suspense>
  );
};

export default LibraryPage;
