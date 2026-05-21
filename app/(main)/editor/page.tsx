import Link from "next/link";

import { btnSoft } from "@/lib/utils/brand";

export default function EditorPlaceholderPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">编辑器</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          创作编辑器将在后续迭代中开放，当前可先浏览首页内容流。
        </p>
        <Link
          className={`mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-medium ${btnSoft}`}
          href="/"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
