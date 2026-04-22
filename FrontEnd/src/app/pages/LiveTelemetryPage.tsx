import { MarketingDetailPage } from '../components/MarketingDetailPage';

export function LiveTelemetryPage() {
  return (
    <MarketingDetailPage
      badge="Live Telemetry"
      title="The Pulse of Your Plantation"
      description="Track weather, moisture, and harvest weight events as they happen. Convert field signals into practical decisions with live dashboards for managers and operations teams."
      highlights={['Weather Signals', 'Harvest Streams', 'Real-Time Alerts']}
    />
  );
}
