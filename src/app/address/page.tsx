// AddressPage.jsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader } from "@googlemaps/js-api-loader";
import styles from "./page.module.css";

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
  location: { lat: 0, lng: 0 },
  isDefault: false,
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    fetchAddresses();
    // initGoogleMaps(); // Google Maps removed
  }, []);

  const initGoogleMaps = () => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader.load().then(() => {
      // Autocomplete will be initialized when form opens
    });
  };

  async function fetchAddresses() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data);
    } catch (err) {
      setError("Failed to fetch addresses");
    }
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function initAutocomplete() {
    if (typeof google !== "undefined") {
      const input = document.getElementById("autocomplete-input");
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["geocode"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        // Extract address components
        const address = {
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        };

        place.address_components.forEach((component) => {
          const type = component.types[0];
          switch (type) {
            case "street_number":
              address.addressLine1 = component.long_name + " ";
              break;
            case "route":
              address.addressLine1 += component.long_name;
              break;
            case "locality":
              address.city = component.long_name;
              break;
            case "administrative_area_level_1":
              address.state = component.short_name;
              break;
            case "country":
              address.country = component.long_name;
              break;
            case "postal_code":
              address.postalCode = component.long_name;
              break;
          }
        });

        setForm((f) => ({
          ...f,
          ...address,
          addressLine1: address.addressLine1,
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
        }));

        // Update map
        if (map) {
          map.setCenter(place.geometry.location);
          map.setZoom(15);
          if (marker) marker.setMap(null);
          const newMarker = new google.maps.Marker({
            position: place.geometry.location,
            map,
          });
          setMarker(newMarker);
        }
      });

      setAutocomplete(autocomplete);
    }
  }

  function handleEdit(address) {
    setForm(address);
    setEditingId(address._id);
    setShowForm(true);
    setTimeout(initAutocomplete, 100);
  }

  function handleAddNew() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
    setTimeout(initAutocomplete, 100);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`/api/user/addresses/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/user/addresses", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      setError("Failed to save address");
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this address?")) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/user/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err) {
      setError("Failed to delete address");
    }
    setLoading(false);
  }

  async function handleSelect(id) {
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
    } catch (err) {
      setError("Failed to select address");
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Addresses</h1>
        {error && <div className={styles.error}>{error}</div>}
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
                <input
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  className={styles.input}
                >
                </input>
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
                <label>Search Address</label>
                <input
                  id="autocomplete-input"
                  className={styles.input}
                  placeholder="Start typing your address..."
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

              {/* <div className={styles.mapContainer}>
                <label>Location</label>
                <div
                  id="map"
                  className={styles.map}
                  ref={(node) => {
                    if (node && !map && typeof google !== "undefined") {
                      const newMap = new google.maps.Map(node, {
                        center: { lat: 28.6139, lng: 77.209 },
                        zoom: 12,
                        styles: [
                          {
                            elementType: "geometry",
                            stylers: [{ color: "#1e1e1e" }],
                          },
                          {
                            elementType: "labels.text.stroke",
                            stylers: [{ color: "#1e1e1e" }],
                          },
                          {
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#757575" }],
                          },
                          {
                            featureType: "administrative",
                            elementType: "geometry",
                            stylers: [{ visibility: "off" }],
                          },
                          {
                            featureType: "poi",
                            stylers: [{ visibility: "off" }],
                          },
                          {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#2c2c2c" }],
                          },
                          {
                            featureType: "road",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                          },
                          {
                            featureType: "transit",
                            stylers: [{ visibility: "off" }],
                          },
                        ],
                      });

                      newMap.addListener("click", (e) => {
                        setForm((f) => ({
                          ...f,
                          location: {
                            lat: e.latLng.lat(),
                            lng: e.latLng.lng(),
                          },
                        }));
                        if (marker) marker.setMap(null);
                        const newMarker = new google.maps.Marker({
                          position: e.latLng,
                          map: newMap,
                        });
                        setMarker(newMarker);
                      });

                      setMap(newMap);
                    }
                  }}
                ></div>
                <div className={styles.coordinates}>
                  Lat: {form.location.lat.toFixed(4)}, Lng:{" "}
                  {form.location.lng.toFixed(4)}
                </div>
              </div> */}
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
                {editingId ? "Update Address" : "Save Address"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowForm(false)}
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
                    {addr.addressLine1} {addr.addressLine2}
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>City:</span>
                    {addr.city}
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>State:</span>
                    {addr.state}
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.fieldName}>Postal Code:</span>
                    {addr.postalCode}
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
