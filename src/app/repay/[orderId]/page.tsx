"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../checkout/page.module.css";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  site: string;
  url: string;
}

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

interface AddressForm {
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  location: { lat: number; lng: number };
  isDefault: boolean;
}

interface Order {
  _id: string;
  products: Product[];
  status: string;
  paymentStatus: string;
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export default function RepayPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressModal, setAddressModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddressForm>({
    label: 'Home', name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '', location: { lat: 0, lng: 0 }, isDefault: false
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch order");
        setOrder(data);
        setSelectedAddress(data.deliveryAddress);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    async function fetchAddresses() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/user/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAddresses(data);
      } catch {}
    }
    fetchAddresses();
  }, []);

  useEffect(() => {
    async function fetchQR() {
      setQrLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/public-qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.qr) setQrUrl(data.qr);
      } catch {}
      setQrLoading(false);
    }
    fetchQR();
  }, []);

  function handleSelectAddress(id: string) {
    const addr = addresses.find((a: Address) => a._id === id);
    if (addr) setSelectedAddress(addr);
    setAddressModal(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f: AddressForm) => ({ ...f, [name]: value }));
  }

  async function handleAddAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/user/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to add address');
      const data = await res.json();
      setAddresses(data);
      setShowAddForm(false);
      setForm({ label: 'Home', name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '', location: { lat: 0, lng: 0 }, isDefault: false });
    } catch {
      setAddressError('Failed to add address');
    }
    setAddressLoading(false);
  }

  const MAX_FILE_SIZE_MB = 5;
  function isValidImage(file: File | null) {
    return file && file.type.startsWith("image/") && file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true);
    if (!proof) {
      setError("Please select a payment proof image.");
      setUploading(false);
      return;
    }
    if (!isValidImage(proof)) {
      setError("File must be an image and less than 5MB.");
      setUploading(false);
      return;
    }
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      setUploading(false);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("You must be logged in.");
      setUploading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("paymentProof", proof);
      formData.append("deliveryAddress", JSON.stringify(selectedAddress));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/order/repay/${orderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to repay order");
      setSuccess("Payment proof uploaded! Your order will be rechecked.");
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError("Failed to upload payment proof: " + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!order) return null;

  return (
    <div className={styles.container}>
      {/* QR Code Section */}
      <div style={{ margin: '0 auto 32px', maxWidth: 320, textAlign: 'center' }}>
        <h2 style={{ color: '#ff3e00', marginBottom: 12 }}>Payment QR</h2>
        {qrLoading ? (
          <div style={{ color: '#aaa', marginBottom: 16 }}>Loading QR...</div>
        ) : qrUrl ? (
          <Image 
            src={qrUrl} 
            alt="Payment QR" 
            width={220}
            height={220}
            style={{ objectFit: 'contain', background: '#fff', borderRadius: 12, marginBottom: 8 }} 
          />
        ) : (
          <div style={{ color: '#aaa', marginBottom: 16 }}>No QR code available.</div>
        )}
        <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>Scan this QR to pay for your order.</div>
      </div>
      {addressModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Select Delivery Address</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setAddressModal(false)}
              >
                &times;
              </button>
            </div>
            {addressError && <div className={styles.modalError}>{addressError}</div>}
            {addressLoading ? (
              <div className={styles.loading}>Loading addresses...</div>
            ) : (
              <>
                <ul className={styles.addressList}>
                  {addresses.map(addr => (
                    <li 
                      key={addr._id} 
                      className={`${styles.addressItem} ${addr._id === selectedAddress?._id ? styles.selectedAddress : ''}`}
                      onClick={() => handleSelectAddress(addr._id)}
                    >
                      <div className={styles.addressLabel}>
                        <span className={styles.tag}>{addr.label}</span>
                        {addr.isDefault && <span className={styles.defaultTag}>Default</span>}
                      </div>
                      <p className={styles.addressText}>{addr.name}</p>
                      <p className={styles.addressText}>{addr.addressLine1}, {addr.addressLine2}</p>
                      <p className={styles.addressText}>{addr.city}, {addr.state}, {addr.postalCode}</p>
                      <p className={styles.addressText}>{addr.country}</p>
                      <p className={styles.addressText}>📱 {addr.phone}</p>
                    </li>
                  ))}
                </ul>
                {!showAddForm ? (
                  <div className={styles.modalActions}>
                    <button 
                      className={`${styles.modalButton} ${styles.primary}`}
                      onClick={() => setShowAddForm(true)}
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddAddress} className={styles.addressForm}>
                    <h3 className={styles.formTitle}>Add New Address</h3>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Label</label>
                        <select 
                          name="label" 
                          value={form.label} 
                          onChange={handleChange}
                          className={styles.formInput}
                          required
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Full Name</label>
                        <input 
                          type="text" 
                          name="name" 
                          value={form.name} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          value={form.phone} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Address Line 1</label>
                        <input 
                          type="text" 
                          name="addressLine1" 
                          value={form.addressLine1} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Address Line 2</label>
                        <input 
                          type="text" 
                          name="addressLine2" 
                          value={form.addressLine2} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="Apt #4B"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input 
                          type="text" 
                          name="city" 
                          value={form.city} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input 
                          type="text" 
                          name="state" 
                          value={form.state} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="NY"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Country</label>
                        <input 
                          type="text" 
                          name="country" 
                          value={form.country} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="United States"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Postal Code</label>
                        <input 
                          type="text" 
                          name="postalCode" 
                          value={form.postalCode} 
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="10001"
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formActions}>
                      <button 
                        type="button" 
                        className={`${styles.formButton} ${styles.secondary}`}
                        onClick={() => setShowAddForm(false)}
                        disabled={addressLoading}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={`${styles.formButton} ${styles.primary}`}
                        disabled={addressLoading}
                      >
                        {addressLoading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div className={styles.checkoutCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Repay for Order #{order._id.slice(-6)}</h1>
          <div className={styles.steps}>
            <span className={styles.activeStep}>1. Address</span>
            <span className={styles.activeStep}>2. Payment</span>
            <span>3. Confirmation</span>
          </div>
        </div>
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>Your Products</h2>
          <div className={styles.productsList}>
            {order.products.map((item: Product, idx: number) => (
              <div key={item.url + idx} className={styles.productItem}>
                <Image src={item.image} alt={item.name} width={80} height={80} className={styles.productImage} />
                <div className={styles.productDetails}>
                  <div className={styles.productName}>{item.name}</div>
                  <div className={styles.productMeta}>
                    <span className={styles.productSite}>{item.site}</span>
                    <span className={styles.productPrice}>रु{item.price} × {item.quantity || 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.summarySection}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <div className={styles.summaryDetails}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>रु {order.products.reduce((sum: number, item: Product) => sum + Number(item.price) * (item.quantity || 1), 0).toFixed(2)}</span>
            </div>
            {/* Add other summary rows as needed, e.g., shipping, tax, etc. if available on order */}
          </div>
        </div>
        <div className={styles.qrSection}>
          <div className={styles.uploadSection}>
            <h2 className={styles.sectionTitle}>Upload New Payment Proof</h2>
            <form onSubmit={handleUpload} className={styles.uploadForm}>
              <label className={styles.fileUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setProof(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <div className={styles.uploadArea}>
                  {proof ? (
                    <>
                      <div className={styles.filePreview}>
                        <span className={styles.fileName}>{proof.name}</span>
                        <span className={styles.fileSize}>
                          {(proof.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.changeButton}
                        onClick={() => setProof(null)}
                      >
                        Change
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM14 13V17H10V13H7L12 8L17 13H14Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <p>Click to upload payment screenshot</p>
                      <p className={styles.uploadHint}>JPG or PNG (max 5MB)</p>
                    </>
                  )}
                </div>
              </label>
              <div className={styles.addressPreview}>
                <h3 className={styles.previewTitle}>Delivery Address</h3>
                {selectedAddress ? (
                  <div className={styles.selectedAddressPreview}>
                    <div className={styles.addressHeader}>
                      <span className={styles.addressTag}>{selectedAddress.label}</span>
                      {selectedAddress.isDefault && (
                        <span className={styles.defaultTag}>Default</span>
                      )}
                    </div>
                    <p>{selectedAddress.name}</p>
                    <p>{selectedAddress.addressLine1}, {selectedAddress.addressLine2}</p>
                    <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                    <p>{selectedAddress.country}</p>
                    <p>📱 {selectedAddress.phone}</p>
                  </div>
                ) : (
                  <p className={styles.noAddress}>No address selected</p>
                )}
                <button
                  type="button"
                  className={styles.changeAddressButton}
                  onClick={() => setAddressModal(true)}
                >
                  Change Address
                </button>
              </div>
              <button
                className={`${styles.submitButton} ${uploading ? styles.loadingButton : ''}`}
                type="submit"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Processing Payment...
                  </>
                ) : (
                  'Confirm Repayment'
                )}
              </button>
            </form>
          </div>
        </div>
        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    </div>
  );
} 