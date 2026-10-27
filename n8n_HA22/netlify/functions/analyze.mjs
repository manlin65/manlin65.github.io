const webhookUrl = "https://sonja1.app.n8n.cloud/webhook/workflowpilot/analyze";

function response(status, body, origin = "") {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigins() {
  const values = [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(",")
  ].filter(Boolean);
  return new Set(values.map(value => {
    try { return new URL(value.trim()).origin; } catch { return value.trim(); }
  }));
}

export default async function handler(request) {
  const origin = request.headers.get("origin") || "";
  if (!origin || !allowedOrigins().has(origin)) {
    return response(403, { success: false, message: "Origin nicht erlaubt." });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin"
      }
    });
  }

  if (request.method !== "POST") {
    return response(405, { success: false, message: "Nur POST ist erlaubt." }, origin);
  }

  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (!token) {
    return response(500, { success: false, message: "Netlify Secret N8N_WEBHOOK_TOKEN fehlt." }, origin);
  }

  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 40000) {
    return response(413, { success: false, message: "Anfrage ist zu groß." }, origin);
  }

  let payload;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 40000) {
      return response(413, { success: false, message: "Anfrage ist zu groß." }, origin);
    }
    payload = JSON.parse(raw);
  } catch {
    return response(400, { success: false, message: "Ungültiges JSON." }, origin);
  }

  if (typeof payload.jobText !== "string" || typeof payload.profile !== "string" ||
      !payload.jobText.trim() || !payload.profile.trim() ||
      payload.jobText.length > 15000 || payload.profile.length > 15000) {
    return response(400, { success: false, message: "Bitte Stellenanzeige und Kurzprofil eingeben (je maximal 15.000 Zeichen)." }, origin);
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WorkflowPilot-Token": token
      },
      body: JSON.stringify({ jobText: payload.jobText, profile: payload.profile }),
      signal: AbortSignal.timeout(55000)
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin"
      }
    });
  } catch {
    return response(504, { success: false, message: "n8n hat nicht rechtzeitig geantwortet. Bitte erneut versuchen." }, origin);
  }
}
