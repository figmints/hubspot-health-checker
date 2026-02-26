import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HubSpot Health Checker",
  description: "Get a free health score for your HubSpot instance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
