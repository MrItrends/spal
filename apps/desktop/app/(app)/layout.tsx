import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UserHydration } from "@/components/UserHydration";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex" style={{ background: "#EEF3E9" }}>
      <UserHydration />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
