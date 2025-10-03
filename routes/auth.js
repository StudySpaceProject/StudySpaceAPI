import express from "express";
import jwt from "jsonwebtoken";
import {
  generateAuthUrl,
  getTokenFromCode,
  syncPendingStudySessions,
  checkGoogleAuth,
} from "../controllers/googleCalendarOAuth.js";

const router = express.Router();

// verify Google Calendar authentication status
router.get("/google/status", async (req, res) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization) {
      token = req.headers.authorization.split;
    }
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    const hasAuth = await checkGoogleAuth(userId);
    res.json({ authenticated: hasAuth });
  } catch (err) {
    res.status(500).json({ error: "Error verificando autenticación" });
  }
});

// start Google OAuth
router.get("/google/connect", (req, res) => {
  console.log("=== DEBUG /google/connect ===");
  console.log("Query completo:", req.query);
  console.log("Token recibido:", req.query.token ? "SÍ" : "NO");
  console.log("Longitud del token:", req.query.token?.length);
  try {
    const token = req.query.token;
    if (!token) {
      console.log("ERROR: Token no proporcionado");
      return res.status(400).json({ error: "Token not provided", status: 401 });
    }
    console.log("Intentando verificar JWT...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT válido. User ID:", decoded.user_id);
    const userId = decoded.user_id;

    const url = generateAuthUrl() + `&state=${userId}`;
    console.log("Redirigiendo a URL de Google OAuth:", url);
    res.redirect(url);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:1234";
    res.redirect(`${frontendUrl}/topics?google_auth=error`);
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
