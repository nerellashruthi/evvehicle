import { Logo } from '@/components/Logo';

interface LoadingFallbackProps {
  message?: string;
  subMessage?: string;
}

export function LoadingFallback({
  message = 'Loading ChargeNix...',
  subMessage = 'Preparing charging stations and smart route intelligence',
}: LoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-acid/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4 max-w-sm">
        <Logo size="lg" />

        <div className="flex items-center gap-3 mt-4">
          <div className="w-5 h-5 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-ink-200">
            {message}
          </span>
        </div>

        {subMessage && (
          <p className="text-xs text-ink-500 leading-relaxed max-w-xs">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
