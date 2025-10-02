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
  try {
    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No se pudo obtener el acces token");
    }
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
      },
    });

    return tokens;
  } catch (error) {
    console.error("Error en getTokenFromCode:", error);
    throw new Error(`Error al procesar tokens de Google: ${error.message}`);
  }
}

async function checkGoogleAuth(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { googleAccessToken: true, googleRefreshToken: true },
    });

    return !!(user?.googleAccessToken && user?.googleRefreshToken);
  } catch (error) {
    console.error("Error verificando autenticación de Google:", error);
    return false;
  }
}

async function syncPendingStudySessions(userId) {
  try {
    // Obtener sesiones sin evento de calendar
    const pendingSessions = await prisma.scheduledReview.findMany({
      where: {
        userId: Number(userId),
        googleEventId: null,
        completedReviews: { none: {} },
        dueDate: { gte: new Date() },
      },
      include: {
        card: { include: { topic: true } },
      },
      take: 20,
    });

    if (pendingSessions.length === 0) {
      return {
        success: true,
        message: "No hay sesiones pendientes para sincronizar",
      };
    }

    console.log(
      `Sincronizando ${pendingSessions.length} sesiones para usuario ${userId}`
    );

    let successCount = 0;
    const { createStudySessionEvent } = await import("./calendarController.js");

    for (const session of pendingSessions) {
      try {
        const event = await createStudySessionEvent(userId, session);
        if (event) successCount++;
      } catch (error) {
        console.log(
          `Error creando evento para sesión ${session.id}:`,
          error.message
        );
      }
    }

    return {
      success: true,
      message: `${successCount} eventos creados de ${pendingSessions.length} sesiones`,
      synced: successCount,
      total: pendingSessions.length,
    };
  } catch (error) {
    console.error("Error sincronizando sesiones:", error);
    return { success: false, message: error.message };
  }
}

export {
  generateAuthUrl,
  getTokenFromCode,
  checkGoogleAuth,
  syncPendingStudySessions,
};
