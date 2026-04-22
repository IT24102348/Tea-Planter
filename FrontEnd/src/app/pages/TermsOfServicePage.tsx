import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#D7E4DC] font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto bg-[#E8F0E9] rounded-[2.5rem] md:rounded-[4rem] min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-2xl border border-white/40 flex flex-col">
        <PublicNavbar />

        <div className="relative pt-40 pb-20 px-6 md:px-12 lg:px-20 flex-grow">
          <article className="max-w-4xl mx-auto bg-white/70 border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-gray-700 leading-relaxed mb-5">
              By using Tea Planter, you agree to use the platform responsibly for lawful tea estate
              operations, data management, and analytics workflows.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              You must not misuse, disrupt, reverse-engineer, or attempt unauthorized access to any
              part of the platform, its APIs, or connected systems.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Accounts and Access</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              You are responsible for account credentials, user permissions, and all activity under
              your organization workspace.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Data and Availability</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              We aim for reliable service, but availability can vary due to maintenance, updates, or
              external disruptions. You remain responsible for maintaining your business continuity.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For legal or contract questions, contact our team through the Contact page.
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
