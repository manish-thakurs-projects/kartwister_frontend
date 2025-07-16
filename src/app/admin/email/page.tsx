"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

export default function AdminEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTo = searchParams.get("to") || "";
  const [to, setTo] = useState(prefillTo);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [bulk, setBulk] = useState(!prefillTo);

  useEffect(() => {
    if (!prefillTo) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setAllUsers(data))
        .catch(() => {});
    }
  }, [prefillTo]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    try {
      let res;
      if (bulk) {
        res = await fetch("/api/admin/bulk-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subject, text: message })
        });
      } else {
        res = await fetch("/api/admin/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ to, subject, text: message })
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send email");
      setSuccess("Email sent successfully!");
      setSubject(""); 
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Email Center</h1>
        <Link href="/admin">
          <button className={styles.backButton}>
            <span className={styles.arrow}>&larr;</span> Dashboard
          </button>
        </Link>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Recipient</label>
            {bulk ? (
              <div className={styles.recipientContainer}>
                <span className={styles.bulkLabel}>All Registered Users</span>
                <button 
                  type="button" 
                  className={styles.toggleButton}
                  onClick={() => setBulk(false)}
                >
                  Switch to Individual
                </button>
              </div>
            ) : (
              <div className={styles.recipientContainer}>
                <input 
                  type="email" 
                  value={to} 
                  onChange={e => setTo(e.target.value)} 
                  required 
                  className={styles.input}
                  disabled={!!prefillTo}
                  placeholder="user@example.com"
                />
                <button 
                  type="button" 
                  className={styles.toggleButton}
                  onClick={() => { setBulk(true); setTo(""); }}
                >
                  Send to All Users
                </button>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              required 
              className={styles.input}
              placeholder="Important announcement"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Message</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              required 
              className={styles.textarea}
              placeholder="Write your message here..."
            />
          </div>

          <button 
            className={`${styles.button} ${loading ? styles.loading : ''}`} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : (
              "Send Email"
            )}
          </button>

          {success && <div className={styles.success}>{success}</div>}
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>

      {bulk && allUsers.length > 0 && (
        <div className={styles.userList}>
          <h3 className={styles.userListTitle}>All Users ({allUsers.length})</h3>
          <ul>
            {allUsers.map(u => (
              <li key={u.email} className={styles.userItem}>
                <span className={styles.userEmail}>{u.email}</span>
                <span className={styles.userName}>{u.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}