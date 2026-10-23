import React from "react";
import TabBox from "./TabBox";
import useUserStore from "@/app/stores/UserStore";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search } from "lucide-react";

const Sidebar = () => {
  const { user } = useUserStore();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isSearch = pathname.startsWith("/manage/search");

  // 메뉴 그룹 정의
  const menuGroups = [
    {
      title: "Visual Components",
      icon: "/images/ic-vc.png",
      menus: [
        {
          imgUrl: "",
          imgAlt: "",
          name: "VC PlugIn",
          href: "/manage/vc-plugin",
        },
        {
          imgUrl: "",
          imgAlt: "",
          name: "VC Model",
          href: "/manage/vc-model",
        },
      ],
    },
    {
      title: "Nextspace",
      icon: "/images/ic-ns.png",
      menus: [
        {
          imgUrl: "",
          imgAlt: "",
          name: "NS PlugIn",
          href: "/manage/ns-plugin",
        },
        {
          imgUrl: "",
          imgAlt: "",
          name: "NS Model",
          href: "/manage/ns-model",
        },
      ],
    },
    {
      title: "etc",
      icon: "/images/ic-etc.png",
      menus: [
        {
          imgUrl: "",
          imgAlt: "",
          name: "etc",
          href: "/manage/etc",
        },
      ],
    },
    {
      title: "Management",
      icon: "/images/ic-settings.png",
      menus: [
        {
          imgUrl: "/images/ic-user.png",
          imgAlt: "",
          name: "유저 관리",
          href: "/user",
        },
        {
          imgUrl: "/images/ic-log.png",
          imgAlt: "",
          name: "로그 조회",
          href: "/log",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-[280px] h-full bg-sidebar text-sidebar-fg py-[32px] px-[20px] border-r border-sidebar-border flex-shrink-0 z-40 transition-colors duration-300 overflow-y-auto shadow-sm">
      {/* 상단 메인 바로가기 (대시보드 & 통합 검색) */}
      <div className="mb-8 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center w-full group relative px-[16px] py-[10px] rounded-xl transition-all duration-300 ${
            isDashboard
              ? "bg-white/15 dark:bg-primary/20 text-white font-semibold"
              : "text-sidebar-muted dark:text-muted hover:text-white dark:hover:text-foreground hover:bg-white/10 dark:hover:bg-white/[0.04]"
          }`}
        >
          {/* 활성 상태 사이드 인디케이터 (다크: 블루, 라이트: 화이트) */}
          {isDashboard && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-white dark:bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] dark:shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
          )}

          <div className="h-[20px] w-[20px] relative flex items-center justify-center flex-shrink-0">
            <LayoutDashboard
              className={`w-[18px] h-[18px] transition-all duration-300 ${
                isDashboard ? "text-white dark:text-primary" : "text-sidebar-muted dark:text-muted group-hover:text-white dark:group-hover:text-foreground"
              }`}
            />
          </div>

          <span
            className={`text-[14px] ml-[14px] font-medium transition-all duration-300 ${
              isDashboard ? "text-white translate-x-1" : "text-sidebar-muted dark:text-muted group-hover:text-white dark:group-hover:text-foreground"
            }`}
          >
            대시보드
          </span>
        </Link>

        <Link
          href="/manage/search"
          className={`flex items-center w-full group relative px-[16px] py-[10px] rounded-xl transition-all duration-300 ${
            isSearch
              ? "bg-white/15 dark:bg-primary/20 text-white font-semibold"
              : "text-sidebar-muted dark:text-muted hover:text-white dark:hover:text-foreground hover:bg-white/10 dark:hover:bg-white/[0.04]"
          }`}
        >
          {/* 활성 상태 사이드 인디케이터 */}
          {isSearch && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-white dark:bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] dark:shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
          )}

          <div className="h-[20px] w-[20px] relative flex items-center justify-center flex-shrink-0">
            <Search
              className={`w-[18px] h-[18px] transition-all duration-300 ${
                isSearch ? "text-white dark:text-primary" : "text-sidebar-muted dark:text-muted group-hover:text-white dark:group-hover:text-foreground"
              }`}
            />
          </div>

          <span
            className={`text-[14px] ml-[14px] font-medium transition-all duration-300 ${
              isSearch ? "text-white translate-x-1" : "text-sidebar-muted dark:text-muted group-hover:text-white dark:group-hover:text-foreground"
            }`}
          >
            통합 검색
          </span>
        </Link>
      </div>

      {menuGroups
        .filter((group) => group.title !== "Management" || user?.role === "admin")
        .map((group, groupIdx) => (
          <div key={group.title} className={groupIdx > 0 ? "mt-10" : ""}>
            <div className="flex items-center gap-3 px-2 mb-4 group/header cursor-default">
              {group.icon ? (
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image src={group.icon} alt={group.title} fill className="object-contain opacity-80 group-hover/header:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-white/70 dark:bg-gray-400 rounded-full group-hover/header:bg-white dark:group-hover/header:bg-primary transition-colors" />
                </div>
              )}
              <h3 className="text-[12px] font-black text-sidebar-muted/90 dark:text-gray-400 uppercase tracking-[0.15em] transition-colors group-hover/header:text-sidebar-fg dark:group-hover/header:text-foreground">
                {group.title}
              </h3>
            </div>
            <div className="space-y-2 pl-1">
              {group.menus.map((menu) => (
                <TabBox key={menu.name} tab={menu} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default Sidebar;
