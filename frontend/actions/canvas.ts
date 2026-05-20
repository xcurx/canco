"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function getCanvasDetails(canvasId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: {
      id: true,
      visibility: true,
      userId: true,
    },
  });

  if (!canvas || canvas.userId !== session.user.id) return null;
  return canvas;
}

export async function toggleVisibility(canvasId: string, visibility: "PRIVATE" | "PUBLIC") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
  });

  if (!canvas || canvas.userId !== session.user.id) {
    return { error: "Canvas not found or unauthorized" };
  }

  await prisma.canvas.update({
    where: { id: canvasId },
    data: { visibility },
  });

  return { success: true, visibility };
}

export async function searchUsers(query: string, canvasId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  if (!query || query.trim().length < 2) return [];

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: { userId: true },
  });

  if (!canvas || canvas.userId !== session.user.id) return [];

  const existingShares = await prisma.canvasShare.findMany({
    where: { canvasId },
    select: { userId: true },
  });
  const sharedUserIds = existingShares.map((s) => s.userId);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        { id: { notIn: [session.user.id, ...sharedUserIds] } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    take: 5,
  });

  return users;
}

export async function getSharedUsers(canvasId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: { userId: true },
  });

  if (!canvas || canvas.userId !== session.user.id) return [];

  const shares = await prisma.canvasShare.findMany({
    where: { canvasId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return shares.map((share) => ({
    shareId: share.id,
    ...share.user,
  }));
}

export async function addShare(canvasId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: { userId: true },
  });

  if (!canvas || canvas.userId !== session.user.id) {
    return { error: "Canvas not found or unauthorized" };
  }

  const existing = await prisma.canvasShare.findFirst({
    where: { canvasId, userId },
  });

  if (existing) return { error: "Already shared with this user" };

  const share = await prisma.canvasShare.create({
    data: { canvasId, userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return {
    success: true,
    share: { shareId: share.id, ...share.user },
  };
}

export async function removeShare(shareId: string, canvasId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: { userId: true },
  });

  if (!canvas || canvas.userId !== session.user.id) {
    return { error: "Canvas not found or unauthorized" };
  }

  await prisma.canvasShare.delete({
    where: { id: shareId },
  });

  return { success: true };
}
