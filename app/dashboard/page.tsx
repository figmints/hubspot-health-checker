'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HealthScore {
  score: number;
  contactQuality: number | null;
  dealPipeline: number | null;
  companyQuality: number | null;
  engagement: number | null;
  hygiene: number | null;
  counts: {
    contacts: number | null;
    deals: number | null;
    companies: number | null;
  };
  issues: number | null;
  autoFixable: number | null;
  date: string;
}

interface FixLog {
  id: number;
  type: string;
  title: string;
  fixedCount: number;
  errorCount: number;
  details: string[];
  date: string;
}

interface DashboardData {
  workspace: {
    id: number;
    portalId: string;
    name: string | null;
    tier: string;
    createdAt: string;
  };
  healthScores: HealthScore[];
  scoreTrend: Array<{ date: string; score: number }>;
  scoreImprovement: number;
  fixLogs: FixLog[];
  fixStats: {
    totalRecordsFixed: number;
    totalErrors: number;
    totalFixOperations: number;
  };
  alerts: Array<{
    id: number;
    type: string;
    title: string;
    message: string | null;
    severity: string;
    date: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  useEffect(() => {
    // Get portal ID from session storage or URL
    const portalId = sessionStorage.getItem('portalId') || 'demo-portal';
    
    // Check for upgrade success
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }
    
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/history?portalId=${portalId}`);
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        } else {
          setError('Failed to load dashboard data');
        }
        
        // Check premium status
        const statusRes = await fetch(`/api/checkout?portalId=${portalId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsPremium(statusData.isPremium);
          setSubscription(statusData.subscription);
        }
      } catch (err) {
        setError('Failed to connect to server');
      }
      setIsLoading(false);
    };

    fetchDashboard();
  }, []);

  const handleManageSubscription = async () => {
    try {
      const portalId = sessionStorage.getItem('portalId') || 'demo-portal';
      const email = prompt('Enter your email to manage subscription:');
      if (!email) return;
      
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          portalId,
          action: 'manage',
        }),
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open subscription management');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to manage subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-slate-900 font-semibold mb-2">{error || 'No data available'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Run a new audit
          </Link>
        </div>
      </div>
    );
  }

  const latestScore = data.healthScores[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Upgrade Success Banner */}
      {showUpgradeSuccess && (
        <div className="bg-emerald-500 text-white py-3 px-4 text-center">
          <span className="font-medium">🎉 Welcome to Premium! Your account has been upgraded successfully.</span>
          <button 
            onClick={() => setShowUpgradeSuccess(false)}
            className="ml-4 text-emerald-100 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Premium Dashboard</h1>
              <p className="text-xs text-slate-500 -mt-0.5">{data.workspace.name || data.workspace.portalId}</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isPremium ? (
              <>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-full">
                  ✨ Premium
                </span>
                <button
                  onClick={handleManageSubscription}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
                >
                  Manage Subscription
                </button>
              </>
            ) : (
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-medium rounded-full">
                Free Plan
              </span>
            )}
            <Link
              href="/results"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              View Full Report
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <section className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Current Score</div>
            <div className={`text-4xl font-bold ${
              latestScore?.score >= 80 ? 'text-emerald-600' :
              latestScore?.score >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {latestScore?.score || 0}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Score Change</div>
            <div className={`text-4xl font-bold flex items-center gap-2 ${
              data.scoreImprovement >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.scoreImprovement >= 0 ? '+' : ''}{data.scoreImprovement}
              <span className="text-sm font-normal text-slate-400">pts</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Records Fixed</div>
            <div className="text-4xl font-bold text-blue-600">
              {data.fixStats.totalRecordsFixed.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Fix Operations</div>
            <div className="text-4xl font-bold text-slate-900">
              {data.fixStats.totalFixOperations}
            </div>
          </div>
        </section>

        {/* Score Trend Chart */}
        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Health Score Trend</h2>
          
          {data.scoreTrend.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📈</div>
              <p>No historical data yet. Run more audits to see your trend.</p>
            </div>
          ) : (
            <div className="relative h-64">
              {/* Simple chart visualization */}
              <div className="flex items-end justify-between h-48 gap-1">
                {data.scoreTrend.map((point, idx) => {
                  const height = (point.score / 100) * 100;
                  const color = point.score >= 80 ? 'bg-emerald-500' :
                               point.score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className={`${color} rounded-t transition-all hover:opacity-80`}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {point.score} - {new Date(point.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                {data.scoreTrend.length > 0 && (
                  <>
                    <span>{new Date(data.scoreTrend[0].date).toLocaleDateString()}</span>
                    <span>{new Date(data.scoreTrend[data.scoreTrend.length - 1].date).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Fix Activity Log */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Fix Activity Log</h2>
            
            {data.fixLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-4">🔧</div>
                <p>No fixes applied yet. Visit the Results page to fix issues.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.fixLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.errorCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {log.errorCount === 0 ? '✓' : '⚠'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{log.title}</div>
                      <div className="text-sm text-slate-500">
                        Fixed {log.fixedCount} records
                        {log.errorCount > 0 && ` • ${log.errorCount} errors`}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(log.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Alerts */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Alerts & Notifications</h2>
            
            {data.alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-4">🔔</div>
                <p>No alerts. Your HubSpot is looking healthy!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        alert.severity === 'critical' ? 'text-red-700' :
                        alert.severity === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {alert.severity === 'critical' ? '🚨' :
                         alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                        {alert.title}
                      </span>
                    </div>
                    {alert.message && (
                      <p className="text-sm text-slate-600">{alert.message}</p>
                    )}
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(alert.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Subscription Info (if premium) */}
        {isPremium && subscription && (
          <section className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Premium Subscription</h3>
                <p className="text-sm text-slate-600">
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-orange-600">Cancels at period end</span>
                  ) : (
                    <>Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
              >
                Manage Billing
              </button>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link
            href="/results"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
          >
            🔍 View Full Audit Report
          </Link>
          <button className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            📋 Export PDF Report
          </button>
          <button className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            ⚙️ Configure Monitoring
          </button>
          {isPremium && (
            <button
              onClick={handleManageSubscription}
              className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              💳 Manage Subscription
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
