"use client";

import { Suspense } from "react";
import EtcClientPage from "./EtcClientPage";

const EtcPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EtcClientPage />
    </Suspense>
  );
};

export default EtcPage;
