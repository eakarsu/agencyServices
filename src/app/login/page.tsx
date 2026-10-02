"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600">
            Agency Services
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
          <button
            type="button"
            onClick={async () => { const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || ''; const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || ''; setEmail(demoEmail); setPassword(demoPassword); if (!demoEmail || !demoPassword) { setError('Demo credentials are not configured.'); return; } setLoading(true); setError(''); try { const result = await signIn('credentials', { email: demoEmail, password: demoPassword, redirect: false }); if (result?.error) { setError('Invalid email or password'); } else { router.push('/dashboard'); router.refresh(); } } catch { setError('An error occurred. Please try again.'); } finally { setLoading(false); } }}
            disabled={!process.env.NEXT_PUBLIC_DEMO_EMAIL || !process.env.NEXT_PUBLIC_DEMO_PASSWORD}
            aria-label="Auto Fill Demo Credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Auto Fill Demo Credentials
          </button>
          <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-500 text-sm">
              Forgot password?
            </Link>
            <Link href="/register" className="text-primary-600 hover:text-primary-500 text-sm">
              Don&apos;t have an account? Register
            </Link>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">Test Credentials:</p>
          <div className="space-y-1 text-xs text-blue-800">
            <div className="flex justify-between">
              <span className="font-medium">Admin:</span>
              <span>admin@agency.com / password123</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Manager:</span>
              <span>sarah.johnson@agency.com / password123</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">User:</span>
              <span>emily.davis@agency.com / password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
