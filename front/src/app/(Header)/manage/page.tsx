"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ManagePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/manage/vc-plugin");
  }, [router]);

  return null;
};

export default ManagePage;
