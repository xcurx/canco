"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";

export async function createNewCanvas() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const newCanvas = await prisma.canvas.create({
    data: {
      name: "Untitled Canvas",
      userId: session.user.id,
    },
  });

  redirect(`/canvas/${newCanvas.id}`);
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
