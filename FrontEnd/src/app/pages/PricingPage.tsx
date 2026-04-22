import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function PricingPage() {
  return (
    <MarketingDetailPage
      badge="Simple Pricing"
      title="Scale Without Limits"
      description="Choose a plan based on estate complexity rather than worker count. Keep costs predictable while adding features like AI diagnosis, reports, and telemetry."
      highlights={['Flat Estate Tiers', 'No Per-Worker Fees', 'Implementation Support']}
    />
  );
}
