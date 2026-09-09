'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDateTime,
  PRINT_SIZE_LABELS,
  getStatusColor,
} from '@/lib/utils';
import {
  ArrowLeft,
  Printer,
  Download,
  Building,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        setError('Order not found or unauthorized');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you wish to void this print commission?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: 'Commission cancelled by client from dispatch folio',
        }),
      });
      if (res.ok) {
        fetchOrder();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel order');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center text-xs font-mono text-[#8C827A]">
        Retrieving archival certificate #{orderId}...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center bg-[#FAF8F5]">
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 space-y-3 rounded-[2px]">
          <Badge variant="danger" size="sm">
            Docket Not Found
          </Badge>
          <p className="font-serif italic text-sm text-[#6B665F]">{error || 'Unable to locate order dossier.'}</p>
          <div className="pt-2">
            <Link href="/orders">
              <Button variant="primary" size="md">
                Return to Orders Folio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusColor(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2 rounded-[2px] border border-[#E8E2D8] bg-white/70 hover:border-[#1A1816] text-[#6B665F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1A1816] tracking-tight">
                Commission Docket #{order.orderNumber}
              </h1>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[1px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8C827A] mt-1">
              Registered {formatDateTime(order.createdAt)} • Settlement:{' '}
              <span className="text-[#2D4F3E] font-medium">
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
            <Receipt className="w-3.5 h-3.5 mr-1" /> Print Docket Slip
          </Button>

          {order.status === 'PLACED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelOrder}
              isLoading={isCancelling}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Void Commission
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Status Pipeline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#1A1816]" />
                <h3 className="font-serif text-base font-normal text-[#1A1816]">
                  Darkroom Dispatch Pipeline
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#2D4F3E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D4F3E] animate-pulse" />
                Live Wire
              </span>
            </div>

            <StatusTimeline
              currentStatus={order.status}
              createdAt={order.createdAt}
              updatedAt={order.updatedAt}
              deliveryMethod={order.deliveryMethod}
              cancellationReason={order.cancellationReason}
            />
          </div>

          {/* Ordered Print Items List */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <h3 className="font-serif text-base font-normal text-[#1A1816]">
                Photographic Plates ({order.items.length})
              </h3>
            </div>

            <div className="divide-y divide-[#E8E2D8]">
              {order.items.map((item: any, idx: number) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-[1px] border border-[#E8E2D8] bg-white p-1 overflow-hidden relative shrink-0">
                      <img
                        src={item.photoUrl}
                        alt={item.originalFilename}
                        style={{ transform: `rotate(${item.cropRotation || 0}deg)` }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-xs text-[#1A1816] block">
                        Plate {idx + 1} • {item.originalFilename}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-[#F4F0E8] border border-[#E8E2D8] px-2 py-0.5 rounded-[1px] text-[10px] font-mono text-[#6B665F]">
                          {PRINT_SIZE_LABELS[item.size] || item.size}
                        </span>
                        <span className="bg-[#F4F0E8] border border-[#E8E2D8] px-2 py-0.5 rounded-[1px] text-[10px] font-mono text-[#6B665F]">
                          {item.paperType}
                        </span>
                        <span className="bg-[#F4F0E8] border border-[#E8E2D8] px-2 py-0.5 rounded-[1px] text-[10px] font-mono text-[#6B665F]">
                          {item.finish}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[#8C827A] uppercase tracking-wider">
                        {item.quantity} prints @ {formatCurrency(item.unitPrice)}/ea
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end w-full sm:w-auto justify-between">
                    <span className="font-serif text-base font-medium text-[#1A1816]">
                      {formatCurrency(item.totalPrice)}
                    </span>
                    <a
                      href={item.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[#1A1816] hover:underline"
                    >
                      <Download className="w-3 h-3" /> High-Res Plate
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Studio Info & Financial Receipt */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Studio Card */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
              <Building className="w-4 h-4 text-[#1A1816]" />
              <h3 className="font-serif text-base font-normal text-[#1A1816]">
                Assigned Guild Atelier
              </h3>
            </div>

            {order.studio ? (
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-serif text-base font-medium text-[#1A1816]">
                    {order.studio.name}
                  </h4>
                  <p className="text-[11px] font-mono text-[#8C827A]">
                    Master: {order.studio.ownerName}
                  </p>
                </div>

                <div className="p-3.5 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] space-y-2 font-mono">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8C827A] mt-0.5" />
                    <div>
                      <span className="text-[#1A1816] block">{order.studio.address}</span>
                      <span className="text-[#8C827A] text-[10px]">
                        {order.studio.city} • {order.studio.pincode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-[#E8E2D8]">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-[#8C827A]" />
                    <span className="text-[#1A1816]">{order.studio.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-[#E8E2D8]">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#8C827A]" />
                    <span className="text-[#6B665F]">{order.studio.workingHours}</span>
                  </div>
                </div>

                {order.deliveryMethod === 'PICKUP' ? (
                  <div className="p-3 rounded-[2px] bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-sans text-[#6B665F]">
                    📍 Counter Retrieval: Present docket #{order.orderNumber} at the atelier counter once status reads <strong>Ready for Studio Retrieval</strong>.
                  </div>
                ) : (
                  <div className="p-3 rounded-[2px] bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-sans text-[#6B665F]">
                    🚚 Courier Transit: Studio will dispatch your package in rigid acid-free flat mailers.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-serif italic text-[#8C827A]">
                Awaiting atelier darkroom assignment.
              </p>
            )}
          </div>

          {/* Delivery Address (if home delivery) */}
          {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-5 rounded-[2px] space-y-2 text-xs font-mono">
              <h4 className="font-serif text-sm font-medium text-[#1A1816] border-b border-[#E8E2D8] pb-2">
                Client Address Dossier
              </h4>
              <p className="font-semibold text-[#1A1816]">{order.deliveryAddress.fullName || order.customer?.name}</p>
              <p className="text-[#6B665F]">{order.deliveryAddress.line1}</p>
              <p className="text-[#8C827A]">
                {order.deliveryAddress.city} • PIN {order.deliveryAddress.pincode}
              </p>
              {order.deliveryAddress.phone && (
                <p className="text-[#8C827A] pt-1">Tel: {order.deliveryAddress.phone}</p>
              )}
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-3 text-xs font-mono">
            <h4 className="font-serif text-base font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-2">
              Invoice Colophon
            </h4>
            <div className="flex justify-between text-[#6B665F]">
              <span>Plates Subtotal:</span>
              <span className="text-[#1A1816]">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#6B665F]">
              <span>Fulfillment Fee ({order.deliveryMethod.toLowerCase()}):</span>
              <span className="text-[#1A1816]">
                {order.deliveryFee === 0 ? 'Complimentary' : formatCurrency(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-[#6B665F]">
              <span>Platform Processing Levy:</span>
              <span className="text-[#1A1816]">{formatCurrency(order.platformFee)}</span>
            </div>
            <div className="border-t border-[#E8E2D8] pt-3 flex items-center justify-between text-sm">
              <span className="font-serif text-base text-[#1A1816]">Settled Total:</span>
              <span className="font-serif text-2xl font-medium text-[#1A1816]">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

