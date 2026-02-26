'use client';

import Header from '@/components/Header';
import ScoreCircle from '@/components/ScoreCircle';
import ProgressBar from '@/components/ProgressBar';
import IssueCard from '@/components/IssueCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuditResult {
  score: number;
  categories: {
    name: string;
    score: number;
    icon: string;
  }[];
  topIssues: {
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    category: string;
  }[];
  recommendations: string[];
}

const MOCK_RESULT: AuditResult = {
  score: 72,
  categories: [
    { name: 'Data Quality', score: 85, icon: '📊' },
    { name: 'Integration Health', score: 72, icon: '🔗' },
    { name: 'Automation Setup', score: 68, icon: '⚙️' },
    { name: 'Security & Compliance', score: 75, icon: '🔒' },
    { name: 'User Management', score: 64, icon: '👥' },
  ],
  topIssues: [
    {
      title: 'Incomplete contact data',
      description: '42% of contacts missing email addresses',
      severity: 'high',
      category: 'Data Quality',
    },
    {
      title: 'Inactive workflows',
      description: '8 workflows are paused or inactive',
      severity: 'medium',
      category: 'Automation',
    },
    {
      title: 'Missing field mappings',
      description: 'Some custom fields are not synced with integrations',
      severity: 'medium',
      category: 'Integration',
    },
    {
      title: 'User permission gaps',
      description: '3 team members may have excessive permissions',
      severity: 'low',
      category: 'User Management',
    },
    {
      title: 'Duplicate records',
      description: 'Approximately 156 duplicate companies detected',
      severity: 'high',
      category: 'Data Quality',
    },
  ],
  recommendations: [
    'Set up automated email enrichment for contacts missing email addresses',
    'Review and reactivate any paused workflows that are still relevant',
    'Audit user permissions and apply principle of least privilege',
    'Implement duplicate detection rules for contacts and companies',
    'Create a data quality scorecard to track metrics over time',
    'Consider implementing a data governance policy',
  ],
};

export default function ResultsPage() {
  const router = useRouter();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Try to get results from sessionStorage, fallback to mock data
    const stored = sessionStorage.getItem('auditResults');
    if (stored) {
      try {
        setAuditResult(JSON.parse(stored));
      } catch {
        setAuditResult(MOCK_RESULT);
      }
    } else {
      setAuditResult(MOCK_RESULT);
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Connect to email service
      // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      setEmailSubmitted(true);
      setTimeout(() => setIsSubmitting(false), 2000);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!auditResult) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your results...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-12">
        {/* Score Section */}
        <section className="max-w-6xl mx-auto w-full mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Your HubSpot Health Score</h2>
            <p className="text-slate-600">
              Here's a comprehensive analysis of your HubSpot instance
            </p>
          </div>
          <ScoreCircle score={auditResult.score} size="large" />
          <div className="mt-8 text-center">
            <p className="text-slate-600 mb-4">
              {auditResult.score >= 80 && '✨ Great job! Your HubSpot instance is in excellent shape.'}
              {auditResult.score >= 60 && auditResult.score < 80 && '💪 Good foundation! With some improvements, you can reach excellence.'}
              {auditResult.score < 60 && '🎯 There\'s room for improvement. Let\'s get your HubSpot optimized!'}
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="max-w-6xl mx-auto w-full mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Category Breakdown</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {auditResult.categories.map((category, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <ProgressBar
                  label={category.name}
                  score={category.score}
                  icon={category.icon}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Top Issues Section */}
        <section className="max-w-6xl mx-auto w-full mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Top Issues</h3>
          <div className="space-y-4">
            {auditResult.topIssues.map((issue, idx) => (
              <IssueCard
                key={idx}
                title={issue.title}
                description={issue.description}
                severity={issue.severity}
                category={issue.category}
              />
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="max-w-6xl mx-auto w-full mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Recommendations</h3>
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <ul className="space-y-4">
              {auditResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                    ✓
                  </span>
                  <span className="text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto w-full mb-16 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200 p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Want help fixing these issues?</h3>
          <p className="text-slate-700 mb-6">
            Our team of HubSpot experts can help you implement these recommendations and improve your health score.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Schedule a consultation
            </button>
            <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
              Get detailed report
            </button>
          </div>
        </section>

        {/* Email Capture Section */}
        <section className="max-w-md mx-auto w-full mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">
            Get personalized insights
          </h3>
          <p className="text-slate-600 text-center mb-6">
            Get tips delivered to your inbox to improve your health score
          </p>

          {emailSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">✨</div>
              <h4 className="font-semibold text-emerald-900 mb-2">Thanks for subscribing!</h4>
              <p className="text-emerald-800 text-sm">
                Check your inbox for exclusive HubSpot optimization tips.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe for insights'}
              </button>
            </form>
          )}
        </section>

        {/* Footer Actions */}
        <section className="max-w-6xl mx-auto w-full py-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-center"
            >
              ← Back home
            </a>
            <button
              onClick={() => router.push('/audit')}
              className="px-6 py-3 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Run another audit
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
