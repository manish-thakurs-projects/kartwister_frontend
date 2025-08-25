'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  site: string;
  url: string;
}

interface DeliveryAddress {
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface Order {
  _id: string;
  products: Product[];
  status: string;
  paymentStatus: string;
  deliveryAddress: DeliveryAddress;
  subtotal?: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/order`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        setOrders(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.header}>Your Orders</h1>
      
      {loading && <div className={styles.loader}>Loading orders...</div>}
      
      {error && <div className={styles.errorBanner}>{error}</div>}
      
      {!loading && !error && orders.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <p>You haven&apos;t placed any orders yet</p>
          <button 
            className={styles.ctaButton}
            onClick={() => router.push('/')}
          >
            Start Shopping
          </button>
        </div>
      )}

      <div className={styles.ordersContainer}>
        {orders.map(order => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.orderId}>Order #{order._id.slice(-6)}</span>
                <div className={styles.statusContainer}>
                  <div>
                  <span>
                    At :
                  </span>
                  <span className={`${styles.status} ${styles[order.status.replace(/\s+/g, '')]}`}>
                    {order.status}
                  </span>
                  </div>
                  <div>
                  <span>
                    Payment :
                  </span>
                  <span className={`${styles.paymentStatus} ${order.paymentStatus === 'approved' ? styles.completed : styles.pending}`}>
                    {order.paymentStatus}
                  </span>
                  </div>
                </div>
              </div>
              <button 
                className={styles.trackButton}
                onClick={() => router.push(`/orders/${order._id}/track`)}
              >
                Track Order
              </button>
            </div>

            {order.deliveryAddress?.label && (
              <div className={styles.deliveryAddress}>
                <span className={styles.addressLabel}>Delivering to:</span>
                {order.deliveryAddress.label}
              </div>
            )}

            <div className={styles.productsContainer}>
              {order.products.map((item: Product, idx: number) => (
                <div key={item.url + idx} className={styles.productItem}>
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={60}
                    height={60}
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{item.name}</span>
                    <span className={styles.productSite}>{item.site}</span>
                  </div>
                  <div className={styles.productPrice}>
                    ₹ {item.price} × {item.quantity || 1}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.cardFooter}>
              <div className={styles.totalAmount}>
                Total: रु {order.subtotal || 0}
              </div>
              <div className={styles.orderDate}>
              On : {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}