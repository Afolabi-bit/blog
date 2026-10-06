"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { userEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { setStoredUser } from "@/lib/client";
import { UpdateProfileSchema, ChangePasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { API_BASE_URL } from "@/lib/client";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, LogOut, Save, User as UserIcon, Shield, PenTool } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profilePending, startProfileTransition] = useTransition();

  // Security state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [securityPending, startSecurityTransition] = useTransition();

  useEffect(() => {
    if (user) {
      if (user.full_name) {
        const parts = user.full_name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || user.picture || "");
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});

    const result = UpdateProfileSchema.safeParse({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl || undefined,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) errs[String(issue.path[0])] = issue.message;
      }
      setProfileErrors(errs);
      return;
    }

    startProfileTransition(async () => {
      const toastId = toast.loading("Saving profile…");
      try {
        const res = await userEndpoints.updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl || undefined,
        });

        if (res.status === "success" && res.data) {
          toast.success("Profile updated successfully!", { id: toastId });
          setUser(res.data);
          setStoredUser(res.data);
        } else {
          toast.error(res.message || "Failed to update profile", { id: toastId });
        }
      } catch (err: unknown) {
        let msg = "Failed to update profile";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        toast.error(msg, { id: toastId });
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrors({});

    const result = ChangePasswordSchema.safeParse({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) errs[String(issue.path[0])] = issue.message;
      }
      setSecurityErrors(errs);
      return;
    }

    startSecurityTransition(async () => {
      const toastId = toast.loading("Changing password…");
      try {
        const res = await userEndpoints.changePassword({
          old_password: oldPassword,
          new_password: newPassword,
        });

        if (res.status === "success") {
          toast.success(
            "Password changed! Please log in with your new password.",
            { id: toastId },
          );
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          await logout();
          router.push("/login");
        } else {
          toast.error(res.message || "Failed to change password", { id: toastId });
        }
      } catch (err: unknown) {
        let msg = "Failed to change password";
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setSecurityErrors({
              old_password: "Current password is incorrect",
            });
            toast.error("Current password is incorrect", { id: toastId });
            return;
          }
          msg = err.response?.data?.message || err.message || msg;
        }
        toast.error(msg, { id: toastId });
      }
    });
  };

  const handleSignOutEverywhere = async () => {
    const toastId = toast.loading("Signing out…");
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Continue client logout
    }
    toast.success("Signed out of all devices", { id: toastId });
    await logout();
    router.push("/login");
  };

  return (
    <div className="py-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, profile presentation, and security preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={`mb-6 grid w-full ${
            user?.role === "reader" ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <TabsTrigger value="profile" className="gap-2 text-xs font-semibold">
            <UserIcon className="size-3.5" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs font-semibold">
            <Lock className="size-3.5" />
            <span>Security</span>
          </TabsTrigger>
          {user?.role === "reader" && (
            <TabsTrigger
              value="author-request"
              className="gap-2 text-xs font-semibold"
            >
              <PenTool className="size-3.5" />
              <span>Author Request</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl font-bold">
                    Public Profile
                  </CardTitle>
                  <CardDescription>
                    Information displayed alongside your published articles and comments.
                  </CardDescription>
                </div>
                {user?.role && (
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-wider py-0.5 px-2"
                  >
                    Role: {user.role}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={profilePending}
                        className="bg-background"
                      />
                      {profileErrors.first_name && (
                        <p className="text-xs text-destructive">{profileErrors.first_name}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={profilePending}
                        className="bg-background"
                      />
                      {profileErrors.last_name && (
                        <p className="text-xs text-destructive">{profileErrors.last_name}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Please confirm your first and last name.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Email address is managed by your account credentials.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell readers about yourself, engineering focus, and background…"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={profilePending}
                    className="resize-none bg-background text-sm"
                  />
                  {profileErrors.bio && (
                    <p className="text-xs text-destructive">{profileErrors.bio}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Profile Picture / Avatar</Label>
                  <AvatarUploader
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    disabled={profilePending}
                  />
                  {profileErrors.avatar_url && (
                    <p className="text-xs text-destructive">{profileErrors.avatar_url}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={profilePending}
                  className="w-fit gap-2 bg-accent-solid text-white hover:bg-accent-solid/90"
                >
                  {profilePending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span>Save Profile</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <Shield className="size-5 text-accent-solid" />
                <span>Security & Password</span>
              </CardTitle>
              <CardDescription>
                Update your account password. Changing password will require you to sign in again.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="old_password">Current Password</Label>
                  <Input
                    id="old_password"
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    disabled={securityPending}
                    className="bg-background"
                  />
                  {securityErrors.old_password && (
                    <p className="text-xs text-destructive">{securityErrors.old_password}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={securityPending}
                    className="bg-background"
                  />
                  {securityErrors.new_password && (
                    <p className="text-xs text-destructive">{securityErrors.new_password}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={securityPending}
                    className="bg-background"
                  />
                  {securityErrors.confirm_password && (
                    <p className="text-xs text-destructive">{securityErrors.confirm_password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={securityPending}
                  className="w-fit gap-2 mt-2 bg-accent-solid text-white hover:bg-accent-solid/90"
                >
                  {securityPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  <span>Update Password</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Sessions & Sign Out Everywhere */}
          <Card className="mt-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg font-bold text-foreground">
                Active Sessions
              </CardTitle>
              <CardDescription>
                Sign out of all web browsers and devices currently logged into your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out of all devices</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll need to sign in again everywhere.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOutEverywhere}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign out everywhere
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Author Request Tab (for readers) */}
        {user?.role === "reader" && (
          <TabsContent value="author-request">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                  <PenTool className="size-5 text-accent-warm" />
                  <span>Author Privileges</span>
                </CardTitle>
                <CardDescription>
                  Apply to become an author on Bloggr to write and publish your own articles.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Readers can apply for author privileges. Once approved, you gain access to the Author Studio, rich text publishing tools, and analytics.
                </p>
                <div>
                  <Button asChild className="gap-2 bg-accent-solid text-white hover:bg-accent-solid/90">
                    <Link href="/settings/author-request">
                      <span>Go to Author Application</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
