import { google } from "googleapis";
import prisma from "../lib/prisma.js";
import { use } from "react";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

function createOAuthClient() {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

class AuthMissingError extends Error {
  constructor(message = "Usuario no autorizado con Google") {
    super(message);
    this.name = "AuthMissingError";
    this.statusCode = 401;
  }
}

async function createCalendarEvent(userId, eventObj, calendarId = "primary") {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
    },
  });
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    throw new AuthMissingError();
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });
  try {
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const res = await calendar.events.insert({
      calendarId,
      resource: eventObj,
    });

    return res.data;
  } catch (error) {
    // Si el access token expiró, intentar renovarlo
    if (error.code === 401) {
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();

        // Actualizar tokens en BD
        await prisma.user.update({
          where: { id: Number(userId) },
          data: {
            googleAccessToken: credentials.access_token,
            googleRefreshToken:
              credentials.refresh_token || user.googleRefreshToken,
          },
        });

        // Reintentar la operación
        oAuth2Client.setCredentials(credentials);
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
        const res = await calendar.events.insert({
          calendarId,
          resource: eventObj,
        });
        return res.data;
      } catch (refreshError) {
        throw new AuthMissingError("Token expirado. Re-autorización requerida");
      }
    }
    throw error;
  }
}

async function deleteCalendarEvent(userId, eventId, calendarId = "primary") {
  if (!eventId) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { googleAccessToken: true, googleRefreshToken: true },
    });

    if (!user?.googleRefreshToken) return;

    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.log("Error eliminando evento:", error.message);
  }
}

async function createStudySessionEvent(userId, scheduledReview) {
  try {
    console.log(`INICIANDO createStudySessionEvent para usuario ${userId}`);

    if (!scheduledReview.card) {
      console.log(`scheduledReview sin propiedad card`);
      return null;
    }

    if (!scheduledReview.card.topic) {
      console.error(`❌ scheduledReview.card sin propiedad 'topic'`);
      return null;
    }
    // Verificar si tiene tokens
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { googleAccessToken: true, googleRefreshToken: true, timezone },
    });

    const userTimezone = user?.timezone || "America/Bogota";

    console.log(`Usuario:`, {
      hasAccessToken: !!user?.googleAccessToken,
      hasRefreshToken: !!user?.googleRefreshToken,
    });

    if (!user?.googleRefreshToken) {
      console.log(`Usuario no tiene refreshToken - retornando null `);
      return null; // Usuario no tiene Calendar conectado
    }

    // Crear objeto del evento
    const startTime = new Date(reviewData.dueDate);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min

    const topic = reviewData.card.topic;
    const question = reviewData.card.question;
    const shortQuestion =
      question.length > 100 ? question.substring(0, 100) + "..." : question;

    const eventObj = {
      summary: `Estudio: ${topic.name}`,
      description:
        `Sesión de repaso espaciado\n\n` +
        `Tema: ${topic.name}\n` +
        `Pregunta: ${shortQuestion}\n\n` +
        `Intervalo: ${reviewData.intervalDays} días\n` +
        `Tiempo estimado: 30 minutos\n\n` +
        `Tip: Revisa la pregunta y respuesta antes de la sesión.\n\n` +
        `Creado por StudySpace`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: userTimezone,
        // timeZone: "America/Bogota", //fixed the static timezone to avoid issues
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: userTimezone,
        // timeZone: "America/Bogota", //fixed the static timezone to avoid issues
      },
      colorId: "4", // Azul
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 15 },
          { method: "popup", minutes: 5 },
        ],
      },
    };

    console.log(`Creando evento en Calendar:`, {
      summary: eventObj.summary,
      startTime: startTime.toISOString(),
      timezone: userTimezone,
    });

    // Crear evento
    const event = await createCalendarEvent(userId, eventObj);
    console.log(`Evento de estudio creado en Calendar: ${event.id}`);

    // Guardar ID del evento
    await prisma.scheduledReview.update({
      where: { id: reviewData.id },
      data: { googleEventId: event.id },
    });

    return event;
  } catch (error) {
    console.log(`ERROR en createStudySessionEvent:`, {
      message: error.message,
      stack: error.stack,
      errorName: error.name,
    });
    return null;
  }
}

export {
  createCalendarEvent,
  deleteCalendarEvent,
  createStudySessionEvent,
  AuthMissingError,
};
