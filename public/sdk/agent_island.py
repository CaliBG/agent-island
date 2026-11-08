"""Agent Island local bridge client. Python 3.9+, standard library only."""
import json
import os
import uuid
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

class AgentIsland:
    def __init__(self, agent="Custom Agent", title="New task", session_id=None, cwd=None, home=None):
        self.base = dict(agent=agent, title=title, sessionId=session_id or str(uuid.uuid4()), cwd=cwd or os.getcwd())
        self.home = Path(home or os.environ.get("AGENT_ISLAND_HOME", Path.home() / ".agent-island"))

    def send(self, event, **detail):
        connection = json.loads((self.home / "connection.json").read_text())
        url = urlparse(connection["endpoint"])
        if url.scheme != "http" or url.hostname != "127.0.0.1":
            raise ValueError("Bridge endpoint must be local")
        payload = dict(self.base, eventId=str(uuid.uuid4()), **detail)
        payload["event"] = event
        request = urllib.request.Request(connection["endpoint"] + "/v1/events", json.dumps(payload).encode(), {
            "Content-Type": "application/json", "Authorization": "Bearer " + connection["token"]
        }, method="POST")
        with urllib.request.urlopen(request, timeout=615 if event.endswith(".request") else 5) as response:
            return json.load(response)

    def start(self, content="Working"):
        return self.send("task.start", content=content)

    def approve(self, command, title="Approval required", **detail):
        return self.send("approval.request", requestId=str(uuid.uuid4()), requestTitle=title, command=command, **detail)

    def ask(self, questions, title="Your input is needed"):
        return self.send("question.request", requestId=str(uuid.uuid4()), requestTitle=title, questions=questions)

    def complete(self, content="Done"):
        return self.send("task.complete", content=content)
