import SiteHeader from "@/components/layout/site-header";
import BusinessesMap from "@/components/map/businesses-map";

export default function BusinessesMapPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main>
        <BusinessesMap />
      </main>
    </div>
  );
}
