"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Generate a unique room ID and redirect
    const roomId = crypto.randomUUID().slice(0, 8);
    router.replace(`/canvas/${roomId}`);
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#121212]">
      <p className="text-white">Creating room...</p>
    </div>
  );
}