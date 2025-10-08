import * as streakService from "../services/streakService.js";

// get current streak status

export async function getStreakStatus(req, res, next) {
  try {
    const userId = req.apiUserId;

    const streakStats = await streakService.getUserStreakStats(userId);

    res.json({
      streak: streakStats,
    });
  } catch (error) {
    next(error);
  }
}

// Check and update streak

export async function checkStreak(req, res, next) {
  try {
    const userId = req.apiUserId;

    const result = await streakService.checkAndUpdateStreak(userId);

    res.json({
      message: "Racha verificada",
      streak: result,
    });
  } catch (error) {
    next(error);
  }
}
