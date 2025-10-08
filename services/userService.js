import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { getUserStreakStats } from "./streakService.js";

export async function createUser(email, password) {
  try {
    const passwordHash = await bcrypt.hash(password, 9);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    if (error.code === "P2002") throw new Error("Email already exist");
  }
  throw error;
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      studyTopics: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          createdAt: true,
          _count: {
            select: { studyCards: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });
  return user;
}

export async function verifyPassword(password, passwordHash) {
  return await bcrypt.compare(password, passwordHash);
}

export async function getUserDashboard(userId) {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studyTopics: {
        include: {
          studyCards: {
            select: {
              id: true,
              question: true,
              createdAt: true,
            },
          },
        },
      },
      scheduledReviews: {
        where: {
          dueDate: { lte: new Date() },
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
      },
      completedReviews: {
        where: {
          completedAt: { gte: startOfToday },
        },
        select: {
          id: true,
          completedAt: true,
          difficultyRating: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }
  //get streak stats
  const streakStats = await getUserStreakStats(userId);

  const totalCards = user.studyTopics.reduce(
    (acc, topic) => acc + topic.studyCards.length,
    0
  );
  const pendingReviews = user.scheduledReviews.map((review) => ({
    id: review.id,
    dueDate: review.dueDate,
    card: {
      id: review.card.id,
      question: review.card.question,
      topic: review.card.topic,
    },
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    stats: {
      totalTopics: user.studyTopics.length,
      totalCards: totalCards,
      pendingReviews: user.scheduledReviews.length,
      completedToday: user.completedReviews.length,
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
    },
    pendingReviews: pendingReviews,
    recentActivity: user.completedReviews,
  };
}

export async function getUserStats(userId, days = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const totalTopics = await prisma.studyTopic.count({
    where: { userId },
  });
  const totalCards = await prisma.studyCard.count({
    where: { userId },
  });
  const totalCompletedReviews = await prisma.completedReview.count({
    where: { userId },
  });

  return {
    totalTopics,
    totalCards,
    totalCompletedReviews,
    period: `${days} days`,
  };
}
