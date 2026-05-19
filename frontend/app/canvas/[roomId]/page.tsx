import CanvasClient from "@/components/CanvasClient";
import { auth, signIn, signOut } from "@/auth";
import { cookies } from "next/headers";

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

  const cookieStore = await cookies()
  const tokenCookie = 
    cookieStore.get("authjs.session-token") || 
    cookieStore.get("__Secure-authjs.session-token")

  const { roomId } = await context.params

  return (
    <CanvasClient
      roomId={roomId}
      isAuthed={Boolean(session?.user)}
      signInAction={signInWithGoogle}
      signOutAction={signOutUser}
      token={tokenCookie?.value}
    />
  );
}