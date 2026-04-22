import React from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

interface MarketingDetailPageProps {
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

export function MarketingDetailPage({
  badge,
  title,
  description,
  highlights,
}: MarketingDetailPageProps) {
  return (
    <div className="min-h-screen bg-[#D7E4DC] font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto bg-[#E8F0E9] rounded-[2.5rem] md:rounded-[4rem] min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-2xl border border-white/40 flex flex-col">
        <PublicNavbar />

        <div className="relative pt-40 pb-20 px-6 md:px-12 lg:px-20 flex-grow">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider mb-8">
              {badge}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">{title}</h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mb-10">
              {description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {highlights.map((item) => (
                <div key={item} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{item}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Designed for Sri Lankan tea estate operations with practical workflows, audit-ready
                    visibility, and smoother day-to-day team coordination.
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="mt-auto">
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
