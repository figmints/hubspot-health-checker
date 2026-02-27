'use client';

import { useState } from 'react';

export default function SetupGuide() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 underline text-sm"
      >
        How do I get my access token?
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            🔑 Getting Your HubSpot Access Token
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-slate-600">
            A Private App Access Token is the secure way to let HubSpot Health read your CRM data. 
            Follow these steps to create one:
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Go to HubSpot Settings</h4>
                <p className="text-sm text-slate-600">
                  Log into your HubSpot account, click the ⚙️ Settings icon in the top navigation.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Navigate to Integrations → Private Apps</h4>
                <p className="text-sm text-slate-600">
                  In the left sidebar, click <strong>Integrations</strong>, then <strong>Private Apps</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Create a Private App</h4>
                <p className="text-sm text-slate-600">
                  Click <strong>Create a private app</strong>. Name it "HubSpot Health Checker".
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Set Scopes</h4>
                <p className="text-sm text-slate-600 mb-2">
                  In the <strong>Scopes</strong> tab, enable these (all READ only for free audit):
                </p>
                <ul className="text-xs bg-white p-3 rounded border border-slate-200 space-y-1 font-mono">
                  <li>• crm.objects.contacts.read</li>
                  <li>• crm.objects.companies.read</li>
                  <li>• crm.objects.deals.read</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  For Premium auto-fix, also enable the corresponding .write scopes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Create & Copy Token</h4>
                <p className="text-sm text-slate-600">
                  Click <strong>Create app</strong>, then copy the access token that appears. 
                  It starts with <code className="bg-slate-200 px-1 rounded">pat-na1-</code>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-semibold text-emerald-900 mb-1">Security Note</h4>
                <p className="text-sm text-emerald-700">
                  We never store your token on our servers. It's only kept in your browser session 
                  and used to make direct API calls to HubSpot. You can revoke the token anytime in HubSpot.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href="https://app.hubspot.com/private-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg text-center hover:shadow-lg transition-all"
            >
              Open HubSpot Settings →
            </a>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 bg-slate-100 text-slate-900 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
