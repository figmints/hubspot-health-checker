"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuditPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Connecting to HubSpot...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const runAuditFlow = async () => {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((p) => {
            if (p >= 90) return p;
            return p + Math.random() * 30;
          });
        }, 500);

        const messages = [
          "Connecting to HubSpot...",
          "Fetching contacts...",
          "Analyzing contact quality...",
          "Fetching deals...",
          "Analyzing pipeline health...",
          "Fetching companies...",
          "Analyzing company data...",
          "Calculating engagement metrics...",
          "Running data hygiene checks...",
          "Finalizing results...",
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
          if (messageIndex < messages.length) {
            setStatus(messages[messageIndex]);
            messageIndex++;
          }
        }, 600);

        // Call audit API
        const response = await fetch("/api/audit");

        if (!response.ok) {
          throw new Error("Audit failed");
        }

        const auditData = await response.json();

        // Save to session
        await fetch("/api/audit/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(auditData),
        });

        clearInterval(progressInterval);
        clearInterval(messageInterval);
        setProgress(100);

        // Redirect to results
        setTimeout(() => {
          router.push("/results");
        }, 500);
      } catch (error) {
        console.error("Error running audit:", error);
        setStatus("Error running audit. Please try again.");
      }
    };

    runAuditFlow();
  }, [router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Running Your Audit
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="animate-spin h-full w-full border-4 border-orange-200 border-t-orange-500 rounded-full"></div>
            </div>
          </div>

          <p className="text-lg font-semibold text-slate-900 mb-4">
            {status}
          </p>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm text-slate-600 mt-4">
            This usually takes less than 30 seconds
          </p>
        </div>

        <p className="text-sm text-slate-500 mt-8">
          Please don't close this page
        </p>
      </div>
    </main>
  );
}
