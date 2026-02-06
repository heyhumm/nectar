"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "auto";

const themes: Theme[] = ["light", "dark", "auto"];
const icons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = theme === "dark" || (theme === "auto" && systemDark);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = icons[theme];
  const labels: Record<Theme, string> = {
    light: "Switch to dark mode",
    dark: "Switch to auto mode",
    auto: "Switch to light mode",
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 h-9"
      onClick={cycleTheme}
      title={labels[theme]}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
