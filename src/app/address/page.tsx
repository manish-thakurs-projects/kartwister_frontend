"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./page.module.css";

interface Address {
  _id: string;
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  location: { lat: number; lng: number };
  isDefault?: boolean;
}

const initialForm = {
  label: "Home",
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  isDefault: false,
  location: { lat: 0, lng: 0 }, // Add default location
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data);
    } catch {
      setError("Failed to fetch addresses");
    }
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleEdit(address: Address) {
    setForm({ 
      ...address, 
      addressLine2: address.addressLine2 || "",
      isDefault: address.isDefault || false,
      location: address.location || { lat: 0, lng: 0 } 
    }); // Ensure location exists
    setEditingId(address._id);
    setShowForm(true);
  }

  function handleAddNew() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("token");
      const formWithLocation = {
        ...form,
        location: form.location || { lat: 0, lng: 0 }, // Always send location
      };
      if (editingId) {
        await axios.put(`/api/user/addresses/${editingId}`, formWithLocation, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage("Address updated successfully");
      } else {
        await axios.post("/api/user/addresses", formWithLocation, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage("Address added successfully");
      }
      setTimeout(() => {
        setShowForm(false);
        fetchAddresses();
      }, 1500);
    } catch {
      setError("Failed to save address");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this address?")) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/user/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch {
      setError("Failed to delete address");
    }
    setLoading(false);
  }

  async function handleSelect(id: string) {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/user/addresses/${id}/select`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAddresses();
    } catch {
      setError("Failed to select address");
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Addresses</h1>
        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}
        <button className={styles.addButton} onClick={handleAddNew}>
          + Add New Address
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Label</label>
                <select
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Address Line 1</label>
                <input
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Address Line 2</label>
                <input
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className={styles.checkbox}
                />
                Set as default address
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Processing..." : editingId ? "Update Address" : "Save Address"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.addressesContainer}>
        <h2 className={styles.sectionTitle}>Saved Addresses</h2>
        {loading && <div className={styles.loader}>Loading...</div>}

        {addresses.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p>No addresses saved yet</p>
            <button 
              className={styles.addEmptyButton}
              onClick={handleAddNew}
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className={styles.addressGrid}>
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`${styles.addressCard} ${
                  addr.isDefault ? styles.defaultCard : ""
                }`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardLabel}>
                    <span className={styles.labelIcon}>
                      {addr.label === "Home" ? "🏠" : 
                       addr.label === "Work" ? "🏢" : "📍"}
                    </span>
                    {addr.label}
                    {addr.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(addr)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(addr._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>Name:</span>
                    {addr.name}
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>Phone:</span>
                    {addr.phone}
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>Address:</span>
                    <div>
                      {addr.addressLine1} 
                      {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                    </div>
                  </div>
                  <div className={styles.addressDetails}>
                    <div>{addr.city}, {addr.state}</div>
                    <div>{addr.country} {addr.postalCode}</div>
                  </div>
                </div>

                {!addr.isDefault && (
                  <button
                    className={styles.setDefaultButton}
                    onClick={() => handleSelect(addr._id)}
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}