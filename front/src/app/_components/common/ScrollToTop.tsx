"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  targetId?: string;
}

export default function ScrollToTop({ targetId = "main-scroll-container" }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = document.getElementById(targetId) || window;

    const handleScroll = () => {
      let scrollY = 0;
      if (container === window) {
        scrollY = window.scrollY;
      } else {
        scrollY = (container as HTMLElement).scrollTop;
      }
      setIsVisible(scrollY > 200);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [targetId]);

  const scrollToTop = () => {
    const container = document.getElementById(targetId);
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="맨 위로 가기"
      title="맨 위로 이동"
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl hover:shadow-2xl shadow-primary/25 dark:shadow-black/60 border border-white/20 transition-all duration-300 hover:-translate-y-1 active:scale-95 group cursor-pointer ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 duration-200" strokeWidth={2.5} />
      <span className="text-[9px] font-black tracking-tight leading-none">TOP</span>
    </button>
  );
}
