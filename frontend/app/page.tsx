import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  // 1. If NOT signed in, show the Landing Page
  if (!session?.user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#121212] text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Canco</h1>
        <p className="mb-8 text-gray-400">Collaborate visually, instantly.</p>
        
        <div className="flex gap-4">
          <Link 
            href="/local" 
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Start Drawing Locally
          </Link>
          
          <Link 
            href="/api/auth/signin" 
            className="px-6 py-2 border border-gray-600 rounded hover:bg-gray-800 transition"
          >
            Sign In to Save
          </Link>
        </div>
      </div>
    );
  }

  // 2. If SIGNED IN, fetch their canvases and show the Dashboard
  const canvases = await prisma.canvas.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  // Action to create a new persistent canvas
  async function createNewCanvas() {
    "use server";
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

  return (
    <div className="min-h-screen w-full bg-[#121212] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Canvases</h1>
          <form action={createNewCanvas}>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              + New Canvas
            </button>
          </form>
        </div>

        {canvases.length === 0 ? (
          <p className="text-gray-400">You don't have any canvases yet. Create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canvases.map((canvas) => (
              <Link 
                href={`/canvas/${canvas.id}`} 
                key={canvas.id}
                className="block p-6 bg-[#1e1e1e] rounded-lg border border-gray-800 hover:border-blue-500 transition cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">{canvas.name}</h2>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(canvas.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}