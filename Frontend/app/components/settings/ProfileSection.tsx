import Button from "../ui/Button";
import Input from "../ui/Input";

type ProfileSectionProps = {
  name: string;
  email: string;
  savingProfile: boolean;
  onNameChange: (value: string) => void;
  onSave: () => void;
};

export default function ProfileSection({
  name,
  email,
  savingProfile,
  onNameChange,
  onSave,
}: ProfileSectionProps) {
  return (
    <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-(--line) p-5 sm:p-6 space-y-4">
      <h2 className="display-title text-2xl text-[#17130f]">Profile</h2>
      <Input
        label="Full name"
        id="name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <Input label="Email" id="email" value={email} disabled />
      <Button
        type="button"
        onClick={onSave}
        disabled={savingProfile}
        className="w-auto px-6"
      >
        {savingProfile ? "Saving..." : "Save profile"}
      </Button>
    </div>
  );
}
