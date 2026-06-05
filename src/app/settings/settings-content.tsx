"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Trash2, UserX, LogOut } from "lucide-react";

export function SettingsContent() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm("Clear all watch history?")) return;
    setClearing(true);
    try {
      await fetch("/api/users/history", { method: "DELETE" });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete your account and all data."
      )
    )
      return;
    setDeleting(true);
    try {
      await fetch("/api/users/account", { method: "DELETE" });
      authClient.signOut();
      router.push("/login");
    } catch {
      setDeleting(false);
    }
  };

  const handleSignOut = () => {
    router.push("/login");
    authClient.signOut();
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Watch History</h2>
        <Button
          variant="outline"
          onClick={handleClearHistory}
          disabled={clearing}
        >
          <Trash2 className="size-4 mr-2" />
          {clearing ? "Clearing..." : "Clear Watch History"}
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="size-4 mr-2" />
          Sign Out
        </Button>
        <div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            <UserX className="size-4 mr-2" />
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
