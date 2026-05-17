import path from "path";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

// 1. THE EMERGENCY MAPPING
// This maps BOTH the folder and the direct path to be 100% sure
app.use("/assets", express.static(path.resolve(__dirname, "../client/dist/assets")));

// 2. THE CEO IDENTITY (Keep this in the server too)
app.get("/api/auth/session", (req, res) => {
  res.json({
    user: { name: "Sabahat Aamir", email: "ceo@socialmind.local" },
    expires: "2030-01-01T00:00:00.000Z",
    status: "authenticated"
  });
});

// 3. SERVE THE BASE FOLDER
app.use(express.static(path.resolve(__dirname, "../client/dist")));

// 4. THE CATCH-ALL
 app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log("\n------------------------------------");
    console.log("🚀 CORE PIPELINE ACTIVE");
    console.log(`🔗 RUNNING ON PORT: ${port}`);
    console.log("------------------------------------\n");
});