// language: JavaScript, file: api/deepseek.js
// target: Vercel Serverless Function (Node.js 18+)
// purpose: Proxy to DeepSeek API — keeps the DeepSeek API key server-side.

const OWNER = "@RASHIK_69";

const DEEPSEEK_BASE = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-flash";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      owner: OWNER,
      error: "Method not allowed. Use POST with JSON body."
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      owner: OWNER,
      error: "DEEPSEEK_API_KEY not configured on server."
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({
      owner: OWNER,
      error: "Invalid JSON body."
    });
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      owner: OWNER,
      error: "Missing 'messages' array.",
      usage: "{ messages: [{ role: 'user', content: 'Hello' }] }"
    });
  }

  const model = body.model || DEFAULT_MODEL;

  const payload = {
    model: model,
    messages: messages,
    stream: false
  };

  // optional passthrough
  if (body.temperature !== undefined) payload.temperature = body.temperature;
  if (body.max_tokens !== undefined) payload.max_tokens = body.max_tokens;
  if (body.reasoning_effort) payload.reasoning_effort = body.reasoning_effort;

  try {
    const upstream = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        owner: OWNER,
        error: "DeepSeek API error.",
        status: upstream.status,
        detail: data
      });
    }

    const choice = data.choices && data.choices[0];
    return res.status(200).json({
      owner: OWNER,
      success: true,
      model: data.model || model,
      reply: choice ? choice.message.content : null,
      usage: data.usage || null,
      raw: data
    });

  } catch (err) {
    return res.status(502).json({
      owner: OWNER,
      error: "Upstream request failed.",
      reason: err.message
    });
  }
}
