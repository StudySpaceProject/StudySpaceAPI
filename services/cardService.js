import prisma from "../lib/prisma.js";
import {
  createStudySessionEvent,
  deleteCalendarEvent,
} from "../controllers/calendarController.js";

export async function screateCard(topicId, cardData, userId) {
  const { question, answer, timeZone } = cardData;

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

    // Schedule first review for the next day at 9 AM

    const userTimeZone = timeZone || "America/Bogota";

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    //use toLocaleString to get date in user timezone
    const tomorrowStr = tomorrowDate.toLocaleString("en-CA", {
      timeZone: userTimeZone,
    });

    //build complete date
    const tomorrowAt9AM = new Date(tomorrowStr + "T09:00:00");

    //convert to UTC to store in DB
    const utcDate = new Date(
      tomorrowAt9AM.toLocaleString("en-US", { timeZone: userTimeZone })
    );
    console.log("   Zona horaria usuario:", userTimeZone);
    console.log(
      "   Fecha local (9 AM):",
      tomorrowAt9AM.toLocaleString("es-ES", { timeZone: userTimeZone })
    );
    console.log("   Fecha UTC guardada:", utcDate.toISOString());

    const scheduledReview = await prisma.scheduledReview.create({
      data: {
        cardId: card.id,
        userId,
        dueDate: tomorrowDate,
        intervalDays: 1,
      },
    });

    try {
      const eventResult = await createStudySessionEvent(userId, {
        ...scheduledReview,
        card: { ...card, topic },
      });
      console.log(`RESULTADO del evento:`, eventResult ? "ÉXITO" : "NULL");
      console.log(`Evento creado en Calendar para card ${card.id}`);
    } catch (error) {
      console.log(`ERROR creando evento para card ${card.id}:`, error.message);
    }

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

  //if question changed, update calendar events
  if (question) {
    try {
      const pendingReviews = await prisma.scheduledReview.findMany({
        where: {
          cardId,
          completedReviews: { none: {} },
          googleEventId: { not: null },
        },
        include: {
          card: { include: { topic: true } },
        },
      });

      // Recreate events
      for (const review of pendingReviews) {
        await deleteCalendarEvent(userId, review.googleEventId);
        await createStudySessionEvent(userId, {
          ...review,
          card: { ...updatedCard, topic: updatedCard.topic },
        });
      }
      console.log(`${pendingReviews.length} eventos actualizados en Calendar`);
    } catch (calendarError) {
      console.log(
        "Error actualizando eventos de Calendar:",
        calendarError.message
      );
    }
  }

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

  // Delete calendar events before deleting the card
  try {
    const pendingReviews = await prisma.scheduledReview.findMany({
      where: {
        cardId,
        completedReviews: { none: {} },
        googleEventId: { not: null },
      },
    });

    for (const review of pendingReviews) {
      await deleteCalendarEvent(userId, review.googleEventId);
    }
    console.log(`${pendingReviews.length} eventos eliminados de Calendar`);
  } catch (calendarError) {
    console.log("Error eliminando eventos de Calendar:", calendarError.message);
  }

  await prisma.studyCard.delete({
    where: { id: cardId },
  });

  return {
    message: "Card deleted successfully",
  };
}

export async function searchCards(userId, searchTerm) {
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
