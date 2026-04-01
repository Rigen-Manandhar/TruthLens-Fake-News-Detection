import type { AdminRecentUser } from "@/lib/shared/admin";
import { formatDateTime } from "./dashboardUtils";

type AdminRecentUsersSectionProps = {
  recentUsers: AdminRecentUser[];
};

export default function AdminRecentUsersSection({
  recentUsers,
}: AdminRecentUsersSectionProps) {
  return (
    <section className="section-reveal delay-2 rounded-[2rem] border border-(--line) bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
            Recent users
          </p>
          <h2 className="mt-2 page-title display-title text-3xl font-bold text-[#17130f]">
            Latest account signups.
          </h2>
        </div>
        <p className="text-sm text-(--muted-foreground)">Newest accounts first.</p>
      </div>

      {recentUsers.length === 0 ? (
        <p className="mt-6 text-sm text-(--muted-foreground)">
          No users have signed up yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {recentUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#17130f]">{user.name}</p>
                  <p className="mt-1 break-all text-sm text-[#5f5548]">{user.email}</p>
                </div>
                <span className="inline-flex rounded-full border border-(--line) bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5548]">
                  {user.role}
                </span>
              </div>
              <div className="mt-4 text-sm leading-6 text-(--muted-foreground)">
                <p>Created: {formatDateTime(user.createdAt)}</p>
                <p>Updated: {formatDateTime(user.updatedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
