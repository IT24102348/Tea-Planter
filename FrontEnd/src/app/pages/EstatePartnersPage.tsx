import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function EstatePartnersPage() {
  return (
    <MarketingDetailPage
      badge="Community"
      title="Our Estate Partners"
      description="We support estates across elevations, factory sizes, and management models. Partners use Tea Planter to improve transparency, accountability, and output quality."
      highlights={['Highland Estates', 'Mid-Country Operations', 'Low-Grown Networks']}
    />
  );
}
