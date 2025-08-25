"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { FiMail, FiLock, FiCheckCircle, FiArrowLeft, FiShield, FiKey } from "react-icons/fi";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setSuccess("OTP sent to your email. Please check your inbox.");
      setStep(2);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess("Password updated successfully! You can now log in with your new password.");
      setStep(3);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add redirect logic after successful reset
  React.useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        router.push("/auth?reset=1");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}></div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}></div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}></div>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {step === 1 && "Reset Your Password"}
            {step === 2 && "Enter OTP & New Password"}
            {step === 3 && "Password Reset Complete"}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 && "Enter your email address and we'll send you a secure OTP to reset your password"}
            {step === 2 && "Enter the 6-digit OTP sent to your email and create a new password"}
            {step === 3 && "Your password has been successfully updated"}
          </p>
        </div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <>
            <div className={styles.infoBox}>
              <h3><FiShield size={16} /> Secure Password Reset</h3>
              <p>We'll send a one-time password (OTP) to your registered email address. This ensures only you can reset your password.</p>
            </div>
            
            <form onSubmit={handleRequestOtp} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="Enter your registered email"
                />
              </div>
              
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <FiMail size={18} />
                    Send OTP
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP and New Password */}
        {step === 2 && (
          <>
            <div className={styles.infoBox}>
              <h3><FiKey size={16} /> Password Requirements</h3>
              <p>Your new password must be at least 8 characters long. Make it strong by including letters, numbers, and special characters.</p>
            </div>
            
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className={styles.input}
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className={styles.input}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FiLock size={18} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className={styles.successStep}>
            <div className={styles.successIcon}>
              <FiCheckCircle size={40} />
            </div>
            <h2 className={styles.successTitle}>Password Reset Successful!</h2>
            <p className={styles.successMessage}>
              Your password has been successfully updated. You can now log in to your account with your new password.
            </p>
            <div className={styles.redirectMessage}>
              <FiArrowLeft size={14} /> Redirecting to login page in 3 seconds...
            </div>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && step !== 3 && <div className={styles.success}>{success}</div>}

        {/* Back Link */}
        <div className={styles.backLink}>
          <a href="/auth">
            <FiArrowLeft size={16} /> Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 