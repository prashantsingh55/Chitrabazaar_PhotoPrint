'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { UserPlus, Building, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'customer' | 'studio'>('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    studioName: '',
    ownerName: '',
    address: '',
    city: '',
    pincode: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('type') === 'studio') {
      setActiveTab('studio');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register');
        setIsLoading(false);
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        router.push(activeTab === 'studio' ? '/studio/login' : '/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('An error occurred during registration');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A]">
            Guild Enrolment & Registration
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Register with Chitrabazaar
          </h1>
          <p className="font-serif italic text-xs text-[#6B665F]">
            Commission physical archival prints or register your regional darkroom atelier.
          </p>
        </div>

        {/* Tab Selector */}
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
            <Sparkles className="w-3.5 h-3.5" /> Client Folio
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
            <Building className="w-3.5 h-3.5" /> Atelier Partner
          </button>
        </div>

        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-7 rounded-[2px] shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-[2px] bg-[#F4F0E8] border border-[#A3432B]/30 text-[#A3432B] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-[2px] bg-[#F4F0E8] border border-[#2D4F3E]/40 text-[#2D4F3E] text-xs font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'studio' && (
              <>
                <Input
                  label="Darkroom / Studio Trade Name"
                  name="studioName"
                  required
                  placeholder="e.g. Royal Photo Color Lab"
                  value={formData.studioName}
                  onChange={handleChange}
                />
                <Input
                  label="Master Printmaker / Principal Contact"
                  name="ownerName"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.ownerName}
                  onChange={handleChange}
                />
              </>
            )}

            <Input
              label={activeTab === 'studio' ? 'Staff Operator Handle' : 'Full Name'}
              name="name"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                name="email"
                required
                placeholder="name@domain.com"
                value={formData.email}
                onChange={handleChange}
              />
              <Input
                label="Telephone Wire"
                type="tel"
                name="phone"
                required
                placeholder="+977 9800000000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Account Passkey"
              type="password"
              name="password"
              required
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
            />

            {activeTab === 'studio' && (
              <>
                <div className="pt-4 border-t border-[#E8E2D8]">
                  <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#1A1816] block mb-3 font-semibold">
                    Physical Darkroom Location
                  </span>
                  <Textarea
                    label="Workshop Physical Address"
                    name="address"
                    required
                    placeholder="Street name, landmark, building..."
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      label="Municipality / City"
                      name="city"
                      required
                      placeholder="e.g. Kathmandu"
                      value={formData.city}
                      onChange={handleChange}
                    />
                    <Input
                      label="Postal / PIN Code"
                      name="pincode"
                      required
                      placeholder="e.g. 44600"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isLoading}
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                {activeTab === 'studio' ? 'Submit Darkroom Accreditation Request' : 'Register Client Folio'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E8E2D8] text-center text-xs font-mono">
            <span className="text-[#8C827A]">Already recorded in ledger? </span>
            <Link href="/login" className="font-medium text-[#1A1816] underline hover:text-[#6B665F] transition-colors">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-mono text-[#8C827A]">Loading registration form...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

