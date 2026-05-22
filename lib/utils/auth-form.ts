/** 登录/注册页表单样式，与主站品牌色解耦，避免沿用首页淡蓝按钮与蓝色聚焦环 */

export const authInputClass =
  [
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition",
    "focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100",
    "autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_#ffffff] autofill:[-webkit-text-fill-color:#18181b]",
    "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
    "dark:focus:border-zinc-500 dark:focus:ring-zinc-800",
    "dark:autofill:bg-zinc-950 dark:autofill:shadow-[inset_0_0_0px_1000px_#09090b] dark:autofill:[-webkit-text-fill-color:#f4f4f5]",
  ].join(" ");

export const authSubmitButtonClass =
  "w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";

export const authLinkClass =
  "font-medium text-zinc-900 underline-offset-4 transition hover:underline dark:text-zinc-100";

export const authEyebrowClass =
  "text-sm font-medium text-zinc-500 dark:text-zinc-400";
