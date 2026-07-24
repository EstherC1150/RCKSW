"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MyPageModal from "@/app/_components/common/MyPageModal";

export default function MyPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <MyPageModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.back();
        }}
      />
    </div>
  );
}
