# Agent Island 官网

中文产品官网、安装指引与通用 SDK 文档。

- 官网：https://calibg.github.io/agent-island/
- 下载：https://github.com/CaliBG/agent-island/releases
- 网站使用原生 HTML、CSS、JavaScript，无运行时第三方依赖和追踪脚本。
- 应用截图来自 v0.1.0 实际界面，截图含演示数据。
- 本仓库包含网站与通用 SDK；不包含桌面应用的完整源代码。

## 本地预览

需要 Node.js 22 或更高版本，无需安装 npm 依赖。

```sh
npm run dev
```

打开 http://127.0.0.1:4173/agent-island/ 。

```sh
npm run check
npm run build
```

静态产物位于 `dist/`。推送 `main` 后由 GitHub Actions 自动发布到 GitHub Pages。安装包通过 Releases 提供，不存入网站 Git 历史。

## 更新版本

1. 上传新版本的安装包至 GitHub Release。
2. 修改 `public/index.html` 的下载链接、版本号和说明。
3. 同步 `public/docs/index.html` 与 SDK、校验文件。
4. 运行检查，提交并推送。Pages 工作流完成后验证线上链接。

## 当前产品范围

v0.1.0 提供桌面小岛、会话管理、审批问答、计划审阅和本地通用接入。各 AI 工具的专用自动适配将后续扩展。安装包未签名；macOS 已完成自动化验证，Windows 实机行为仍待验证。
