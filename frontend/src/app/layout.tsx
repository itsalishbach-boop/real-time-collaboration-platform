import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { ToastProvider } from '@/components/ToastProvider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CollabSpace — Real-Time Collaboration',
  description: 'Chat, collaborate on notes, and manage workspaces in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-gray-900">
        <AuthProvider>
          <PresenceProvider>
            {children}
            <ToastProvider />
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
