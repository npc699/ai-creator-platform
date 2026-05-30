/** 插入图片弹窗文案，集中维护避免编码损坏。 */
export const insertImageCopy = {
  title: "插入图片",
  close: "关闭",
  tabLocal: "本机选择",
  tabAi: "AI 生成",
  pickLocal: "点击选择本机图片",
  formatHint: (maxSize: string) => `JPG / PNG / WebP / GIF，单张不超过 ${maxSize}`,
  embedTip: "图片将上传至服务器并以链接形式插入正文。",
  coverTitle: "封面",
  coverConfirm: "设为封面",
  coverSaving: "保存中…",
  coverEmbedTip: "封面仅用于列表展示，不会插入正文。",
  tabAssets: "素材库选择",
} as const;
