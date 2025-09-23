import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    throw new AuthMissingError();
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const res = await calendar.events.insert({
    calendarId,
    resource: eventObj,
  });

  return res.data;
}

export { createCalendarEvent, AuthMissingError };
