"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** 滚动超过该距离后显示按钮，避免首屏遮挡内容 */
const SCROLL_THRESHOLD = 400;

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      aria-label="回到顶部"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-700 shadow-lg transition-all duration-200",
        "hover:border-brand-border hover:bg-brand-surface hover:text-brand-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
      onClick={scrollToTop}
      type="button"
    >
      <ArrowUp aria-hidden className="h-5 w-5" />
    </button>
  );
}
