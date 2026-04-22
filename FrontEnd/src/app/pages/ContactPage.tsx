import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function ContactPage() {
  return (
    <MarketingDetailPage
      badge="Reach Out"
      title="We Are Here to Help"
      description="Talk to our team about onboarding, data migration, hardware telemetry setup, and training plans for owners, clerks, and field staff."
      highlights={['Sales Inquiries', 'Implementation Support', 'Technical Help']}
    />
  );
}
