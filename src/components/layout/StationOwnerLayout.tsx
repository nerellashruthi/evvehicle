import { ReactNode } from 'react';

interface StationOwnerLayoutProps {
  children: ReactNode;
}

export function StationOwnerLayout({ children }: StationOwnerLayoutProps) {
  return (
    <div className="min-h-screen bg-ink-950 text-white flex flex-col relative">
      {/* Dedicated Station Owner Layout Shell — No EV User Navigation or AI Modals */}
      {children}
    </div>
  );
}
