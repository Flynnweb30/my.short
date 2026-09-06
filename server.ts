import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  // Support Render.com dynamic PORT environment variable or default to 3000
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API health check for Render.com and uptime monitors
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "my.short",
      domain: "my.short",
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  // Vite development middleware vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Disables WebSocket HMR to eliminate WebSocket closed rejections in sandbox
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
    console.log(`my.short server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
