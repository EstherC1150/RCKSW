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
      className={`flex items-center w-full group relative px-[16px] py-[10px] rounded-xl transition-all duration-300 border border-transparent ${
        isActive 
          ? "bg-primary/10 border-primary/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
          : "hover:bg-white/5 hover:border-white/5"
      }`}
      href={tab.href}
    >
      {/* 활성 상태 사이드 바 (왼쪽) */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
      )}

      <div className="h-[20px] w-[20px] relative flex items-center justify-center flex-shrink-0">
        {tab.imgUrl ? (
          <Image 
            src={tab.imgUrl} 
            alt={tab.imgAlt} 
            fill 
            className={`object-contain transition-all duration-300 ${
              isActive ? "opacity-100 scale-110" : "opacity-40 grayscale group-hover:opacity-80 group-hover:grayscale-0"
            }`} 
          />
        ) : (
          <div className={`transition-all duration-300 ${
            isActive ? "w-1.5 h-1.5 bg-primary shadow-[0_0_6px_rgba(59,130,246,0.8)]" : "w-1 h-1 bg-gray-600 group-hover:bg-gray-400"
          } rounded-full`} />
        )}
      </div>

      <p className={`text-[14px] ml-[14px] font-medium transition-all duration-300 ${
        isActive ? "text-white translate-x-1" : "text-gray-400 group-hover:text-gray-200"
      }`}>
        {tab.name}
      </p>

      {/* 활성 상태 글로우 효과 (오른쪽으로 늘어뜨린 느낌) */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl pointer-events-none" />
      )}
    </Link>
  );
};

export default TabBox;
