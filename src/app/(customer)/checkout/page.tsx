'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LocationPicker } from '@/components/ui/LocationPicker';
import {
  PRINT_SIZE_LABELS,
  PRINT_SIZE_PRICES,
  PAPER_TYPE_SURCHARGES,
  formatCurrency,
  getMediaUrl,
} from '@/lib/utils';
import {
  ShieldCheck,
  CreditCard,
  Building,
  Truck,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
  Home,
  Briefcase,
  Edit2,
  Plus,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudioOption {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
}

interface AddressRecord {
  id?: string;
  label: string;
  fullName: string;
  phone?: string | null;
  line1: string;
  city: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [studios, setStudios] = useState<StudioOption[]>([]);
  const [loadingStudios, setLoadingStudios] = useState(true);

  // Form State
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [selectedStudioId, setSelectedStudioId] = useState<string>('auto');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOCK_PAYMENT');

  // Address State & Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<AddressRecord[]>([]);
  const [addressMode, setAddressMode] = useState<'HOME' | 'WORK' | 'CUSTOM'>('HOME');
  const [customAddress, setCustomAddress] = useState<AddressRecord>({
    label: 'Custom',
    fullName: '',
    phone: '',
    line1: '',
    city: 'Kathmandu',
    pincode: '44600',
    lat: 27.7172,
    lng: 85.324,
  });

  // Quick Address Modal (To set Home or Work address directly in checkout)
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickAddressForm, setQuickAddressForm] = useState<AddressRecord>({
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    city: 'Kathmandu',
    pincode: '44600',
    lat: 27.7172,
    lng: 85.324,
  });
  const [isSavingQuickAddress, setIsSavingQuickAddress] = useState(false);

  // Modal / Submitting State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('chitrabazaar_cart_items');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCartItems(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch saved addresses
  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        const addrs: AddressRecord[] = data.addresses || [];
        setSavedAddresses(addrs);

        const hasHome = addrs.some((a) => a.label?.toLowerCase() === 'home');
        const hasWork = addrs.some((a) => a.label?.toLowerCase() === 'work');

        if (hasHome) {
          setAddressMode('HOME');
        } else if (hasWork) {
          setAddressMode('WORK');
        } else {
          setAddressMode('CUSTOM');
        }
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadAddresses();
      setCustomAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || '',
        phone: prev.phone || '',
      }));
    }
  }, [session]);

  // Fetch partner studios
  useEffect(() => {
    async function loadStudios() {
      try {
        const res = await fetch('/api/studios');
        if (res.ok) {
          const data = await res.json();
          setStudios(data.studios || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudios(false);
      }
    }
    loadStudios();
  }, []);

  // Identify Home and Work addresses
  const homeAddress = savedAddresses.find((a) => a.label?.toLowerCase() === 'home');
  const workAddress = savedAddresses.find((a) => a.label?.toLowerCase() === 'work');

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => {
    const base = PRINT_SIZE_PRICES[item.size] || 1.2;
    const paper = PAPER_TYPE_SURCHARGES[item.paperType] || 0;
    return acc + (base + paper) * item.quantity;
  }, 0);

  const deliveryFee = deliveryMethod === 'DELIVERY' ? 4.99 : 0.0;
  const platformFee = 1.5;
  const grandTotal = subtotal + deliveryFee + platformFee;

  const handleOpenQuickModal = (target: 'Home' | 'Work') => {
    const existing = target === 'Home' ? homeAddress : workAddress;
    setQuickAddressForm({
      id: existing?.id,
      label: target,
      fullName: existing?.fullName || session?.user?.name || '',
      phone: existing?.phone || '',
      line1: existing?.line1 || '',
      city: existing?.city || 'Kathmandu',
      pincode: existing?.pincode || '44600',
      lat: existing?.lat || 27.7172,
      lng: existing?.lng || 85.324,
      isDefault: true,
    });
    setShowQuickModal(true);
  };

  const handleSaveQuickAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuickAddress(true);
    try {
      const method = quickAddressForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickAddressForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save address');
      }

      await loadAddresses();
      setAddressMode(quickAddressForm.label.toUpperCase() as 'HOME' | 'WORK');
      setShowQuickModal(false);
    } catch (err: any) {
      alert(err.message || 'Error saving address');
    } finally {
      setIsSavingQuickAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    setIsProcessingPayment(true);

    try {
      let activeDeliveryAddress: any = undefined;

      if (deliveryMethod === 'DELIVERY') {
        if (addressMode === 'HOME') {
          if (!homeAddress) {
            throw new Error('Please set your Home Address or select Custom Address.');
          }
          activeDeliveryAddress = {
            id: homeAddress.id,
            label: 'Home',
            fullName: homeAddress.fullName,
            phone: homeAddress.phone,
            line1: homeAddress.line1,
            city: homeAddress.city,
            pincode: homeAddress.pincode,
            lat: homeAddress.lat,
            lng: homeAddress.lng,
          };
        } else if (addressMode === 'WORK') {
          if (!workAddress) {
            throw new Error('Please set your Work Address or select Custom Address.');
          }
          activeDeliveryAddress = {
            id: workAddress.id,
            label: 'Work',
            fullName: workAddress.fullName,
            phone: workAddress.phone,
            line1: workAddress.line1,
            city: workAddress.city,
            pincode: workAddress.pincode,
            lat: workAddress.lat,
            lng: workAddress.lng,
          };
        } else {
          // CUSTOM
          if (!customAddress.line1 || !customAddress.city || !customAddress.pincode) {
            throw new Error('Please fill in complete street, city, and postal code for delivery.');
          }
          activeDeliveryAddress = customAddress;
        }
      }

      const payload = {
        items: cartItems,
        deliveryMethod,
        studioId: selectedStudioId,
        deliveryAddress: activeDeliveryAddress,
        paymentMethod,
        notes,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place commission order');
      }

      // Success: Clear cart & trigger celebration
      localStorage.removeItem('chitrabazaar_cart_items');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1A1816', '#8C827A', '#E8DFC2'],
        });
      } catch (confettiErr) {
        // ignore in non-browser or low-spec devices
      }

      // Redirect to newly generated order tracking screen
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      console.error(err);
      setCheckoutError(err.message || 'Payment simulation failed. Please try again.');
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
    }
  };

  // If user is not authenticated, prompt login
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4 bg-[#FAF8F5]">
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 space-y-3 rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] block">
            Folio Access Required
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#1A1816]">
            Authenticate to Finalize Commission
          </h2>
          <p className="font-serif italic text-xs text-[#6B665F] leading-relaxed mb-4">
            We record your commission against your client folio so you can track darkroom exposure in real time.
          </p>
          <Link href="/login?callbackUrl=/checkout">
            <Button variant="primary" fullWidth size="lg">
              Sign In or Register Folio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4 bg-[#FAF8F5]">
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 space-y-3 rounded-[2px] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] block">
            Atelier Manifest Empty
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#1A1816]">
            No Photographic Plates Staged
          </h2>
          <p className="font-serif italic text-xs text-[#6B665F] leading-relaxed mb-4">
            Deposit photos and specify paper dimensions prior to submitting dispatch.
          </p>
          <Link href="/upload">
            <Button variant="primary" fullWidth size="md">
              Return to Intake Station
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8E2D8] pb-5 mb-8">
        <div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-[#8C827A] hover:text-[#1A1816] transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Return to Specifications
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Commission Dispatch & Settlement
          </h1>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8C827A]">
          {cartItems.length} Photographic Plates Prepared
        </div>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 rounded-[2px] bg-[#F4F0E8] border border-[#A3432B]/30 text-[#A3432B] text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fulfillment & Studio Picker */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Fulfillment Method */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
              <span className="font-mono text-xs text-[#8C827A]">I.</span>
              <h3 className="font-serif text-base font-normal text-[#1A1816]">
                Fulfillment Modality
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pickup Option */}
              <div
                onClick={() => setDeliveryMethod('PICKUP')}
                className={`p-4 rounded-[2px] border cursor-pointer transition-all ${
                  deliveryMethod === 'PICKUP'
                    ? 'border-[#1A1816] bg-[#F4F0E8]/70 shadow-xs'
                    : 'border-[#E8E2D8] hover:border-[#1A1816] bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-serif text-sm text-[#1A1816]">
                    <Building className="w-4 h-4 text-[#1A1816]" /> Atelier Counter Pickup
                  </div>
                  <Badge variant="default" size="sm">
                    Complimentary
                  </Badge>
                </div>
                <p className="text-xs text-[#6B665F] font-sans leading-relaxed">
                  Collect directly from the partner darkroom counter once acid-free packing is complete.
                </p>
              </div>

              {/* Delivery Option */}
              <div
                onClick={() => setDeliveryMethod('DELIVERY')}
                className={`p-4 rounded-[2px] border cursor-pointer transition-all ${
                  deliveryMethod === 'DELIVERY'
                    ? 'border-[#1A1816] bg-[#F4F0E8]/70 shadow-xs'
                    : 'border-[#E8E2D8] hover:border-[#1A1816] bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-serif text-sm text-[#1A1816]">
                    <Truck className="w-4 h-4 text-[#1A1816]" /> Courier Transit
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#1A1816]">
                    {formatCurrency(4.99)}
                  </span>
                </div>
                <p className="text-xs text-[#6B665F] font-sans leading-relaxed">
                  Carefully sealed in rigid archival flat mailers and dispatched to your destination.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Studio Routing Selection */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
              <span className="font-mono text-xs text-[#8C827A]">II.</span>
              <h3 className="font-serif text-base font-normal text-[#1A1816]">
                Regional Atelier Assignment
              </h3>
            </div>

            <p className="text-xs font-serif italic text-[#6B665F]">
              Select which certified guild darkroom executes and chemically processes your commission:
            </p>

            <div className="space-y-2.5">
              {/* Auto Assign */}
              <div
                onClick={() => setSelectedStudioId('auto')}
                className={`p-3.5 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${
                  selectedStudioId === 'auto'
                    ? 'border-[#1A1816] bg-[#F4F0E8]/70 shadow-xs'
                    : 'border-[#E8E2D8] hover:border-[#1A1816] bg-white/60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#2D4F3E]" />
                    <span className="font-serif text-sm text-[#1A1816]">
                      Intelligent Regional Routing (Curator Recommendation)
                    </span>
                  </div>
                  <p className="text-xs text-[#6B665F] mt-0.5 font-sans">
                    Automatically routes to the highest-rated active darkroom with lowest queue depth.
                  </p>
                </div>
                {selectedStudioId === 'auto' && (
                  <CheckCircle2 className="w-4 h-4 text-[#1A1816] shrink-0" />
                )}
              </div>

              {/* Specific Studios */}
              {studios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudioId(s.id)}
                  className={`p-3.5 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${
                    selectedStudioId === s.id
                      ? 'border-[#1A1816] bg-[#F4F0E8]/70 shadow-xs'
                      : 'border-[#E8E2D8] hover:border-[#1A1816] bg-white/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm text-[#1A1816]">{s.name}</span>
                      <span className="text-[9px] font-mono text-[#8C827A] border border-[#E8E2D8] px-1 py-0.2 rounded-[1px]">
                        {s.rating}★
                      </span>
                    </div>
                    <p className="text-xs text-[#6B665F] mt-0.5 flex items-center gap-1 font-sans">
                      <MapPin className="w-3 h-3 text-[#8C827A]" /> {s.address}, {s.city}
                    </p>
                  </div>
                  {selectedStudioId === s.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#1A1816] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Delivery Address (If delivery selected) */}
          {deliveryMethod === 'DELIVERY' && (
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#8C827A]">III.</span>
                  <h3 className="font-serif text-base font-normal text-[#1A1816]">
                    Client Dispatch Destination
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#8C827A] uppercase tracking-wider">
                  Select Delivery Point
                </span>
              </div>

              {/* 3-way Address Selector: Home vs Work vs Custom */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAddressMode('HOME')}
                  className={`p-3 rounded-[2px] border text-left flex flex-col justify-between transition-all ${
                    addressMode === 'HOME'
                      ? 'border-[#1A1816] bg-[#F4F0E8] shadow-xs'
                      : 'border-[#E8E2D8] bg-white hover:border-[#1A1816]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5 font-serif text-sm font-medium text-[#1A1816]">
                      <Home className="w-3.5 h-3.5 text-[#1A1816]" /> Home
                    </div>
                    {addressMode === 'HOME' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1816]" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#8C827A] truncate">
                    {homeAddress ? homeAddress.line1 : 'Not Set'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddressMode('WORK')}
                  className={`p-3 rounded-[2px] border text-left flex flex-col justify-between transition-all ${
                    addressMode === 'WORK'
                      ? 'border-[#1A1816] bg-[#F4F0E8] shadow-xs'
                      : 'border-[#E8E2D8] bg-white hover:border-[#1A1816]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5 font-serif text-sm font-medium text-[#1A1816]">
                      <Briefcase className="w-3.5 h-3.5 text-[#1A1816]" /> Work
                    </div>
                    {addressMode === 'WORK' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1816]" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#8C827A] truncate">
                    {workAddress ? workAddress.line1 : 'Not Set'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddressMode('CUSTOM')}
                  className={`p-3 rounded-[2px] border text-left flex flex-col justify-between transition-all ${
                    addressMode === 'CUSTOM'
                      ? 'border-[#1A1816] bg-[#F4F0E8] shadow-xs'
                      : 'border-[#E8E2D8] bg-white hover:border-[#1A1816]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5 font-serif text-sm font-medium text-[#1A1816]">
                      <Edit2 className="w-3.5 h-3.5 text-[#1A1816]" /> Custom
                    </div>
                    {addressMode === 'CUSTOM' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1816]" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#8C827A]">
                    One-time address
                  </span>
                </button>
              </div>

              {/* Home Address Selected View */}
              {addressMode === 'HOME' && (
                <div>
                  {homeAddress ? (
                    <div className="p-4 rounded-[2px] bg-[#FAF8F5] border border-[#1A1816]/30 space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-[#1A1816]">
                          {homeAddress.fullName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickModal('Home')}
                          className="text-[10px] uppercase tracking-wider text-[#1A1816] hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit / Re-pin
                        </button>
                      </div>
                      <p className="font-sans text-xs text-[#6B665F]">{homeAddress.line1}</p>
                      <p className="text-[#8C827A]">{homeAddress.city} • PIN {homeAddress.pincode}</p>
                      {homeAddress.phone && <p className="text-[#8C827A]">Tel: {homeAddress.phone}</p>}
                      {homeAddress.lat && homeAddress.lng && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-[#F4F8F4] text-[#2E6B38] border border-[#CEE0CF] text-[10px]">
                          <Navigation className="w-2.5 h-2.5" />
                          {homeAddress.lat.toFixed(4)}° N, {homeAddress.lng.toFixed(4)}° E (Google Pin Active)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 border-2 border-dashed border-[#E8E2D8] rounded-[2px] text-center space-y-2">
                      <p className="font-serif text-sm text-[#1A1816]">No Home Address recorded</p>
                      <p className="font-serif italic text-xs text-[#8C827A]">
                        Pin your home on Google Maps for expedited courier transit.
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenQuickModal('Home')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Home Address & Map Pin
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Work Address Selected View */}
              {addressMode === 'WORK' && (
                <div>
                  {workAddress ? (
                    <div className="p-4 rounded-[2px] bg-[#FAF8F5] border border-[#1A1816]/30 space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-[#1A1816]">
                          {workAddress.fullName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickModal('Work')}
                          className="text-[10px] uppercase tracking-wider text-[#1A1816] hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit / Re-pin
                        </button>
                      </div>
                      <p className="font-sans text-xs text-[#6B665F]">{workAddress.line1}</p>
                      <p className="text-[#8C827A]">{workAddress.city} • PIN {workAddress.pincode}</p>
                      {workAddress.phone && <p className="text-[#8C827A]">Tel: {workAddress.phone}</p>}
                      {workAddress.lat && workAddress.lng && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-[#F4F8F4] text-[#2E6B38] border border-[#CEE0CF] text-[10px]">
                          <Navigation className="w-2.5 h-2.5" />
                          {workAddress.lat.toFixed(4)}° N, {workAddress.lng.toFixed(4)}° E (Google Pin Active)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 border-2 border-dashed border-[#E8E2D8] rounded-[2px] text-center space-y-2">
                      <p className="font-serif text-sm text-[#1A1816]">No Work Address recorded</p>
                      <p className="font-serif italic text-xs text-[#8C827A]">
                        Pin your office or atelier on Google Maps for workday delivery.
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenQuickModal('Work')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Work Address & Map Pin
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Address Input View */}
              {addressMode === 'CUSTOM' && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Recipient Full Name"
                      required
                      value={customAddress.fullName}
                      onChange={(e) => setCustomAddress({ ...customAddress, fullName: e.target.value })}
                    />
                    <Input
                      label="Courier Contact Telephone"
                      type="tel"
                      required
                      placeholder="+977 9800000000"
                      value={customAddress.phone || ''}
                      onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                    />
                  </div>

                  <Textarea
                    label="Postal Street Address / Apartment / Landmark"
                    required
                    placeholder="House, street name, neighborhood..."
                    value={customAddress.line1}
                    onChange={(e) => setCustomAddress({ ...customAddress, line1: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City / Municipality"
                      required
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                    />
                    <Input
                      label="Postal Area Code"
                      required
                      value={customAddress.pincode}
                      onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                    />
                  </div>

                  {/* Interactive Google Map Location Picker for Custom Address */}
                  <div className="pt-2 border-t border-[#E8E2D8]">
                    <LocationPicker
                      lat={customAddress.lat}
                      lng={customAddress.lng}
                      label="Set Custom Delivery Map Pin"
                      onChange={(newLat, newLng) => {
                        setCustomAddress((prev) => ({
                          ...prev,
                          lat: newLat,
                          lng: newLng,
                        }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Special Instructions for Darkroom */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
              <span className="font-mono text-xs text-[#8C827A]">
                {deliveryMethod === 'DELIVERY' ? 'IV.' : 'III.'}
              </span>
              <h3 className="font-serif text-base font-normal text-[#1A1816]">
                Darkroom Production Memo (Optional)
              </h3>
            </div>
            <Textarea
              placeholder="e.g. Please preserve warm sepia tonality, crop 10% tighter around subjects, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Settlement */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-6 sticky top-8">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] block">
                  Commission Docket
                </span>
                <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                  Settlement Ledger
                </h3>
              </div>
              <Badge variant="default" size="sm">
                {cartItems.length} Plates
              </Badge>
            </div>

            {/* Items Compact Preview */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#E8E2D8] text-xs pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getMediaUrl((item as any).previewUrl || item.url)}
                      alt=""
                      className="w-9 h-9 rounded-[1px] object-cover border border-[#E8E2D8] shrink-0"
                    />
                    <div>
                      <span className="font-mono text-xs text-[#1A1816] block truncate max-w-[150px]">
                        {item.filename}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C827A]">
                        {PRINT_SIZE_LABELS[item.size]?.split('(')[0]} • {item.paperType} • {item.quantity}x
                      </span>
                    </div>
                  </div>
                  <span className="font-serif text-sm font-medium text-[#1A1816]">
                    {formatCurrency(
                      ((PRINT_SIZE_PRICES[item.size] || 1.2) +
                        (PAPER_TYPE_SURCHARGES[item.paperType] || 0)) *
                        item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 border-t border-[#E8E2D8] pt-4 text-xs font-mono">
              <div className="flex justify-between text-[#6B665F]">
                <span>Photographic Printing Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6B665F]">
                <span>Archival Handling & Platform Fee:</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-[#6B665F]">
                <span>Fulfillment / Transit:</span>
                <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Complimentary (Pickup)'}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-semibold text-[#1A1816] border-t border-[#E8E2D8] pt-3">
                <span>Commission Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] block">
                Settlement Rail
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setPaymentMethod('MOCK_PAYMENT')}
                  className={`p-2.5 rounded-[2px] border text-center cursor-pointer transition-all ${
                    paymentMethod === 'MOCK_PAYMENT'
                      ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5]'
                      : 'border-[#E8E2D8] bg-white text-[#1A1816] hover:bg-[#F4F0E8]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  <span className="font-mono text-[10px] uppercase font-bold block">Instant Settle</span>
                  <span className="text-[9px] opacity-80 block">Zero-Fee Escrow</span>
                </div>

                <div
                  onClick={() => setPaymentMethod('ESEWA_MOCK')}
                  className={`p-2.5 rounded-[2px] border text-center cursor-pointer transition-all ${
                    paymentMethod === 'ESEWA_MOCK'
                      ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5]'
                      : 'border-[#E8E2D8] bg-white text-[#1A1816] hover:bg-[#F4F0E8]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1" />
                  <span className="font-mono text-[10px] uppercase font-bold block">eSewa / Digital</span>
                  <span className="text-[9px] opacity-80 block">Wallet Transfer</span>
                </div>
              </div>
            </div>

            {/* Authorize & Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isProcessingPayment}
              onClick={handlePlaceOrder}
            >
              Authorize Commission • {formatCurrency(grandTotal)}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#8C827A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D4F3E]" />
              <span>Certified Guild Guarantee • Acid-Free Archival Paper</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Address Modal: Add or Edit Home/Work right from checkout */}
      <Modal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        title={`Set ${quickAddressForm.label} Address & Google Map Pin`}
      >
        <form onSubmit={handleSaveQuickAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Recipient Full Name"
              required
              placeholder="e.g. Prashant Singh"
              value={quickAddressForm.fullName}
              onChange={(e) => setQuickAddressForm({ ...quickAddressForm, fullName: e.target.value })}
            />
            <Input
              label="Contact Telephone"
              type="tel"
              required
              placeholder="+977 9800000000"
              value={quickAddressForm.phone || ''}
              onChange={(e) => setQuickAddressForm({ ...quickAddressForm, phone: e.target.value })}
            />
          </div>

          <Input
            label="Street Address / House / Landmark"
            required
            placeholder="Street name, neighborhood, building..."
            value={quickAddressForm.line1}
            onChange={(e) => setQuickAddressForm({ ...quickAddressForm, line1: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              value={quickAddressForm.city}
              onChange={(e) => setQuickAddressForm({ ...quickAddressForm, city: e.target.value })}
            />
            <Input
              label="Postal PIN Code"
              required
              value={quickAddressForm.pincode}
              onChange={(e) => setQuickAddressForm({ ...quickAddressForm, pincode: e.target.value })}
            />
          </div>

          {/* Interactive Location Picker */}
          <div className="pt-2 border-t border-[#E8E2D8]">
            <LocationPicker
              lat={quickAddressForm.lat}
              lng={quickAddressForm.lng}
              label={`${quickAddressForm.label} Delivery Pin`}
              onChange={(newLat, newLng) => {
                setQuickAddressForm((prev) => ({
                  ...prev,
                  lat: newLat,
                  lng: newLng,
                }));
              }}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8E2D8]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowQuickModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSavingQuickAddress}>
              Save {quickAddressForm.label} Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
