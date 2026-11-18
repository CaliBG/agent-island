# AISLAND local API v1

## Connect

Read the current user's `.agent-island/connection.json` before each request. It contains `endpoint`, `token`, `pid` and `protocol: 1`.

```http
POST {endpoint}/v1/events
Authorization: Bearer {token}
Content-Type: application/json
```

Ordinary events return HTTP 202 with `{"ok":true}`. Approval, question and plan requests keep the connection open until the user responds, then return HTTP 200 with a decision.

| Status | Meaning |
| --- | --- |
| 400 | Invalid event |
| 401 | Invalid access token |
| 403 | Browser origin rejected |
| 408 | Request timed out |
| 409 | The same request is already pending |
| 503 | Application is shutting down |

The payload limit is 256 KiB. Main text is limited to 40,000 characters. Each session retains up to 120 history entries of up to 4,000 characters each. Up to 100 sessions are kept. When capacity is reached, the oldest inactive session is removed first. If all sessions are active or waiting, creation fails. Commands are displayed for review. Execution remains the caller's responsibility.

## Common fields

| Field | Description |
| --- | --- |
| sessionId | Required stable identifier, up to 200 characters |
| event | Required event name |
| eventId | Optional deduplication identifier, up to 200 characters. The bridge remembers the latest 2,000 IDs. UUIDs are recommended. |
| agent, title | Agent and conversation display names |
| cwd, terminal | Absolute project directory and terminal display name |
| content | Status text or Markdown |
| target | Optional destination for opening the original work |

## Events

| Name | Fields and behavior |
| --- | --- |
| session.start | Session ready |
| task.start | Task started, with optional content |
| tool.start, tool.end | Tool name and description |
| message | Updated status or reply in content |
| approval.request | requestId, requestTitle, command, diff and content |
| question.request | requestId, requestTitle and questions |
| plan.request | requestId, requestTitle and Markdown plan in content |
| task.complete, task.error | End the turn and cancel unhandled requests |
| session.end | End the session and cancel pending requests |
| usage | Report measured usage with used, limit, label and resetAt. used must be nonnegative and limit positive. |

Each request event needs a unique requestId. Optional timeoutMs is between 100 and 600000 milliseconds. Cancellation, disconnection and timeout do not grant permission.

## Decisions

Approvals return `{"decision":"allow"}`, deny or cancel. A plan review can also carry feedback.

```json
{"sessionId":"work-123","event":"question.request","requestId":"question-uuid","requestTitle":"Select an environment","questions":[{"id":"env","prompt":"Where should this run?","options":["Local","Staging"],"multiple":false}]}
```

Send 1–10 questions with unique IDs of up to 100 characters each. Set multiple to true for multi-select. Freeform answers are supported. Example response:

```json
{"decision":"answer","answers":{"env":["Staging"]}}
```

## Open a destination

Use a folder or URL target with a value, such as `{"type":"folder","value":"/absolute/path/to/project"}`. For an iTerm2 session, pass `{"type":"terminal","value":"iTerm2","sessionId":"session-id"}`. For Terminal, pass a tty such as /dev/ttys012. Supported Mac apps include iTerm2, Terminal, Ghostty, Warp, WezTerm, VS Code and Cursor. Without a session identifier, AISLAND activates the app.

For Windows Terminal, supply the PID of the terminal host with a main window, for example `{"type":"terminal","value":"Windows Terminal","pid":12345}`. With no destination, AISLAND tries the working directory.

## SDK examples

```js
import { AgentIsland } from './agent-island.mjs';
const island = new AgentIsland({agent:'My Agent', title:'Build project'});
await island.start('Checking source');
const result = await island.approve({title:'Run tests?', command:'npm test'});
if (result.decision === 'allow') {
  // Perform the approved operation in your own integration.
  await island.complete('Finished');
} else {
  await island.complete('Skipped');
}
```

```python
from agent_island import AgentIsland
island = AgentIsland(agent="My Python Agent", title="Process data")
island.start("Preparing data")
decision = island.approve("python process_data.py")
if decision["decision"] == "allow":
    # Run the approved operation here.
    island.complete("Finished")
else:
    island.complete("Skipped")
```

For isolated testing, set AGENT_ISLAND_HOME to the same test directory for the app and the SDK.

## Verify first-time setup

Copy the setup instructions from Integrations and paste them into an agent with local file and command access. They contain the SDK and protocol locations, connection file path and one-time verification code. The access token is read locally.

POST /v1/connect uses the same authorization and browser-origin restrictions as the events endpoint. Send `{"code":"current-code","agent":"Your Agent"}`. Use client.connect(code) in either SDK and await the call in Node.js. Repeated receipts are idempotent. Restarting AISLAND or beginning a new setup invalidates the old code.

The receipt verifies local communication only. Report lifecycle events through /v1/events from actual task callbacks. Approval, questions and background dispatch depend on the integration.
