import React from "react";
import { TMenu } from "@/app/_types/common/common.tyeps";
import TabBox from "./TabBox";
import useUserStore from "@/app/stores/UserStore";
import Image from "next/image";

const Sidebar = () => {
  const { user } = useUserStore();

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
      ]
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
      ]
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
      ]
    },
    {
      title: "Management",
      icon: "",
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
      ]
    }
  ];

  return (
    <div className="flex flex-col w-[280px] h-full bg-[#0b1121] text-foreground py-[40px] px-[20px] border-r border-white/5 flex-shrink-0 z-40 transition-all duration-300 overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      {/* 사이드바 상단 여백 또는 로고 추가 가능 */}
      
      {menuGroups.map((group, groupIdx) => (
        <div key={group.title} className={groupIdx > 0 ? "mt-10" : ""}>
          <div className="flex items-center gap-3 px-2 mb-4 group/header cursor-default">
            {group.icon ? (
               <div className="w-5 h-5 relative p-1 bg-white/5 rounded-lg border border-white/10 shadow-sm group-hover/header:border-primary/50 transition-colors">
                 <Image src={group.icon} alt={group.title} fill className="object-contain" />
               </div>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center p-1 bg-white/5 rounded-lg border border-white/10 group-hover/header:border-primary/50 transition-colors">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover/header:bg-primary" />
              </div>
            )}
            <h3 className="text-[12px] font-black text-gray-500 uppercase tracking-[0.15em] transition-colors group-hover/header:text-gray-300">
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
