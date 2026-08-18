"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import AuthPanel from "./components/AuthPanel";
import UpdateForm from "./components/UpdateForm";
import Feed from "./components/Feed";
import { useSocket } from "@/lib/useSocket";

const THEME_STORAGE_KEY = "pulseboard.theme";

export default function HomePage() {
  const { auth, ready, signIn, signOut } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);
  const socket = useSocket();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }
    } catch (err) {
      // ignore unavailable storage
    }
  }, []);

  function handleThemeToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (err) {
      // ignore unavailable storage
    }
  }

  function handlePosted() {
    setRefreshToken((n) => n + 1);
  }

  return (
    <main className="container">
      <header className="app-header">
        <h1>PulseBoard</h1>

        <label className="theme-toggle">
          <span className="theme-toggle-label">
            {theme === "light" ? "Light theme" : "Dark theme"}
          </span>
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={handleThemeToggle}
            aria-label="Toggle color theme"
          />
          <span className="theme-toggle-track" aria-hidden="true" />
        </label>
      </header>

      <p className="tagline">
        The team standup feed - post, react, stay in sync.
      </p>

      {ready && <AuthPanel auth={auth} onSignIn={signIn} onSignOut={signOut} />}

      <section>
        <h2>Post an update</h2>
        <UpdateForm auth={auth} onPosted={handlePosted} />
      </section>

      <section>
        <h2>Feed</h2>
        <Feed auth={auth} refreshToken={refreshToken} socket={socket} />
      </section>
    </main>
  );
}
