import Button from "../ui/Button";
import Input from "../ui/Input";
import type { AccountProfile } from "./types";

type PasswordSectionProps = {
  profile: AccountProfile | null;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setupPassword: string;
  setupConfirmPassword: string;
  updatingPassword: boolean;
  settingPassword: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSetupPasswordChange: (value: string) => void;
  onSetupConfirmPasswordChange: (value: string) => void;
  onChangePassword: () => void;
  onSetupPassword: () => void;
};

export default function PasswordSection({
  profile,
  currentPassword,
  newPassword,
  confirmPassword,
  setupPassword,
  setupConfirmPassword,
  updatingPassword,
  settingPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSetupPasswordChange,
  onSetupConfirmPasswordChange,
  onChangePassword,
  onSetupPassword,
}: PasswordSectionProps) {
  return (
    <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
      <h2 className="display-title text-2xl text-[#17130f]">
        {profile?.hasPassword ? "Change password" : "Set backup password"}
      </h2>
      {profile?.hasPassword ? (
        <>
          <Input
            label="Current password"
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
          />
          <Input
            label="New password"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
          />
          <Input
            label="Confirm new password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
          <Button
            type="button"
            onClick={onChangePassword}
            disabled={updatingPassword}
            className="w-auto px-6"
          >
            {updatingPassword ? "Updating..." : "Update password"}
          </Button>
        </>
      ) : (
        <>
          <Input
            label="New backup password"
            id="setupPassword"
            type="password"
            value={setupPassword}
            onChange={(e) => onSetupPasswordChange(e.target.value)}
          />
          <Input
            label="Confirm backup password"
            id="setupConfirmPassword"
            type="password"
            value={setupConfirmPassword}
            onChange={(e) => onSetupConfirmPasswordChange(e.target.value)}
          />
          <Button
            type="button"
            onClick={onSetupPassword}
            disabled={settingPassword}
            className="w-auto px-6"
          >
            {settingPassword ? "Saving..." : "Set backup password"}
          </Button>
        </>
      )}
    </div>
  );
}
