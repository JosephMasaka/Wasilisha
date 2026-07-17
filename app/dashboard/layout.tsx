import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import DashboardNav from "@/components/navbar/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "var(--bg)" }}>
      <DashboardNav
        companyName={session.user.companyName}
        signOutSlot={<SignOutButton />}
      />
      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-10 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}