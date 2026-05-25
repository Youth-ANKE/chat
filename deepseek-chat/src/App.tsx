import { useEffect, useState } from 'react';
import { ChatLayout } from './components/ChatLayout';
import { useChatStore } from './stores/chatStore';
import { useSettingsStore } from './stores/settingsStore';
import { Sparkles } from 'lucide-react';

function SplashScreen() {
  const [bootStep, setBootStep] = useState(0);
  const bootLines = [
    'INITIALIZING NEURAL INTERFACE...',
    'CONNECTING TO DEEPSEEK V4 CORE...',
    'LOADING MEMORY BANKS...',
    'CALIBRATING QUANTUM CIRCUITS...',
    'SYSTEM READY',
  ];

  useEffect(() => {
    if (bootStep >= bootLines.length) return;
    const timer = setTimeout(() => setBootStep((s) => s + 1), 400 + bootStep * 200);
    return () => clearTimeout(timer);
  }, [bootStep]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#030312] overflow-hidden">
      {/* Animated tech grid */}
      <div className="absolute inset-0 tech-grid opacity-30" />

      <div className="relative z-10 text-center animate-scale-in">
        {/* Glowing logo */}
        <div className="relative inline-flex mb-8">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl gradient-cyber flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-6">
          <span className="text-white/90">DeepSeek</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Chatbox
          </span>
        </h1>

        {/* Boot sequence */}
        <div className="space-y-2 font-mono text-xs">
          {bootLines.slice(0, bootStep).map((line, i) => (
            <div
              key={line}
              className="flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <span className="text-cyan-400/60">[{i + 1}]</span>
              <span className={i === bootLines.length - 1 ? 'text-green-400' : 'text-cyan-400/80'}>
                {line}
              </span>
              {i < bootStep - 1 && <span className="text-green-400/60 ml-auto">✓</span>}
            </div>
          ))}
        </div>

        {bootStep >= bootLines.length && (
          <div className="mt-6 flex items-center justify-center gap-1.5 animate-fade-in">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [initializing, setInitializing] = useState(true);
  const init = useChatStore((s) => s.init);
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  useEffect(() => {
    // Slight delay for boot animation
    const t = setTimeout(() => {
      init().finally(() => setInitializing(false));
    }, 2500);
    return () => clearTimeout(t);
  }, [init]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (initializing) return <SplashScreen />;

  return <ChatLayout />;
}

export default App;
