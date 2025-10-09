import * as topicService from "./../services/topicService.js";

export async function createTopic(req, res, next) {
  try {
    const { name, description, color } = req.body;
    const userId = req.apiUserId;

    if (!name) {
      const error = new Error("topic name is required");
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
    const userId = req.apiUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      const error = new Error("Invalid pagination parameters");
      error.status = 400;
      return next(error);
    }

    const result = await topicService.getUserTopics(userId, page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTopicById(req, res, next) {
  try {
    const topicId = parseInt(req.params.id);
    const userId = req.apiUserId;

    if (isNaN(topicId)) {
      const error = new Error("Invalid topic ID");
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
    const { name, description, color } = req.body;
    const userId = req.apiUserId;

    if (isNaN(topicId)) {
      const error = new Error("Invalid topic ID");
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
    const userId = req.apiUserId;

    if (isNaN(topicId)) {
      const error = new Error("Invalid topic ID");
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
    const userId = req.apiUserId;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!search || search.trim().length < 2) {
      const error = new Error("Search term must be at least 2 characters long");
      error.status = 400;
      return next(error);
    }

    if (page < 1 || limit < 1 || limit > 100) {
      const error = new Error("Invalid pagination parameters");
      error.status = 400;
      return next(error);
    }

    const result = await topicService.searchTopics(userId, search, page, limit);

    res.json({
      ...result,
      searchTerm: search,
    });
  } catch (error) {
    next(error);
  }
}
