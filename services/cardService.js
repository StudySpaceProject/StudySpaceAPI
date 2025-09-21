import prisma from "../lib/prisma.js";

export async function createCard(topicId, cardData, userId) {
  const { question, answer } = cardData;

  const topic = await prisma.studyTopic.findFirst({
    where: { id: topicId, userId },
  });

  if (!topic) {
    throw new Error("Topic not found or unauthorized access");
  }

  try {
    const card = await prisma.studyCard.create({
      data: {
        topicId,
        question: question.trim(),
        answer: answer.trim(),
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(9, 0, 0, 0);

    await prisma.scheduledReview.create({
      data: {
        cardId: card.id,
        userId,
        dueDate: tomorrowDate,
        intervalDays: 1,
      },
    });

    return card;
  } catch (error) {
    throw new Error("Error creating card:" + error.message);
  }
}

export async function getTopicCards(topicId, userId) {
  const topic = await prisma.studyTopic.findFirst({
    where: { id: topicId, userId },
  });

  if (!topic) {
    throw new Error("Topic not found or unauthorized access");
  }

  const cards = await prisma.studyCard.findMany({
    where: { topicId },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      scheduledReviews: {
        where: {
          completedReviews: { none: {} },
        },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      completedReviews: {
        select: {
          completedAt: true,
          difficultyRating: true,
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          completedReviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return cards.map((card) => ({
    id: card.id,
    question: card.question,
    answer: card.answer,
    createdAt: card.createdAt,
    topic: card.topic,
    nextReview: card.scheduledReviews[0]?.dueDate || null,
    timesStudied: card._count.completedReviews,
    lastRating: card.completedReviews[0]?.difficultyRating || null,
    recentSessions: card.completedReviews,
  }));
}

export async function getCardById(cardId, userId) {
  const card = await prisma.studyCard.findFirst({
    where: {
      id: cardId,
      topic: { userId },
    },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      scheduledReview: {
        where: {
          completedReviews: { none: {} },
        },
        orderBy: { dueDate: "asc" },
      },
      completedReviews: {
        select: {
          completedAt: true,
          difficultyRating: true,
        },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!card) {
    throw new Error("Card not found or unauthorized access");
  }
  return {
    id: card.id,
    question: card.question,
    answer: card.answer,
    createdAt: card.createdAt,
    topic: card.topic,
    pendingReviews: card.scheduledReviews,
    studyHistory: card.completedReviews,
  };
}

export async function updateCard(cardId, updatedInfo, userId) {
  const { question, answer } = updatedInfo;

  const existingCard = await prisma.studyCard.findFirst({
    where: {
      id: cardId,
      topic: { userId },
    },
  });

  if (!existingCard) {
    throw new Error("Card not found or unauthorized access");
  }

  const data = {};

  if (question) {
    data.question = question;
  }
  if (answer) {
    data.answer = answer;
  }

  const updatedCard = await prisma.studyCard.update({
    where: { id: cardId },
    data: data,
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return updatedCard;
}

export async function deleteCard(cardId, userId) {
  const existingCard = await prisma.studyCard.findFirst({
    where: {
      id: cardId,
      topic: { userId },
    },
  });

  if (!existingCard) {
    throw new Error("Card not found or unauthorized acces");
  }

  await prisma.studyCard.delete({
    where: { id: cardId },
  });

  return {
    message: "Card deleted successfully",
  };
}

export async function searchCard(userId, searchTerm) {
  const cards = await prisma.studyCard.findMany({
    where: {
      topic: { userId },
      OR: [
        {
          question: {
            contains: searchTerm.trim(),
            mode: "insensitive",
          },
        },
        {
          answer: {
            contains: searchTerm.trim(),
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: {
          completedReviews: true,
        },
      },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return cards.map((card) => ({
    id: card.id,
    question: card.question,
    answer: card.answer,
    topic: card.topic,
    timesStudied: card._count.completedReviews,
  }));
}
