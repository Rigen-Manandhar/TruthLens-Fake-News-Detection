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
import { useSettingsController } from "../components/settings/useSettingsController";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function SettingsPage() {
  const {
    loading,
    profile,
    sessions,
    name,
    setName,
    prefs,
    setPrefs,
    reauthPassword,
    setReauthPassword,
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
    deleteConfirm,
    setDeleteConfirm,
    deleteReason,
    setDeleteReason,
    exportJob,
    savingProfile,
    savingPrefs,
    reauthing,
    updatingPassword,
    settingPassword,
    revokingOthers,
    revokingSessionId,
    requestingExport,
    requestingDelete,
    cancelingDelete,
    deleteModal,
    setDeleteModal,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    savePrefs,
    doReauth,
    changePassword,
    setupPasswordAction,
    revokeSession,
    revokeOthers,
    requestExport,
    requestDeletion,
    cancelDeletion,
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
            Profile, security, privacy and product defaults.
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
          <ReauthSection
            profile={profile}
            reauthPassword={reauthPassword}
            reauthing={reauthing}
            onPasswordChange={setReauthPassword}
            onVerify={doReauth}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
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
          <PreferencesSection
            prefs={prefs}
            savingPrefs={savingPrefs}
            onPrefsChange={setPrefs}
            onSave={savePrefs}
          />
        </section>

        <section>
          <ExtensionTokenCard />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SessionsSection
            sessions={sessions}
            profile={profile}
            revokingOthers={revokingOthers}
            revokingSessionId={revokingSessionId}
            onRevokeSession={revokeSession}
            onRevokeOthers={revokeOthers}
          />
          <PrivacySection
            profile={profile}
            exportJob={exportJob}
            requestingExport={requestingExport}
            requestingDelete={requestingDelete}
            cancelingDelete={cancelingDelete}
            onRequestExport={requestExport}
            onOpenDeleteModal={() => setDeleteModal(true)}
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
          open={deleteModal}
          deleteConfirm={deleteConfirm}
          deleteReason={deleteReason}
          requestingDelete={requestingDelete}
          onDeleteConfirmChange={setDeleteConfirm}
          onDeleteReasonChange={setDeleteReason}
          onClose={() => setDeleteModal(false)}
          onSubmit={requestDeletion}
        />

        <Footer />
      </main>
    </div>
  );
}
