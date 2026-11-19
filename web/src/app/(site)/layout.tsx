import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

/** Public site: menu bar on top, floating bottom bar on phones. The admin console has its own layout. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <MobileNav />
    </>
  );
}
