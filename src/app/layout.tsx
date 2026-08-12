import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EFCPL — Inventory Management System',
  description: 'Production & Cold Storage Inventory Management System for EFCPL Pune',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EFCPL IMS',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0A1628" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
