import prisma from "../lib/prisma";

export async function getPendingReviews(userId) {
  const now = new Date();

  const pendingReviews = await prisma.scheduledReview.findMany({
    where: {
      userId,
      dueDate: { lte: now },
      completedReviews: { none: {} }, // No completadas
    },
    include: {
      card: {
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return pendingReviews.map((review) => ({
    id: review.id,
    dueDate: review.dueDate,
    intervalDays: review.intervalDays,
    card: {
      id: review.card.id,
      question: review.card.question,
      answer: review.card.answer,
      topic: review.card.topic,
    },
  }));
}

export async function completeReview(scheduledReview, reviewData, userId) {
  const { difficultyRating, responseTime = null } = reviewData;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const scheduledReview = await tx.scheduledReview.findFirst({
        where: {
          id: scheduledReviewId,
          userId,
          completedReviews: { none: {} }, // No completada aún
        },
        include: {
          card: {
            include: {
              completedReviews: {
                orderBy: { completedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      if (!scheduledReview) {
        throw new Error("Scheduled review not found or already completed");
      }

      const completedReview = await tx.completedReview.create({
        data: {
          scheduledReviewId,
          cardId: scheduledReview.cardId,
          userId,
          completedAt: new Date(),
          difficultyRating,
          responseTimeSeconds,
        },
      });

      const nextInterval = calculateNextInterval(
        difficultyRating,
        scheduledReview.intervalDays,
        scheduledReview.card.completedReviews.length + 1
      );

      const nextStudyDate = new Date();
      nextStudyDate.setDate(nextStudyDate.getDate() + nextInterval);

      const nextReview = await tx.scheduledReview.create({
        data: {
          cardId: scheduledReview.cardId,
          userId,
          dueDate: nextDueDate,
          intervalDays: nextInterval,
        },
      });

      return {
        completedReview,
        nextReview,
        nextInterval,
      };
    });

    return result;
  } catch (error) {
    throw new Error("Error completing review: " + error.message);
  }
}

function calculateNextInterval(
  difficultyRating,
  previousInterval = 1,
  reviewCount = 1
) {
  let nextInterval;

  if (reviewCount === 1) {
    if (difficultyRating === 3) {
      nextInterval = 1;
    } else if (difficultyRating === 2) {
      nextInterval = 3;
    } else {
      nextInterval = 7;
    }
  } else {
    if (difficultyRating === 1) {
      nextInterval = previousInterval * 2;
      if (nextInterval > 30) {
        nextInterval = 30;
      }
    } else if (difficultyRating === 2) {
      nextInterval = Math.ceil(previousInterval * 1.3);
      if (nextInterval > 15) {
        nextInterval = 15;
      }
    } else {
      nextInterval = 1;
    }
  }

  return nextInterval;
}

export async function getUpcomingReviews(userId, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);

  const upcomingReviews = await prisma.scheduledReview.findMany({
    where: {
      userId,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      completedReviews: { none: {} },
    },
    include: {
      card: {
        include: {
          topic: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  //group by date

  const reviewsByDate = {};
  upcomingReviews.forEach((review) => {
    const dateKey = review.dueDate.toISOString().split("T")[0];
    if (!reviewsByDate[dateKey]) {
      reviewsByDate[dateKey] = [];
    }
    reviewsByDate[dateKey].push({
      id: review.id,
      dueDate: review.dueDate,
      card: review.card,
    });
  });

  return reviewsByDate;
}

export async function getCardReviewHistory(cardId, userId) {
  const cardHistory = await prisma.completedReview.findMany({
    where: {
      cardId,
      userId,
    },
    include: {
      scheduledReview: {
        select: {
          intervalDays: true,
          dueDate: true,
        },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  return cardHistory.map((review) => ({
    completedAt: review.completedAt,
    difficultyRating: review.difficultyRating,
    responseTime: review.responseTimeSeconds,
    intervalDays: review.scheduledReview.intervalDays,
    scheduledFor: review.scheduledReview.dueDate,
  }));
}

export async function rescheduleReview(scheduledReviewId, newDate, userId) {
  const review = await prisma.scheduledReview.findFirst({
    where: {
      id: scheduledReviewId,
      userId,
      completedReviews: { none: {} },
    },
  });

  if (!review) {
    throw new Error("Scheduled review not found or already completed");
  }

  const updatedReview = await prisma.scheduledReview.update({
    where: { id: scheduledReviewId },
    data: { dueDate: newDate },
    include: {
      card: {
        include: {
          topic: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return updatedReview;
}
