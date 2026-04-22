import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function AboutUsPage() {
  return (
    <MarketingDetailPage
      badge="Company"
      title="About Tea Planter"
      description="Tea Planter combines Sri Lankan tea domain expertise with practical software engineering to modernize estate operations from field collection to management reporting."
      highlights={['Sri Lanka First', 'AI + Field Operations', 'Built for Estates']}
    />
  );
}
