# Feed 榜单页 Lighthouse 验收

## 环境要求

- 使用**生产构建**：`npm run build && npm run start`（开发模式指标不可作为验收依据）
- Chrome Lighthouse（桌面或移动，需在报告中注明）
- 网络：Fast 3G 或 Slow 4G（记录所用预设）
- 测试 URL：
  - 热点榜：`http://localhost:3000/?channel=hot`
  - 爆文榜：`http://localhost:3000/?channel=viral`

## 目标指标

| 指标 | 目标 |
|------|------|
| LCP | ≤ 2.5s |
| CLS | ≤ 0.1 |

## 优化项核对

- [ ] 首屏 10 条数据由 RSC 注入（`channel=hot|viral` 时 `CHANNEL_FEED_PAGE_SIZE=10`）
- [ ] 榜单卡片封面固定 `aspect-ratio`，前三张 `priority` 加载
- [ ] 热点/爆文首屏 API 响应可走 Redis 缓存（热点 2min / 爆文 5min）

## 记录模板

```
日期：
分支：
构建：next build && next start
页面：/?channel=hot
设备：Desktop / Mobile
LCP：
CLS：
FID/INP：
截图路径：docs/screenshots/feed-lighthouse-YYYYMMDD.png
备注：
```

将 Lighthouse 报告截图保存至 `docs/screenshots/`（需自行创建目录）并在此文件补充实测数值。
