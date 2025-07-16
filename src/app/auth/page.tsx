'use client';
import { useEffect } from 'react';
import AuthForm from "../../components/auth/AuthForm";
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/');
    }
  }, [router]);
  return (
    <main>
      <AuthForm />
    </main>
  );
} 