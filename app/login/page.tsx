"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { saveUser, clearUser, getAllChecklist } from "@/lib/db";
import { api } from "@/lib/api";

type Step = "home" | "email" | "otp" | "syncing" | "done";

export default function LoginPage() {
  const { user, setUser, getSeenCount, loadChecklist } = useStore();
  const [step, setStep] = useState<Step>("home");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const seenCount = getSeenCount();

  async function handleSendOTP() {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.sendOtp(email.trim().toLowerCase());
      // Dev mode: server returns OTP in response for easy testing
      if (res.otp_code) setDevOtp(res.otp_code);
      setStep("otp");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send code. Try again.";
      setError(errorMessage);
      console.error("Send OTP error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.verifyOtp(email.trim().toLowerCase(), otp);

      // Save token and user
      localStorage.setItem("manu_token", res.token);
      await saveUser({ id: String(res.user.id), email: res.user.email, token: res.token });
      setUser({ email: res.user.email, token: res.token });

      // Sync local checklist to server
      const localItems = await getAllChecklist();
      const seenItems = localItems.filter((i) => i.seen);

      if (seenItems.length > 0) {
        setStep("syncing");
        try {
          await api.syncChecklist(
            seenItems.map((i) => ({
              species_id: i.species_id,
              seen: i.seen,
              timestamp: i.timestamp,
            }))
          );
        } catch (syncError) {
          console.error("Sync error:", syncError);
          // Continue even if sync fails - local data is preserved
        }
      }

      setStep("done");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Invalid code. Try again.";
      setError(errorMessage);
      console.error("Verify OTP error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local logout even if server logout fails
    }
    localStorage.removeItem("manu_token");
    await clearUser();
    setUser(null);
    setDevOtp(null);
    setStep("home");
  }

  // ── Already logged in ──────────────────────────────────────────
  if (user) {
    return (
      <div className="page-enter px-5 pt-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 stroke-emerald-600 fill-none" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-stone-800">Signed In</h2>
          <p className="text-stone-500 text-sm mt-1">{user.email}</p>
        </div>

        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-emerald-800">Checklist synced</p>
          <p className="text-xs text-emerald-600 mt-1">
            {seenCount} sightings saved to your account.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full py-4 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-sm active:scale-95 transition-transform"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="page-enter px-5 pt-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-stone-800">All synced!</h2>
        <p className="text-stone-500 text-sm mt-2">
          Your checklist is now backed up and will sync across devices.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-8 w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold active:scale-95 transition-transform"
        >
          Back to Field Guide
        </button>
      </div>
    );
  }

  if (step === "syncing") {
    return (
      <div className="page-enter px-5 pt-20 text-center">
        <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-stone-800">Syncing your sightings...</h2>
        <p className="text-stone-400 text-sm mt-2">
          Uploading {seenCount} species to your account
        </p>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="page-enter px-5 pt-10">
        <button
          onClick={() => { setStep("email"); setOtp(""); setError(""); setDevOtp(null); }}
          className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-sm mb-8"
        >
          <svg className="w-4 h-4 stroke-emerald-700 fill-none" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-stone-800">Check your email</h1>
        <p className="text-stone-500 text-sm mt-2">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {/* Dev helper — shows real OTP code from server */}
        {devOtp && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              Dev mode — your code: <span className="font-mono font-bold text-amber-800">{devOtp}</span>
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="tel"
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="000000"
            autoFocus
            className="w-full py-4 px-4 text-center text-2xl font-bold tracking-[0.5em] bg-white border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-emerald-400"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length < 6}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="page-enter px-5 pt-10">
        <button
          onClick={() => { setStep("home"); setEmail(""); setError(""); }}
          className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-sm mb-8"
        >
          <svg className="w-4 h-4 stroke-emerald-700 fill-none" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-stone-800">Enter your email</h1>
        <p className="text-stone-500 text-sm mt-2">
          We'll send a one-time code — no password needed.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@example.com"
            autoFocus
            className="w-full py-4 px-4 bg-white border-2 border-stone-200 rounded-2xl text-base focus:outline-none focus:border-emerald-400 placeholder:text-stone-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </div>
      </div>
    );
  }

  // ── Home (default) ─────────────────────────────────────────────
  return (
    <div className="page-enter px-5 pt-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">🦜</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Sync Your List</h1>
        <p className="text-stone-500 text-sm mt-2 max-w-xs mx-auto">
          Sign in to back up your sightings and access them on any device.
        </p>
      </div>

      {seenCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-emerald-800">
            You have <strong>{seenCount} sightings</strong> saved locally.
            Sign in to sync them to the cloud.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => setStep("email")}
          className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          Sign in with Email
        </button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">or continue without signing in</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-emerald-800">🌿 Guest Mode</p>
          <p className="text-xs text-emerald-600 mt-1">
            Your checklist is already saved offline on this device. Full functionality available without sync.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-amber-800">💡 Note</p>
          <p className="text-xs text-amber-600 mt-1">
            Sign in requires an active internet connection. Guest mode works completely offline.
          </p>
        </div>
      </div>
    </div>
  );
}
