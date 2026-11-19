import type { Metadata } from "next";
import { Ban, CircleCheck } from "lucide-react";
import { requireAdminPage, serviceClient } from "@/lib/admin";
import { setUserBlocked, setUserRole } from "../actions";
import { ActionButton, StatusSelect, TableFilters } from "../ui";
import { Badge, Empty, PageHead, str, when } from "../shared";

export const metadata: Metadata = { title: "Users" };
const ROLES = ["tenant", "owner", "admin"] as const;

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const { supabase, user: me } = await requireAdminPage();
  const sp = await searchParams;
  const role = str(sp.role), q = str(sp.q).toLowerCase().trim();

  // Emails, sign-in times and blocks live in Supabase Auth: read them with the service key (admin already verified).
  const [{ data: profiles }, { data: auth }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,company_name,phone,role,created_at").order("created_at", { ascending: false }),
    serviceClient().auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("listings").select("owner_id"),
  ]);
  const authById = new Map((auth?.users ?? []).map((u) => [u.id, u]));
  const listingCount = (listings ?? []).reduce<Record<string, number>>((a, l) => { if (l.owner_id) a[l.owner_id] = (a[l.owner_id] ?? 0) + 1; return a; }, {});

  const rows = (profiles ?? [])
    .map((p) => {
      const a = authById.get(p.id);
      const blocked = !!a?.banned_until && new Date(a.banned_until) > new Date();
      return { ...p, email: a?.email ?? "—", lastSignIn: a?.last_sign_in_at ?? null, confirmed: !!a?.email_confirmed_at, blocked };
    })
    .filter((u) => (!role || u.role === role) && (!q || [u.full_name, u.company_name, u.email, u.phone].some((v) => v?.toLowerCase().includes(q))));

  return (
    <>
      <PageHead title="Users" sub={`${rows.length} shown. Change roles or block accounts. Blocked users cannot sign in.`} />
      <div className="mb-4"><TableFilters statuses={ROLES} param="role" placeholder="Search name, company, email, phone…" /></div>
      {!rows.length ? <Empty text="No users match." /> : (
        <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>{["User", "Company / phone", "Role", "Listings", "Joined", "Last sign-in", "Access"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className={`border-t border-line align-middle ${u.blocked ? "bg-coral/5" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-bold">{u.full_name ?? "—"} {isMe && <span className="ml-1 rounded-full bg-lime px-2 py-0.5 text-[10px]">You</span>}</p>
                      <p className="text-xs text-muted">{u.email}{!u.confirmed && <span className="ml-1 text-amber">(email not confirmed)</span>}</p>
                    </td>
                    <td className="px-4 py-3"><p className="font-semibold">{u.company_name ?? "—"}</p><p className="text-xs text-muted">{u.phone ?? ""}</p></td>
                    <td className="px-4 py-3">
                      {isMe ? <Badge s="admin" /> : <StatusSelect action={setUserRole.bind(null, u.id)} value={u.role} options={ROLES} label={`Role of ${u.full_name ?? u.email}`} />}
                    </td>
                    <td className="px-4 py-3 font-semibold">{listingCount[u.id] ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-muted">{when(u.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{when(u.lastSignIn, true)}</td>
                    <td className="px-4 py-3">
                      {isMe ? <span className="text-xs text-muted">—</span> : u.blocked
                        ? <ActionButton action={setUserBlocked.bind(null, u.id, false)} className="bg-mint/10 text-mint hover:bg-mint/20"><CircleCheck className="size-3.5" /> Unblock</ActionButton>
                        : <ActionButton action={setUserBlocked.bind(null, u.id, true)} confirm={`Block ${u.email}? They will not be able to sign in until unblocked.`}
                            className="bg-coral/10 text-coral hover:bg-coral hover:text-white"><Ban className="size-3.5" /> Block</ActionButton>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Roles: <Badge s="tenant" /> searches and requests space · <Badge s="owner" /> lists space · <Badge s="admin" /> full control.</p>
    </>
  );
}
