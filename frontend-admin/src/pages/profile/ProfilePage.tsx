import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FileUpload } from "@/components/ui/FileUpload";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useProfile, useUpdateProfile } from "@/hooks/queries/useProfile";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { STORAGE_PATHS } from "@/lib/storage";
import type { ReactNode } from "react";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { isOnline } = useOnlineStatus();
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const user = data?.data;

  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "";

  useEffect(() => {
    document.title = "My Profile | Joyful Trekking Admin";
  }, []);

  useEffect(() => {
    if (feedback?.type !== "success") return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "" },
  });

  const startEditing = () => {
    reset({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
    setIsEditing(true);
  };

  const onSubmitProfile = (values: ProfileFormValues) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        setIsEditing(false);
        setFeedback({ type: "success", message: "Profile updated successfully" });
      },
      onError: (err) => setFeedback({ type: "error", message: getErrorMessage(err) }),
    });
  };

  const onAvatarUploaded = (path: string) => {
    updateProfile.mutate(
      { avatar: path },
      {
        onSuccess: () => setFeedback({ type: "success", message: "Profile updated successfully" }),
        onError: (err) => setFeedback({ type: "error", message: getErrorMessage(err) }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" isLoading={isLoading} />

      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}
      {feedback && (
        <Alert variant={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PageCard>
            {isLoading || !user ? (
              <Skeleton count={4} />
            ) : (
              <div className="flex flex-col items-center text-center">
                <UserAvatar photoPath={user.avatar} name={fullName} size="xl" />
                <p className="mt-4 text-xl font-semibold text-gray-900">{fullName}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <Badge label={user.role.name} variant="indigo" />
                  {user.isSuperAdmin && <Badge label="Super Admin" variant="purple" />}
                </div>
                <p className="mt-1 text-sm text-gray-500">{user.email}</p>

                <div className="mt-6 w-full text-left">
                  <FileUpload
                    label="Profile Photo"
                    type="image"
                    bucket="public"
                    accept="image/jpeg,image/png,image/webp"
                    storagePath={STORAGE_PATHS.userAvatar(user.id)}
                    currentPath={user.avatar}
                    onUploadComplete={onAvatarUploaded}
                    hint="JPG, PNG or WebP. Max 5MB."
                    disabled={!isOnline}
                  />
                </div>
              </div>
            )}
          </PageCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <PageCard>
            {isLoading || !user ? (
              <Skeleton count={4} />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={startEditing} disabled={!isOnline}>
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmitProfile)}>
                    <fieldset disabled={!isOnline} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                          label="First Name"
                          error={errors.firstName?.message}
                          {...register("firstName")}
                        />
                        <Input
                          label="Last Name"
                          error={errors.lastName?.message}
                          {...register("lastName")}
                        />
                      </div>
                      <Input
                        label="Email"
                        value={user.email}
                        disabled
                        hint="Email cannot be changed"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsEditing(false)}
                          disabled={updateProfile.isPending}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" isLoading={updateProfile.isPending} disabled={!isOnline}>
                          Save
                        </Button>
                      </div>
                    </fieldset>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoItem label="First Name" value={user.firstName ?? "—"} />
                    <InfoItem label="Last Name" value={user.lastName ?? "—"} />
                    <InfoItem label="Email" value={user.email} />
                    <InfoItem label="Role" value={user.role.name} />
                    <InfoItem
                      label="Status"
                      value={
                        <Badge
                          label={user.isActive ? "Active" : "Inactive"}
                          variant={user.isActive ? "green" : "red"}
                        />
                      }
                    />
                  </div>
                )}
              </>
            )}
          </PageCard>

          <PageCard>
            {isLoading || !user ? (
              <Skeleton count={4} />
            ) : (
              <>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Account Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem label="Account Type" value={user.isSuperAdmin ? "Super Admin" : user.role.name} />
                  <InfoItem label="Member Since" value={formatDate(user.createdAt)} />
                  <InfoItem label="Last Updated" value={formatDate(user.updatedAt)} />
                </div>
              </>
            )}
          </PageCard>
        </div>
      </div>
    </div>
  );
}
