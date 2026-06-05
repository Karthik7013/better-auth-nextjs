"use client"
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

type CardConfig = {
  variant: "gradient" | "skeleton" | "empty";
  className?: string;
  content?: React.ReactNode;
};

const rows: CardConfig[][] = [
  [
    {
      variant: "gradient",
      className: "bg-linear-to-br from-indigo-500 to-purple-600 border-white/10",
      content: (
        <>
          <h3 className="text-2xl font-bold tracking-tight text-white">Close every deal.</h3>
          <div className="h-4 w-2/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-slate-700 rounded-md" />
            <div className="h-4 w-full bg-slate-800 rounded-md" />
            <div className="h-4 w-5/6 bg-slate-800 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-tr from-emerald-500 to-teal-600 border-white/10",
      content: (
        <>
          <h3 className="text-2xl font-bold tracking-tight text-white">Grow faster.</h3>
          <div className="h-12 w-12 bg-white/20 rounded-full" />
        </>
      ),
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-3/4 bg-slate-800 rounded-md" />
          <div className="h-24 w-full bg-slate-800/40 border border-slate-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-pink-500 to-rose-600 border-white/10",
      content: (
        <>
          <p className="text-lg font-medium opacity-90">A snapshot of your pipeline</p>
          <div className="h-4 w-1/2 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "empty",
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-10 w-10 bg-slate-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-800 rounded-md" />
            <div className="h-3 w-4/5 bg-slate-800 rounded-md" />
          </div>
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-amber-500 to-orange-600 border-white/10",
      content: (
        <>
          <h3 className="text-2xl font-bold tracking-tight text-white">Streamline tasks.</h3>
          <div className="h-4 w-1/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-full bg-slate-800 rounded-md" />
          <div className="h-8 w-full bg-slate-800 rounded-md" />
        </>
      ),
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-3/4 bg-slate-800 rounded-md" />
          <div className="h-24 w-full bg-slate-800/40 border border-slate-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-violet-500 to-fuchsia-600 border-white/10",
      content: (
        <>
          <h3 className="text-2xl font-bold tracking-tight text-white">Stay ahead.</h3>
          <div className="h-4 w-1/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-slate-700 rounded-md" />
            <div className="h-4 w-full bg-slate-800 rounded-md" />
            <div className="h-4 w-5/6 bg-slate-800 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
        </>
      ),
    },
  ],
];

function renderCard(card: CardConfig, i: number) {
  const base = "h-64 rounded-xl p-6 shadow-2xl flex flex-col justify-between border";

  if (card.variant === "empty") {
    return (
      <div key={i} className="h-64 rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-800 flex items-center justify-center">
        <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-700 font-mono text-sm">
          Empty Slot
        </div>
      </div>
    );
  }

  if (card.variant === "skeleton") {
    return (
      <div key={i} className={`${base} bg-slate-900 border-slate-800`}>
        {card.content}
      </div>
    );
  }

  return (
    <div key={i} className={`${base} ${card.className}`}>
      {card.content}
    </div>
  );
}

function renderRow(row: CardConfig[], i: number) {
  return (
    <div key={i} className="grid grid-cols-3 gap-6">
      {row.map((card, j) => renderCard(card, j))}
    </div>
  );
}

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white flex items-center justify-center">

      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40 perspective-[1000px]">

        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] origin-center transform rotate-x-60 rotate-z-45 skew-x-[-10deg]">

          <div className="flex flex-col gap-6 p-4 animate-scroll-bg">
            {[...Array(3)].map((_, setIdx) =>
              rows.map((row, rowIdx) => renderRow(row, setIdx * rows.length + rowIdx))
            )}
          </div>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent via-20% to-slate-950" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-transparent via-50% to-slate-950" />
      </div>

      <div className="relative z-10 max-w-xl text-center px-6">
        <div className="flex flex-col flex-1 items-center justify-center font-sans">
          <main className="flex gap-16 flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
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
      </div>
    </div>
  )
}
