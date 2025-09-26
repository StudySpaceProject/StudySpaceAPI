import express from "express";
import authRoutes from "./routes/auth.js";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import * as usersController from "./controllers/usersController.js";
import * as topicsController from "./controllers/topicsController.js";
import * as cardsController from "./controllers/cardsController.js";
import * as reviewsController from "./controllers/reviewsController.js";
import { guard } from "./middleware/authMiddleware.js";

const app = express();
//cors configuration

const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = [
  "http://localhost:1234", // Parcel default
  "http://localhost:3000", // Express default  
  "http://localhost:5173", // Vite
  "http://localhost:8080", // Webpack dev server
];

if (!isDevelopment) {
  allowedOrigins.push(
    process.env.FRONTEND_URL || "https://frontend.com",
    process.env.API_URL || "https://api.railway.app"
  );
}
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

app.use(morgan("dev"));
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
app.use("/api/auth", authRoutes)


// USERS ROUTES
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
