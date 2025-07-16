"use client";
import { useEffect, useState } from "react";
import Header from "./header/Header";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-dark", "theme-red");
    document.body.classList.add(`theme-${theme}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <>
      <Header onToggleTheme={handleToggleTheme} />
      {children}
    </>
  );
} 