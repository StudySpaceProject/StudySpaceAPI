import jwt from "jsonwebtoken";
import createError from "http-errors";

export function guard(req, res, next) {
  console.log("INICIANDO guard middleware");
  console.log("URL completa:", req.url);

  try {
    // extract token from various possible locations
    let tokenJWT = null;

    //check cookies

    console.log("Intentando req.cookies.token...");
    if (req.cookies && req.cookies.token) {
      tokenJWT = req.cookies.token;
      console.log("Resultado: token encontrado en cookies");
    }

    //check headers
    if (!tokenJWT) {
      console.log("Intentando req.get('Authorization')...");
      const authHeader = req.get("Authorization");
      if (authHeader) {
        tokenJWT = authHeader;
        console.log("Resultado: token encontrado en headers");
      }
    }

    //check body
    if (!tokenJWT) {
      console.log("Intentando req.body.jwt...");
      const bodyJwt = req.body?.jwt;
      console.log("Resultado:", bodyJwt || "undefined");
      if (bodyJwt) {
        tokenJWT = bodyJwt;
        console.log("Resultado: token encontrado en body");
      }
    }
    //check query
    if (!tokenJWT) {
      console.log("Intentando req.query.jwt...");
      const queryJwt = req.query?.jwt;
      if (queryJwt) {
        tokenJWT = queryJwt;
        console.log("Resultado: token encontrado en query");
      }
    }

    //check url (manual parsing)
    if (!tokenJWT) {
      console.log("Intentando parsear token de URL...");
      if (req.url.includes("jwt=")) {
        const urlParts = req.url.split("jwt=");
        tokenJWT = urlParts[1]?.split("&")[0];
        console.log("Resultado: token encontrado en URL");
      }
    }

    if (!tokenJWT) {
      console.log("No hay token - enviando error 401");
      return next(createError(401, "Token not provided"));
    }

    // Limpiar Bearer
    if (tokenJWT.startsWith("Bearer ")) {
      tokenJWT = tokenJWT.slice(7);
    }

    jwt.verify(tokenJWT, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        console.log("JWT inválido:", err.message);
        return next(createError(401, "Invalid token"));
      }

      console.log("JWT válido para usuario:", payload.user_id);
      req.apiUserId = payload.user_id;
      next();
    });
  } catch (error) {
    console.log("ERROR en guard middleware:", error.message);
    next(createError(500, "Error in authentication"));
  }
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

export function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearTokenCookie(res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
