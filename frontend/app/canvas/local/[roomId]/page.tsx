import { signIn } from "@/auth";
import CanvasClient from "@/components/CanvasClient";
import { notFound } from "next/navigation";

async function signInWithGoogle() {
  "use server";
  await signIn("google");
}

export default async function CanvasPage(context : { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params
  
  try {
      const response = await fetch(`http://localhost:8080/api/check-session/${roomId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
      });

      if (!response.ok) {
        notFound(); 
      }
  } catch (error) {
    notFound();
  }

  return (
    <CanvasClient
      roomId={roomId}
      isAuthed={false}
      isOwner={false}
      signInAction={signInWithGoogle}
      signOutAction={async () => { "use server" }}
      token={undefined}
    />
  );
}