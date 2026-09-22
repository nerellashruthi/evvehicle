import { Zap } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' };
  const text = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${dims[size]} relative flex items-center justify-center rounded-xl bg-electric-500/10 border border-electric-500/30`}>
        <div className="absolute inset-0 rounded-xl bg-electric-500/20 animate-pulse-glow" />
        <Zap className="w-5 h-5 text-electric-400 relative z-10" fill="currentColor" />
      </div>
      <span className={`${text[size]} font-display font-bold tracking-tight text-white`}>
        Chargenix
      </span>
    </div>
  );
}
