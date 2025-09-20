import express from "express";
import * as cardController from "./controllers/api/cardsController";
import * as usersController from "./controllers/api/usersController";

const app = express();
//cors configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Desarrollo
      "http://localhost:3000", // Desarrollo alternativo
      "https://dominio", // Producción
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * General rutes
 */

app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(import.meta.dirname, "public")));

/**
 * API routes
 */

app.get("/api/cards", jwtAuth.guard, cardController.list);
app.get("/api/cards/:cardId", jwtAuth.guard, cardController.getOne);
app.post(
  "/api/card",
  jwtAuth.guard,
  upload.single("image"),
  cardController.newProduct
);
app.put(
  "/api/card/:cardId",
  upload.single("image"),
  jwtAuth.guard,
  cardController.upDate
);
app.delete("/api/card/:cardId", jwtAuth.guard, cardController.deleteCard);

//autenticacion con jwt

//peticion para crear usuario
//el usuario se crea en postgresql con prisma

//peticion para borrar usuario
//se hace la peticion con prisma a postgresql

//peticion para hacer login
//se verifican los datos del usuario en la base de datos

//Error handling
app.use((err, req, res, next) => {
  if (err.array) {
    err.message =
      "invalid request : " +
      err
        .array()
        .map((e) => `${e.location} ${e.type} ${e.path} ${e.msg}`)
        .join(",");

    err.status = 422;
  }

  res.status(err.status || 500);
  // res.send('Ocurrio un error: ' + err.message)

  //set locals, including error informartion in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODEAPP_ENV === "development" ? err : {};
  res.render("error");
});

export default app;
