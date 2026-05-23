/** 插入图片弹窗文案，集中维护避免编码损坏。 */
export const insertImageCopy = {
  title: "插入图片",
  close: "关闭",
  tabLocal: "本机选择",
  tabAi: "AI 生成",
  pickLocal: "点击选择本机图片",
  formatHint: (maxSize: string) => `JPG / PNG / WebP / GIF，单张不超过 ${maxSize}`,
  embedTip: "图片将以嵌入方式插入正文，较大文件会增加文档体积。",
} as const;
