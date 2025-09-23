import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

function generateAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getTokenFromCode(code, userId) {
  const { tokens } = await oAuth2Client.getToken(code);

  await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
    },
  });

  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

export { generateAuthUrl, getTokenFromCode };
