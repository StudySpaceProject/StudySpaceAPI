import express from "express";
import { createCalendarEvent, AuthMissingError } from "../controllers/calendarController.js";

const router = express.Router();

// Crear evento en Calendar
router.post("/create-event", async (req, res) => {
  const { userId, title, description, startDate, endDate } = req.body;

  if (!userId || !title || !startDate || !endDate) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const eventObj = {
    summary: title,
    description: description || "Sesión de estudio StudySpace",
    start: { dateTime: new Date(startDate).toISOString() },
    end: { dateTime: new Date(endDate).toISOString() },
  };

  try {
    const event = await createCalendarEvent(userId, eventObj);
    res.json({ success: true, event });
  } catch (err) {
    if (err instanceof AuthMissingError) return res.status(401).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
