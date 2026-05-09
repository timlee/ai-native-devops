/*
Webhook bridge for AI-Native DevOps extension.
- Receives webhook payloads from GitHub/Jira/Slack/custom systems.
- Appends normalized events to a JSONL queue file consumed by the extension.

Run:
  node scripts/webhook-bridge.js

Env:
  WEBHOOK_PORT=8787
  WEBHOOK_TOKEN=<shared-secret>
  WEBHOOK_QUEUE=<absolute-or-relative-path-to-events.jsonl>
*/

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.WEBHOOK_PORT || "8787", 10);
const TOKEN = process.env.WEBHOOK_TOKEN || "";
const QUEUE_PATH = process.env.WEBHOOK_QUEUE
  ? path.resolve(process.env.WEBHOOK_QUEUE)
  : path.resolve(process.cwd(), ".ai-native-devops", "events.jsonl");

ensureDir(path.dirname(QUEUE_PATH));

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    return respond(res, 405, { error: "Only POST supported" });
  }

  if (TOKEN) {
    const incoming = req.headers["x-ai-native-devops-token"];
    if (incoming !== TOKEN) {
      return respond(res, 401, { error: "Unauthorized" });
    }
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    try {
      const body = Buffer.concat(chunks).toString("utf8") || "{}";
      const payload = JSON.parse(body);
      const event = normalizeEvent(req.url || "/", payload);
      fs.appendFileSync(QUEUE_PATH, JSON.stringify(event) + "\n", "utf8");
      respond(res, 200, { ok: true, queued: event.id, queuePath: QUEUE_PATH });
    } catch (err) {
      respond(res, 400, { error: String(err) });
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[webhook-bridge] listening on :${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[webhook-bridge] queue: ${QUEUE_PATH}`);
});

function normalizeEvent(urlPath, payload) {
  const source = inferSource(urlPath, payload);
  const phase = payload.phase || payload.phaseKey || "plan";

  return {
    id: payload.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    source,
    phaseKey: typeof phase === "string" ? phase.toLowerCase() : "plan",
    triggerId: payload.triggerId || defaultTriggerBySource(source),
    title: payload.title || payload.summary || `${source} automation event`,
    context:
      payload.context ||
      payload.description ||
      payload.body ||
      "No context provided",
    metadata: {
      rawEventType: payload.eventType || payload.action || "unknown",
      issueNumber: payload.issueNumber || payload.issue?.number,
      prNumber: payload.prNumber || payload.pull_request?.number,
      labels: payload.labels || payload.issue?.labels,
      severity: payload.severity,
      environment: payload.environment,
      sourceUrl: payload.url || payload.html_url,
    },
  };
}

function inferSource(urlPath, payload) {
  const p = String(urlPath).toLowerCase();
  if (p.includes("github") || payload.repository || payload.issue || payload.pull_request) {
    return "github";
  }
  if (p.includes("jira") || payload.issueKey || payload.jira) {
    return "jira";
  }
  if (p.includes("slack") || payload.channel || payload.team) {
    return "slack";
  }
  return payload.source || "custom";
}

function defaultTriggerBySource(source) {
  switch (source) {
    case "github":
      return "github-issue";
    case "jira":
      return "jira-ticket";
    case "slack":
      return "slack-request";
    default:
      return "github-issue";
  }
}

function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
