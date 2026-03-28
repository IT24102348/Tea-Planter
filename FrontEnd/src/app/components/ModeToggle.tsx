import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ModeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${collapsed ? 'w-8 h-8' : 'w-full h-10'}`} />
    );
  }

  const themes = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'system', icon: Monitor, label: 'System' },
  ];

  const currentTheme = themes.find((t) => t.name === theme) || themes[2];

  const toggleTheme = () => {
    const nextThemeIndex = (themes.findIndex((t) => t.name === theme) + 1) % themes.length;
    setTheme(themes[nextThemeIndex].name);
  };

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
        title={`Theme: ${currentTheme.label}`}
      >
        <currentTheme.icon size={20} />
      </button>
    );
  }

  return (
    <div className="flex gap-2 p-1 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.name;
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`flex items-center justify-center p-2.5 rounded-md transition-all ${
              isActive
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            aria-label={t.label}
            title={t.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
