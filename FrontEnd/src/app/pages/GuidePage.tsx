import React from 'react';
import {
  BookCheck,
  ScanLine,
  Users,
  Activity,
  ShieldCheck,
  Crown,
  ClipboardList,
  UserCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

export function GuidePage() {
  return (
    <div className="min-h-screen bg-[#D7E4DC] font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto bg-[#E8F0E9] rounded-[2.5rem] md:rounded-[4rem] min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-2xl border border-white/40 flex flex-col">
        <PublicNavbar />

        <div className="relative pt-40 pb-24 px-6 md:px-12 lg:px-20 flex-grow">
          <article className="max-w-5xl mx-auto space-y-8">
            <header className="text-center mb-4 relative overflow-hidden bg-white/50 border border-white/60 rounded-[2rem] p-10 shadow-sm">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#C8FF4C]/25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-black/5 rounded-full blur-2xl pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider mb-8">
                <Sparkles className="w-3 h-3 text-[#C8FF4C]" />
                Knowledge Base
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">Platform Guide</h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                This guide explains how to run Tea Planter from daily field operations to owner-level
                decisions. Use it as your practical playbook for setup, workflows, and reporting.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs md:text-sm font-semibold">
                {['Onboarding', 'Operations', 'Analytics', 'Roles', 'Best Practices'].map((chip) => (
                  <span key={chip} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                    {chip}
                  </span>
                ))}
              </div>
            </header>

            <section className="bg-white/70 border border-white/60 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <BookCheck className="w-5 h-5" />
                </span>
                Quick Start Checklist
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed">
                <li>Create user accounts and assign roles (owner, clerk, worker).</li>
                <li>Register plots and workforce groups before first-day operations.</li>
                <li>Set attendance flow and harvest recording points.</li>
                <li>Enable disease scanner and telemetry streams.</li>
                <li>Review reports weekly and adjust workflows by data.</li>
              </ol>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </span>
                Module 1: Neural Diagnosis
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Upload clear leaf photos under good lighting. The model predicts likely disease or
                stress category and helps teams prioritize response order by urgency.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                <li>Capture close and focused images without heavy shadows.</li>
                <li>Use repeated scans for suspicious areas to confirm consistency.</li>
                <li>Track affected plot IDs for trend analysis over time.</li>
                <li>Escalate unresolved cases to supervisor review.</li>
              </ul>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </span>
                Module 2: Workforce and Attendance
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Attendance and task assignment should be updated in real time. Accurate attendance
                drives payroll quality, team accountability, and fair output attribution.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                <li>Record entry and break events consistently each shift.</li>
                <li>Map workers to plot or task groups before field deployment.</li>
                <li>Validate missing punches before day-close approval.</li>
                <li>Lock approved records to avoid payroll drift.</li>
              </ul>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </span>
                Module 3: Live Telemetry and Harvest
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Use telemetry and harvest streams to monitor field performance continuously.
                Supervisors can detect low-yield zones quickly and coordinate timely actions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                <li>Confirm devices are online before each collection window.</li>
                <li>Tag harvest data by worker and plot for traceability.</li>
                <li>Watch anomaly alerts for sudden volume drops or spikes.</li>
                <li>Export daily summaries for operations review.</li>
              </ul>
            </section>

            <section className="bg-white/70 border border-white/60 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                Role-Based Workflow
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700 leading-relaxed">
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Owner
                  </div>
                  Reviews strategic reports, cost and yield trends, and weekly productivity variance.
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Clerk
                  </div>
                  Maintains attendance quality, payroll-ready data, inventory consistency, and
                  operational reports.
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    Worker
                  </div>
                  Completes tasks, records harvests, and follows assigned plot or activity plans.
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-black text-[#C8FF4C] flex items-center justify-center">
                  <ArrowRight className="w-5 h-5" />
                </span>
                Weekly Best Practices
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                <li>Run a weekly quality check for attendance, harvest, and scanner entries.</li>
                <li>Investigate any outlier plot metrics before planning next-week work.</li>
                <li>Use trend reports to rebalance labor across underperforming sections.</li>
                <li>Document recurring issues and assign corrective actions with owners.</li>
              </ul>
            </section>
          </article>
        </div>

        <div className="mt-auto">
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
