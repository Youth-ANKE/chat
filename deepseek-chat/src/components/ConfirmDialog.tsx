import { AlertTriangle, X } from 'lucide-react';
import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { playClick } from '../lib/sound';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    playClick();
    state?.resolve(result);
    setState(null);
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      btn: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
      overlayBg: 'bg-red-500/5',
    },
    warning: {
      icon: 'text-amber-400',
      btn: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30',
      overlayBg: 'bg-amber-500/5',
    },
    default: {
      icon: 'text-purple-400',
      btn: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30',
      overlayBg: 'bg-cyan-500/5',
    },
  };

  const style = state ? variantStyles[state.options.variant ?? 'default'] : variantStyles.default;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Custom Confirm Modal */}
      {state && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => handleClose(false)}
          />
          {/* Modal */}
          <div className={cn(
            'relative z-10 w-full max-w-md rounded-2xl glass-heavy border border-white/[0.08] shadow-2xl animate-scale-in overflow-hidden'
          )}>
            {/* Accent glow */}
            <div className={cn('absolute inset-0', style.overlayBg)} />

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08]', style.icon)}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {state.options.title && (
                    <h3 className="text-base font-semibold text-white/90 mb-1">{state.options.title}</h3>
                  )}
                  <p className="text-sm text-white/60 leading-relaxed">{state.options.message}</p>
                </div>
                <button
                  onClick={() => handleClose(false)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                >
                  {state.options.cancelLabel ?? '取消'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={cn('px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200', style.btn)}
                >
                  {state.options.confirmLabel ?? '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
