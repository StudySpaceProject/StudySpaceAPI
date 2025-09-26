import jwt from "jsonwebtoken";
import createError from "http-errors";


export function guard(req, res, next) {
  console.log("INICIANDO guard middleware");
  console.log("URL completa:", req.url);
  
  try {
    // Extraer token paso a paso con logs
    const authHeader = req.get("Authorization");
    console.log("Resultado:", authHeader || "undefined");
    
    console.log("Intentando req.body.jwt...");
    const bodyJwt = req.body?.jwt;
    console.log("Resultado:", bodyJwt || "undefined");
    
    console.log("Intentando req.query.jwt...");
    const queryJwt = req.query?.jwt;
    console.log("   Resultado:", queryJwt || "undefined");
    
    console.log("Query object completo:", req.query);
    
    // Extraer de URL manualmente
    console.log("Parseando URL manualmente...");
    let tokenFromUrl = null;
    if (req.url.includes('jwt=')) {
      const urlParts = req.url.split('jwt=');
      tokenFromUrl = urlParts[1]?.split('&')[0];
    }
    console.log("Token de URL:", tokenFromUrl || "undefined");
    
    // Decidir cual usar
    let tokenJWT = authHeader || bodyJwt || queryJwt || tokenFromUrl;
    console.log("Token final:", tokenJWT ? "ENCONTRADO" : "NO ENCONTRADO");
    
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
