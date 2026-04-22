import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#D7E4DC] font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto bg-[#E8F0E9] rounded-[2.5rem] md:rounded-[4rem] min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-2xl border border-white/40 flex flex-col">
        <PublicNavbar />

        <div className="relative pt-40 pb-20 px-6 md:px-12 lg:px-20 flex-grow">
          <article className="max-w-4xl mx-auto bg-white/70 border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-gray-700 leading-relaxed mb-5">
              Tea Planter collects and processes operational data to provide estate management,
              reporting, and platform security services.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">What We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              We may process account details, workforce records, harvest and telemetry inputs, and
              usage logs needed to operate the platform.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">How We Use Data</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Data is used to deliver core product features, improve reliability, provide analytics,
              and protect your account against abuse or unauthorized access.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Security and Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              We apply practical safeguards for storage and access control. Data is retained according
              to business and regulatory needs of the service.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You can request data access, correction, or deletion through our support/contact channels
              where applicable under relevant law.
            </p>
          </article>
        </div>

        <div className="mt-auto">
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
