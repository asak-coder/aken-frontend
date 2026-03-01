"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    fetch("/api/admin-session", { cache: "no-store" })
      .then((res) => {
        if (!mounted) {
          return;
        }

        if (res.ok) {
          router.replace("/admin/leads");
        }
      })
      .catch(() => {
        // Ignore session check failures on initial load.
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const nextPath = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
      router.replace(nextPath || "/admin/leads");
    } else {
      setError(data.error || "Login failed.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-xl w-80">
        <h1 className="text-xl mb-4">Admin Login</h1>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Admin Username"
            className="w-full p-2 text-black rounded mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full p-2 text-black rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black p-2 rounded disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  );
}
