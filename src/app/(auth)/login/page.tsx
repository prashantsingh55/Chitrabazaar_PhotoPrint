'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DemoLoginBar } from '@/components/DemoLoginBar';
import { LogIn, User, Camera, ShieldAlert, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/orders';

  const [activeTab, setActiveTab] = useState<'customer' | 'studio' | 'admin'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (!res?.ok) {
        setError(res?.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Hard redirect to guarantee session cookies and cache rehydration
      let destination = callbackUrl === '/login' ? '/orders' : callbackUrl;
      if (activeTab === 'studio') {
        destination = '/studio/dashboard';
      } else if (activeTab === 'admin') {
        destination = '/admin/dashboard';
      }

      window.location.href = destination;
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during authentication');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await signIn('google', {
        callbackUrl: callbackUrl === '/login' ? '/orders' : callbackUrl,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to initialize Google authentication');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-md w-full space-y-6">
        {/* Environment-gated 1-click demo login bar */}
        <DemoLoginBar />

        {/* Editorial Bookplate Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A]">
            Folio Registry & Authentication
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Sign In to Chitrabazaar
          </h1>
          <p className="font-serif italic text-xs text-[#6B665F]">
            Select your ledger designation to access your workspace:
          </p>
        </div>

        {/* Account Type Tabs */}
        <div className="flex border border-[#E8E2D8] bg-[#F4F0E8]/50 p-1 rounded-[2px] gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'customer'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Client
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'studio'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Darkroom
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Curator HQ
          </button>
        </div>

        {/* Login Form Card */}
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-7 rounded-[2px] shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-[2px] bg-[#F4F0E8] border border-[#A3432B]/30 text-[#A3432B] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Identity (Email)"
              type="email"
              required
              placeholder={
                activeTab === 'admin'
                  ? 'admin@chitrabazaar.com'
                  : activeTab === 'studio'
                  ? 'apex@photostudio.com'
                  : 'rahul@example.com'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Secret Passkey"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isLoading}
              >
                <LogIn className="w-4 h-4 mr-1.5" /> Authenticate & Enter
              </Button>
            </div>
          </form>

          {/* Google Authentication for Client/Customer */}
          {activeTab === 'customer' && (
            <div className="pt-1">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8E2D8]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.15em]">
                  <span className="bg-[#FAF8F5] px-2 text-[#8C827A]">Or authenticate via</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 border border-[#E8E2D8] bg-white hover:bg-[#F4F0E8] text-[#1A1816] text-xs font-mono tracking-wider rounded-[2px] flex items-center justify-center gap-2.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-6 pt-4 border-t border-[#E8E2D8] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8C827A]">Unregistered?</span>
            <Link
              href={activeTab === 'studio' ? '/register?type=studio' : '/register'}
              className="font-medium text-[#1A1816] underline hover:text-[#6B665F] transition-colors"
            >
              {activeTab === 'studio' ? 'Darkroom Partner Application' : 'Create Client Account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-mono text-[#8C827A]">Loading authentication ledger...</div>}>
      <LoginForm />
    </Suspense>
  );
}

