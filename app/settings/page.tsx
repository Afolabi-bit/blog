"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { userEndpoints } from "@/lib/endpoints";
import { useAuth } from "@/components/general/AuthProvider";
import { setStoredUser } from "@/lib/client";
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
import { CoverUploader } from "@/components/editor/CoverUploader";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePending, startProfileTransition] = useTransition();

  // Security Form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityPending, startSecurityTransition] = useTransition();

  useEffect(() => {
    // Populate user profile info
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

    startProfileTransition(async () => {
      try {
        const res = await userEndpoints.updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl || undefined,
        });

        if (res.status === "success" && res.data) {
          toast.success("Profile updated successfully!");
          setUser(res.data);
          setStoredUser(res.data);
        } else {
          toast.error(res.message || "Failed to update profile");
        }
      } catch (err: unknown) {
        let msg = "Failed to update profile";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        toast.error(msg);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    startSecurityTransition(async () => {
      try {
        const res = await userEndpoints.changePassword({
          old_password: oldPassword,
          new_password: newPassword,
        });

        if (res.status === "success") {
          toast.success("Password changed! Please log in with your new password.");
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          await logout();
          router.push("/login");
        } else {
          toast.error(res.message || "Failed to change password");
        }
      } catch (err: unknown) {
        let msg = "Failed to change password";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || err.message || msg;
        }
        toast.error(msg);
      }
    });
  };

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal details and security preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "profile"
              ? "text-[#ef862b] border-b-2 border-[#ef862b]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "security"
              ? "text-[#ef862b] border-b-2 border-[#ef862b]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Security & Password
        </button>
      </div>

      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              This information will be displayed alongside your articles and comments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={profilePending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={profilePending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label>Avatar Photo</Label>
                <CoverUploader
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  disabled={profilePending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Share a short bio..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={profilePending}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button type="submit" disabled={profilePending}>
                  {profilePending ? "Saving..." : "Save Profile"}
                </Button>

                {user?.role === "reader" && (
                  <Link
                    href="/settings/author-request"
                    className="text-xs text-[#ef862b] hover:underline font-medium"
                  >
                    Apply to Become an Author →
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Ensure your account is using a strong password. Changing your password will sign you out of all sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  disabled={securityPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={securityPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={securityPending}
                />
              </div>

              <Button type="submit" disabled={securityPending}>
                {securityPending ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
