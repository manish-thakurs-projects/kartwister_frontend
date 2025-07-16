// app/admin/completed-orders/page.tsx
"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/");
      return;
    }
    
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/completed-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch completed orders");
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [router]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

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

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Completed Orders</h1>
          <p className={styles.subtitle}>All successfully processed customer orders</p>
        </div>
        <Link href="/admin">
          <button className={styles.backButton}>
            <span className={styles.arrow}>&larr;</span> Dashboard
          </button>
        </Link>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading orders...</p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No completed orders yet</h3>
          <p>Completed orders will appear here once customers complete their purchases.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className={styles.ordersGrid}>
          {orders.map(order => (
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
                    <span className={styles.orderLabel}>Order #</span>
                    {order._id.slice(-8).toUpperCase()}
                  </div>
                  <div className={styles.orderCustomer}>
                    <span className={styles.orderLabel}>Customer:</span>
                    {order.user?.email || "N/A"}
                  </div>
                </div>
                <div className={styles.orderMeta}>
                  <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                  <div className={styles.orderTotal}>
                    {formatPrice(order.totalAmount || order.products.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0))}
                  </div>
                </div>
                <div className={styles.orderToggle}>
                  {expandedOrder === order._id ? '▲' : '▼'}
                </div>
              </div>
              
              {expandedOrder === order._id && (
                <div className={styles.orderDetails}>
                  <div className={styles.productsSection}>
                    <h3 className={styles.sectionTitle}>Products</h3>
                    <div className={styles.productsGrid}>
                      {order.products.map((item: any, idx: number) => (
                        <div key={item.url + idx} className={styles.productItem}>
                          <div className={styles.productImage}>
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              onError={(e) => (e.currentTarget.src = '/placeholder-image.svg')}
                            />
                          </div>
                          <div className={styles.productInfo}>
                            <div className={styles.productName}>{item.name}</div>
                            <div className={styles.productMeta}>
                              <span className={styles.productSite}>{item.site}</span>
                              <span className={styles.productPrice}>{formatPrice(item.price)} × {item.quantity || 1}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.deliverySection}>
                    <h3 className={styles.sectionTitle}>Delivery Address</h3>
                    <div className={styles.addressCard}>
                      <div className={styles.addressLabel}>{order.deliveryAddress?.label}</div>
                      <div className={styles.addressLine}>{order.deliveryAddress?.addressLine1}</div>
                      <div className={styles.addressCity}>
                        {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                      </div>
                      <div className={styles.addressPhone}>📱 {order.deliveryAddress?.phone}</div>
                    </div>
                  </div>
                  
                  <div className={styles.statusSection}>
                    <h3 className={styles.sectionTitle}>Order Status</h3>
                    <div className={styles.statusBadge}>
                      <span className={styles.statusDot}></span>
                      Completed
                    </div>
                    <div className={styles.statusTimeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <div>Order placed</div>
                          <div className={styles.timelineDate}>{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <div>Processing</div>
                          <div className={styles.timelineDate}>{formatDate(order.updatedAt)}</div>
                        </div>
                      </div>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <div>Completed</div>
                          <div className={styles.timelineDate}>{formatDate(order.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {orders.length > 0 && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Orders</span>
            <span className={styles.summaryValue}>{orders.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Revenue</span>
            <span className={styles.summaryValue}>
              {formatPrice(orders.reduce((sum, order) => sum + (order.totalAmount || order.products.reduce((s: number, p: any) => s + (p.price * (p.quantity || 1)), 0)), 0))}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Avg. Order Value</span>
            <span className={styles.summaryValue}>
              {formatPrice(orders.reduce((sum, order) => sum + (order.totalAmount || order.products.reduce((s: number, p: any) => s + (p.price * (p.quantity || 1)), 0)), 0) / orders.length)}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}