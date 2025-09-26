import express from "express";
import { guard } from "../middleware/authMiddleware.js";
import { generateAuthUrl, getTokenFromCode,syncPendingStudySessions } from "../controllers/googleCalendarOAuth.js";

const router = express.Router();


// start Google OAuth
router.get("/google/connect",guard,(req, res) => {
  try {
    const userId = req.apiUserId; // Del JWT token
    const url = generateAuthUrl() + `&state=${userId}`;
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ 
      error: "Error iniciando autorización con Google"
    });
  }
});


// Callback Google
router.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) {
    return res.status(400).json({ error: "Faltan parámetros obligatorios",
      details: "se requiere codigo de autorización y userId"
    });
  }

  try {
    await getTokenFromCode(code, userId);

    const syncResult = await syncPendingStudySessions(userId);

    res.json({success: true, message: "Google calendar conectado", syncResult:{
      synced: syncResult.synced || 0,
      total: syncResult.total || 0,
      message: syncResult.message
    }});
  } catch (err) {
    res.status(500).json({ error: "Error durante el proceso de autenticación con google", details: err.message });
  }
});

export default router;
