'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMinus, FiPlus, FiTrash2, FiMapPin, FiCheck, FiX } from 'react-icons/fi';
import Image from 'next/image';

interface CartItem {
  productId?: string;
  name: string;
  price: number | string;
  image: string;
  quantity?: number;
  site: string;
  url: string;
}

interface Address {
  _id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [transactionRate, setTransactionRate] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressModal, setAddressModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);

  useEffect(() => {
    // Check for dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    // Check for persisted theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('You must be logged in to view your cart.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
      setCart(data.cart || []);
      setCartSubtotal(data.cartSubtotal || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Fetch addresses and set default
  useEffect(() => {
    async function fetchAddresses() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/user/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAddresses(data);
        const def = data.find((a: Address) => a.isDefault) || data[0];
        setSelectedAddress(def);
      } catch {}
    }
    fetchAddresses();
  }, []);

  function handleSelectAddress(id: string) {
    const addr = addresses.find(a => a._id === id);
    if (addr) setSelectedAddress(addr);
    setAddressModal(false);
  }

  const chargesEndpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/public-charges`;
  // Fetch global charges
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(chargesEndpoint, { headers });
        const data = await res.json();
        if (res.ok) {
          setShippingCharge(data.shippingCharge);
          setServiceCharge(data.serviceCharge);
          setTransactionRate(data.transactionRate || 0);
          setTax(data.tax || 0);
        }
      } catch {}
    };
    fetchCharges();
  }, [chargesEndpoint]);

  function isValidQuantity(q: number) {
    return Number.isInteger(q) && q > 0;
  }

  const updateQuantity = async (url: string, newQuantity: number) => {
    setUpdating(true);
    setError('');
    // Validate quantity
    if (!isValidQuantity(newQuantity) && newQuantity !== 0) {
      setError('Quantity must be a positive integer.');
      setUpdating(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('You must be logged in to update your cart.');
      setUpdating(false);
      return;
    }
    try {
      if (newQuantity < 1) {
        // Remove item
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to remove item');
        setCart(data);
      } else {
        // Remove first
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url })
        });
        // Find the item
        const item = cart.find(i => i.url === url);
        if (!item) throw new Error('Item not found in cart');
        // Validate product info
        if (!item.name || !item.price || !item.image || !item.site || !item.url) {
          setError('Invalid product info.');
          setUpdating(false);
          return;
        }
        // Add with new quantity
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productId: item.productId || undefined,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: newQuantity,
            site: item.site,
            url: item.url
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update quantity');
        setCart(data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setUpdating(false);
      setConfirmRemove(null);
    }
  };

  // Restore breakdown calculations for display
  const productsSubtotal = cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
  const taxAmount = (productsSubtotal + shippingCharge + serviceCharge) * (tax / 100);
  const transactionFee =  (productsSubtotal * transactionRate ) - productsSubtotal;

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.container}>
        <div className={styles.cartHeader}>
          <h1 className={styles.title}>Your Shopping Cart</h1>
          <div className={styles.cartSummary}>
            {cart.length > 0 ? (
              <span>{cart.length} {cart.length === 1 ? 'item' : 'items'} in cart</span>
            ) : (
              <span>Your cart is empty</span>
            )}
          </div>
        </div>
        
        {/* Address selection */}
        <div className={styles.addressContainer}>
          <div className={styles.addressHeader}>
            <FiMapPin className={styles.addressIcon} />
            <h3 className={styles.addressTitle}>Delivery Address</h3>
          </div>
          
          {selectedAddress ? (
            <div className={styles.selectedAddress} onClick={() => setAddressModal(true)}>
              <div className={styles.addressLabel}>{selectedAddress.label}</div>
              <div className={styles.addressDetails}>
                {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </div>
              <div className={styles.changeAddress}>Change</div>
            </div>
          ) : (
            <div className={styles.addAddress} onClick={() => setAddressModal(true)}>
              <div className={styles.addAddressText}>+ Add delivery address</div>
            </div>
          )}
        </div>
        
        {/* Cart items */}
        <div className={styles.cartItems}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading your cart...</p>
            </div>
          )}
          
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && cart.length === 0 && (
            <div className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>🛒</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven&apos;t added any items yet</p>
              <button 
                className={styles.continueShopping}
                onClick={() => router.push('/')}
              >
                Continue Shopping
              </button>
            </div>
          )}
          
          {!loading && cart.map((item, idx) => (
            <div key={item.url + idx} className={styles.cartItem}>
              <div className={styles.itemImage}>
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  width={80}
                  height={80}
                />
              </div>
              
              <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <div className={styles.itemSite}>{item.site}</div>
                <div className={styles.itemPrice}>₹ {item.price}</div>
                
                <div className={styles.itemActions}>
                  <div className={styles.quantityControl}>
                    <button 
                      className={styles.quantityButton}
                      disabled={updating}
                      onClick={() => updateQuantity(item.url, (item.quantity || 1) - 1)}
                    >
                      <FiMinus />
                    </button>
                    <span className={styles.quantityValue}>{item.quantity || 1}</span>
                    <button 
                      className={styles.quantityButton}
                      disabled={updating}
                      onClick={() => updateQuantity(item.url, (item.quantity || 1) + 1)}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  
                  {confirmRemove === item.url ? (
                    <div className={styles.confirmRemove}>
                      <button 
                        className={`${styles.removeButton} ${styles.confirmButton}`}
                        onClick={() => updateQuantity(item.url, 0)}
                      >
                        <FiCheck />
                      </button>
                      <button 
                        className={`${styles.removeButton} ${styles.cancelButton}`}
                        onClick={() => setConfirmRemove(null)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className={styles.removeButton}
                      onClick={() => setConfirmRemove(item.url)}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order summary */}
        {!loading && !error && cart.length > 0 && (
          <div className={styles.orderSummary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹ {productsSubtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping Charge</span>
                <span>रु {shippingCharge}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Service Charge</span>
                <span>रु {serviceCharge}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax ({tax}%)</span>
                <span>रु {taxAmount.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Transaction Rate ({transactionRate}x)</span>
                <span>रु {transactionFee.toFixed(2)}</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>रु {cartSubtotal.toFixed(2)}</span>
              </div>
            </div>
            <button 
              className={styles.checkoutButton}
              onClick={() => router.push('/checkout')}
              disabled={!selectedAddress}
            >
              Proceed to Checkout
            </button>
            {!selectedAddress && (
              <div className={styles.addressWarning}>
                Please select a delivery address to proceed
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Address modal */}
      {addressModal && (
        <div className={styles.addressModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Select Delivery Address</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setAddressModal(false)}
              >
                <FiX />
              </button>
            </div>
            
            <div className={styles.addressList}>
              {addresses.length === 0 ? (
                <div className={styles.noAddresses}>
                  <p>No addresses saved</p>
                  <Link href="/address">
                    <button className={styles.addAddressButton}>Add New Address</button>
                  </Link>
                </div>
              ) : (
                addresses.map(addr => (
                  <div 
                    key={addr._id} 
                    className={`${styles.addressOption} ${addr._id === selectedAddress?._id ? styles.selected : ''}`}
                    onClick={() => handleSelectAddress(addr._id)}
                  >
                    <div className={styles.optionHeader}>
                      <div className={styles.optionLabel}>{addr.label}</div>
                      {addr.isDefault && <div className={styles.defaultBadge}>Default</div>}
                    </div>
                    <div className={styles.optionDetails}>
                      {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <Link href="/address">
                <button className={styles.manageAddressButton}>Manage Addresses</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}