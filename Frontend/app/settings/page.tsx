"use client";

import Footer from "../components/Footer";
import AccountSummaryCard from "../components/settings/AccountSummaryCard";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import ExtensionTokenCard from "../components/settings/ExtensionTokenCard";
import PasswordSection from "../components/settings/PasswordSection";
import PreferencesSection from "../components/settings/PreferencesSection";
import PrivacySection from "../components/settings/PrivacySection";
import ProfileSection from "../components/settings/ProfileSection";
import ReauthSection from "../components/settings/ReauthSection";
import SessionsSection from "../components/settings/SessionsSection";
import SettingsSideNav, {
  type SettingsNavItem,
} from "../components/settings/SettingsSideNav";
import { useSettingsController } from "../components/settings/useSettingsController";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  KeyRound,
  Plug,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCircle2,
} from "../components/ui/icons";

const NAV_ITEMS: SettingsNavItem[] = [
  { id: "account", label: "Account", Icon: ShieldCheck },
  { id: "profile", label: "Profile", Icon: UserCircle2 },
  { id: "preferences", label: "Preferences", Icon: Sparkles },
  { id: "security", label: "Security", Icon: KeyRound },
  { id: "sessions", label: "Sessions", Icon: ShieldCheck },
  { id: "extension", label: "Extension", Icon: Plug },
  { id: "privacy", label: "Privacy", Icon: Trash2 },
];

export default function SettingsPage() {
  const {
    loading,
    profile,
    name,
    setName,
    prefs,
    setPrefs,
    sessions,
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
    reauthPassword,
    setReauthPassword,
    exportJob,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    deleteReason,
    setDeleteReason,
    savingProfile,
    savingPrefs,
    updatingPassword,
    settingPassword,
    reauthing,
    revokingOthers,
    revokingSessionId,
    requestingExport,
    requestingDelete,
    cancelingDelete,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    savePreferences,
    changePassword,
    setupPasswordAction,
    verifyReauth,
    revokeSession,
    revokeOthers,
    requestExport,
    submitDeletion,
    cancelDeletion,
    handleSignOut,
  } = useSettingsController();

  if (loading) {
    return <div className="page-shell px-6">Loading settings...</div>;
  }

  return (
    <div className="page-shell ambient-grid">
      <main id="main-content" className="page-main space-y-6">
        <header>
          <h1 className="page-title display-title text-4xl font-bold text-(--foreground-strong)">
            Settings
          </h1>
          <p className="text-sm text-(--muted-foreground) mt-2">
            Manage your profile, preferences, security, and privacy.
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
          <SettingsSideNav items={NAV_ITEMS} />

          <div className="space-y-6 mt-2 lg:mt-0">
            <section
              id="account"
              aria-labelledby="account-heading"
              className="scroll-mt-24"
            >
              <h2 id="account-heading" className="sr-only">
                Account summary
              </h2>
              <AccountSummaryCard
                profile={profile}
                providerLabel={providerLabel}
                reauthLabel={reauthLabel}
              />
            </section>

            <section
              id="profile"
              aria-labelledby="profile-heading"
              className="scroll-mt-24"
            >
              <h2 id="profile-heading" className="sr-only">
                Profile
              </h2>
              <ProfileSection
                name={name}
                email={profile?.email ?? ""}
                savingProfile={savingProfile}
                onNameChange={setName}
                onSave={saveProfile}
              />
            </section>

            <section
              id="preferences"
              aria-labelledby="preferences-heading"
              className="scroll-mt-24"
            >
              <h2 id="preferences-heading" className="sr-only">
                Preferences
              </h2>
              <PreferencesSection
                prefs={prefs}
                savingPrefs={savingPrefs}
                onPrefsChange={setPrefs}
                onSave={savePreferences}
              />
            </section>

            <section
              id="security"
              aria-labelledby="security-heading"
              className="scroll-mt-24 space-y-6"
            >
              <h2 id="security-heading" className="sr-only">
                Security
              </h2>
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
              <ReauthSection
                profile={profile}
                reauthPassword={reauthPassword}
                reauthing={reauthing}
                onPasswordChange={setReauthPassword}
                onVerify={verifyReauth}
              />
            </section>

            <section
              id="sessions"
              aria-labelledby="sessions-heading"
              className="scroll-mt-24"
            >
              <h2 id="sessions-heading" className="sr-only">
                Active sessions
              </h2>
              <SessionsSection
                sessions={sessions}
                profile={profile}
                revokingOthers={revokingOthers}
                revokingSessionId={revokingSessionId}
                onRevokeSession={revokeSession}
                onRevokeOthers={revokeOthers}
              />
            </section>

            <section
              id="extension"
              aria-labelledby="extension-heading"
              className="scroll-mt-24"
            >
              <h2 id="extension-heading" className="sr-only">
                Extension token
              </h2>
              <ExtensionTokenCard />
            </section>

            <section
              id="privacy"
              aria-labelledby="privacy-heading"
              className="scroll-mt-24"
            >
              <h2 id="privacy-heading" className="sr-only">
                Privacy and data
              </h2>
              <PrivacySection
                profile={profile}
                exportJob={exportJob}
                requestingExport={requestingExport}
                requestingDelete={requestingDelete}
                cancelingDelete={cancelingDelete}
                onRequestExport={requestExport}
                onOpenDeleteModal={() => setDeleteOpen(true)}
                onCancelDeletion={cancelDeletion}
              />
            </section>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setLogoutOpen(true)}
              className="w-auto px-6"
            >
              Sign out
            </Button>
          </div>
        </div>

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

        <DeleteAccountModal
          open={deleteOpen}
          deleteConfirm={deleteConfirm}
          deleteReason={deleteReason}
          requestingDelete={requestingDelete}
          onDeleteConfirmChange={setDeleteConfirm}
          onDeleteReasonChange={setDeleteReason}
          onClose={() => setDeleteOpen(false)}
          onSubmit={submitDeletion}
        />

        <Footer />
      </main>
    </div>
  );
}
