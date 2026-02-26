'use client';

import Header from '@/components/Header';
import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    // Redirect to HubSpot OAuth
    window.location.href = '/api/auth/hubspot';
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
              Free HubSpot <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Health Check</span>
            </h2>
            <p className="text-xl text-slate-600 mb-4">
              Get your score in 60 seconds
            </p>
            <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
              Discover how healthy your HubSpot instance is. Our AI-powered audit analyzes your configuration, data quality, and best practices.
            </p>

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-4 shadow-lg"
            >
              {isLoading ? 'Connecting...' : 'Connect HubSpot'}
            </button>
            <p className="text-sm text-slate-500">
              🔒 We only read your HubSpot data. Your credentials are never stored.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-slate-900 text-center mb-12">
              How it works
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute left-0 top-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <div className="ml-16">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Connect your HubSpot
                  </h4>
                  <p className="text-slate-600">
                    Securely authenticate with your HubSpot instance. We only request read access.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute left-0 top-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <div className="ml-16">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    We analyze your data
                  </h4>
                  <p className="text-slate-600">
                    Our AI audits 50+ aspects of your HubSpot setup in seconds.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute left-0 top-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  3
                </div>
                <div className="ml-16">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Get your score & insights
                  </h4>
                  <p className="text-slate-600">
                    See your health score and actionable recommendations to improve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-slate-900 text-center mb-12">
              Why trust us?
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🔒', title: 'Privacy First', desc: 'Read-only access, data never stored' },
                { icon: '⚡', title: 'Lightning Fast', desc: 'Get results in under 60 seconds' },
                { icon: '🤖', title: 'AI Powered', desc: 'Advanced analysis of your setup' },
                { icon: '✅', title: 'Expert Tips', desc: 'From HubSpot best practices' },
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-white rounded-lg border border-slate-200 text-center hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-emerald-50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to improve your HubSpot health?
            </h3>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {isLoading ? 'Connecting...' : 'Start your free audit'}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
