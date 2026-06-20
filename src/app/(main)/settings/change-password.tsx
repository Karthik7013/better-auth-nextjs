"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChangePassword() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setChangingPassword(false);

    if (error) {
      setPasswordError(error.message || "Failed to change password");
    } else {
      setPasswordSuccess(true);
      form.reset();
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-16 h-6" /></CardTitle>
          <CardDescription><Skeleton className="w-56 h-6" /></CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3" onSubmit={handlePasswordChange}>
          <Input
            name="currentPassword"
            type="password"
            placeholder="Current password"
            required
          />
          <Input
            name="newPassword"
            type="password"
            placeholder="New password (8+ characters)"
            required
            minLength={8}
          />
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            required
          />
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-emerald-500">Password changed successfully.</p>
          )}
          <Button type="submit" disabled={changingPassword}>
            <Lock className="size-4 mr-2" />
            {changingPassword ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
