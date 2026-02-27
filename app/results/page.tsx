'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  name: string;
  score: number;
  maxPoints: number;
  description: string;
  details: string[];
}

interface AuditResult {
  overallScore: number;
  categories: Category[];
  issues: string[];
  recommendations: string[];
  fixableIssues?: FixableIssue[];
  fixableSummary?: {
    total: number;
    autoFixable: number;
    highSeverity: number;
  };
}

interface FixableIssue {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedCount: number;
  affectedRecords: Array<{ id: string; name: string; details: Record<string, any> }>;
  fixAction: string;
  estimatedImpact: string;
  canAutoFix: boolean;
}

export default function ResultsPage() {
  const router = useRouter();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [fixableIssues, setFixableIssues] = useState<FixableIssue[]>([]);
  const [isLoadingFixes, setIsLoadingFixes] = useState(false);
  const [fixingIssue, setFixingIssue] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [portalId, setPortalId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');

  useEffect(() => {
    // Get audit results from sessionStorage
    const stored = sessionStorage.getItem('auditResults');
    const storedToken = sessionStorage.getItem('hubspotToken');
    const storedPortalId = sessionStorage.getItem('portalId') || 'demo-portal';
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAuditResult(data);
        // Use fixable issues from audit result if available
        if (data.fixableIssues) {
          setFixableIssues(data.fixableIssues);
        }
      } catch {
        router.push('/');
        return;
      }
    }
    
    if (storedToken) {
      setToken(storedToken);
      setPortalId(storedPortalId);
      
      // Check actual premium status
      checkPremiumStatus(storedPortalId);
    }
  }, [router]);

  const checkPremiumStatus = async (pId: string) => {
    try {
      const res = await fetch(`/api/checkout?portalId=${pId}`);
      if (res.ok) {
        const data = await res.json();
        setIsPremium(data.isPremium);
      }
    } catch (error) {
      console.error('Failed to check premium status:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradeEmail || !portalId) {
      alert('Please enter your email');
      return;
    }
    
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: upgradeEmail,
          portalId: portalId,
        }),
      });
      
      const data = await res.json();
      
      if (data.alreadyPremium) {
        setIsPremium(true);
        setShowPremiumModal(false);
        alert('You already have a premium subscription!');
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
    setIsUpgrading(false);
  };

  const fetchFixableIssues = async (accessToken: string) => {
    setIsLoadingFixes(true);
    try {
      const res = await fetch('/api/fix', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFixableIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch fixable issues:', error);
    }
    setIsLoadingFixes(false);
  };

  const handleFix = async (issueId: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (!token) return;
    
    setFixingIssue(issueId);
    try {
      const res = await fetch('/api/fix', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ issueId, portalId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFixedIssues(prev => new Set([...prev, issueId]));
        // Re-fetch to get updated issues
        await fetchFixableIssues(token);
      } else if (data.requiresPremium) {
        setShowPremiumModal(true);
      } else {
        alert('Fix failed: ' + (data.message || 'Please try again.'));
      }
    } catch (error) {
      console.error('Fix failed:', error);
      alert('Fix failed. Please try again.');
    }
    setFixingIssue(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!auditResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">HubSpot Health</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Audit Results</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isPremium && (
              <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-full">
                ✨ Premium
              </span>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Run New Audit
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Score Hero */}
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Your HubSpot Health Score</h2>
          
          <div className="relative inline-block">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="84" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              <circle 
                cx="96" 
                cy="96" 
                r="84" 
                stroke="url(#scoreGradient)" 
                strokeWidth="12" 
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${auditResult.overallScore * 5.28} 528`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={auditResult.overallScore >= 80 ? '#10b981' : auditResult.overallScore >= 60 ? '#f59e0b' : '#ef4444'} />
                  <stop offset="100%" stopColor={auditResult.overallScore >= 80 ? '#059669' : auditResult.overallScore >= 60 ? '#ea580c' : '#dc2626'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-bold ${getScoreColor(auditResult.overallScore)}`}>
                {auditResult.overallScore}
              </span>
              <span className="text-slate-500 text-sm">out of 100</span>
            </div>
          </div>
          
          <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto">
            {auditResult.overallScore >= 80 && '✨ Excellent! Your HubSpot is in great shape.'}
            {auditResult.overallScore >= 60 && auditResult.overallScore < 80 && '💪 Good foundation! Some improvements will get you to excellence.'}
            {auditResult.overallScore < 60 && '🎯 There\'s room for improvement. Let\'s get your HubSpot optimized!'}
          </p>
        </section>

        {/* Category Breakdown */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Category Breakdown</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auditResult.categories.map((category, idx) => {
              const percentage = Math.round((category.score / category.maxPoints) * 100);
              return (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">{category.name}</h4>
                    <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(percentage)} transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    {category.details.slice(0, 3).map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fixable Issues - Premium Feature */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Fixable Issues</h3>
              <p className="text-slate-600">Click to automatically fix these problems</p>
            </div>
            {!isPremium && (
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                ✨ Unlock Auto-Fix
              </button>
            )}
          </div>

          {isLoadingFixes ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-slate-600">Analyzing fixable issues...</span>
            </div>
          ) : fixableIssues.length === 0 ? (
            <div className="text-center py-12 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-4xl mb-4">🎉</div>
              <h4 className="text-lg font-semibold text-emerald-900">No Fixable Issues Found!</h4>
              <p className="text-emerald-700">Your HubSpot data is looking great.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fixableIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className={`bg-white rounded-xl border p-6 transition-all ${
                    fixedIssues.has(issue.id) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-slate-900">{issue.title}</h4>
                        {fixedIssues.has(issue.id) && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            ✓ Fixed
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          <strong className="text-slate-900">{issue.affectedCount}</strong> records affected
                        </span>
                        <span className="text-emerald-600">
                          {issue.estimatedImpact}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {issue.canAutoFix ? (
                        fixedIssues.has(issue.id) ? (
                          <button className="px-6 py-3 bg-emerald-100 text-emerald-700 font-medium rounded-lg cursor-default">
                            ✓ Fixed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFix(issue.id)}
                            disabled={fixingIssue === issue.id}
                            className={`px-6 py-3 font-medium rounded-lg transition-all ${
                              isPremium 
                                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg disabled:opacity-50'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {fixingIssue === issue.id ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Fixing...
                              </span>
                            ) : (
                              <>
                                {isPremium ? '🔧 Fix Now' : '🔒 ' + issue.fixAction}
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm">
                          Manual fix required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommendations */}
        {auditResult.recommendations.length > 0 && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-slate-900 mb-8">Recommendations</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <ul className="space-y-4">
                {auditResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 pt-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {!isPremium && (
          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to fix these issues automatically?</h3>
              <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                Upgrade to Premium and let our AI fix your HubSpot problems with one click. 
                Save hours of manual work and keep your data clean.
              </p>
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                ✨ Start 14-Day Free Trial
              </button>
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <section className="py-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors text-center"
          >
            ← Back home
          </Link>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-slate-100 text-slate-900 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            📋 Export Report
          </button>
        </section>
      </main>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative">
            <button 
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Unlock Premium Features</h3>
              <p className="text-slate-600 mb-6">
                Auto-fix issues, track your score over time, and get proactive alerts when new problems appear.
              </p>
              
              <ul className="text-left space-y-3 mb-6">
                {[
                  '🔧 Automated issue fixing',
                  '📈 Historical score tracking',
                  '🔔 Daily monitoring & alerts',
                  '📋 PDF health reports',
                  '💬 Priority support',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$99</span>
                <span className="text-slate-500">/month</span>
                <p className="text-sm text-emerald-600 mt-1">Starts with 14-day free trial</p>
              </div>
              
              {/* Email input */}
              <div className="mb-4">
                <input
                  type="email"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={handleUpgrade}
                disabled={isUpgrading || !upgradeEmail}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpgrading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Start 14-Day Free Trial →'
                )}
              </button>
              <p className="text-sm text-slate-500">Secure payment via Stripe • Cancel anytime</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
