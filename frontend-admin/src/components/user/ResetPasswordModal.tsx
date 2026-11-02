import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useResetPassword } from "@/hooks/queries/useUsers";
import { getErrorMessage } from "@/lib/apiError";

interface ResetPasswordModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ userId, isOpen, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resetPassword = useResetPassword(userId);

  const handleClose = () => {
    setNewPassword("");
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    setError(null);
    resetPassword.mutate(
      { newPassword },
      {
        onSuccess: handleClose,
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button> 
          <Button
            onClick={handleSubmit}
            isLoading={resetPassword.isPending}
            disabled={newPassword.length < 8}
          >
            Reset Password
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
        <Input
          label="New Password"
          type="password"
          required
          hint="Must be at least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
    </Modal>
  );
}
