"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session && !isPending) {
      router.replace("/home");
    }
  }, [session, isPending, router]);

  if (isPending) return null;
  if (session) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      setError(null);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (err) {
      console.error("Login failed:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    try {
      setError(null);
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/home",
      });
    } catch (err) {
      console.error("Login failed:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-sans">
      {/* Back Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group"
      >
        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Link>

      {/* Background Decor - Reusing the cinematic poster theme but blurred */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20 perspective-[1200px]">
        <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-[35deg] rotate-z-[20deg] skew-x-[-10deg] blur-sm">
          <div className="flex flex-col gap-8 p-4 animate-scroll-bg opacity-50">
            {/* Increased row and column count to ensure a continuous scrolling effect */}
            {[...Array(12)].map((_, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-4 sm:grid-cols-8 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-900/50 border border-zinc-800" />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-at-c from-transparent to-zinc-950" />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Image
              className="dark:invert mb-2 hover:opacity-80 transition-opacity"
              src="/next.svg"
              alt="StreamFlix logo"
              width={120}
              height={24}
              priority
            />
          </Link>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-zinc-400 text-sm">
              Sign in to access your library and continue your cinematic journey.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full h-12 bg-[#24292f] text-white hover:bg-[#1b1f23] rounded-full font-semibold transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </>
              )}
            </Button>

            <p className="text-center text-xs text-zinc-500 mt-6 leading-relaxed">
              By signing in, you agree to our <br />
              <Link href="#" className="underline hover:text-zinc-300">Terms of Service</Link> and{" "}
              <Link href="#" className="underline hover:text-zinc-300">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Don&apos;t have an account? Google will automatically create one for you.
          </p>
        </div>
      </div>
    </div>
  );
}
