import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useChangePassword } from "@/hooks/queries/useProfile";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const STRENGTH_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "Contains uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "Contains lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "Contains a number", test: (v) => /[0-9]/.test(v) },
];

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const changePassword = useChangePassword();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");

  useEffect(() => {
    document.title = "Change Password | Your Company Admin";
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const onSubmit = (values: ChangePasswordFormValues) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          reset();
          setSuccessMessage("Password updated successfully");
          redirectTimer.current = setTimeout(() => navigate(PATHS.PROFILE), 2000);
        },
        onError: (err) => {
          const status = getErrorStatus(err);
          setErrorMessage(status === 401 ? "Current password is incorrect" : getErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Change Password" backHref={PATHS.PROFILE} />

      <PageCard className="mx-auto max-w-md">
        {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}
        {successMessage && <Alert variant="success" message={successMessage} />}
        {errorMessage && (
          <Alert variant="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5" noValidate>
          <fieldset disabled={!isOnline} className="space-y-5">
            <Input
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              required
              error={errors.currentPassword?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("currentPassword")}
            />

            <div>
              <Input
                label="New Password"
                type={showNew ? "text" : "password"}
                required
                error={errors.newPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register("newPassword")}
              />
              <ul className="mt-2 space-y-1">
                {STRENGTH_RULES.map((rule) => {
                  const passed = rule.test(newPassword ?? "");
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs ${
                        passed ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Input
              label="Confirm New Password"
              type={showConfirm ? "text" : "password"}
              required
              error={errors.confirmPassword?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={changePassword.isPending}
              disabled={!isOnline}
            >
              Update Password
            </Button>
          </fieldset>
        </form>
      </PageCard>
    </div>
  );
}
