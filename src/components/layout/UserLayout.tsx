import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIAgentChatModal, FloatingAIButton } from '@/components/ai/AIAgentChatModal';
import { useApp } from '@/context/AppContext';

interface UserLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function UserLayout({ children, showFooter = true }: UserLayoutProps) {
  const { page } = useApp();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative bg-ink-950 text-white">
      {/* EV User Dedicated Navigation Header */}
      <Navbar />

      {/* Main EV User Page Content */}
      <main className="flex-1 pt-16 sm:pt-20">
        {children}
      </main>

      {/* EV User Dedicated Floating AI Trigger Button */}
      {page !== 'ai-agent' && (
        <FloatingAIButton onClick={() => setIsAiModalOpen(true)} />
      )}

      {/* EV User AI Charging Assistant Modal */}
      <AIAgentChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {showFooter && <Footer />}
    </div>
  );
}
