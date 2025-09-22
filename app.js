import express from "express";
import calendarRoutes from "./routes/calendar.js";
import authRoutes from "./routes/auth.js"; 
import cors from "cors";
import path from "path";
import morgan from "morgan";
import * as usersController from "./controllers/usersController.js";
import * as topicsController from "./controllers/topicsController.js";
import * as cardsController from "./controllers/cardsController.js";
import * as reviewsController from "./controllers/reviewsController.js";

const app = express();
//cors configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Development
      "http://localhost:3000", // Alt development
      "https://dominio", // Production
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * GENERAL ROUTES
 */

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(import.meta.dirname, "public")));

/**
 * API ROUTES
 */

// CALENDAR ROUTES
app.use("/calendar", calendarRoutes);
app.use("/auth", authRoutes);

// USERS ROUTES
app.post("/api/users/register", usersController.register);
app.post("/api/users/login", usersController.login);
app.get("/api/users/:id", usersController.getUserById);
app.get("/api/users/:id/dashboard", usersController.getDashboard);

// TOPICS ROUTES
app.post("/api/topics", topicsController.createTopic);
app.get("/api/topics/user/:userId", topicsController.getUserTopics);
app.get("/api/topics/:id", topicsController.getTopicById);
app.put("/api/topics/:id", topicsController.updateTopic);
app.delete("/api/topics/:id", topicsController.deleteTopic);
app.get("/api/topics/search/:userId", topicsController.searchTopics);

// CARDS ROUTES
app.post("/api/cards", cardsController.createCard);
app.get("/api/cards/topic/:topicId", cardsController.getTopicCards);
app.get("/api/cards/:id", cardsController.getCardById);
app.put("/api/cards/:id", cardsController.updateCard);
app.delete("/api/cards/:id", cardsController.deleteCard);
app.get("/api/cards/search/:userId", cardsController.searchCards);

// REVIEWS ROUTES
app.get("/api/reviews/pending/:userId", reviewsController.getPendingReviews);
app.post("/api/reviews/complete", reviewsController.completeReview);
app.get("/api/reviews/upcoming/:userId", reviewsController.getUpcomingReviews);
app.get(
  "/api/reviews/card/:cardId/history",
  reviewsController.getCardReviewHistory
);
app.put(
  "/api/reviews/reschedule/:reviewId",
  reviewsController.rescheduleReview
);

//ROUTE NOT FOUND 404
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

//ERRROR HANDLING
app.use((err, req, res, next) => {
  const errorResponse = {
    error: err.message || "Internal server error",
    status: err.status || 500,
  };

  res.status(err.status || 500).json(errorResponse);
});

export default app;
