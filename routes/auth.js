import express from "express";
import { guard } from "../middleware/authMiddleware.js";
import {
  generateAuthUrl,
  getTokenFromCode,
  syncPendingStudySessions,
} from "../controllers/googleCalendarOAuth.js";

const router = express.Router();

// verify Google Calendar authentication status
router.get("/google/status", guard, async (req, res) => {
  try {
    const userId = req.apiUserId;
    const { checkGoogleAuth } = await import(
      "../controllers/googleCalendarOAuth.js"
    );
    const hasAuth = await checkGoogleAuth(userId);
    res.json({ authenticated: hasAuth });
  } catch (err) {
    res.status(500).json({ error: "Error verificando autenticación" });
  }
});

// start Google OAuth
router.get("/google/connect", guard, (req, res) => {
  try {
    const userId = req.apiUserId; // Del JWT token
    const url = generateAuthUrl() + `&state=${userId}`;
    res.redirect(url);
  } catch (error) {
    res.status(500).json({
      error: "Error iniciando autorización con Google",
    });
  }
});

// Callback Google
router.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";
    return res.redirect(`${frontendUrl}/dashboard?google_auth=error`);
  }

  try {
    await getTokenFromCode(code, userId);

    const syncResult = await syncPendingStudySessions(userId);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";
    const params = new URLSearchParams({
      google_auth: "success",
      synced: String(syncResult.synced || 0),
      total: String(syncResult.total || 0),
      message: encodeURIComponent(syncResult.message || ""),
    });

    res.redirect(`${frontendUrl}/dashboard?${params.toString()}`);
  } catch (err) {
    console.error("Error en /google/callback:", err);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";
    res.redirect(`${frontendUrl}/dashboard?google_auth=error`);
  }
});

export default router;
