"use client";

import { useEffect, useState } from "react";

type Tab = "general" | "smtp" | "security";

interface AppConfig {
  appName: string;
  appDescription: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  otpExpiryMinutes: number;
  maxLoginAttempts: number;
  sessionHours: number;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
        active ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${checked ? "bg-emerald-600" : "bg-slate-300"}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function NumberInput({ label, desc, value, onChange, min, max }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [smtp, setSmtp] = useState<SmtpConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setConfig);
    fetch("/api/admin/smtp").then((r) => r.json()).then(setSmtp);
  }, []);

  async function saveGeneral() {
    if (!config) return;
    setSaving(true);
    setSaveMsg("");
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaveMsg("Settings saved.");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function saveSmtp() {
    if (!smtp) return;
    setSaving(true);
    setSaveMsg("");
    await fetch("/api/admin/smtp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smtp),
    });
    setSaveMsg("SMTP configuration saved.");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function sendTest() {
    if (!testEmail) return;
    setTestLoading(true);
    setTestMsg("");
    const res = await fetch("/api/admin/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testEmail }),
    });
    const d = await res.json();
    setTestMsg(res.ok ? "Test email sent successfully!" : `Error: ${d.error}`);
    setTestLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configure the field guide application</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
        <TabButton label="General" active={tab === "general"} onClick={() => { setTab("general"); setSaveMsg(""); }} />
        <TabButton label="SMTP / Email" active={tab === "smtp"} onClick={() => { setTab("smtp"); setSaveMsg(""); }} />
        <TabButton label="Security" active={tab === "security"} onClick={() => { setTab("security"); setSaveMsg(""); }} />
      </div>

      {/* General tab */}
      {tab === "general" && config && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">General Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Basic app configuration</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">App Name</label>
              <input
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">App Description</label>
              <textarea
                rows={3}
                value={config.appDescription}
                onChange={(e) => setConfig({ ...config, appDescription: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 px-1">
              <Toggle
                label="Allow User Registration"
                desc="Let new users sign up via OTP email"
                checked={config.allowRegistration}
                onChange={(v) => setConfig({ ...config, allowRegistration: v })}
              />
              <Toggle
                label="Maintenance Mode"
                desc="Show a maintenance page to all app users"
                checked={config.maintenanceMode}
                onChange={(v) => setConfig({ ...config, maintenanceMode: v })}
              />
            </div>

            {config.maintenanceMode && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
                ⚠️ Maintenance mode is ON — app users will see a maintenance message.
              </div>
            )}

            {saveMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{saveMsg}</div>
            )}

            <button
              onClick={saveGeneral}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? "Saving..." : "Save General Settings"}
            </button>
          </div>
        </div>
      )}

      {/* SMTP tab */}
      {tab === "smtp" && smtp && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">SMTP Configuration</h2>
              <p className="text-xs text-slate-400 mt-0.5">Used for OTP emails and notifications</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">SMTP Host</label>
                  <input
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Port</label>
                  <input
                    type="number"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-center">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">TLS / SSL</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${smtp.secure ? "bg-emerald-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${smtp.secure ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm text-slate-600">{smtp.secure ? "Enabled (port 465)" : "STARTTLS (port 587)"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Username</label>
                  <input
                    value={smtp.username}
                    onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    value={smtp.password}
                    onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                    placeholder="App password or SMTP password"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">From Email</label>
                  <input
                    value={smtp.fromEmail}
                    onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
                    placeholder="noreply@yourapp.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">From Name</label>
                  <input
                    value={smtp.fromName}
                    onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                    placeholder="Manu Explorers"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {saveMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{saveMsg}</div>
              )}

              <button
                onClick={saveSmtp}
                disabled={saving}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? "Saving..." : "Save SMTP Settings"}
              </button>
            </div>
          </div>

          {/* Test email */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800">Send Test Email</h3>
            <p className="text-sm text-slate-500">Verify your SMTP configuration by sending a test message.</p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={sendTest}
                disabled={testLoading || !testEmail}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                {testLoading ? "Sending..." : "Send Test"}
              </button>
            </div>
            {testMsg && (
              <div className={`text-sm rounded-xl px-4 py-3 border ${testMsg.startsWith("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                {testMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && config && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Security Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Authentication and session configuration</p>
          </div>
          <div className="px-6">
            <NumberInput
              label="OTP Expiry"
              desc="How many minutes before a login OTP expires"
              value={config.otpExpiryMinutes}
              onChange={(v) => setConfig({ ...config, otpExpiryMinutes: v })}
              min={1} max={60}
            />
            <NumberInput
              label="Max Login Attempts"
              desc="Lock account after this many failed OTP attempts"
              value={config.maxLoginAttempts}
              onChange={(v) => setConfig({ ...config, maxLoginAttempts: v })}
              min={1} max={20}
            />
            <NumberInput
              label="Admin Session Hours"
              desc="How long admin sessions stay valid"
              value={config.sessionHours}
              onChange={(v) => setConfig({ ...config, sessionHours: v })}
              min={1} max={72}
            />
          </div>
          <div className="px-6 pb-6 pt-4 border-t border-slate-100 mt-2">
            {saveMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{saveMsg}</div>
            )}
            <button
              onClick={saveGeneral}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? "Saving..." : "Save Security Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
