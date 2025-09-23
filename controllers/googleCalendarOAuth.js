import { google } from "googleapis";
import prisma from "../lib/prisma.js";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const oAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

function generateAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getTokenFromCode(code, userId) {
  const { tokens } = await oAuth2Client.getToken(code);

  try {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
      },
    });

    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  } catch (error) {
    console.error("Error en getTokenFromCode:", error);
    throw new Error(`Error al procesar tokens de Google: ${error.message}`);
  }
}

async function hasValidTokens(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
      },
    });

    return !!(user?.googleAccessToken && user?.googleRefreshToken);
  } catch (error) {
    console.error("Error verificando tokens:", error);
    return false;
  }
}

async function revokeTokens(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
      },
    });

    if (user?.googleRefreshToken) {
      await oAuth2Client.revokeToken(user.googleRefreshToken);
    }

    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
      },
    });

    return true;
  } catch (error) {
    console.error("Error revocando tokens:", error);
    throw new Error(`Error al desconectar Google Calendar: ${error.message}`);
  }
}

async function syncPendingStudySessions(userId) {
  try {
    const hasTokens = await hasValidTokens(userId);
    if (!hasTokens) {
      return { success: false, message: "Google Calendar no conectado" };
    }

    // Obtener sesiones sin evento de calendar
    const pendingSessions = await prisma.scheduledReview.findMany({
      where: {
        userId: Number(userId),
        googleEventId: null,
        completedReviews: { none: {} },
        dueDate: { gte: new Date() }, // Solo futuras
      },
      include: {
        card: { include: { topic: true } },
      },
      take: 10, // Limitar para no sobrecargar
    });

    console.log(
      `Sincronizando ${pendingSessions.length} sesiones para usuario ${userId}`
    );

    const results = [];
    for (const session of pendingSessions) {
      try {
        const { createStudySessionEvent } = await import(
          "./calendarController.js"
        );
        const event = await createStudySessionEvent(userId, session);
        results.push({
          sessionId: session.id,
          eventCreated: !!event,
          eventId: event?.id,
        });
      } catch (error) {
        console.log(
          `Error creando evento para sesión ${session.id}:`,
          error.message
        );
        results.push({
          sessionId: session.id,
          eventCreated: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.eventCreated).length;
    return {
      success: true,
      message: `${successCount} eventos creados de ${pendingSessions.length} sesiones`,
      results,
    };
  } catch (error) {
    console.error("Error sincronizando sesiones:", error);
    return { success: false, message: error.message };
  }
}

export {
  generateAuthUrl,
  getTokenFromCode,
  hasValidTokens,
  revokeTokens,
  syncPendingStudySessions,
};
