'use client';

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiShoppingCart, FiZap, FiSearch, FiLoader } from "react-icons/fi";
import Image from "next/image";

interface Product {
  productId?: string;
  name: string;
  price: number;
  image: string;
  site: string;
  url: string;
}

function isValidProductUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(amazon\.(com|in|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.in|flipkart\.com|dl\.flipkart\.com)\//.test(url);
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    // Check for persisted theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    setSuccess(""); 
    setLoading(true); 
    setProduct(null);
    
    if (!isValidProductUrl(url)) {
      setError("Please enter a valid Amazon (including app links like amzn.in) or Flipkart (including app links like dl.flipkart.com) product URL.");
      setLoading(false);
      return;
    }
    
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      setError("You must be logged in to scrape products. Please login first.");
      setLoading(false);
      return;
    }
    
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (!res.ok || !data.name) throw new Error(data.message || "Could not scrape product");
      setProduct(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setError(""); 
    setSuccess("");
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    
    if (!token) {
      setError("You must be logged in to add to cart.");
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product?.productId || undefined,
          name: product?.name,
          price: product?.price,
          image: product?.image,
          quantity: 1,
          site: product?.site,
          url: product?.url
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not add to cart");
      setSuccess("Added to cart!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    }
  };

  const handleBuyNow = async () => {
    setError(""); 
    setSuccess("");
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    
    if (!token) {
      setError("You must be logged in to buy now.");
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product?.productId || undefined,
          name: product?.name,
          price: product?.price,
          image: product?.image,
          quantity: 1,
          site: product?.site,
          url: product?.url
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not add to cart");
      router.push('/cart');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    }
  };

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ''}`}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Kartwister<span className={styles.titleDot}>.</span>
          </h1>
          <p className={styles.subtitle}>
            Paste any product link from Amazon or Flipkart and we&apos;ll get it delivered.
          </p>
        </div>
        
        <div className={styles.wave}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className={styles.waveFill}></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className={styles.waveFill}></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className={styles.waveFill}></path>
          </svg>
        </div>
      </div>
      
      <main className={styles.main}>
        <form onSubmit={handleScrape} className={styles.form}>
          <div className={styles.inputContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              className={styles.input}
              type="url"
              placeholder="Paste product URL from Amazon (including app links) or Flipkart (including app links)..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
            <button
              className={styles.submitButton}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <FiLoader className={styles.spinner} />
              ) : (
                <>
                  Scrape <FiArrowRight />
                </>
              )}
            </button>
          </div>
        </form>
        
        {error && (
          <div className={styles.error}>
            {error}
            {error.includes("logged in") && (
              <div className={styles.loginPrompt}>
                <a href="/login" className={styles.loginLink}>
                  Click here to login
                </a>
              </div>
            )}
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}
        
        {product ? (
          <div className={styles.productCard}>
            <div className={styles.productImageContainer}>
                                <Image 
                    src={product.image} 
                    alt={product.name} 
                    width={200}
                    height={200}
                    className={styles.productImage}
                  />
            </div>
            
            <div className={styles.productInfo}>
              <div className={styles.badge}>{product.site}</div>
              <h2 className={styles.productName}>{product.name}</h2>
              
              <div className={styles.priceContainer}>
                <div className={styles.priceLabel}>Price:</div>
                <div className={styles.price}>₹ {product.price}</div>
              </div>
              
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.button} ${styles.cartButton}`}
                  onClick={handleAddToCart}
                >
                  <FiShoppingCart /> Add to Cart
                </button>
                <button
                  className={`${styles.button} ${styles.buyButton}`}
                  onClick={handleBuyNow}
                >
                  <FiZap /> Buy Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.instructions}>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Find a Product</h3>
                  <p>Browse Amazon or Flipkart for your favorite product</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Copy Product URL</h3>
                  <p>Copy the link from your browser&apos;s address bar</p>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Paste & Scrape</h3>
                  <p>Paste the URL above and click &quot;Scrape&quot;</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>© 2025 Kartwister. All rights reserved.</p>
        <div className={styles.footerLinks}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}