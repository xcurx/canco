import CanvasClient from "@/components/CanvasClient";
import { auth, signIn, signOut } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "@/prisma";
import { notFound, redirect } from "next/navigation";

async function signInWithGoogle() {
  "use server";
  await signIn("google");
}

async function signOutUser() {
  "use server";
  await signOut();
}

export default async function CanvasPage(context : { params: Promise<{ roomId: string }> }) {
  const session = await auth();

  if (!session?.user) {
      redirect("/login",);
  }

  const { roomId } = await context.params
  
  const cavas = await prisma.canvas.findFirst({
    where: {
      id: roomId,
      OR: [
        { userId: session.user.id },
        { canvasShares: { some: { userId: session.user.id } } },
        { visibility: "PUBLIC" }
      ],
    },
  });

  if (!cavas) {
    notFound();
  }

  const cookieStore = await cookies()
  const tokenCookie = 
    cookieStore.get("authjs.session-token") || 
    cookieStore.get("__Secure-authjs.session-token")

  const isOwner = cavas.userId === session.user.id;

  return (
    <CanvasClient
      roomId={roomId}
      isAuthed={true}
      isOwner={isOwner}
      signInAction={signInWithGoogle}
      signOutAction={signOutUser}
      token={tokenCookie?.value}
    />
  );
}