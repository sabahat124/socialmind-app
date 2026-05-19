import path from "path";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

// 1. THE EMERGENCY MAPPING
// This maps to our production client builds dynamically on Linux/Railway
const distPath = path.resolve(process.cwd(), "./dist/public");
app.use(express.static(distPath));
app.use("/assets", express.static(path.resolve(distPath, "assets")));
// Fallback catch-all to serve index.html for frontend routing
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/trpc")) {
    res.sendFile(path.resolve(process.cwd(), "./dist/public/index.html"));
  }
});
// 2. THE CEO IDENTITY (Keep this in the server too)
app.get("/api/auth/session", (req, res) => {
  res.json({
    user: { name: "Sabahat Aamir", email: "ceo@socialmind.local" },
    expires: "2030-01-01T00:00:00.000Z",
    status: "authenticated"
  });
});

// 3. SERVE THE BASE FOLDER
app.use(express.static("E:/dist"));

// 4. THE CATCH-ALL
app.get("*", (req, res) => {
  res.sendFile(path.resolve("E:/dist/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log("\n------------------------------------");
    console.log("🚀 SERVER PIPELINE ACTIVE");
    console.log(`🔗 RUNNING ON PORT: ${port}`);
    console.log("------------------------------------\n");
});
