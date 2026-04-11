"use client";

import Footer from "../components/Footer";
import AccountSummaryCard from "../components/settings/AccountSummaryCard";
import ExtensionTokenCard from "../components/settings/ExtensionTokenCard";
import PasswordSection from "../components/settings/PasswordSection";
import ProfileSection from "../components/settings/ProfileSection";
import { useSettingsController } from "../components/settings/useSettingsController";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function SettingsPage() {
  const {
    loading,
    profile,
    name,
    setName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setupPassword,
    setSetupPassword,
    setupConfirmPassword,
    setSetupConfirmPassword,
    savingProfile,
    updatingPassword,
    settingPassword,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    changePassword,
    setupPasswordAction,
    handleSignOut,
  } = useSettingsController();

  if (loading) {
    return <div className="page-shell px-6">Loading settings...</div>;
  }

  return (
    <div className="page-shell ambient-grid">
      <main className="page-main space-y-6">
        <header>
          <h1 className="page-title display-title text-4xl font-bold text-[#17130f]">
            Settings
          </h1>
          <p className="text-sm text-(--muted-foreground) mt-2">
            Manage your profile, password, and extension access.
          </p>
        </header>

        <AccountSummaryCard
          profile={profile}
          providerLabel={providerLabel}
          reauthLabel={reauthLabel}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <ProfileSection
            name={name}
            email={profile?.email ?? ""}
            savingProfile={savingProfile}
            onNameChange={setName}
            onSave={saveProfile}
          />
          <PasswordSection
            profile={profile}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            setupPassword={setupPassword}
            setupConfirmPassword={setupConfirmPassword}
            updatingPassword={updatingPassword}
            settingPassword={settingPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSetupPasswordChange={setSetupPassword}
            onSetupConfirmPasswordChange={setSetupConfirmPassword}
            onChangePassword={changePassword}
            onSetupPassword={setupPasswordAction}
          />
        </section>

        <section>
          <ExtensionTokenCard />
        </section>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setLogoutOpen(true)}
          className="w-auto px-6"
        >
          Sign out
        </Button>
        <ConfirmDialog
          open={logoutOpen}
          title="Sign out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          cancelLabel="Cancel"
          isLoading={signingOut}
          onConfirm={async () => {
            await handleSignOut();
          }}
          onCancel={() => setLogoutOpen(false)}
        />

        <Footer />
      </main>
    </div>
  );
}
