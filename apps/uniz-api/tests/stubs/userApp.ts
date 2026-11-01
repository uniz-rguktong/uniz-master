import express from "express";

export function createApp() {
  const app = express();
  app.use((req, res) => {
    res.status(200).json({ module: "user", url: req.url, method: req.method });
  });
  return app;
}

export default createApp;
