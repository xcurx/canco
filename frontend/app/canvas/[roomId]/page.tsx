import CanvasClient from "@/components/CanvasClient";
import { auth, signIn, signOut } from "@/auth";
import { cookies } from "next/headers";

interface PageProps {
  params: { roomId: string };
}

async function signInWithGoogle() {
  "use server";
  await signIn("google");
}

async function signOutUser() {
  "use server";
  await signOut();
}

export default async function CanvasPage({ params }: PageProps) {
  const session = await auth();

  const cookieStore = await cookies()
  const tokenCookie = 
    cookieStore.get("authjs.session-token") || 
    cookieStore.get("__Secure-authjs.session-token")

  return (
    <CanvasClient
      roomId={params.roomId}
      isAuthed={Boolean(session?.user)}
      signInAction={signInWithGoogle}
      signOutAction={signOutUser}
      token={tokenCookie?.value}
    />
  );
}