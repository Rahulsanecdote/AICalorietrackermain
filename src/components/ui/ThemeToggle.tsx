import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Switch } from './material-design-3-switch';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center">
      <Switch
        id="theme-toggle-switch"
        aria-label="Toggle dark mode"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        showIcons
        size="sm"
        haptic="none"
        checkedIcon={<Moon className="h-2.5 w-2.5" />}
        uncheckedIcon={<Sun className="h-2.5 w-2.5" />}
      />
      <span className="sr-only">{isDark ? 'Dark mode enabled' : 'Light mode enabled'}</span>
    </div>
  );
}
