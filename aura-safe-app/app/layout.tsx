import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Aura Safe | Safer people. Stronger communities.', description: 'Privacy-conscious GBV support, safety planning, education and referral pathways for South Africa.', applicationName: 'Aura Safe', manifest: '/manifest.json', appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Aura Safe' } };
export const viewport: Viewport = { themeColor: '#073f38', width: 'device-width', initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en-ZA"><body>{children}</body></html>; }
