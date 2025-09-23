import jwt from "jsonwebtoken";
import createError from "http-errors";

export function guard(req, res, next) {
  // Sacar el token de: cabecera, body o query string
  const tokenJWT = req.get("Authorization") || req.body.jwt || req.query.jwt;

  // Si no me han mandado token → error
  if (!tokenJWT) {
    next(createError(401, "Not token provided"));
    return;
  }

  jwt.verify(tokenJWT, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      next(createError(401, "Invalid toke"));
      return;
    }

    req.apiUserId = payload.user_id;
    next();
  });
}

export function generateToken(user) {
  const payload = {
    user_id: user.id,
    email: user.email,
  };

  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2d" });
  } catch (error) {
    throw error;
  }
}
