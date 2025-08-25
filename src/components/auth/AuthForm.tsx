"use client";
import { useState } from "react";
import styles from "./AuthForm.module.css";
import { useRouter } from "next/navigation";

export type AuthMode = "login" | "register" | "otp" | "forgot" | "reset";

interface LoginPayload {
  password: string;
  email?: string;
  phone?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password: string) {
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
      const payload: LoginPayload = { password };
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
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
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
      const payload: RegisterPayload = { name, email, phone, password };
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
    } catch (err: unknown) {
      console.error("Register error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
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
    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
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
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
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
    } catch (err: unknown) {
      console.error("Reset password error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle}>
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "otp" && "Verify Account"}
            {mode === "forgot" && "Reset Password"}
            {mode === "reset" && "New Password"}
          </h2>
          <p className={styles.authSubtitle}>
            {mode === "login" && "Sign in to continue"}
            {mode === "register" && "Join our community"}
            {mode === "otp" && "Check your email for OTP"}
            {mode === "forgot" && "Recover your account"}
            {mode === "reset" && "Create a new password"}
          </p>
        </div>

        <form className={styles.authForm}>
          {(error || success) && (
            <div className={`${styles.alert} ${error ? styles.error : styles.success}`}>
              {error || success}
            </div>
          )}

          {mode === "login" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="loginId" className={styles.inputLabel}>Email or Phone</label>
                <input
                  id="loginId"
                  className={styles.input}
                  type="text"
                  value={email || phone}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.includes("@")) { setEmail(val); setPhone(""); }
                    else { setPhone(val); setEmail(""); }
                  }}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.inputLabel}>Password</label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => router.push("/reset-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.inputLabel}>Full Name</label>
                <input
                  id="name"
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>Email Address</label>
                <input
                  id="email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="phone" className={styles.inputLabel}>Phone Number</label>
                <input
                  id="phone"
                  className={styles.input}
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="regPassword" className={styles.inputLabel}>Password</label>
                <input
                  id="regPassword"
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {mode === "otp" && (
            <div className={styles.inputGroup}>
              <label htmlFor="otp" className={styles.inputLabel}>Verification Code</label>
              <input
                id="otp"
                className={styles.input}
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="resetId" className={styles.inputLabel}>Email or Phone</label>
                <input
                  id="resetId"
                  className={styles.input}
                  type="text"
                  value={email || phone}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.includes("@")) { setEmail(val); setPhone(""); }
                    else { setPhone(val); setEmail(""); }
                  }}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="resetOtp" className={styles.inputLabel}>Verification Code</label>
                <input
                  id="resetOtp"
                  className={styles.input}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.inputLabel}>New Password</label>
                <input
                  id="newPassword"
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className={styles.actionGroup}>
            <button 
              className={`${styles.button} ${loading ? styles.loading : ''}`}
              onClick={
                mode === "login" ? handleLogin :
                mode === "register" ? handleRegister :
                mode === "otp" ? handleVerifyOtp :
                mode === "forgot" ? handleForgot :
                handleReset
              }
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner}></span>
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "register" && "Create Account"}
                  {mode === "otp" && "Verify Account"}
                  {mode === "forgot" && "Send Reset Code"}
                  {mode === "reset" && "Update Password"}
                </>
              )}
            </button>
          </div>
        </form>

        <div className={styles.authFooter}>
          {mode === "login" && (
            <>
                              <p>Don&apos;t have an account? 
                <button className={styles.footerLink} onClick={() => setMode("register")}>
                  Sign Up
                </button>
              </p>
            </>
          )}
          
          {mode === "register" && (
            <p>Already have an account? 
              <button className={styles.footerLink} onClick={() => setMode("login")}>
                Sign In
              </button>
            </p>
          )}
          
          {(mode === "otp" || mode === "forgot" || mode === "reset") && (
            <button 
              className={styles.footerLink}
              onClick={() => setMode("login")}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}