import Button from "../ui/Button";
import Input from "../ui/Input";
import type { AccountProfile } from "./types";

type ReauthSectionProps = {
  profile: AccountProfile | null;
  reauthPassword: string;
  reauthing: boolean;
  onPasswordChange: (value: string) => void;
  onVerify: (method: "password" | "google") => void;
};

export default function ReauthSection({
  profile,
  reauthPassword,
  reauthing,
  onPasswordChange,
  onVerify,
}: ReauthSectionProps) {
  return (
    <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
      <h2 className="display-title text-2xl text-[#17130f]">Re-authentication</h2>
      {profile?.providerInfo.passwordLogin ? (
        <>
          <Input
            label="Current password"
            id="reauthPassword"
            type="password"
            value={reauthPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => onVerify("password")}
            disabled={reauthing}
            className="w-auto px-6"
          >
            {reauthing ? "Verifying..." : "Verify identity"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Google-only accounts must use a fresh Google sign-in for sensitive
            actions. If verification fails, sign out, sign back in with Google,
            then retry within 10 minutes.
          </p>
          <Button
            type="button"
            onClick={() => onVerify("google")}
            disabled={reauthing}
            className="w-auto px-6"
          >
            {reauthing ? "Verifying..." : "Verify with Google"}
          </Button>
        </>
      )}
    </div>
  );
}
