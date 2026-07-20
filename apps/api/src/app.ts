import express, { type Express } from "express";

const app: Express = express();

// health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "healthy",
  });
});

export default app;
