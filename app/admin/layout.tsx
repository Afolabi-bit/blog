import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  // Route guard: strictly Admin access
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="py-6">
      <div className="mb-6 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Admin Moderation Console
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Review author promotion requests and moderate system-wide publications
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
