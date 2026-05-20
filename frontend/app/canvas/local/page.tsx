import CanvasClient from "@/components/CanvasClient";
import { signIn } from "@/auth";

async function signInWithGoogle() {
    "use server";
    await signIn("google");
}

export default function LocalCanvasPage() {
    return (
    <CanvasClient
        roomId="local"
        isAuthed={false}
        isOwner={false}
        signInAction={signInWithGoogle}
        signOutAction={async () => { "use server" }}
        token={undefined}
    />
    );
}