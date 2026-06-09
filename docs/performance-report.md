# 首页 Feed 性能报告

## 1. 概述

| 项              | 值                                                            |
| --------------- | ------------------------------------------------------------- |
| 测试页面        | `http://localhost:3000/`（推荐 Feed）                         |
| 构建方式        | `next build && npm run start`（生产模式）                     |
| Lighthouse 版本 | 13.2.0（Channel: DevTools）                                   |
| 验收目标        | LCP ≤ 2.5s，CLS ≤ 0.1                                         |
| **验收结论**    | **通过** — Mobile Slow 4G + 4× CPU 下 LCP **2.2s**，CLS **0** |

---

## 2. 测试环境

| 项       | 报告 A — 无节流 Desktop                | 报告 B — Mobile Slow 4G                                |
| -------- | -------------------------------------- | ------------------------------------------------------ |
| 报告文件 | `localhost_3000-20260607T104135.html`  | `localhost_3000-20260607T123142.html`                  |
| 采集时间 | 2026-06-07 10:41                       | 2026-06-07 12:31                                       |
| 模拟设备 | Desktop（Chrome/149，UA: macOS/Intel） | Mobile（412×823，DPR 1.75，UA: Android/moto g power）  |
| 网络     | 无节流（RTT 40 ms，~10 Mbps）          | Slow 4G（RTT 150 ms，下载 ~1.5 Mbps，请求延迟 562 ms） |
| CPU      | 1×                                     | 4× slowdown                                            |
| 登录态   | 已登录                                 | 已登录                                                 |

---

## 3. 性能数据

### 3.1 核心指标

| 指标               | 目标       | 报告 A（无节流 Desktop） | 报告 B（Mobile Slow 4G） |
| ------------------ | ---------- | ------------------------ | ------------------------ |
| Performance 总分   | —          | **100**                  | **96**                   |
| **LCP**            | **≤ 2.5s** | **0.7s**                 | **2.2s ✓**               |
| FCP                | —          | 0.3s                     | 2.1s                     |
| **CLS**            | **≤ 0.1**  | **0**                    | **0 ✓**                  |
| TBT                | —          | 0 ms                     | 10 ms                    |
| Speed Index        | —          | 0.4s                     | 3.1s                     |
| TTI                | —          | 0.7s                     | 3.6s                     |
| TTFB（服务端响应） | —          | 52 ms                    | 51 ms                    |

### 3.2 LCP 详细分析

**LCP 元素**：两份报告一致，均为推荐列表第三条文章的摘要段落，无封面图资源参与 LCP 计算：

```
selector:  div.min-w-0 > div.flex > div.min-w-0 > p.mt-1
tag:       <p class="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
```

**LCP 阶段分解**（Lighthouse LCP Breakdown Insight）：

| 阶段                       | 报告 A（无节流） | 报告 B（Slow 4G） | 说明                                                        |
| -------------------------- | ---------------- | ----------------- | ----------------------------------------------------------- |
| Time to First Byte         | 54 ms            | 52 ms             | 服务端处理耗时，两份报告一致，不是瓶颈                      |
| CSS + 资源下载（差值推算） | ~381 ms          | **~628 ms**       | 全局 CSS 阻塞渲染；Slow 4G 下 13 KB CSS 单次请求约需 630 ms |
| Element Render Delay       | 276 ms           | **1,549 ms**      | Client Component hydration + JS 执行耗时                    |
| **LCP 合计**               | **712 ms**       | **2,229 ms**      |                                                             |

> Lighthouse 13.x 对文本 LCP 元素仅直接输出 TTFB 和 Element Render Delay 两个阶段；中间的资源下载耗时由差值推算得出，与 Render-Blocking 诊断结果（CSS 节省估算 740 ms）基本吻合。

**LCP 元素视口位置**（`boundingRect.top`，视口高度 823px）：

| 报告              | LCP 时间 | 元素 top | 状态               |
| ----------------- | -------- | -------- | ------------------ |
| 报告 A（Desktop） | 712 ms   | 246 px   | 视口内             |
| 报告 B（Mobile）  | 2,229 ms | 688 px   | 视口内（靠近底部） |

### 3.3 网络资源

| 资源类型         | 报告 A 请求数 | 报告 A 体积 | 报告 B 请求数 | 报告 B 体积 |
| ---------------- | ------------- | ----------- | ------------- | ----------- |
| **合计**         | **61**        | **~388 KB** | **49**        | **~393 KB** |
| Script           | 12            | 274 KB      | 12            | 274 KB      |
| Font             | 2             | 60 KB       | 2             | 60 KB       |
| Document（HTML） | 1             | **14 KB**   | 1             | **21 KB**   |
| Stylesheet       | 1             | 13 KB       | 1             | 13 KB       |
| Image            | 0             | —           | 0             | —           |

报告 B 的 HTML 文档体积（21 KB）显著大于报告 A（14 KB），原因是静态渲染改造后 SSR HTML 直接包含首屏 10 条列表内容；两份报告 Script 体积完全相同，优化未引入额外 JS 负担。

**体积最大的前五个脚本**（两份报告相同）：

| 脚本文件           | 传输体积 |
| ------------------ | -------- |
| `0c9trkqo1qr_4.js` | 73 KB    |
| `1857afk6bjc1m.js` | 69 KB    |
| `0bymg5d-lqs0o.js` | 48 KB    |
| `0llo6myby100y.js` | 14 KB    |
| `0d3shmwh5_nmn.js` | 12 KB    |

### 3.4 主线程耗时（报告 B）

报告 A（无节流）主线程总耗时仅 339 ms，无需关注。报告 B 在 4× CPU 条件下：

| 任务类型                     | 耗时          | 占比  |
| ---------------------------- | ------------- | ----- |
| Script Evaluation            | 3,299 ms      | 73.9% |
| Other                        | 894 ms        | 20.0% |
| Garbage Collection           | 158 ms        | 3.5%  |
| Style & Layout               | 60 ms         | 1.3%  |
| Script Parsing & Compilation | 58 ms         | 1.3%  |
| **合计**                     | **~4,470 ms** |       |

**各脚本执行耗时**（报告 B，4× CPU）：

| 脚本                              | 总耗时       | 其中 Scripting |
| --------------------------------- | ------------ | -------------- |
| `1857afk6bjc1m.js`                | **3,891 ms** | 3,172 ms       |
| Unattributable                    | 306 ms       | 13 ms          |
| `localhost:3000/`（页面内联脚本） | 143 ms       | 10 ms          |
| `0bymg5d-lqs0o.js`                | 104 ms       | 84 ms          |

`1857afk6bjc1m.js` 是当前 hydration 延迟的核心来源，占 Script Evaluation 的 96%。

### 3.5 Lighthouse 诊断

| 诊断项                   | 报告 A 评分 | 报告 B 评分   | 关键数据                                                 |
| ------------------------ | ----------- | ------------- | -------------------------------------------------------- |
| Render-Blocking Resource | 0.5（警告） | **0（FAIL）** | `06px.lgc87.wp.css` 13 KB，Slow 4G 下估计节省 **740 ms** |
| Unused JavaScript        | 0（FAIL）   | 0.5（警告）   | 约 120 KB 可消除（`0c9trkqo1qr_4.js` 99% 未使用）        |
| Main Thread Work         | 1（通过）   | 0.5（警告）   | 4.5s（Script Evaluation 占 73.9%）                       |
| JS Execution Time        | 1（通过）   | 0.5（警告）   | 3.3s（`1857afk6bjc1m.js` 贡献最大）                      |
| Legacy JavaScript        | 0.5（警告） | 0.5（警告）   | 约 13 KB polyfill 在现代浏览器中多余                     |
| BF Cache                 | 0（FAIL）   | 0（FAIL）     | `Cache-Control: no-store` 导致无法进入前进/后退缓存      |
| Long Tasks               | —           | 通过          | 2 个长任务（67 ms、62 ms），均在 TBT 阈值内              |

---

## 4. 已实施的优化手段

### 4.1 首屏静态文档流渲染

**问题根因**

原实现中，`HomeFeedInfiniteList` 无条件使用 `@tanstack/react-virtual` 虚拟滚动。虚拟滚动通过 `position: absolute` + `translateY` 对列表项进行绝对定位，SSR 阶段输出的 HTML 中列表项的 `top` 值可能为负（本次测试场景为 −412 px），即位于视口之外。浏览器在 hydration 完成、React 重新计算布局之前，始终将最大内容命中在视口外的元素，因此推迟触发 LCP，导致 LCP 时间大幅延后。

**改动方案**

在 `components/feed/home-infinite-list.tsx` 中引入 `useVirtualLayout` 布尔开关，值等于 `isRestoring`（从 `sessionStorage` 读取是否存在历史滚动偏移）：

```tsx
const isRestoring =
  typeof sessionStorage !== "undefined" &&
  sessionStorage.getItem(SCROLL_KEY) !== null;
const useVirtualLayout = isRestoring;
```

- **常规访问**（`useVirtualLayout = false`）：改用 `items.map()` 静态渲染，列表项以正常文档流输出。SSR HTML 直接包含完整首屏内容，LCP 元素 `top` 值为视口内真实坐标，浏览器无需等待 hydration 即可正确计算最大内容区域。
- **深滚恢复**（`useVirtualLayout = true`）：保留虚拟滚动路径，恢复滚动位置后重建虚拟列表，避免大量 DOM 节点导致性能回归。
- 非恢复态下虚拟器设 `count: 0`，满足 Rules of Hooks 约束，不产生虚拟行。

**效果**：LCP 元素 `top` 从 −412 px 修正至 688 px（视口内）；Mobile Slow 4G LCP 由 3.3s 降至 **2.2s**，达到验收目标。

### 4.2 服务端渲染与数据预取

**RSC 首屏数据注入**（`app/(main)/page.tsx`）

`page.tsx` 为 Server Component，在服务端调用 `fetchHomeFeedPage` 获取首屏列表数据后，以 props 直接传递给 `HomePage`。SSR 输出的 HTML 已包含完整列表内容，客户端无需在 hydration 后再发起 API 请求，消除了数据加载的瀑布流，也避免了首屏内容空白再填入的闪烁。

**Redis 首屏缓存**（`lib/feed/cache.ts`）

首屏列表在 Redis 中缓存，热点榜 TTL 2 min，爆文榜 TTL 5 min。多数请求直接命中缓存，无需查询数据库，保证 TTFB 稳定在 50 ms 左右（两份报告实测 51–52 ms）。

**首屏条数控制**（`lib/feed/home/list.ts`）

`CHANNEL_FEED_PAGE_SIZE = 10`，限制首屏列表渲染条数。条数过多会增大 SSR HTML 体积、延长 HTML 解析与 DOM 构建时间，10 条在内容完整性与性能之间取得平衡。

### 4.3 LCP 资源优先加载（封面图场景）

本次推荐 Feed 测试中 LCP 元素为文本，但在热点榜（`?channel=hot`）、爆文榜（`?channel=viral`）等频道下，LCP 元素可能为文章封面图，需额外保障。

**封面优先加载**（`components/article/list-presets.tsx`）

热点榜排名前 3（`rank <= 3`）的文章封面设 `coverPriority` 标记，对应 Next.js `<Image priority>`，框架会在 `<head>` 自动注入 `<link rel="preload" as="image">` 预加载标签，确保封面图在 JS hydration 之前就开始下载，避免图片被默认懒加载而推迟 LCP。

**封面固定宽高比**（`components/article/cover.tsx`）

封面容器使用 `aspect-ratio` CSS 属性预留固定高度，图片加载前浏览器即可确定元素占位，防止图片加载完成后触发布局偏移（两份报告 CLS 均为 0）。

### 4.4 JS 模块边界管控

**Client/Server 模块拆分**（`lib/users/format-creator-stats.ts` 等）

Next.js 中，通过 barrel（`index.ts`）重新导出的模块若同时被服务端代码引用，在 Client Component 中 import 可能将 `server-only` 模块（如 Prisma Client）意外打包进客户端 bundle，导致 bundle 体积膨胀和 hydration 报错。通过在文件顶部添加 `import 'server-only'` 守卫，或将格式化函数迁移到独立的客户端可用文件中，使 Client Component 只打包真正需要的代码。

---

## 5. 后续可选优化

- **消除 Render-Blocking CSS**：全局样式表 `06px.lgc87.wp.css`（13 KB）阻塞渲染，Slow 4G 下估计节省约 740 ms，是当前评分最低的失败项，优先级最高。可考虑提取 Critical CSS 内联至 `<head>`，其余样式异步加载。
- **减少 Unused JavaScript**：当前约 120 KB 未使用 JS，`0c9trkqo1qr_4.js` 几乎 100% 未使用（69 KB），建议通过 Bundle Analyzer 定位来源并拆包。
- **首屏列表提升为 Server Component**：将 `HomeFeedInfiniteList` 首屏部分拆为 RSC，可跳过约 3.3s 的 JS hydration，进一步压缩 LCP 和 TTI。
- **补测封面图频道**：`?channel=hot`、`?channel=viral` 的 LCP 元素可能为封面图，需单独验证 `coverPriority` 在各节流条件下是否生效。

---

## 6. 复现步骤

```bash
npm run build && npm run start
```

Chrome DevTools → Lighthouse → Navigation → Performance，按以下配置运行，**必须使用生产构建**（开发模式指标不可作为验收依据）：

| 场景     | 设备    | 网络    | CPU         |
| -------- | ------- | ------- | ----------- |
| 基线验证 | Desktop | 无节流  | 1×          |
| 验收测试 | Mobile  | Slow 4G | 4× slowdown |

登录后采集以下页面，导出 HTML 报告（建议命名：`localhost_3000-YYYYMMDDThhmmss.html`）：

- 推荐 Feed：`http://localhost:3000/`
- 热点榜：`http://localhost:3000/?channel=hot`
- 爆文榜：`http://localhost:3000/?channel=viral`

手动回归：首屏列表渲染、点赞交互、下拉加载更多、文章详情返回后深滚恢复（`sessionStorage`）。
