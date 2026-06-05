"use client"
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">
            Welcome to StreamFlix, your cinematic journey starts here.
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            Dive into a vast library of films and series. Discover new releases, binge-watch classics, and find your next obsession.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            href={session ? "/home" : "/login"}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-primary text-primary-foreground gap-2 hover:bg-primary/90 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            {isPending ? <Loader2 /> : ""}
            {session ? " Continue to Dashboard" : "Get Started"}
          </Link>

        </div>
      </main>
    </div>
  );
}
