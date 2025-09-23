import express from "express";
import { generateAuthUrl, getTokenFromCode } from "../controllers/googleCalendarOAuth.js";

const router = express.Router();

// Iniciar autorización Google para un usuario
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const url = generateAuthUrl() + `&state=${userId}`;
  res.redirect(url);
});

// Callback de Google
router.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) {
    return res.status(400).send("Faltan parámetros");
  }

  try {
    await getTokenFromCode(code, userId);
    res.send("Autenticado con Google ✅. Tokens guardados en la DB.");
  } catch (err) {
    res.status(500).send("Error autenticando con Google");
  }
});

export default router;
