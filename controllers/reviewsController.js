import * as reviewService from "./../services/reviewService.js";

export async function getPendingReviews(req, res, next) {
  try {
    const userId = req.apiUserId;

    const pendingReviews = await reviewService.getPendingReviews(userId);

    res.json({
      pendingReviews,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeReview(req, res, next) {
  try {
    const { scheduledReviewId, difficultyRating } = req.body;
    const userId = req.apiUserId;

    if (!scheduledReviewId || !difficultyRating) {
      const error = new Error(
        "Scheduled review ID, difficulty rating are required"
      );
      error.status = 400;
      return next(error);
    }

    if (![1, 2, 3].includes(difficultyRating)) {
      const error = new Error(
        "Difficulty rating must be 1 (easy), 2 (medium), or 3 (difficult)"
      );
      error.status = 400;
      return next(error);
    }

    const result = await reviewService.completeReview(
      scheduledReviewId,
      { difficultyRating },
      userId
    );

    res.json({
      message: "Review completed successfully",
      completedReview: result.completedReview,
      nextReviewIn: `${result.nextInterval} days`,
      nextReviewDate: result.nextReview.dueDate,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already completed")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function getUpcomingReviews(req, res, next) {
  try {
    const userId = req.apiUserId;
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 30) {
      const error = new Error("Days parameter must be between 1 and 30");
      error.status = 400;
      return next(error);
    }

    const upcomingReviews = await reviewService.getUpcomingReviews(
      userId,
      days
    );

    res.json({
      upcomingReviews,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCardReviewHistory(req, res, next) {
  try {
    const cardId = parseInt(req.params.cardId);
    const userId = req.apiUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (isNaN(cardId)) {
      const error = new Error("Invalid card ID");
      error.status = 400;
      return next(error);
    }

    if (page < 1 || limit < 1 || limit > 100) {
      const error = new Error("Invalid pagination parameters");
      error.status = 400;
      return next(error);
    }

    const result = await reviewService.getCardReviewHistory(
      cardId,
      userId,
      page,
      limit
    );

    res.json({
      cardId,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleReview(req, res, next) {
  try {
    const scheduledReviewId = parseInt(req.params.reviewId);
    const { newDate } = req.body;
    const userId = req.apiUserId;

    if (isNaN(scheduledReviewId) || !newDate) {
      const error = new Error("Review ID, new date are required");
      error.status = 400;
      return next(error);
    }

    // Validar que newDate sea una fecha válida
    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error("Invalid date format");
      error.status = 400;
      return next(error);
    }

    const updatedReview = await reviewService.rescheduleReview(
      scheduledReviewId,
      parsedDate,
      userId
    );

    res.json({
      message: "Review rescheduled successfully",
      review: updatedReview,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already completed")
    ) {
      error.status = 404;
    }
    next(error);
  }
}
