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


## 下载官网模板 · 2026-11-18

页面以 MIT shadcn/UI Landing Page 的发布页结构为基础，沿用静态 HTML/CSS 与现有 React 下载按钮。样机使用 MIT Devices.css MacBook Pro；保留原始几何，整体等比缩放。截图来自 AISLAND renderer 的隔离示例数据，标明示例任务，不读取用户会话。

屏幕逻辑尺寸按 1512×945，对应 1120px 应用窗、448px 小岛、179px 刘海。软件图像不拉伸、不裁切，也不添加重复标题栏。小岛截图在 footer 实际边界截取，避免额外透明留白。图片查看器可切换原始尺寸，支持 Escape 关闭并返回原焦点。

在 sibling desktop-app 中运行 `node ../website/scripts/product-captures.mjs` 可刷新截图。`node scripts/marketing-qa.mjs` 验证下载、图库、图片查看器、移动导航和响应式布局。许可证见 THIRD_PARTY_NOTICES.md。
