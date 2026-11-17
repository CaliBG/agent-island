# Agent Island 官网

白色与亮蓝色的中文官网、安装指引与通用 SDK 文档。

- 官网：https://calibg.github.io/agent-island/
- 安装包：https://github.com/CaliBG/agent-island/releases
- 静态 HTML/CSS/JavaScript，下载按钮使用 React、Tailwind CSS 与 Lucide。
- 实际软件截图与 CSS 样机；没有虚构任务交互或追踪脚本。
- 仅包含网站和通用 SDK，不包含桌面软件完整源代码。

## 开发与发布

Node.js 22.12+。

```sh
npm ci
npm run build
npm run check
npm run dev
```

预览：http://127.0.0.1:4173/agent-island/ 。修改 public/ 或 src/ 后重新构建。产物位于 dist/；推送 main 由 GitHub Actions 发布到 GitHub Pages。

按钮源文件：src/components/ui/interactive-hover-button.tsx。支持链接/按钮、自定义 className、children 和 fullWidth；普通 HTML 链接提供无 JavaScript 回退。透视文字支持暂停及系统减少动态效果偏好。界面标签页支持键盘导航。

## 更新版本

1. 构建并测试安装包，将二进制与 SHA256SUMS.txt 上传 GitHub Release。
2. 确认服务器文件摘要，发布 Release。
3. 更新首页链接、文档版本和 public/download-checksums.txt。
4. 构建、检查并推送；确认 Pages 部署和公开下载正常。

v0.2.4 提供接入助手、Codex Hooks 信任状态检查，以及独立的登录启动和启动检查设置。Codex 首次信任由用户完成。Windows 已跨平台构建，实机待验证；安装包尚未签名。

第三方组件与字体许可见 THIRD_PARTY_NOTICES.md。


## 产品官网重塑 · 2026-11-18

新页面使用产品画册式排版：左侧下载和右侧屏幕顶部特写、Agent 接入入口、带标签切换的 MacBook 实际界面、可暂停的透视文字和系统下载列表。品牌仍为白底与亮蓝色。保留现有路由、文档、安装包及 React Hover Button。

设计参考（借鉴展示方式，没有复制品牌素材或源码）：
- [Raycast](https://www.raycast.com/)：下载优先、围绕操作展示产品。
- [Things](https://culturedcode.com/things/)：精简文案、真实产品画面。
- [Linear](https://linear.app/)：产品细节与清晰的字体层级。

设计参数：布局变化 7 / 动效 5 / 密度 3。按用户要求固定白色主题；按钮为胶囊形，产品展示区与原生设备保留各自几何。动画用于入场、截图状态转换和焦点叙事，并支持系统减少动态效果。

样机继续使用 MIT Devices.css MacBook Pro，整体等比缩放。屏幕中的应用截图保持 1120:740 比例，完整落在显示区域内。首屏为屏幕顶部放大特写，展开与收起使用真实 renderer 截图，而非模拟 Agent 任务。截图取自隔离示例数据，标明示例任务，不读取用户会话。

在 sibling desktop-app 中运行 `node ../website/scripts/product-captures.mjs` 可刷新截图并生成响应式尺寸。单独运行 `node scripts/prepare-marketing-assets.mjs` 可重新生成图标缩略图和样机 CSS 子集（需 macOS 的 sips）。`node scripts/marketing-qa.mjs` 验证下载、截图切换、图片查看器、移动导航和响应式布局。`node scripts/social-capture.mjs` 更新分享图。许可证见 THIRD_PARTY_NOTICES.md。
