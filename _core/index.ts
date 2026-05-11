import path from "path";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

// 1. THE EMERGENCY MAPPING
// This maps BOTH the folder and the direct path to be 100% sure
app.use("/assets", express.static("E:/dist/assets"));
app.use("/assets", express.static(path.resolve("E:/dist/assets")));

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

app.listen(https://idyllic-melomakarona-96282b.netlify.app, '0.0.0.0', () => {
  console.log("\n----------------------------");
  console.log("🚀 PIPELINE OVERRIDE ACTIVE");
  console.log("🔗 URL: http://localhost:https://idyllic-melomakarona-96282b.netlify.app/dashboard");
  console.log("----------------------------\n");
});