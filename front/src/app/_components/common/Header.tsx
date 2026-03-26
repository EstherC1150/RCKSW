"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore from "@/app/stores/UserStore";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { user, clearAll } = useUserStore();

  const isManagement = pathname.includes("/manage") || pathname.includes("/user") || pathname.includes("/log");

  const navItems = [
    { name: "Visual Components", href: "/manage/vc-plugin", active: pathname.includes("/vc-") },
    { name: "Nextspace", href: "/manage/ns-plugin", active: pathname.includes("/ns-") },
    { name: "etc", href: "/manage/etc", active: pathname.includes("/etc") },
  ];

  const handleLogout = () => {
    // 로그아웃 로직 구현
    clearAll();
    router.push("/login");
    setShowOptions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-[64px] bg-card border-b border-border flex items-center justify-between px-8 z-30 shadow-sm transition-all flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Image src="/images/RCK Logo-en-Horizontal-Reverse.png" alt="RCK Logo" width={100} height={26} className="object-contain" priority />
        </div>
        {isManagement}
      </div>
      <div className="flex gap-[8px] items-center relative">
        <p
          className="text-[14px] font-medium cursor-pointer hover:underline"
          onClick={() => setShowOptions(!showOptions)}
        >
          {user?.username}님
        </p>
        {showOptions && (
          <div
            ref={optionsRef}
            className="absolute top-[30px] right-0 bg-card border border-gray-600 rounded-md shadow-lg z-10 w-[100px] items-center"
          >
            <button
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 text-[14px]"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
