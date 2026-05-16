import RoomClient from "@/components/RoomClient";
import { auth, signIn, signOut } from "@/auth";

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

export default async function RoomPage({ params }: PageProps) {
  const session = await auth();

  return (
    <RoomClient
      roomId={params.roomId}
      isAuthed={Boolean(session?.user)}
      signInAction={signInWithGoogle}
      signOutAction={signOutUser}
    />
  );
}