import * as topicService from "./../services/topicService.js";

export async function createTopic(req, res, next) {
  try {
    const { userId, name, description, color } = req.body;

    if (!userId || !name) {
      const error = new Error("User ID and topic name are required");
      error.status = 400;
      return next(error);
    }

    if (name.trim().length < 2) {
      const error = new Error("Topic name must be at least 2 characters long");
      error.status = 400;
      return next(error);
    }

    const topic = await topicService.createTopic(userId, {
      name,
      description,
      color,
    });

    res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      error.status = 409;
    }
    next(error);
  }
}

export async function getUserTopics(req, res, next) {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      return next(error);
    }

    const topics = await topicService.getUserTopics(userId);

    res.json({ topics });
  } catch (error) {
    next(error);
  }
}

export async function getTopicById(req, res, next) {
  try {
    const topicId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId);

    if (isNaN(topicId) || isNaN(userId)) {
      const error = new Error("Invalid topic ID or user ID");
      error.status = 400;
      return next(error);
    }

    const topic = await topicService.getTopicById(topicId, userId);

    res.json({ topic });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("access denied")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function updateTopic(req, res, next) {
  try {
    const topicId = parseInt(req.params.id);
    const { userId: userIdStr, name, description, color } = req.body;
    const userId = parseInt(userIdStr);

    if (isNaN(topicId) || isNaN(userId)) {
      const error = new Error("Invalid topic ID or user ID missing");
      error.status = 400;
      return next(error);
    }

    if (name && name.trim().length < 2) {
      const error = new Error("Topic name must be at least 2 characters long");
      error.status = 400;
      return next(error);
    }

    const updatedTopic = await topicService.updateTopic(topicId, userId, {
      name,
      description,
      color,
    });

    res.json({
      message: "Topic updated successfully",
      topic: updatedTopic,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("access denied")
    ) {
      error.status = 404;
    } else if (error.message.includes("already exists")) {
      error.status = 409;
    }
    next(error);
  }
}

export async function deleteTopic(req, res, next) {
  try {
    const topicId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId);

    if (isNaN(topicId) || isNaN(userId)) {
      const error = new Error("Invalid topic ID or user ID");
      error.status = 400;
      return next(error);
    }

    const result = await topicService.deleteTopic(topicId, userId);

    res.json({
      message: result.message,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("access denied")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function searchTopics(req, res, next) {
  try {
    const userId = parseInt(req.params.userId);
    const { search } = req.query;

    if (isNaN(userId)) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      return next(error);
    }

    if (!search || search.trim().length < 2) {
      const error = new Error("Search term must be at least 2 characters long");
      error.status = 400;
      return next(error);
    }

    const cards = await cardService.searchCards(userId, search);

    res.json({
      cards,
      searchTerm: search,
    });
  } catch (error) {
    next(error);
  }
}
