import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Approvals" };

export default async function Approvals(){
  const session = await getServerSession(authOptions);
  const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email }}) : null;
  if (!me || me.role !== "SUPER_ADMIN") return notFound();

  const pending = await prisma.user.findMany({ where: { role: "COACH", status: "PENDING" }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Coach Approvals</h1>
      <ul className="space-y-2">
        {pending.map(u=>(
          <li key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name} <span className="muted">({u.email})</span></div>
              <div className="muted text-xs">{u.createdAt.toDateString()}</div>
            </div>
            <div className="flex gap-2">
              <form action={"/api/admin/users/"+u.id+"/status"} method="post">
                <input type="hidden" name="status" value="ACTIVE" />
                <button className="btn">Approve</button>
              </form>
              <form action={"/api/admin/users/"+u.id+"/status"} method="post">
                <input type="hidden" name="status" value="DISABLED" />
                <button className="btn">Disable</button>
              </form>
            </div>
          </li>
        ))}
        {pending.length===0 && <li className="muted">No pending requests.</li>}
      </ul>
    </div>
  );
}
