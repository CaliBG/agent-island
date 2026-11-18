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

按钮源文件：src/components/ui/interactive-hover-button.tsx。支持链接/按钮、自定义 className、children 和 fullWidth；普通 HTML 链接提供无 JavaScript 回退。样机响应鼠标轻微移动。动态体验随自然滚动正反展开，并支持手动开合及系统减少动态效果偏好。界面标签页支持键盘导航。

## 更新版本

1. 构建并测试安装包，将二进制与 SHA256SUMS.txt 上传 GitHub Release。
2. 确认服务器文件摘要，发布 Release。
3. 更新首页链接、文档版本和 public/download-checksums.txt。
4. 构建、检查并推送；确认 Pages 部署和公开下载正常。

v0.2.4 提供接入助手、Codex Hooks 信任状态检查，以及独立的登录启动和启动检查设置。Codex 首次信任由用户完成。Windows 已跨平台构建，实机待验证；安装包尚未签名。

第三方组件与字体许可见 THIRD_PARTY_NOTICES.md。


## 同框官网方向 · 2026-11-18

结合 10 月 20 日使用的 Jack / 3D Creator 提示词和[同框动态体验](https://tongkuang.netlify.app/#experience)的滚动方式，首屏用 AISLAND 全宽字标、真实设备合成与两侧的标题和下载。

动态体验通过自然页面滚动揭示两张真实界面截图，上滑倒回，停止滚动时画面保持。展开与收起也可用按钮操作。减少动态效果时使用静态展开画面，去掉固定滚动区。网页展示使用隔离示例任务。

## 历史版式：Rescale

按用户选定的 [Rescale](https://rescale.framer.ai/) / [Framer 模板](https://www.framer.com/marketplace/templates/rescale/) 视觉方向实现静态版本，继续部署在 GitHub Pages。并非 Framer 项目导出或源模板安装；未复制模板源码、图片、视频或虚构营销数据。

悬浮胶囊导航、居中大标题及描边词组、白蓝流动背景、电脑和手机组合样机、双色块功能展示、截图标签页与下载区。保留原有文档、手机网页和 Release 下载地址。背景可暂停，遵循减少动态效果设置。

桌面图取自真实 renderer 的隔离示例数据。MacBook 使用 MIT Devices.css 原始几何整体等比缩放，应用窗口完整保留 1120:740 比例。手机图来自已运行的 iOS 原生 SwiftUI 模拟器界面（DEBUG 隔离 fixture），1206×2622，完整嵌入等比例 CSS 手机框，截图自带状态栏及灵动岛；没有重新绘制或叠加假系统 UI。手机框为本项目 CSS 绘制。不会把模拟器截图描述成真机验收结果。

截图来源：`public/assets/ios-native.png`，派生 603px 宽版本 `ios-native-603.png`。捕获使用 `xcrun simctl io <booted-device> screenshot`，不发送任务、不读取私人会话。iOS 下载仍如实标注原生版尚未公开发布。

在 sibling desktop-app 中运行 `node ../website/scripts/product-captures.mjs` 可刷新桌面截图。`node scripts/prepare-marketing-assets.mjs` 生成图标缩略图和设备 CSS 子集。`node scripts/marketing-qa.mjs` 检查五种屏宽、真实截图贴合、下载、标签页及键盘操作、查看器焦点、导航与减少动态效果。`node scripts/social-capture.mjs` 更新分享图。许可证见 THIRD_PARTY_NOTICES.md。
