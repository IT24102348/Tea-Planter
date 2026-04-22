import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function ApiAccessPage() {
  return (
    <MarketingDetailPage
      badge="Developers"
      title="Build with Tea Planter API"
      description="Connect disease diagnosis, telemetry, and workforce metrics to your ERP, warehouse systems, or custom analytics stack through secure integration endpoints."
      highlights={['Secure Auth', 'Operational Webhooks', 'ERP Integration']}
    />
  );
}
