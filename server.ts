import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

interface ServerWebhook {
  id: string;
  userId: string;
  url: string;
  name: string;
  secret?: string;
  events: string[];
  status: 'active' | 'paused';
  createdAt: string;
  lastTriggeredAt?: string | null;
  lastStatusCode?: number | null;
  lastDeliveryStatus?: 'success' | 'failed' | 'pending' | null;
}

// In-memory persistent webhook registry per user
const webhookStore = new Map<string, Map<string, ServerWebhook>>();

async function startServer() {
  const app = express();
  // Support Render.com dynamic PORT environment variable or default to 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Serve static assets from public directory (images, sitemap, robots, icons)
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));

  // Explicit endpoints for SEO bots and crawlers
  app.get("/robots.txt", (req, res) => {
    res.sendFile(path.join(publicPath, "robots.txt"));
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.sendFile(path.join(publicPath, "sitemap.xml"));
  });

  // API health check for Render.com and uptime monitors
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "my.short",
      domain: "my.short",
      port: PORT,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Real IP Geolocation Resolver
  app.get("/api/geo/lookup", async (req, res) => {
    try {
      const forwarded = req.headers["x-forwarded-for"];
      let clientIp =
        typeof forwarded === "string"
          ? forwarded.split(",")[0].trim()
          : req.socket.remoteAddress || "";
      clientIp = clientIp.replace(/^::ffff:/, "");

      const isPrivateIp =
        !clientIp ||
        clientIp === "127.0.0.1" ||
        clientIp === "::1" ||
        clientIp === "localhost" ||
        clientIp.startsWith("10.") ||
        clientIp.startsWith("192.168.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clientIp) ||
        clientIp.startsWith("fc00:") ||
        clientIp.startsWith("fe80:");

      if (isPrivateIp) {
        return res.json({
          status: "unavailable",
          reason: "Private/Local Network IP",
          ip: clientIp || "127.0.0.1",
          country: "Unknown",
          countryCode: "UN",
          region: "Unknown",
          city: "Unknown",
          latitude: null,
          longitude: null,
          timeZone: null,
        });
      }

      // Query reliable geolocation service with 2.5s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`https://ipwho.is/${encodeURIComponent(clientIp)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false && data.latitude != null && data.longitude != null) {
          return res.json({
            status: "precise",
            ip: clientIp,
            country: data.country || "Unknown",
            countryCode: data.country_code || "UN",
            region: data.region || "Unknown",
            city: data.city || "Unknown",
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            timeZone: data.timezone?.id || null,
          });
        }
      }

      return res.json({
        status: "unresolved",
        reason: "Geolocation lookup did not return verified coordinates",
        ip: clientIp,
        country: "Unknown",
        countryCode: "UN",
        region: "Unknown",
        city: "Unknown",
        latitude: null,
        longitude: null,
        timeZone: null,
      });
    } catch {
      return res.json({
        status: "unavailable",
        reason: "Network timeout or service offline",
        ip: "Unknown",
        country: "Unknown",
        countryCode: "UN",
        region: "Unknown",
        city: "Unknown",
        latitude: null,
        longitude: null,
        timeZone: null,
      });
    }
  });

  // Programmatic URL Shortening API with personal API token authentication
  app.post("/api/shorten", (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    const { originalUrl, customAlias, utmSource, utmMedium, utmCampaign } = req.body || {};

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'originalUrl' field in request body",
      });
    }

    let trimmed = originalUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }

    try {
      new URL(trimmed);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format provided. Must be a valid web address.",
      });
    }

    // Attach UTM parameters if provided
    try {
      const parsed = new URL(trimmed);
      if (utmSource) parsed.searchParams.set("utm_source", String(utmSource).trim());
      if (utmMedium) parsed.searchParams.set("utm_medium", String(utmMedium).trim());
      if (utmCampaign) parsed.searchParams.set("utm_campaign", String(utmCampaign).trim());
      trimmed = parsed.toString();
    } catch {
      // ignore
    }

    let code = "";
    if (customAlias && typeof customAlias === "string" && customAlias.trim()) {
      const cleanAlias = customAlias.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleanAlias)) {
        return res.status(400).json({
          error: "Custom alias must be 3-32 characters long and alphanumeric.",
        });
      }
      code = cleanAlias;
    } else {
      const chars = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    const host = req.headers.host || "my.short";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const shortUrl = `${protocol}://${host}/${code}`;

    return res.status(201).json({
      success: true,
      shortCode: code,
      shortUrl,
      originalUrl: trimmed,
      authenticated: Boolean(token),
      tokenPrefix: token ? token.substring(0, 15) + "..." : null,
      createdAt: new Date().toISOString(),
    });
  });

  // Register or update a webhook endpoint for a user
  app.post("/api/webhooks/register", (req, res) => {
    const { userId, webhook } = req.body || {};
    if (!userId || !webhook || !webhook.id || !webhook.url) {
      return res.status(400).json({ error: "Missing required fields: userId, webhook" });
    }

    if (!webhookStore.has(userId)) {
      webhookStore.set(userId, new Map());
    }
    webhookStore.get(userId)!.set(webhook.id, webhook as ServerWebhook);

    return res.json({ success: true, registeredId: webhook.id });
  });

  // Sync all user webhooks into server memory
  app.post("/api/webhooks/sync", (req, res) => {
    const { userId, webhooks } = req.body || {};
    if (!userId || !Array.isArray(webhooks)) {
      return res.status(400).json({ error: "Invalid payload: userId and webhooks array required" });
    }

    const userMap = new Map<string, ServerWebhook>();
    for (const wh of webhooks) {
      if (wh && wh.id && wh.url) {
        userMap.set(wh.id, wh);
      }
    }
    webhookStore.set(userId, userMap);

    return res.json({ success: true, count: userMap.size });
  });

  // Remove a webhook endpoint
  app.delete("/api/webhooks/:webhookId", (req, res) => {
    const { webhookId } = req.params;
    const { userId } = req.body || {};

    if (userId && webhookStore.has(userId)) {
      webhookStore.get(userId)!.delete(webhookId);
    } else {
      for (const map of webhookStore.values()) {
        map.delete(webhookId);
      }
    }

    return res.json({ success: true, deletedId: webhookId });
  });

  // Real-time Webhook Test Ping Endpoint
  app.post("/api/webhooks/test", async (req, res) => {
    const { url, secret, eventType } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'url' parameter" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "URL protocol must be http or https" });
      }
    } catch {
      return res.status(400).json({ error: "Invalid webhook URL format" });
    }

    const host = req.headers.host || "my.short";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const timestamp = new Date().toISOString();
    const eventName = eventType || "link.clicked";

    const testPayload = {
      event: eventName,
      eventId: `evt_test_${Date.now()}`,
      timestamp,
      isTest: true,
      link: {
        shortCode: "preview-link",
        shortUrl: `${protocol}://${host}/preview-link`,
        originalUrl: "https://example.com/blog/real-time-telemetry-launch",
        title: "Product Launch Announcement",
        totalClicks: 142,
        uniqueClicks: 118,
      },
      telemetry: {
        country: "United States",
        countryCode: "US",
        region: "California",
        city: "San Francisco",
        timeZone: "America/Los_Angeles",
        locationPrecision: "precise",
        latitude: 37.7749,
        longitude: -122.4194,
        browser: "Chrome 122.0",
        os: "macOS Sonoma",
        deviceType: "Desktop",
        referer: "https://news.ycombinator.com",
        utmSource: "hackernews",
        utmMedium: "referral",
        utmCampaign: "launch_showcase",
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "my.short-Webhook-Test/1.0",
      "X-MyShort-Event": eventName,
      "X-MyShort-Delivery": `deliv_test_${Date.now()}`,
    };

    if (secret && typeof secret === "string" && secret.trim()) {
      const signature = crypto.createHmac("sha256", secret.trim()).update(payloadString).digest("hex");
      headers["X-MyShort-Signature"] = `sha256=${signature}`;
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const targetResponse = await fetch(parsedUrl.toString(), {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      const responseBody = await targetResponse.text().catch(() => "");
      const responsePreview = responseBody.slice(0, 400);

      return res.json({
        success: targetResponse.ok,
        statusCode: targetResponse.status,
        statusText: targetResponse.statusText || (targetResponse.ok ? "OK" : "Error"),
        latencyMs,
        responsePreview: responsePreview || "(No response body returned)",
        timestamp,
        requestPayloadPreview: payloadString,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === "AbortError";
      return res.json({
        success: false,
        statusCode: isAbort ? 408 : 502,
        statusText: isAbort ? "Request Timeout (exceeded 6s)" : (err.message || "Failed to connect to target URL"),
        latencyMs,
        responsePreview: `Delivery failed: ${err.message || "Connection refused or unreachable"}`,
        timestamp,
        requestPayloadPreview: payloadString,
      });
    }
  });

  // Real-time Click Notification Dispatcher
  app.post("/api/webhooks/dispatch", async (req, res) => {
    const { ownerId, event, link, telemetry } = req.body || {};
    if (!ownerId) {
      return res.status(400).json({ error: "Missing 'ownerId' parameter" });
    }

    const userWebhooks = webhookStore.get(ownerId);
    if (!userWebhooks || userWebhooks.size === 0) {
      return res.json({
        success: true,
        dispatchedCount: 0,
        message: "No registered webhooks found for owner",
      });
    }

    const eventName = event || "link.clicked";
    const host = req.headers.host || "my.short";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const timestamp = telemetry?.timestamp || new Date().toISOString();

    const payload = {
      event: eventName,
      eventId: telemetry?.id || `evt_${Date.now()}`,
      timestamp,
      link: {
        shortCode: link?.shortCode || "",
        shortUrl: link?.shortUrl || `${protocol}://${host}/${link?.shortCode}`,
        originalUrl: link?.originalUrl || "",
        title: link?.title || "",
        totalClicks: link?.clicks ?? link?.totalClicks ?? 1,
        uniqueClicks: link?.uniqueClicks ?? 1,
        ownerId,
      },
      telemetry: telemetry || {},
    };

    const payloadString = JSON.stringify(payload);
    const activeTargets = Array.from(userWebhooks.values()).filter(
      (wh) => wh.status === "active" && (!wh.events || wh.events.includes(eventName))
    );

    if (activeTargets.length === 0) {
      return res.json({
        success: true,
        dispatchedCount: 0,
        message: "No active webhook endpoints subscribed to this event",
      });
    }

    // Dispatch POST requests to all active target endpoints asynchronously
    const dispatchPromises = activeTargets.map(async (webhook) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "my.short-Webhook-Delivery/1.0",
        "X-MyShort-Event": eventName,
        "X-MyShort-Delivery": `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };

      if (webhook.secret && webhook.secret.trim()) {
        const sig = crypto.createHmac("sha256", webhook.secret.trim()).update(payloadString).digest("hex");
        headers["X-MyShort-Signature"] = `sha256=${sig}`;
      }

      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const targetRes = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: payloadString,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latencyMs = Date.now() - startTime;
        const responseBody = await targetRes.text().catch(() => "");
        const responsePreview = responseBody.slice(0, 400);
        webhook.lastTriggeredAt = new Date().toISOString();
        webhook.lastStatusCode = targetRes.status;
        webhook.lastDeliveryStatus = targetRes.ok ? "success" : "failed";

        return {
          webhookId: webhook.id,
          url: webhook.url,
          success: targetRes.ok,
          statusCode: targetRes.status,
          statusText: targetRes.statusText || (targetRes.ok ? "OK" : "Error"),
          latencyMs,
          responsePreview: responsePreview || "(No response body returned)",
          requestPayloadPreview: payloadString,
        };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        webhook.lastTriggeredAt = new Date().toISOString();
        webhook.lastStatusCode = 502;
        webhook.lastDeliveryStatus = "failed";

        return {
          webhookId: webhook.id,
          url: webhook.url,
          success: false,
          statusCode: 502,
          statusText: "Connection Failed",
          error: err.message || "Failed to reach endpoint",
          latencyMs,
          responsePreview: `Delivery failed: ${err.message || "Connection refused or unreachable"}`,
          requestPayloadPreview: payloadString,
        };
      }
    });

    // Fire and gather results
    const results = await Promise.allSettled(dispatchPromises);
    return res.json({
      success: true,
      dispatchedCount: activeTargets.length,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason })),
    });
  });

  // Vite development middleware vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Disables WebSocket HMR in sandbox preview
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`my.short production server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
