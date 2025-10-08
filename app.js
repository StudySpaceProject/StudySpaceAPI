import express from "express";
import authRoutes from "./routes/auth.js";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import * as streakController from "./controllers/streakController.js";
import * as usersController from "./controllers/usersController.js";
import * as topicsController from "./controllers/topicsController.js";
import * as cardsController from "./controllers/cardsController.js";
import * as reviewsController from "./controllers/reviewsController.js";
import { guard } from "./middleware/authMiddleware.js";

const app = express();
//cors configuration

const allowedOrigins = [
  "http://localhost:1234", // Parcel default
  "http://localhost:3000", // Express default
  "http://localhost:5173", // Vite
  "https://studyspaceapi-production.up.railway.app",
  process.env.FRONTEND_URL || "http://localhost:1234",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * GENERAL ROUTES
 */

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(import.meta.dirname, "public")));

/**
 * API ROUTES
 */
//PUBLIC ROUTES
app.post("/api/users/register", usersController.register);
app.post("/api/users/login", usersController.login);

//GOOGLE OAUTH
app.use("/api/auth", authRoutes);

// USERS ROUTES
app.get("/api/users/logout", guard, usersController.logout);
app.get("/api/users/profile", guard, usersController.getUserProfile);
app.get("/api/users/dashboard", guard, usersController.getDashboard);

// TOPICS ROUTES
app.post("/api/topics", guard, topicsController.createTopic);
app.get("/api/topics/search", guard, topicsController.searchTopics);
app.get("/api/topics", guard, topicsController.getUserTopics);
app.get("/api/topics/:id", guard, topicsController.getTopicById);
app.put("/api/topics/:id", guard, topicsController.updateTopic);
app.delete("/api/topics/:id", guard, topicsController.deleteTopic);

// CARDS ROUTES
app.post("/api/cards", guard, cardsController.createCard);
app.get("/api/cards/search", guard, cardsController.searchCards);
app.get("/api/cards/topic/:topicId", guard, cardsController.getTopicCards);
app.get("/api/cards/:id", guard, cardsController.getCardById);
app.put("/api/cards/:id", guard, cardsController.updateCard);
app.delete("/api/cards/:id", guard, cardsController.deleteCard);

// REVIEWS ROUTES
app.get("/api/reviews/pending", guard, reviewsController.getPendingReviews);
app.post("/api/reviews/complete", guard, reviewsController.completeReview);
app.get("/api/reviews/upcoming", guard, reviewsController.getUpcomingReviews);
app.get(
  "/api/reviews/card/:cardId/history",
  guard,
  reviewsController.getCardReviewHistory
);
app.put(
  "/api/reviews/reschedule/:reviewId",
  guard,
  reviewsController.rescheduleReview
);

// STREAK ROUTES
app.get("/api/streak/status", guard, streakController.getStreakStatus);
//HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    status: "StudySpace API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

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
