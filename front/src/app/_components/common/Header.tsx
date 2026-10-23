"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore from "@/app/stores/UserStore";
import useThemeStore from "@/app/stores/ThemeStore";
import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";

import MyPageModal from "./MyPageModal";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showOptions, setShowOptions] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { user, clearAll } = useUserStore();
  const { theme, toggleTheme } = useThemeStore();

  const isManagement = pathname.includes("/manage") || pathname.includes("/user") || pathname.includes("/log");

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
    <>
      <header className="h-[64px] bg-header border-b border-header-border flex items-center justify-between px-8 z-30 shadow-sm transition-colors flex-shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-transform hover:opacity-90 active:scale-95 cursor-pointer"
            title="대시보드 메인으로 이동"
          >
            <Image
              src="/images/RCK Logo-en-Horizontal-Reverse.png"
              alt="RCK Logo"
              width={100}
              height={26}
              className="object-contain transition-all group-hover:opacity-90"
              priority
            />
          </Link>
          {isManagement}
        </div>
        <div className="flex items-center gap-4">
          {/* 테마 전환 토글 버튼 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/15 text-header-fg active:scale-95 cursor-pointer"
            title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 scale-100" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-200 transition-transform -rotate-12 scale-100" />
            )}
          </button>

          {/* 유저 메뉴 */}
          <div className="flex gap-[8px] items-center relative">
            <p
              className="text-[14px] font-medium text-header-fg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowOptions(!showOptions)}
            >
              {user?.username}님
            </p>
            {showOptions && (
              <div
                ref={optionsRef}
                className="absolute top-[36px] right-0 bg-card border border-border text-foreground rounded-xl shadow-xl z-50 w-[130px] overflow-hidden backdrop-blur-md"
              >
                <button
                  className="w-full px-4 py-2.5 text-left text-foreground hover:bg-card-hover text-[13px] border-b border-border flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  onClick={() => {
                    setIsMyPageOpen(true);
                    setShowOptions(false);
                  }}
                >
                  마이페이지
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-rose-500 hover:bg-rose-500/10 text-[13px] flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 마이페이지 팝업 모달 */}
      <MyPageModal isOpen={isMyPageOpen} onClose={() => setIsMyPageOpen(false)} />
    </>
  );
};

export default Header;
