# Agent Island 本地接口 v1

## 连接

读取用户目录下 `.agent-island/connection.json`。包含 `endpoint`、`token`、`pid` 与 `protocol: 1`。

```
POST {endpoint}/v1/events
Authorization: Bearer {token}
Content-Type: application/json
```

- 非阻塞事件返回 `202 {"ok":true}`。
- 审批/问答/计划事件保持当前 HTTP 请求，用户处理后返回 `200` 和决定。
- 401：令牌错误；403：拒绝浏览器来源；400：无效事件；409：相同请求仍在等待；408：请求超时；503：应用退出。
- 负载最多 256 KiB。单条主要文本最多显示 40,000 字符，历史记录每条最多 4,000 字符、每个会话最多 120 条。
- 最多 100 个会话；达到上限时优先清除最早的非工作/非等待会话。没有可清理会话时返回错误。
- 页面和本地服务都不会执行 `command` 字段；它仅作为操作预览。

## 通用字段

| 字段 | 必须 | 含义 |
| --- | --- | --- |
| sessionId | 是 | 稳定会话 ID，最长 200 字符 |
| event | 是 | 下表中的事件名称 |
| eventId | 否 | 最近 2000 个事件范围内的去重 ID，最长 200 字符，建议 UUID |
| agent | 否 | 工具名称，如 My Agent |
| title | 否 | 会话标题 |
| cwd | 否 | 绝对工作目录 |
| terminal | 否 | 终端名称，仅用于展示 |
| content | 否 | 状态说明或 Markdown 内容 |
| target | 否 | 用户点击跳转的目标，见下文 |

## 事件

| event | 额外字段 | 用途 |
| --- | --- | --- |
| session.start | — | 会话就绪 |
| task.start | content | 工作开始 |
| tool.start | tool, content | 当前工具或操作 |
| tool.end | content | 当前工具结束 |
| message | content | 更新状态说明 |
| approval.request | requestId, requestTitle, command, diff, content | 审批，可同时发多条 |
| question.request | requestId, requestTitle, questions | 等待回答 |
| plan.request | requestId, requestTitle, content | Markdown 计划审阅 |
| task.complete | content | 本轮完成，取消未处理请求 |
| task.error | content | 任务失败，取消未处理请求 |
| session.end | content | 会话结束，取消未处理请求 |
| usage | used, limit, label, resetAt | 真实上报用量；used 非负、limit 为正 |

所有 `.request` 必须给出 requestId，建议每次生成 UUID。可选 timeoutMs，100–600000 毫秒。网络异常或取消不能解释为允许。

## 审批响应

```json
{"decision":"allow"}
```

或者 `deny` / `cancel`。计划请求可带 `feedback` 文本。

## 问答

```json
{
  "sessionId":"work-123",
  "event":"question.request",
  "requestId":"question-uuid",
  "requestTitle":"选择目标环境",
  "questions":[
    {"id":"env","prompt":"发布到哪里？","options":["本地","测试环境"],"multiple":false}
  ]
}
```

每个请求含 1–10 个问题。id 必须唯一，最长 100 字符；multiple 为 true 时允许多选。所有问题都支持自定义回答。

```json
{"decision":"answer","answers":{"env":["测试环境"]}}
```

## 跳转目标

```json
{"type":"folder","value":"/absolute/path/to/project"}
```

```json
{"type":"url","value":"https://example.com/task/123"}
```

macOS 的 iTerm2：

```json
{"type":"terminal","value":"iTerm2","sessionId":"iTerm-session-unique-ID"}
```

macOS 的 Terminal：

```json
{"type":"terminal","value":"Terminal","tty":"/dev/ttys012"}
```

macOS App 激活支持：iTerm2、Terminal、Ghostty、Warp、WezTerm、VS Code、Cursor。未传 sessionId/tty 时只激活应用，不承诺定位到 tab。

Windows：

```json
{"type":"terminal","value":"Windows Terminal","pid":12345}
```

PID 应为有主窗口的终端宿主进程，而非通常没有窗口的 Agent 子进程。没有目标时尝试打开 cwd。

## Node.js 示例

```js
import { AgentIsland } from './agent-island.mjs';
const island = new AgentIsland({agent:'My Agent', title:'构建项目'});
await island.start('正在检查代码');
const result = await island.approve({title:'执行测试', command:'npm test'});
if (result.decision !== 'allow') {
  await island.complete('操作未执行');
} else {
  // 接入方在这里执行获批操作；SDK 本身不执行命令。
  await island.complete('操作已完成');
}
```

## Python 示例

```python
from agent_island import AgentIsland
island = AgentIsland(agent="My Python Agent", title="处理数据")
island.start("准备开始")
decision = island.approve("python process_data.py")
if decision["decision"] == "allow":
    island.complete("已收到允许；由接入方执行实际任务")
else:
    island.complete("未执行")
```

## 调试

设置 `AGENT_ISLAND_HOME` 可将本地连接和数据放到独立测试目录。主程序和 SDK 必须使用相同的目录。不要用真实历史数据测试重启和恢复。
