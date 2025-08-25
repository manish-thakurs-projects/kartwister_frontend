// app/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

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
  isDefault: boolean;
}

interface ScrapeRequest {
  url: string;
  site: string;
  name: string;
  date: string;
}

interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  site: string;
  url: string;
}

interface Order {
  _id: string;
  products: OrderProduct[];
  status: string;
  paymentStatus: string;
  paymentProof?: string;
  shippingCharge: number;
  serviceCharge: number;
  deliveryAddress: Address;
  tracking: any[];
  completed: boolean;
  repaidFor?: string;
  needsRecheck: boolean;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

interface Profile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  profile: Profile;
  addresses: Address[];
  scrapeHistory: ScrapeRequest[];
  orders: Order[];
}

const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>('profile');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/user/dashboard", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, {data.profile.name}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statValue}>{data.orders.length}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statValue}>{data.scrapeHistory.length}</div>
            <div className={styles.statLabel}>Scrape Requests</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏠</div>
            <div className={styles.statValue}>{data.addresses.length}</div>
            <div className={styles.statLabel}>Saved Addresses</div>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Sidebar Navigation */}
        <div className={styles.sidebar}>
          <div 
            className={`${styles.navItem} ${activeSection === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <div className={styles.navIcon}>👤</div>
            Profile
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveSection('addresses')}
          >
            <div className={styles.navIcon}>📍</div>
            Addresses
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'scrape' ? styles.active : ''}`}
            onClick={() => setActiveSection('scrape')}
          >
            <div className={styles.navIcon}>🔍</div>
            Scrape History
          </div>
          <div 
            className={`${styles.navItem} ${activeSection === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            <div className={styles.navIcon}>📦</div>
            Order History
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Profile Information</h2>
              <div className={styles.profileGrid}>
                <div className={styles.profileInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Name:</span>
                    <span className={styles.infoValue}>{data.profile.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span className={styles.infoValue}>{data.profile.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone:</span>
                    <span className={styles.infoValue}>{data.profile.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Verified:</span>
                    <span className={`${styles.infoValue} ${data.profile.isVerified ? styles.verified : styles.notVerified}`}>
                      {data.profile.isVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Member Since:</span>
                    <span className={styles.infoValue}>{formatDate(data.profile.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.profileActions}>
                  <button className={styles.actionButton} onClick={() => router.push('/reset-password')}>Change Password</button>
                </div>
              </div>
            </div>
          )}

          {/* Addresses Section */}
          {activeSection === 'addresses' && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Saved Addresses</h2>
              {data.addresses.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📍</div>
                  <h3>No saved addresses</h3>
                  <p>Add an address to make checkout faster</p>
                  <button className={styles.addButton}>Add New Address</button>
                </div>
              ) : (
                <div className={styles.addressesGrid}>
                  {data.addresses.map(addr => (
                    <div 
                      key={addr._id} 
                      className={`${styles.addressCard} ${addr.isDefault ? styles.default : ''}`}
                    >
                      {addr.isDefault && <div className={styles.defaultBadge}>Default</div>}
                      <div className={styles.addressHeader}>
                        <h3>{addr.label}</h3>
                        <div className={styles.addressActions}>
                          <button className={styles.editButton}>Edit</button>
                          <button className={styles.deleteButton}>Delete</button>
                        </div>
                      </div>
                      <div className={styles.addressContent}>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>Name:</span>
                          <span>{addr.name}</span>
                        </div>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>Phone:</span>
                          <span>{addr.phone}</span>
                        </div>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>Address:</span>
                          <span>{addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}</span>
                        </div>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>City:</span>
                          <span>{addr.city}</span>
                        </div>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>State:</span>
                          <span>{addr.state}</span>
                        </div>
                        <div className={styles.addressField}>
                          <span className={styles.fieldLabel}>Postal Code:</span>
                          <span>{addr.postalCode}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scrape History Section */}
          {activeSection === 'scrape' && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Scrape History</h2>
              {data.scrapeHistory.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3>No scrape history</h3>
                  <p>Start scraping products to see them here</p>
                  <button className={styles.addButton}>Scrape a Product</button>
                </div>
              ) : (
                <div className={styles.scrapeTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th>Product</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.scrapeHistory.map((s, i) => (
                        <tr key={i}>
                          <td>
                            <div className={styles.siteBadge}>{s.site}</div>
                          </td>
                          <td>
                            <div className={styles.productName}>{s.name}</div>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.productLink}>
                              View Product
                            </a>
                          </td>
                          <td>{formatDate(s.date)}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button className={styles.viewButton}>View</button>
                              <button className={styles.scrapeButton}>Rescrape</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Orders Section */}
          {activeSection === 'orders' && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Order History</h2>
              {data.orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h3>No orders placed yet</h3>
                  <p>Your orders will appear here once you make a purchase</p>
                  <button className={styles.addButton}>Start Shopping</button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {data.orders.map(order => (
                    <div 
                      key={order._id} 
                      className={`${styles.orderCard} ${expandedOrder === order._id ? styles.expanded : ''}`}
                    >
                      <div 
                        className={styles.orderHeader}
                        onClick={() => toggleOrder(order._id)}
                      >
                        <div className={styles.orderInfo}>
                          <div className={styles.orderId}>
                            Order #{order._id.slice(-8).toUpperCase()}
                          </div>
                          <div className={styles.orderDate}>
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className={styles.orderMeta}>
                          <div className={styles.orderStatus}>
                            {order.status}
                          </div>
                          <div className={styles.orderTotal}>
                            {formatPrice(order.subtotal)}
                          </div>
                        </div>
                        <div className={styles.orderToggle}>
                          {expandedOrder === order._id ? '▲' : '▼'}
                        </div>
                      </div>
                      
                      {expandedOrder === order._id && (
                        <div className={styles.orderDetails}>
                          <div className={styles.detailsGrid}>
                            <div className={styles.productsSection}>
                              <h3 className={styles.detailTitle}>Products</h3>
                              <div className={styles.productsList}>
                                {order.products.map((p, idx) => (
                                  <div key={idx} className={styles.productItem}>
                                    <div className={styles.productImage}>
                                      <img 
                                        src={p.image} 
                                        alt={p.name} 
                                        onError={(e) => (e.currentTarget.src = '/placeholder-image.svg')}
                                      />
                                    </div>
                                    <div className={styles.productInfo}>
                                      <div className={styles.productName}>{p.name}</div>
                                      <div className={styles.productMeta}>
                                        <span className={styles.productSite}>{p.site}</span>
                                        <span className={styles.productPrice}>{formatPrice(p.price)} × {p.quantity}</span>
                                      </div>
                                      <a href={p.url} target="_blank" rel="noopener noreferrer" className={styles.productLink}>
                                        View Product
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className={styles.addressSection}>
                              <h3 className={styles.detailTitle}>Delivery Address</h3>
                              <div className={styles.addressCardSmall}>
                                <div className={styles.addressLabel}>{order.deliveryAddress?.label}</div>
                                <div className={styles.addressName}>{order.deliveryAddress?.name}</div>
                                <div className={styles.addressLine}>{order.deliveryAddress?.addressLine1}</div>
                                <div className={styles.addressCity}>
                                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.postalCode}
                                </div>
                                <div className={styles.addressPhone}>📱 {order.deliveryAddress?.phone}</div>
                              </div>
                            </div>
                            
                            <div className={styles.paymentSection}>
                              <h3 className={styles.detailTitle}>Payment Details</h3>
                              <div className={styles.paymentInfo}>
                                <div className={styles.paymentItem}>
                                  <span>Subtotal:</span>
                                  <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className={styles.paymentItem}>
                                  <span>Shipping:</span>
                                  <span>{formatPrice(order.shippingCharge)}</span>
                                </div>
                                <div className={styles.paymentItem}>
                                  <span>Service Fee:</span>
                                  <span>{formatPrice(order.serviceCharge)}</span>
                                </div>
                                <div className={styles.paymentItemTotal}>
                                  <span>Total:</span>
                                  <span>{formatPrice(order.subtotal + order.shippingCharge + order.serviceCharge)}</span>
                                </div>
                                <div className={styles.paymentStatus}>
                                  Status: <span className={order.paymentStatus === 'completed' ? styles.completed : styles.pending}>{order.paymentStatus}</span>
                                </div>
                                {order.paymentProof && (
                                  <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                                    View Payment Proof
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            <div className={styles.trackingSection}>
                              <h3 className={styles.detailTitle}>Order Tracking</h3>
                              <div className={styles.timeline}>
                                {order.tracking && order.tracking.length > 0 ? order.tracking.map((t, i) => (
                                  <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                      <div className={styles.timelineStatus}>{t.status}</div>
                                      <div className={styles.timelineDate}>{formatDate(t.date)}</div>
                                      {t.note && <div className={styles.timelineNote}>{t.note}</div>}
                                    </div>
                                  </div>
                                )) : (
                                  <div className={styles.noTracking}>No tracking information available</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;