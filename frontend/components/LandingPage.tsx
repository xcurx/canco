import Link from "next/link";
import {
  Pen,
  Users,
  Cloud,
  Zap,
  ArrowRight,
  Github,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b] text-white font-[family-name:var(--font-inter)]">
      <div aria-hidden className="orb orb-1" />
      <div aria-hidden className="orb orb-2" />
      <div aria-hidden className="orb orb-3" />

      {/*Navbar*/}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <Pen className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Canco</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/canvas/local"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Try it out
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/signin"
            id="landing-sign-in"
            className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-5 py-2.5 text-sm font-semibold backdrop-blur-sm border border-white/[0.06] transition-all hover:bg-white/[0.14] hover:border-white/[0.12] hover:shadow-lg hover:shadow-indigo-500/5"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/*Hero*/}
      <section className="relative z-10 flex flex-col items-center px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
        <div className="animate-fade-in-up">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open Source &amp; Free
          </span>
        </div>

        <h1 className="animate-fade-in-up delay-1 max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
          Draw together,{" "}
          <span className="text-gradient">in real-time</span>
        </h1>

        <p className="animate-fade-in-up delay-2 mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed md:text-xl">
          An infinite collaborative canvas where ideas flow freely.
          Sketch, diagram, and design with your team — instantly.
        </p>

        <div className="animate-fade-in-up delay-3 mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/canvas/local"
            id="landing-cta-primary"
            className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] px-8 py-3.5 text-base font-semibold shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
            style={{ animation: "gradient-shift 4s ease infinite" }}
          >
            Start Drawing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/signin"
            id="landing-cta-secondary"
            className="glass inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In to Save
          </Link>
        </div>
      </section>

      {/*Features*/}
      <section className="relative z-10 px-6 pb-28 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Real-time Collaboration",
              desc: "Invite teammates to draw together with live cursors and instant sync.",
              delay: "delay-1",
            },
            {
              icon: Cloud,
              title: "Cloud Persistence",
              desc: "Sign in to save your canvases. Pick up right where you left off, on any device.",
              delay: "delay-2",
            },
            {
              icon: Zap,
              title: "Zero Friction",
              desc: "No sign-up required to start. Jump straight into a local canvas and start creating.",
              delay: "delay-3",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`animate-fade-in-up ${f.delay} glass group rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.02]`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 transition-colors group-hover:from-indigo-500/30 group-hover:to-purple-500/30">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/*Footer*/}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-sm text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <p>
            Built with <span className="text-red-400">❤</span>
          </p>
          <a
            href="https://github.com/xcurx/canco"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
