import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ModelGuard - AI Model License Compliance',
  description: 'Audit and monitor AI model license compliance across your projects',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <a href="/" className="flex items-center space-x-2">
                  <svg className="w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">ModelGuard</span>
                </a>
                <a href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Dashboard</a>
                <a href="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Settings</a>
                <a href="/integration" className="text-gray-600 hover:text-gray-900 text-sm font-medium">CI/CD</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
