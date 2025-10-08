import * as streakService from "../services/streakService.js";

// get current streak status
//it verifies if the streak is still active or has been broken by inactivity

export async function getStreakStatus(req, res, next) {
  try {
    const userId = req.apiUserId;

    const streakStats = await streakService.getUserStreakStats(userId);

    if (streakStats.wasAutoReset) {
      return res.json({
        message: "Racha reiniciada por inactividad",
        streak: streakStats,
      });
    }

    res.json({
      streak: streakStats,
    });
  } catch (error) {
    next(error);
  }
}
