import { TMenu } from "@/app/_types/common/common.tyeps";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  tab: TMenu;
};

const TabBox = ({ tab }: Props) => {
  const pathname = usePathname();
  const isActive = pathname === tab.href;

  return (
    <Link
      className={`flex items-center w-full group relative px-[16px] py-[10px] rounded-xl transition-all duration-300 ${
        isActive 
          ? "bg-white/15 dark:bg-primary/20" 
          : "hover:bg-white/10 dark:hover:bg-white/5"
      }`}
      href={tab.href}
    >
      {/* 활성 상태 사이드 바 (다크: 블루 글로우, 라이트: 화이트 글로우) */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-white dark:bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] dark:shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
      )}

      <div className="h-[20px] w-[20px] relative flex items-center justify-center flex-shrink-0">
        {tab.imgUrl ? (
          <Image 
            src={tab.imgUrl} 
            alt={tab.imgAlt} 
            fill 
            className={`object-contain transition-all duration-300 ${
              isActive ? "opacity-100 scale-110" : "opacity-50 grayscale group-hover:opacity-90 group-hover:grayscale-0"
            }`} 
          />
        ) : (
          <div className={`transition-all duration-300 ${
            isActive 
              ? "w-1.5 h-1.5 bg-white dark:bg-primary shadow-[0_0_6px_rgba(255,255,255,0.8)] dark:shadow-[0_0_6px_rgba(59,130,246,0.8)]" 
              : "w-1 h-1 bg-white/70 dark:bg-gray-500 group-hover:bg-white dark:group-hover:bg-gray-300"
          } rounded-full`} />
        )}
      </div>

      <p className={`text-[14px] ml-[14px] font-medium transition-all duration-300 ${
        isActive 
          ? "text-white font-semibold translate-x-1" 
          : "text-sidebar-muted dark:text-muted group-hover:text-white dark:group-hover:text-foreground"
      }`}>
        {tab.name}
      </p>
    </Link>
  );
};

export default TabBox;
