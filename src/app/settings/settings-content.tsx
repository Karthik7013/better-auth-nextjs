"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Trash2, UserX, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export function SettingsContent() {
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
      await authClient.signOut();
      window.location.replace("/login");
    } catch {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.replace("/login");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>Remove all your watched history at once.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleClearHistory}
            disabled={clearing}
          >
            <Trash2 className="size-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Watch History"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign out or permanently delete your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full"
          >
            <UserX className="size-4 mr-2" />
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
