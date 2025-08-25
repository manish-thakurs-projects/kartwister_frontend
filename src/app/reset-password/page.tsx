"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const ResetPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setSuccess("OTP sent to your email. Please check your inbox.");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess("Password updated successfully! You can now log in with your new password.");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Add redirect logic after successful reset
  React.useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        router.push("/auth?reset=1");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  return (
    <main style={{ maxWidth: 400, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 12, background: "#fff" }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>Reset Password</h1>
      {step === 1 && (
        <form onSubmit={handleRequestOtp}>
          <label style={{ display: "block", marginBottom: 8 }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
            placeholder="Enter your registered email"
          />
          <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#ff3e00", color: "#fff", fontWeight: 600, border: 0 }} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleResetPassword}>
          <label style={{ display: "block", marginBottom: 8 }}>OTP (sent to your email)</label>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
            placeholder="Enter 6-digit OTP"
          />
          <label style={{ display: "block", marginBottom: 8 }}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
            placeholder="Enter new password"
          />
          <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#ff3e00", color: "#fff", fontWeight: 600, border: 0 }} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
      {step === 3 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2>Password Reset Successful</h2>
          <p style={{ margin: "16px 0" }}>Redirecting to login...<br />You can now log in with your new password.</p>
        </div>
      )}
      {error && <div style={{ color: "#c00", marginTop: 16, textAlign: "center" }}>{error}</div>}
      {success && <div style={{ color: "#090", marginTop: 16, textAlign: "center" }}>{success}</div>}
    </main>
  );
};

export default ResetPasswordPage; 