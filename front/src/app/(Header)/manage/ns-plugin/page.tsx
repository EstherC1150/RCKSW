"use client";

import { Suspense } from "react";
import ObjectClientPage from "./ObjectClientPage";

const ObjectPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ObjectClientPage />
    </Suspense>
  );
};

export default ObjectPage;
