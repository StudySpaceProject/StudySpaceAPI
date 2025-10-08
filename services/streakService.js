import prisma from "../lib/prisma.js";

//verify if two dates are consecutive days

function areConsecutiveDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

//verify if a date is today

function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

//update user streak after completing a review
export async function updateUserStreak(userId) {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  // Verify if there are pending sessions for today
  const pendingReviews = await prisma.scheduledReview.findMany({
    where: {
      userId,
      dueDate: {
        gte: startOfToday,
        lt: endOfToday,
      },
      completedReviews: { none: {} },
    },
  });

  // if there are pending reviews, do not update the streak
  if (pendingReviews.length > 0) {
    return {
      success: false,
      message: "Aún hay sesiones pendientes para hoy",
      pendingCount: pendingReviews.length,
    };
  }

  // Get the current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastCompletionDate: true,
    },
  });

  // If the user has already completed everything today, do nothing
  if (user.lastCompletionDate && isToday(user.lastCompletionDate)) {
    return {
      success: true,
      message: "Racha ya actualizada hoy",
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    };
  }

  let newStreak = 1;

  // Calculate the new streak
  if (user.lastCompletionDate) {
    if (areConsecutiveDays(user.lastCompletionDate, today)) {
      // Consecutive day: increment streak
      newStreak = user.currentStreak + 1;
    } else {
      // Streak broken: reset streak
      newStreak = 1;
    }
  }

  // Update longest streak if necessary
  const newLongestStreak = Math.max(newStreak, user.longestStreak);

  // Update database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletionDate: today,
    },
  });

  return {
    success: true,
    message: "Racha actualizada exitosamente",
    currentStreak: updatedUser.currentStreak,
    longestStreak: updatedUser.longestStreak,
    lastCompletionDate: updatedUser.lastCompletionDate,
  };
}

// Verify and update streak
export async function checkAndUpdateStreak(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastCompletionDate: true,
    },
  });

  if (!user.lastCompletionDate) {
    return {
      currentStreak: 0,
      longestStreak: user.longestStreak,
      isActive: false,
    };
  }

  const today = new Date();
  const lastCompletion = new Date(user.lastCompletionDate);

  lastCompletion.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - lastCompletion;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If more than 1 day has passed since last completion, reset current streak
  if (diffDays > 1) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });

    return {
      currentStreak: 0,
      longestStreak: user.longestStreak,
      isActive: false,
      daysSinceLastCompletion: diffDays,
    };
  }

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    isActive: diffDays === 0, // true if last completion was today
    daysSinceLastCompletion: diffDays,
  };
}

// Get user streak stats
export async function getUserStreakStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastCompletionDate: true,
    },
  });

  const streakStatus = await checkAndUpdateStreak(userId);

  // Verify if there are pending sessions for today
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayPending = await prisma.scheduledReview.count({
    where: {
      userId,
      dueDate: {
        gte: startOfToday,
        lt: endOfToday,
      },
      completedReviews: { none: {} },
    },
  });

  return {
    currentStreak: streakStatus.currentStreak,
    longestStreak: user.longestStreak,
    lastCompletionDate: user.lastCompletionDate,
    isActiveToday: streakStatus.isActive,
    pendingToday: todayPending,
    canExtendStreak: todayPending === 0 && !streakStatus.isActive,
  };
}
