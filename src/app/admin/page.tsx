'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiActivity, FiPackage, FiCheckCircle, FiDollarSign, FiSettings, FiUpload, FiXCircle, FiMapPin, FiEye, FiCheck, FiRefreshCw } from 'react-icons/fi';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AdminPage() {
  // State hooks
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });
  const [uploading, setUploading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showProof, setShowProof] = useState<string | null>(null);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [transactionRate, setTransactionRate] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [chargesLoading, setChargesLoading] = useState(true);
  const [showAddress, setShowAddress] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'charges' | 'qr'>('orders');

  // Authentication check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/');
      return;
    }
    const decoded = parseJwt(token);
    if (!decoded?.isAdmin) {
      router.replace('/');
      return;
    }
    setChecking(false);
  }, [router]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        setOrders(data);
        setStats({
          total: data.length,
          pending: data.filter((o: any) => o.status === 'pending').length,
          paid: data.filter((o: any) => o.status === 'paid').length
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Fetch current QR
  const fetchCurrentQR = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/current-qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.qr) setQrUrl(data.qr);
    } catch {}
  };
  useEffect(() => { fetchCurrentQR(); }, []);

  // Fetch global charges
  useEffect(() => {
    const fetchCharges = async () => {
      setChargesLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/charges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setShippingCharge(data.shippingCharge);
          setServiceCharge(data.serviceCharge);
          setTransactionRate(data.transactionRate || 0);
          setTax(data.tax || 0);
        }
      } catch {}
      setChargesLoading(false);
    };
    fetchCharges();
  }, []);

  // Update charges
  const updateCharges = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shippingCharge, serviceCharge, transactionRate, tax })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update charges');
      setSuccessMsg('Charges updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  // Update order status
  const updateStatus = async (id: string, status: string, note: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/order/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setOrders(orders.map(order => 
        order._id === id ? { ...order, status, tracking: [...order.tracking, { status, note, date: new Date() }] } : order
      ));
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  // Approve payment
  const approvePayment = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/order/${id}/approve-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve payment');
      setOrders(orders.map(order => 
        order._id === id ? { ...order, paymentStatus: 'approved' } : order
      ));
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  // Upload QR
  const uploadQR = async (file: File) => {
    setUploading(true);
    setError('');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('qr', file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/upload-qr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload QR');
      setQrUrl(data.qr);
      setSuccessMsg('QR code uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Complete delivery
  const completeDelivery = async (id: string) => {
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/order/${id}/complete-delivery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to complete delivery');
      setSuccessMsg('Order marked as completed!');
      setOrders(orders.filter(o => o._id !== id));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError('Failed to complete delivery: ' + err.message);
    }
  };

  // Add this function for rejecting payment
  const rejectPayment = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/order/${id}/reject-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject payment');
      setOrders(orders.map(order => 
        order._id === id ? { ...order, paymentStatus: 'rejected', status: 'rejected' } : order
      ));
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  if (checking) {
    return (
      <div className={styles.loadingOverlay}>
        <FiRefreshCw className={styles.spinner} />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.headerActions}>
            <Link href="/admin/completed-orders">
              <button className={styles.headerButton}>
                <FiPackage /> Completed Orders
              </button>
            </Link>
            <Link href="/admin/email">
              <button className={styles.headerButton}>
                <FiActivity /> Send Email
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiPackage />
          </div>
          <div>
            <div className={styles.statLabel}>Total Orders</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiRefreshCw />
          </div>
          <div>
            <div className={styles.statLabel}>Pending</div>
            <div className={styles.statValue}>{stats.pending}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiCheckCircle />
          </div>
          <div>
            <div className={styles.statLabel}>Paid</div>
            <div className={styles.statValue}>{stats.paid}</div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiPackage /> Orders
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'charges' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('charges')}
        >
          <FiSettings /> Charges
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'qr' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          <FiUpload /> QR Code
        </button>
      </div>

      {/* Charges Panel */}
      {activeTab === 'charges' && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Global Charges Configuration</h2>
          {chargesLoading ? (
            <div className={styles.loading}>Loading charges...</div>
          ) : (
            <div className={styles.chargesForm}>
              <div className={styles.formGroup}>
                <label>Shipping Charge (रु)</label>
                <input 
                  type="number" 
                  value={shippingCharge} 
                  onChange={e => setShippingCharge(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Service Charge (रु)</label>
                <input 
                  type="number" 
                  value={serviceCharge} 
                  onChange={e => setServiceCharge(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Transaction Rate (%)</label>
                <input 
                  type="number" 
                  value={transactionRate} 
                  onChange={e => setTransactionRate(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Tax (%)</label>
                <input 
                  type="number" 
                  value={tax} 
                  onChange={e => setTax(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              
              <button 
                onClick={updateCharges} 
                className={styles.primaryButton}
              >
                <FiCheck /> Update Charges
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Panel */}
      {activeTab === 'qr' && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Payment QR Code</h2>
          <div className={styles.qrSection}>
            {qrUrl ? (
              <>
                <div className={styles.qrPreview}>
                  <img src={qrUrl} alt="QR Code" className={styles.qrImage} />
                </div>
                <p className={styles.qrUrl}>Current QR: {qrUrl}</p>
              </>
            ) : (
              <p className={styles.noQR}>No QR code uploaded</p>
            )}
            
            <div className={styles.uploadSection}>
              <label className={styles.uploadButton}>
                <FiUpload /> Select QR Image
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => e.target.files && uploadQR(e.target.files[0])} 
                  disabled={uploading}
                  className={styles.fileInput}
                />
              </label>
              {uploading && <div className={styles.uploadStatus}>Uploading...</div>}
            </div>
          </div>
        </div>
      )}

      {/* Orders Panel */}
      {activeTab === 'orders' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Recent Orders</h2>
            <div className={styles.orderCount}>{orders.length} active orders</div>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              <FiRefreshCw className={styles.spinner} /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <FiPackage className={styles.emptyIcon} />
              <p>No active orders found</p>
            </div>
          ) : (
            <div className={styles.ordersGrid}>
              {orders.map(order => (
                <div key={order._id} className={`${styles.orderCard} ${order.needsRecheck ? styles.needsRecheck : ''}`}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>Order #{order._id.slice(-6)}</div>
                      <div className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.orderStatus} data-status={order.status}>
                      {order.status}
                      {order.status === 'rejected' && (
                        <span style={{ color: '#ff3e00', marginLeft: 8 }}>(Rejected)</span>
                      )}
                      {order.needsRecheck && (
                        <span className={styles.recheckBadge}>Needs Recheck</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.orderUser}>
                    <div className={styles.userEmail}>
                      <Link href={`/admin/email?to=${encodeURIComponent(order.user.email)}`}>{order.user.email}</Link>
                    </div>
                    {order.user?.phone && (
                      <a href={`tel:${order.user.phone}`} className={styles.userPhone}>
                        {order.user.phone}
                      </a>
                    )}
                  </div>
                  
                  <div className={styles.orderProducts}>
                    {order.products.map((item: any, idx: number) => (
                      <div key={item.url + idx} className={styles.productItem}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className={styles.productImage} 
                        />
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
                  
                  <div className={styles.orderSummary}>
                    <div className={styles.summaryItem}>
                      <span>Shipping:</span>
                      <span>रु{order.shippingCharge || 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Service:</span>
                      <span>रु{order.serviceCharge || 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Payment:</span>
                      <span className={styles.paymentStatus} data-status={order.paymentStatus}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Total:</span>
                      <span style={{ fontWeight: 700, color: '#ff3e00' }}>रु{order.subtotal || 0}</span>
                    </div>
                  </div>
                  
                  <div className={styles.orderActions}>
                    {order.paymentProof && (
                      <button 
                        className={styles.actionButton}
                        onClick={() => setShowProof(order.paymentProof)}
                      >
                        <FiEye /> View Proof
                      </button>
                    )}
                    {/* Only show Approve/Reject when proof modal is open for this order */}
                    {showProof === order.paymentProof && order.paymentProof && (
                      <div className={styles.paymentProofModal}>
                        <div className={styles.modalContent}>
                          <button 
                            className={styles.closeButton}
                            onClick={() => setShowProof(null)}
                          >
                            <FiXCircle />
                          </button>
                          <img 
                            src={order.paymentProof} 
                            alt="Payment Proof" 
                            className={styles.proofImage} 
                          />
                          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                            <button 
                              className={styles.actionButton}
                              onClick={() => approvePayment(order._id)}
                              disabled={order.paymentStatus === 'approved'}
                            >
                              <FiCheckCircle /> Approve
                            </button>
                            <button 
                              className={styles.actionButton}
                              onClick={() => rejectPayment(order._id)}
                              disabled={order.paymentStatus === 'rejected'}
                              style={{ background: '#ff3e00', color: 'white' }}
                            >
                              <FiXCircle /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Pending status button (for demonstration, not interactive) */}
                    {order.paymentStatus === 'pending' && (
                      <span className={styles.actionButton} style={{ background: '#ffa500', color: '#222', cursor: 'default' }}>
                        Pending
                      </span>
                    )}
                    <button 
                      className={styles.actionButton}
                      onClick={() => {
                        const location = prompt('Enter new product location/status:');
                        if (location) updateStatus(order._id, location, 'Location updated by admin');
                      }}
                    >
                      <FiMapPin /> Update Location
                    </button>
                    {!order.completed && (
                      <button 
                        className={styles.completeButton}
                        onClick={() => completeDelivery(order._id)}
                      >
                        <FiCheck /> Complete
                      </button>
                    )}
                    {order.deliveryAddress && (
                      <button 
                        className={styles.actionButton}
                        onClick={() => setShowAddress(order.deliveryAddress)}
                      >
                        <FiMapPin /> Address
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      {showAddress && (
        <div className={styles.addressModal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeButton}
              onClick={() => setShowAddress(null)}
            >
              <FiXCircle />
            </button>
            <h3>Delivery Address</h3>
            <div className={styles.addressDetails}>
              <div><span>Label:</span> {showAddress.label}</div>
              <div><span>Name:</span> {showAddress.name}</div>
              <div><span>Phone:</span> {showAddress.phone}</div>
              <div><span>Address:</span> {showAddress.addressLine1} {showAddress.addressLine2}</div>
              <div><span>City:</span> {showAddress.city}</div>
              <div><span>State:</span> {showAddress.state}</div>
              <div><span>Country:</span> {showAddress.country}</div>
              <div><span>Postal Code:</span> {showAddress.postalCode}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}