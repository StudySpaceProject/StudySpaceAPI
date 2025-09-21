import * as cardService from "./../services/cardService.js";

export async function createCard(req, res, next) {
  try {
    const {
      topicId: topicIdStr,
      question,
      answer,
      userId: userIdStr,
    } = req.body;
    const topicId = parseInt(topicIdStr);
    const userId = parseInt(userIdStr);

    if (isNaN(topicId) || !question || !answer || isNaN(userId)) {
      const error = new Error(
        "Topic ID, question, answer, and user ID are required"
      );
      error.status = 400;
      return next(error);
    }

    if (question.trim().length < 3 || answer.trim().length < 2) {
      const error = new Error(
        "Question must be at least 3 characters and answer at least 2 characters"
      );
      error.status = 400;
      return next(error);
    }

    const card = await cardService.createCard(
      topicId,
      {
        question,
        answer,
      },
      userId
    );

    res.status(201).json({
      message: "Card created successfully",
      card,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("unauthorized access")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function getTopicCards(req, res, next) {
  try {
    const topicId = parseInt(req.params.topicId);
    const userId = parseInt(req.query.userId);

    if (isNaN(topicId) || isNaN(userId)) {
      const error = new Error("Invalid topic ID or user ID");
      error.status = 400;
      return next(error);
    }

    const cards = await cardService.getTopicCards(topicId, userId);

    res.json({ cards });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("unauthorized access")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function getCardById(req, res, next) {
  try {
    const cardId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId);

    if (isNaN(cardId) || isNaN(userId)) {
      const error = new Error("Invalid card ID or user ID");
      error.status = 400;
      return next(error);
    }

    const card = await cardService.getCardById(cardId, userId);

    res.json({ card });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("unauthorized access")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function updateCard(req, res, next) {
  try {
    const cardId = parseInt(req.params.id);
    const { question, answer, userId: userIdStr } = req.body;
    const userId = parseInt(userIdStr);

    if (isNaN(cardId) || isNaN(userId)) {
      const error = new Error("Invalid card ID or user ID");
      error.status = 400;
      return next(error);
    }

    if (question && question.trim().length < 3) {
      const error = new Error("Question must be at least 3 characters long");
      error.status = 400;
      return next(error);
    }

    if (answer && answer.trim().length < 2) {
      const error = new Error("Answer must be at least 2 characters long");
      error.status = 400;
      return next(error);
    }

    const updatedCard = await cardService.updateCard(
      cardId,
      {
        question,
        answer,
      },
      userId
    );

    res.json({
      message: "Card updated successfully",
      card: updatedCard,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("unauthorized access")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function deleteCard(req, res, next) {
  try {
    const cardId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId);

    if (isNaN(cardId) || isNaN(userId)) {
      const error = new Error("Invalid card ID or user ID");
      error.status = 400;
      return next(error);
    }

    const result = await cardService.deleteCard(cardId, userId);

    res.json({
      message: result.message,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("unauthorized access")
    ) {
      error.status = 404;
    }
    next(error);
  }
}

export async function searchCards(req, res, next) {
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
