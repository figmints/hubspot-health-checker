'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Animated counter component
function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span id={`counter-${end}`}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Floating orbs background
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-400/15 rounded-full blur-3xl animate-pulse delay-500" />
    </div>
  );
}

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('premium');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleConnect = async () => {
    const token = prompt('Enter your HubSpot Private App Access Token (pat-na1-...)');
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('auditResults', JSON.stringify(data));
        sessionStorage.setItem('hubspotToken', token);
        // Generate a portal ID from the token for tracking
        const portalId = 'portal-' + token.substring(0, 8);
        sessionStorage.setItem('portalId', portalId);
        window.location.href = '/results';
      } else {
        alert('Invalid token or access denied');
        setIsLoading(false);
      }
    } catch (error) {
      alert('Error: ' + error);
      setIsLoading(false);
    }
  };

  const handlePremiumSignup = async () => {
    if (!upgradeEmail) {
      alert('Please enter your email');
      return;
    }
    
    setIsUpgrading(true);
    try {
      // First, prompt for HubSpot token
      const token = prompt('To start your Premium trial, please enter your HubSpot Private App Access Token (pat-na1-...)');
      if (!token) {
        setIsUpgrading(false);
        return;
      }
      
      const portalId = 'portal-' + token.substring(0, 8);
      
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: upgradeEmail,
          portalId: portalId,
        }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Store token for after checkout
        sessionStorage.setItem('hubspotToken', token);
        sessionStorage.setItem('portalId', portalId);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-lg">HS</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">HubSpot Health</h1>
              <p className="text-xs text-slate-500 -mt-0.5">by Figmints</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Free Audit'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <FloatingOrbs />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-full border border-blue-100 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-700">Trusted by 500+ HubSpot agencies</span>
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Your HubSpot is
              <span className="relative">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent"> leaking money</span>
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Let's fix it.</span>
            </h2>
            
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Bad data costs the average company <span className="font-semibold text-slate-900">$12.9 million per year</span>. 
              Our AI-powered health checker finds the leaks in your HubSpot—and our premium tier <span className="font-semibold text-emerald-600">fixes them automatically</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all transform hover:scale-105 disabled:opacity-50 text-lg flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    Get Your Free Health Score
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              <span className="text-slate-500 text-sm">
                ⚡ Results in 60 seconds • No credit card required
              </span>
            </div>
          </div>

          {/* Before/After Score Demo */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Before */}
            <div className="relative p-8 bg-white rounded-2xl border border-slate-200 shadow-xl">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                BEFORE
              </div>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#fee2e2" strokeWidth="8" fill="none" />
                    <circle cx="56" cy="56" r="48" stroke="#ef4444" strokeWidth="8" fill="none" 
                      strokeDasharray={`${47 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-500">47</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Critical Issues Found</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span> 42% contacts missing email
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span> 156 duplicate companies
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span> 23 stale deals (60+ days)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="relative p-8 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 shadow-xl">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AFTER PREMIUM FIX
              </div>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#d1fae5" strokeWidth="8" fill="none" />
                    <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="none" 
                      strokeDasharray={`${94 * 3.14159} ${100 * 3.14159}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-600">94</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Automatically Fixed</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> All emails standardized
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Duplicates merged
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Stale deals cleaned
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: '+', label: 'HubSpot Portals Audited' },
              { value: 2.4, prefix: '$', suffix: 'M', label: 'Revenue Recovered' },
              { value: 47, suffix: '%', label: 'Avg. Score Improvement' },
              { value: 12000, suffix: '+', label: 'Issues Auto-Fixed' },
            ].map((stat, idx) => (
              <div key={idx} className="p-6">
                <div className="text-4xl font-bold text-white mb-2">
                  <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Bad HubSpot data is silently <span className="text-red-500">killing your revenue</span>
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every day your CRM stays messy, you're losing deals, annoying customers, and wasting sales time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💸',
                title: 'Lost Revenue',
                stat: '$12.9M/year',
                desc: 'Average cost of poor data quality for enterprises. Even small businesses lose $15K+ annually.',
                color: 'red'
              },
              {
                icon: '⏰',
                title: 'Wasted Time',
                stat: '27% of sales time',
                desc: 'Sales reps spend over a quarter of their time managing bad data instead of closing deals.',
                color: 'orange'
              },
              {
                icon: '📉',
                title: 'Missed Opportunities',
                stat: '40% decay rate',
                desc: 'CRM data decays 40% annually. Those cold leads were once hot prospects.',
                color: 'yellow'
              },
            ].map((item, idx) => (
              <div key={idx} className="p-8 bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                <div className={`text-2xl font-bold mb-3 ${item.color === 'red' ? 'text-red-500' : item.color === 'orange' ? 'text-orange-500' : 'text-yellow-500'}`}>
                  {item.stat}
                </div>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 font-medium text-sm mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium Features
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Don't just find problems—<span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">fix them automatically</span>
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Free gets you the diagnosis. Premium gets you the cure.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-6">
              {[
                {
                  icon: '🔧',
                  title: 'Auto-Fix Engine',
                  desc: 'One-click remediation for common issues: duplicates, missing data, orphaned records, and more.',
                  premium: true
                },
                {
                  icon: '📊',
                  title: 'Historical Tracking',
                  desc: 'See your health score trend over time. Prove ROI to stakeholders with beautiful graphs.',
                  premium: true
                },
                {
                  icon: '🔔',
                  title: 'Proactive Monitoring',
                  desc: 'Daily scans alert you to new issues before they become problems. Never let data decay.',
                  premium: true
                },
                {
                  icon: '📋',
                  title: 'PDF Health Reports',
                  desc: 'Export professional reports to share with clients or leadership. White-label available.',
                  premium: true
                },
                {
                  icon: '🔒',
                  title: 'Read-Only Audit',
                  desc: 'Get your health score and detailed issue list. Perfect for initial assessment.',
                  premium: false
                },
              ].map((feature, idx) => (
                <div key={idx} className={`flex gap-4 p-5 rounded-xl transition-all ${feature.premium ? 'bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100' : 'bg-white border border-slate-200'}`}>
                  <div className="text-2xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{feature.title}</h4>
                      {feature.premium && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-medium rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex-1 text-center text-slate-400 text-sm">Auto-Fix Dashboard</div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { issue: '156 duplicate companies', action: 'Merge All', status: 'ready' },
                    { issue: '89 contacts missing email', action: 'Enrich Data', status: 'processing' },
                    { issue: '23 stale deals (60+ days)', action: 'Archive', status: 'completed' },
                    { issue: 'Inconsistent phone formats', action: 'Standardize', status: 'ready' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-emerald-500' :
                          item.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                          'bg-slate-300'
                        }`} />
                        <span className="text-slate-700">{item.issue}</span>
                      </div>
                      <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        item.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : item.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        {item.status === 'completed' ? '✓ Fixed' : item.status === 'processing' ? 'Fixing...' : item.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h3>
            <p className="text-xl text-slate-600">
              Start free. Upgrade when you need superpowers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-slate-900 mb-2">Free</h4>
                <p className="text-slate-600 text-sm">Perfect for a quick health check</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/forever</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Full health score analysis',
                  'Category breakdown',
                  'Issue identification',
                  'Basic recommendations',
                  'One-time audit',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Start Free Audit
              </button>
            </div>

            {/* Premium Tier */}
            <div className="relative p-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl shadow-2xl shadow-blue-500/25">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm font-semibold rounded-full">
                Most Popular
              </div>
              <div className="mb-6">
                <h4 className="text-xl font-bold text-white mb-2">Premium</h4>
                <p className="text-blue-100 text-sm">For teams serious about data quality</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">$99</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Free, plus:',
                  '🔧 Automated issue fixing',
                  '📈 Historical score tracking',
                  '🔔 Daily monitoring & alerts',
                  '📋 PDF health reports',
                  '💬 Priority support',
                  '🏷️ White-label reports',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-white">
                    <svg className="w-5 h-5 text-emerald-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <input
                type="email"
                value={upgradeEmail}
                onChange={(e) => setUpgradeEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 mb-3 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button 
                onClick={handlePremiumSignup}
                disabled={isUpgrading || !upgradeEmail}
                className="w-full py-3 px-6 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpgrading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Start 14-Day Free Trial'
                )}
              </button>
              <p className="text-center text-blue-100 text-sm mt-4">
                Secure payment via Stripe • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by HubSpot teams everywhere
            </h3>
            <p className="text-xl text-slate-600">
              See what our customers have to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "We had no idea our HubSpot was such a mess until we ran this audit. The auto-fix feature saved us 40+ hours of manual cleanup.",
                author: "Sarah Chen",
                role: "RevOps Lead",
                company: "TechScale Inc.",
                avatar: "SC"
              },
              {
                quote: "The health score became our north star metric. We went from 52 to 91 in 3 months. Our sales team can actually trust the CRM now.",
                author: "Marcus Johnson",
                role: "VP of Sales",
                company: "GrowthPilot",
                avatar: "MJ"
              },
              {
                quote: "As a HubSpot agency, we use this with every client. The PDF reports are beautiful and clients love seeing their score improve.",
                author: "Emily Rodriguez",
                role: "Agency Owner",
                company: "Catalyst Digital",
                avatar: "ER"
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="p-8 bg-white rounded-2xl border border-slate-200 hover:shadow-xl transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-xl text-slate-600">
              Everything you need to know about HubSpot Health
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does the free audit work?",
                a: "Simply enter your HubSpot Private App Access Token, and we'll analyze your contacts, deals, and companies in about 60 seconds. You'll get a complete health score with category breakdowns and issue identification — no payment required."
              },
              {
                q: "What's a HubSpot Private App Access Token?",
                a: "It's a secure way to connect third-party tools to your HubSpot. You can create one in HubSpot Settings → Integrations → Private Apps. We only need read access for the free audit, and read/write for the Premium auto-fix features."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We never store your HubSpot data. Our audit runs in real-time, analyzes your data, and then forgets it. Your Private App Token is stored only in your browser session and never on our servers."
              },
              {
                q: "What issues can Premium auto-fix?",
                a: "Premium can automatically fix: duplicate contacts and companies (by merging), inconsistent name formatting (title case), phone number standardization (E.164 format), orphan contacts (archiving), and stale deals (archiving 60+ day inactive deals)."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel your Premium subscription at any time from your dashboard. You'll continue to have access until the end of your billing period, and you can always use the free audit features."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 14-day free trial so you can test Premium risk-free. If you're not satisfied within your first billing period after the trial, contact us and we'll work something out."
              },
              {
                q: "How often should I run an audit?",
                a: "For best results, we recommend running a free audit monthly to catch data quality issues early. Premium subscribers get daily automated monitoring with alerts, so you never have to remember to check."
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">{faq.q}</h4>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl shadow-2xl shadow-blue-500/25">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to heal your HubSpot?
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join 500+ companies who've improved their HubSpot health score. 
              Your free audit takes just 60 seconds.
            </p>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 text-lg shadow-lg"
            >
              {isLoading ? 'Connecting...' : 'Get Your Free Health Score →'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HS</span>
              </div>
              <span className="text-slate-600">HubSpot Health by Figmints</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
              <a href="mailto:support@figmints.com" className="hover:text-slate-900 transition-colors">Contact</a>
            </div>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} Figmints. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
