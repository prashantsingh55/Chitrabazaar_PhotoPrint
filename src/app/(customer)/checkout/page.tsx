'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudioOption {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
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

  // Address State
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    line1: '',
    city: 'Kathmandu',
    pincode: '44600',
  });

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

  // Autofill address from session user if available
  useEffect(() => {
    if (session?.user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || '',
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

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => {
    const base = PRINT_SIZE_PRICES[item.size] || 1.2;
    const paper = PAPER_TYPE_SURCHARGES[item.paperType] || 0;
    return acc + (base + paper) * item.quantity;
  }, 0);

  const deliveryFee = deliveryMethod === 'DELIVERY' ? 4.99 : 0.0;
  const platformFee = 1.5;
  const grandTotal = subtotal + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    setIsProcessingPayment(true);

    try {
      const payload = {
        items: cartItems,
        deliveryMethod,
        studioId: selectedStudioId,
        deliveryAddress: deliveryMethod === 'DELIVERY' ? address : undefined,
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
        setCheckoutError(data.error || 'Failed to place order');
        setIsProcessingPayment(false);
        setShowPaymentModal(false);
        return;
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      // Clear local cart
      localStorage.removeItem('chitrabazaar_cart_items');

      // Redirect to live order tracking page
      setTimeout(() => {
        router.push(`/orders/${data.orderId}`);
      }, 900);
    } catch (err) {
      console.error(err);
      setCheckoutError('Payment gateway timeout or server error');
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
                  Carefully sealed in rigid archival flat mailers and dispatched to your address.
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
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
                <span className="font-mono text-xs text-[#8C827A]">III.</span>
                <h3 className="font-serif text-base font-normal text-[#1A1816]">
                  Client Dispatch Destination
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Client Recipient Name"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                />
                <Input
                  label="Courier Contact Telephone"
                  type="tel"
                  required
                  placeholder="+977 9800000000"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                />
              </div>

              <Textarea
                label="Postal Street Address / Apartment / Landmark"
                required
                placeholder="House, street name, neighborhood..."
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City / Municipality"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                <Input
                  label="Postal Area Code"
                  required
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                />
              </div>
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

        {/* Right Column: Pricing Breakdown & Payment Step */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
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

              {/* Cost Calculations */}
              <div className="border-t border-[#E8E2D8] pt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#6B665F]">
                  <span>Plates Subtotal:</span>
                  <span className="text-[#1A1816]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B665F]">
                  <span>Fulfillment ({deliveryMethod.toLowerCase()}):</span>
                  <span className="text-[#1A1816]">
                    {deliveryFee === 0 ? 'Complimentary' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B665F]">
                  <span>Guild Archival Levy:</span>
                  <span className="text-[#1A1816]">{formatCurrency(platformFee)}</span>
                </div>
                <div className="border-t border-[#E8E2D8] pt-3 flex items-center justify-between">
                  <span className="font-serif text-base text-[#1A1816]">Total Tariff:</span>
                  <span className="font-serif text-2xl font-medium text-[#1A1816]">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Gateway Picker */}
              <div className="pt-3 border-t border-[#E8E2D8] space-y-2">
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B665F]">
                  Settlement Instrument
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MOCK_PAYMENT')}
                    className={`p-2.5 text-xs font-mono uppercase tracking-wider rounded-[2px] border flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'MOCK_PAYMENT'
                        ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5]'
                        : 'border-[#E8E2D8] bg-white/70 text-[#1A1816] hover:border-[#1A1816]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Sandbox Pay
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-2.5 text-xs font-mono uppercase tracking-wider rounded-[2px] border flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5]'
                        : 'border-[#E8E2D8] bg-white/70 text-[#1A1816] hover:border-[#1A1816]'
                    }`}
                  >
                    <CreditCard className="w-3 h-3" /> Card / Wire
                  </button>
                </div>
              </div>

              {/* Trigger Payment Modal */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" /> Authorize & Submit {formatCurrency(grandTotal)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !isProcessingPayment && setShowPaymentModal(false)}
        title="Confirm Print Commission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] text-xs font-mono text-[#6B665F] space-y-2">
            <div className="flex justify-between">
              <span>Payee:</span>
              <span className="text-[#1A1816]">Chitrabazaar Platform Ltd.</span>
            </div>
            <div className="flex justify-between">
              <span>Tariff Sum:</span>
              <span className="font-serif text-base font-semibold text-[#1A1816]">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment:</span>
              <span className="text-[#1A1816]">{deliveryMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Settlement Channel:</span>
              <span className="text-[#1A1816]">{paymentMethod}</span>
            </div>
          </div>

          <p className="font-serif italic text-xs text-[#6B665F] leading-relaxed">
            By authorizing, your digital photographic plates will be immediately transmitted into the assigned darkroom atelier queue.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handlePlaceOrder}
              isLoading={isProcessingPayment}
            >
              {isProcessingPayment ? 'Dispatching to Darkroom...' : 'Authorize & Place Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

