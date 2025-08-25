'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
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

interface TrackingStep {
  status: string;
  note?: string;
  date: string;
}

interface Order {
  _id: string;
  products: Product[];
  status: string;
  paymentStatus: string;
  tracking: TrackingStep[];
  createdAt: string;
  updatedAt: string;
}

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('You must be logged in to track your order.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch order');
        setOrder(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  return (
    <main className={styles.page}>
      <div className={styles.main}>
        <h1 className={styles.heading}>Track Order</h1>
        
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Fetching order details...</p>
          </div>
        )}
        
        {error && <div className={styles.error}>{error}</div>}
        
        {order && (
          <div className={styles.card}>
            <div className={styles.orderId}>
              Order #{order._id.slice(-6).toUpperCase()}
            </div>
            
            <div className={styles.productsContainer}>
              {order.products.map((item: Product, idx: number) => (
                <div key={item.url + idx} className={styles.productCard}>
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={80}
                    height={80}
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productMeta}>
                      <span>{item.site}</span>
                      <span>रु {item.price} × {item.quantity || 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className={styles.trackingTitle}>Delivery Progress</h3>
            
            <div className={styles.timeline}>
              {order.tracking?.map((step: TrackingStep, idx: number) => (
                <div key={idx} className={styles.timelineStep}>
                  <div className={styles.status}>
                    {step.status}
                  </div>
                  {step.note && <div className={styles.note}>{step.note}</div>}
                  {step.date && (
                    <div className={styles.date}>
                      {new Date(step.date).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}