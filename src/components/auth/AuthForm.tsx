"use client";
import { useState } from "react";
import styles from "./AuthForm.module.css";
import { useRouter } from "next/navigation";

export type AuthMode = "login" | "register" | "otp" | "forgot" | "reset";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password: string) {
  // At least 8 chars, 1 letter, 1 number
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(password);
}
function validatePhone(phone: string) {
  return /^\d{10,15}$/.test(phone);
}

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    // Validation
    if (!email && !phone) {
      setError("Email or phone is required."); setLoading(false); return;
    }
    if (email && !validateEmail(email)) {
      setError("Invalid email format."); setLoading(false); return;
    }
    if (phone && !validatePhone(phone)) {
      setError("Phone number must be 10-15 digits."); setLoading(false); return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters and contain a letter and a number."); setLoading(false); return;
    }
    try {
      // Only send the field the user entered
      const payload: any = { password };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;
      console.log("Login payload:", payload);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("Login response:", data);
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      setSuccess("Logged in successfully!");
      router.replace('/');
      // Optionally redirect or reload
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!name.trim()) {
      setError("Name is required."); setLoading(false); return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email format."); setLoading(false); return;
    }
    if (!validatePhone(phone)) {
      setError("Phone number must be 10-15 digits."); setLoading(false); return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters and contain a letter and a number."); setLoading(false); return;
    }
    try {
      const payload = { name, email, phone, password };
      console.log("Register payload:", payload);
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("Register response:", data);
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setSuccess("Registered. Check your email for OTP.");
      setMode("otp");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!email) { setError("Email is required."); setLoading(false); return; }
    if (!otp || otp.length !== 6) { setError("OTP must be 6 digits."); setLoading(false); return; }
    try {
      console.log("Verify OTP payload:", { email, otp });
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      console.log("Verify OTP response:", data);
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      setSuccess("OTP verified. You can now log in.");
      setMode("login");
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // For forgot/reset, you need to implement endpoints in backend if not present
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!email && !phone) { setError("Email or phone is required."); setLoading(false); return; }
    if (email && !validateEmail(email)) { setError("Invalid email format."); setLoading(false); return; }
    if (phone && !validatePhone(phone)) { setError("Phone number must be 10-15 digits."); setLoading(false); return; }
    try {
      console.log("Forgot password payload:", { email, phone });
      // Backend endpoint for forgot password OTP (to be implemented)
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone })
      });
      const data = await res.json();
      console.log("Forgot password response:", data);
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setSuccess("OTP sent to your email");
      setMode("reset");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!email && !phone) { setError("Email or phone is required."); setLoading(false); return; }
    if (email && !validateEmail(email)) { setError("Invalid email format."); setLoading(false); return; }
    if (phone && !validatePhone(phone)) { setError("Phone number must be 10-15 digits."); setLoading(false); return; }
    if (!otp || otp.length !== 6) { setError("OTP must be 6 digits."); setLoading(false); return; }
    if (!validatePassword(newPassword)) { setError("Password must be at least 8 characters and contain a letter and a number."); setLoading(false); return; }
    try {
      console.log("Reset password payload:", { email, phone, otp, newPassword });
      // Backend endpoint for reset password (to be implemented)
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, otp, newPassword })
      });
      const data = await res.json();
      console.log("Reset password response:", data);
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess("Password reset. You can now log in.");
      setMode("login");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm}>
      {mode === "login" && <h2>Login</h2>}
      {mode === "register" && <h2>Register</h2>}
      {mode === "otp" && <h2>Verify OTP</h2>}
      {mode === "forgot" && <h2>Forgot Password</h2>}
      {mode === "reset" && <h2>Reset Password</h2>}
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {mode === "login"  && (
        <>
          <input
            className={styles.input}
            type="text"
            placeholder="Email or Phone Number"
            value={email || phone}
            onChange={e => {
              const val = e.target.value;
              if (val.includes("@")) { setEmail(val); setPhone(""); }
              else { setPhone(val); setEmail(""); }
            }}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </>
      )}
      {mode === "register" && (
        <>
          <input
            className={styles.input}
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </>
      )}
      {mode === "otp" && (
        <input
          className={styles.input}
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          required
        />
      )}
      {mode === "reset" && (
        <>
          <input
            className={styles.input}
            type="text"
            placeholder="Email or Phone Number"
            value={email || phone}
            onChange={e => {
              const val = e.target.value;
              if (val.includes("@")) { setEmail(val); setPhone(""); }
              else { setPhone(val); setEmail(""); }
            }}
            required
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </>
      )}

      {mode === "login" && (
        <button className={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      )}
      {mode === "register" && (
        <button className={styles.button} onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      )}
      {mode === "otp" && (
        <button className={styles.button} onClick={handleVerifyOtp} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      )}
      {mode === "forgot" && (
        <button className={styles.button} onClick={handleForgot} disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      )}
      {mode === "reset" && (
        <button className={styles.button} onClick={handleReset} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      )}

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        {mode === "login" && (
          <>
            <span>Don&apos;t have an account? </span>
            <a href="#" onClick={e => { e.preventDefault(); setMode("register"); }}>Register</a>
            <br />
            <a href="#" onClick={e => { e.preventDefault(); setMode("forgot"); }}>Forgot password?</a>
          </>
        )}
        {mode === "register" && (
          <>
            <span>Already have an account? </span>
            <a href="#" onClick={e => { e.preventDefault(); setMode("login"); }}>Login</a>
          </>
        )}
        {mode === "otp" && (
          <>
            <span>Back to </span>
            <a href="#" onClick={e => { e.preventDefault(); setMode("login"); }}>Login</a>
          </>
        )}
        {mode === "forgot" && (
          <>
            <span>Back to </span>
            <a href="#" onClick={e => { e.preventDefault(); setMode("login"); }}>Login</a>
          </>
        )}
        {mode === "reset" && (
          <>
            <span>Back to </span>
            <a href="#" onClick={e => { e.preventDefault(); setMode("login"); }}>Login</a>
          </>
        )}
      </div>
    </form>
  );
} 