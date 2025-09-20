import { selectFields } from "express-validator/lib/field-selection";
import prisma from "../lib/prisma";

export async function createTopic(userId, topicData) {
  const { name, description, color = "#3B82F6" } = topicData;

  try {
    const topic = await prisma.studyTopic.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        color,
      },
      include: {
        _count: {
          select: { studyCards: true },
        },
      },
    });
    return topic;
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("Topic name already used");
    }
    throw error;
  }
}

export async function getUserTopics(userId) {
  const topics = await prisma.studyTopic.findMany({
    where: { userId },
    include: {
      studyCards: {
        select: {
          id: true,
          question: true,
          answer: true,
          createdAt: true,
        },
      },
      _count: {
        select: { studyCards: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return topics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    description: topic.description,
    color: topic.color,
    createdAt: topic.createdAt,
    cardsCount: topic._count.studyCards,
    studyCards: topic.studyCards,
  }));
}

export async function getTopicById(topicId, userId) {
  const topic = await prisma.studyTopic.findFirst({
    where: {
      id: topicId,
      userId: userId,
    },
    include: {
      studyCards: {
        select: {
          id: true,
          question: true,
          answer: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { studyCards: true },
      },
    },
  });

  if (!topic) {
    throw new Error("Topic not found or unauthorized acces");
  }

  return {
    id: topic.id,
    name: topic.name,
    description: topic.description,
    color: topic.color,
    createdAt: topic.createdAt,
    cardsCount: topic._count.studyCards,
    studyCards: topic.studyCards,
  };
}

export async function searchTopics(userId, searchTerm) {
  const topics = await prisma.studyTopic.findMany({
    where: {
      userId,
      name: {
        contains: searchTerm.trim(),
        mode: "insensitive",
      },
    },
    include: {
      _count: {
        select: { studyCards: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return topics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    description: topic.description,
    color: topic.color,
    cardsCount: topic._count.studyCards,
  }));
}

export async function updateTopic(topicId, userId, updateInfo) {
  const { name, description, color } = updateInfo;

  const existingTopic = await prisma.studyTopic.findFirst({
    where: { id: topicId, userId },
  });

  if (!existingTopic) {
    throw new Error("Topic not found or unauthorized access");
  }

  try {
    const updateData = {};

    if (name) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (color) {
      updateData.color = color;
    }

    const updatedTopic = await prisma.studyTopic.update({
      where: { id: topicId },
      data: updateData,
      include: {
        _count: {
          select: { studyCards: true },
        },
      },
    });

    return updatedTopic;
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("Topic name already exists for this user");
    }
    throw error;
  }
}

export async function deleteTopic(topicId, userId) {
  const existingTopic = await prisma.studyTopic.findFirst({
    where: { id: topicId, userId },
  });

  if (!existingTopic) {
    throw new Error("Topic not found or unauthorized access");
  }

  await prisma.studyTopic.delete({
    where: { id: topicId },
  });
}
