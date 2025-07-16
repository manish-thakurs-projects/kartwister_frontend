"use client";

import styles from "./Header.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Header({
  onToggleTheme,
}: {
  onToggleTheme?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user profile
  async function fetchUserProfile() {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
    if (token) {
      try {
        const res = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setIsAdmin(!!user.isAdmin);
          setUserName(user.name || null);
        } else {
          setIsAdmin(false);
          setUserName(null);
        }
      } catch {
        setIsAdmin(false);
        setUserName(null);
      }
    } else {
      setIsAdmin(false);
      setUserName(null);
    }
  }

  useEffect(() => {
    fetchUserProfile();
    window.addEventListener("storage", fetchUserProfile);

    // Check system preference for dark mode
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setIsDarkMode(true);
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("storage", fetchUserProfile);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (onToggleTheme) onToggleTheme();
    // Persist theme preference
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
  ];

  if (isAdmin) navLinks.push({ href: "/admin", label: "Admin" });

  return (
    <header className={`${styles.header} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          Kartwister
          <span className={styles.logoDot}>.</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className={styles.desktopNav}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${
              pathname === link.href ? styles.active : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actionsContainer}>
        {loggedIn && userName && (
          <div className={styles.userGreeting}>
            <FiUser className={styles.userIcon} />
            <span>Hi, {userName.split(" ")[0]}</span>
          </div>
        )}

        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {isDarkMode ? (
            <FiSun className={styles.themeIcon} />
          ) : (
            <FiMoon className={styles.themeIcon} />
          )}
        </button>

        {loggedIn ? (
          <button className={styles.authButton} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link href="/auth" className={styles.authButton}>
            Sign In
          </Link>
        )}

        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          className={`${styles.mobileMenu} ${isDarkMode ? styles.dark : ""}`}
          ref={menuRef}
        >
          <div className={styles.mobileMenuHeader}>
            <button
              className={`${styles.closeBtn} ${isDarkMode ? styles.dark : ""}`}
              onClick={() => setMenuOpen(false)}
            >
             <IoMdClose />
            </button>
            {loggedIn && userName && (
              <div className={styles.mobileUserGreeting}>
                <FiUser className={styles.userIcon} />
                <span>Hi, {userName.split(" ")[0]}</span>
              </div>
            )}
          </div>

          <div className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${
                  pathname === link.href ? styles.active : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.mobileAuth}>
            {loggedIn ? (
              <button
                className={styles.mobileAuthButton}
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth"
                className={styles.mobileAuthButton}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
