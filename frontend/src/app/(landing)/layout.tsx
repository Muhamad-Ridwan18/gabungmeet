import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell flex min-h-screen flex-col bg-white dark:bg-[var(--background)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
