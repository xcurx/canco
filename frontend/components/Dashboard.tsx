import Link from "next/link";
import {
  Pen,
  Plus,
  ArrowRight,
  LogOut,
  Layout,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { createNewCanvas, handleSignOut } from "@/actions/user";

export default async function Dashboard() {
  const session = await auth();
  const user = session!.user!;
  const firstName = user.name?.split(" ")[0] ?? "there";

  const canvases = await prisma.canvas.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-[family-name:var(--font-inter)]">
      {/*Navbar*/}
      <nav className="sticky top-0 z-30 glass border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <Pen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Canco</span>
          </Link>

          <div className="flex items-center gap-3">
            <form action={createNewCanvas}>
              <button
                type="submit"
                id="dashboard-new-canvas"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                New Canvas
              </button>
            </form>

            <form action={handleSignOut}>
              <button
                type="submit"
                id="dashboard-sign-out"
                className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-400 border border-white/[0.06] transition-all hover:bg-white/[0.1] hover:text-white hover:border-white/[0.1]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/*Page content*/}
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="animate-fade-in-up mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Hey, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            {canvases.length > 0
              ? "Here are your canvases. Click to continue drawing."
              : "Create your first canvas to get started."}
          </p>
        </div>

        {canvases.length === 0 ? (
          /*Empty state*/
          <div className="animate-fade-in-up delay-2 flex flex-col items-center justify-center rounded-2xl glass p-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15">
              <Layout className="h-10 w-10 text-indigo-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No canvases yet</h2>
            <p className="mb-8 max-w-sm text-sm text-zinc-400">
              Create a new canvas to start drawing, collaborating, and bringing your ideas to life.
            </p>
            <form action={createNewCanvas}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create Your First Canvas
              </button>
            </form>
          </div>
        ) : (
          /*Canvas grid*/
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canvases.map((canvas, i) => (
              <Link
                href={`/canvas/${canvas.id}`}
                key={canvas.id}
                className={`animate-fade-in-up delay-${Math.min(i + 1, 5)} group relative flex flex-col rounded-2xl glass p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.01]`}
              >
                <div className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 text-indigo-400 transition-colors group-hover:from-indigo-500/25 group-hover:to-purple-500/25">
                    <Pen className="h-4.5 w-4.5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 transition-all group-hover:text-zinc-300 group-hover:translate-x-0.5" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight truncate group-hover:text-white transition-colors">
                  {canvas.name}
                </h2>

                <p className="mt-1.5 text-xs text-zinc-500">
                  Updated{" "}
                  {new Date(canvas.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
