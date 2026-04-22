import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function BlogPage() {
  return (
    <MarketingDetailPage
      badge="Insights"
      title="The Tea Planter Blog"
      description="Read practical articles on tea estate digitalization, AI in agriculture, and lessons from real deployment environments across Sri Lanka."
      highlights={['Product Updates', 'Field Case Studies', 'Operational Guides']}
    />
  );
}
