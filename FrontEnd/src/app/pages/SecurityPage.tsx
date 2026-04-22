import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function SecurityPage() {
  return (
    <MarketingDetailPage
      badge="Enterprise Trust"
      title="Security for Critical Operations"
      description="Protect worker records, crop diagnostics, and financial data with secure access patterns, reliable infrastructure practices, and clear audit controls."
      highlights={['Role-Based Access', 'Encrypted Storage', 'Audit Traceability']}
    />
  );
}
