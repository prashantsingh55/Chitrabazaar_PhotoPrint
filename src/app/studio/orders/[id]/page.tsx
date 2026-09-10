'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import {
  formatCurrency,
  formatDateTime,
  PRINT_SIZE_LABELS,
  getStatusColor,
  getMediaUrl,
} from '@/lib/utils';
import {
  Printer,
  Download,
  CheckCircle,
  Package,
  AlertTriangle,
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Clock,
  User,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export default function StudioOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  const updateStatus = async (newStatus: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          cancellationReason: reason,
        }),
      });

      if (res.ok) {
        setShowCancelModal(false);
        fetchOrder();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update order status');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintJobDocket = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
        Retrieving commission docket from darkroom registry...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <Card className="p-8 space-y-4 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="danger" size="sm">
            Unrecorded
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">Order not found or permission revoked.</p>
          <div className="pt-2">
            <Link href="/studio/orders">
              <Button variant="primary" size="md">
                Return to Orders Logbook
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusColor(order.status);
  const totalPrints = order.items.reduce((acc: number, i: any) => acc + i.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/studio/orders"
            className="p-2.5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-[#1A1816]">
                Darkroom Docket #{order.orderNumber}
              </h1>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-[2px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
              Atelier: <span className="font-semibold text-[#1A1816]">{order.studio?.name}</span> • Logged{' '}
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handlePrintJobDocket}>
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Print Darkroom Docket Slip
          </Button>

          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelModal(true)}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Reject Commission
            </Button>
          )}
        </div>
      </div>

      {/* Status Pipeline Action Banner */}
      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
        <Card className="p-6 border border-[#E8E2D8] bg-[#F4F0E8] rounded-[2px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D8] pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] font-bold">
              Atelier Bench Pipeline
            </span>
            <span className="font-serif italic text-xs text-[#8C827A]">
              Customer dispatch wire updates synchronously upon state advancement
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {order.status === 'PLACED' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdating}
                onClick={() => updateStatus('PRINTING')}
              >
                <Printer className="w-4 h-4 mr-2" /> Accept Commission & Begin Printing Press
              </Button>
            )}

            {order.status === 'PRINTING' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdating}
                onClick={() => updateStatus('READY')}
              >
                <Package className="w-4 h-4 mr-2" /> Mark Ready for{' '}
                {order.deliveryMethod === 'PICKUP' ? 'Counter Handover' : 'Courier Dispatch'}
              </Button>
            )}

            {order.status === 'READY' && (
              <Button
                variant="secondary"
                size="md"
                isLoading={isUpdating}
                onClick={() => updateStatus('COMPLETED')}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-[#2D4A3E]" /> Complete Order (Delivered to Client)
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos Inspection & Full Specs */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-4">
              <div>
                <h3 className="font-serif text-xl font-normal text-[#1A1816]">
                  Print Production Specifications
                </h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-0.5">
                  Total {order.items.length} image plates • {totalPrints} physical archival prints
                </p>
              </div>

              <span className="font-mono text-xs font-semibold text-[#1A1816] bg-[#F4F0E8] border border-[#E8E2D8] px-3 py-1.5 rounded-[2px] self-start sm:self-auto">
                Studio Tariff: {formatCurrency(order.subtotal)}
              </span>
            </div>

            {/* Photo items list */}
            <div className="space-y-6">
              {order.items.map((item: any, idx: number) => {
                const printJob = item.printJob;
                const hasMaster = Boolean(printJob?.masterAssetKey);
                const isProcessing = printJob?.status === 'PROCESSING' || printJob?.status === 'PENDING';
                const detectedDpi = printJob?.detectedDpi;
                const isOptimalDpi = detectedDpi && detectedDpi >= 300;

                return (
                  <div
                    key={item.id}
                    className="rounded-[2px] border border-[#E8E2D8] p-5 bg-[#FAF8F5] space-y-4 shadow-xs"
                  >
                    {/* Header bar with Docket and Dual Download Actions */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] w-6 h-6 rounded-[2px] bg-[#1A1816] text-[#FAF8F5] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-mono text-xs text-[#1A1816] font-semibold truncate max-w-sm block">
                            {item.originalFilename}
                          </span>
                          {printJob?.jobDocketNumber && (
                            <span className="font-mono text-[10px] text-[#8C827A] tracking-wider">
                              Docket: {printJob.jobDocketNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dual Download Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Primary: 300 DPI Master Print Plate */}
                        {hasMaster ? (
                          <a
                            href={`/api/assets/${printJob.masterAssetKey}?download=1&filename=${printJob.jobDocketNumber || 'CB-MASTER'}-300dpi.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            download={`${printJob.jobDocketNumber || 'CB-MASTER'}-300dpi.jpg`}
                            className="px-3.5 py-1.5 bg-[#1A1816] text-[#FAF8F5] hover:bg-[#33302C] font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border border-[#1A1816] shadow-xs flex items-center gap-1.5 font-bold transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#E8DFC2]" /> Download 300 DPI Master
                          </a>
                        ) : isProcessing ? (
                          <span className="px-3 py-1.5 bg-[#FAF7EE] text-[#8C6D23] font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border border-[#E8DFC2] flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering 300 DPI Plate...
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-[#FAF1F1] text-[#9E2A2B] font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border border-[#E8C7C8] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Worker Processing Pending
                          </span>
                        )}

                        {/* 2. Secondary: Original Raw Camera Upload */}
                        <a
                          href={`/api/assets/${item.photoUrl}?download=1&filename=${encodeURIComponent(item.originalFilename || 'raw-original.jpg')}`}
                          target="_blank"
                          rel="noreferrer"
                          download={item.originalFilename || 'raw-original.jpg'}
                          className="px-3 py-1.5 bg-[#FAF8F5] text-[#1A1816] hover:bg-[#F4F0E8] font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border border-[#E8E2D8] hover:border-[#1A1816] shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#8C827A]" /> Download Original Raw
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      {/* Visual Preview */}
                      <div className="sm:col-span-4 aspect-[4/3] rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] p-2 overflow-hidden relative group">
                        <img
                          src={getMediaUrl(printJob?.proofAssetKey || item.photoUrl)}
                          alt={item.originalFilename}
                          style={{ transform: `rotate(${item.cropRotation || 0}deg)` }}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to raw photo URL if proof fails
                            const target = e.currentTarget;
                            if (target.src !== getMediaUrl(item.photoUrl)) {
                              target.src = getMediaUrl(item.photoUrl);
                            }
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-[#1A1816]/80 backdrop-blur-xs text-[#FAF8F5] font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-[1px]">
                          {hasMaster ? '300 DPI Proof' : 'Raw Ingress'}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-[#1A1816]/80 text-[#FAF8F5] font-mono text-[9px] px-1.5 py-0.5 rounded-[1px]">
                          {item.cropRotation || 0}°
                        </div>
                      </div>

                      {/* Technical Specifications Grid */}
                      <div className="sm:col-span-8 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-[#F4F0E8] rounded-[2px] border border-[#E8E2D8]">
                            <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                              Format / Dimensions
                            </span>
                            <span className="font-serif text-sm font-medium text-[#1A1816] mt-0.5 block">
                              {PRINT_SIZE_LABELS[item.size] || item.size}
                            </span>
                          </div>

                          <div className="p-3 bg-[#F4F0E8] rounded-[2px] border border-[#E8E2D8]">
                            <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                              Archival Substrate
                            </span>
                            <span className="font-serif text-sm font-medium text-[#1A1816] mt-0.5 block">
                              {item.paperType}
                            </span>
                          </div>

                          <div className="p-3 bg-[#F4F0E8] rounded-[2px] border border-[#E8E2D8]">
                            <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                              Margin Treatment
                            </span>
                            <span className="font-serif text-sm font-medium text-[#1A1816] mt-0.5 block">
                              {item.finish}
                            </span>
                          </div>

                          <div className="p-3 bg-[#F4F0E8] rounded-[2px] border border-[#E8E2D8]">
                            <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                              Print Run
                            </span>
                            <span className="font-mono text-sm font-bold text-[#1A1816] mt-0.5 block">
                              {item.quantity} copies
                            </span>
                          </div>
                        </div>

                        {/* Preflight Quality Inspection Bar */}
                        <div className="p-3 bg-[#FAF8F5] rounded-[2px] border border-[#E8E2D8] space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8C827A] font-bold">
                              Preflight Press Diagnostics
                            </span>
                            <span
                              className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-[1px] border ${
                                isOptimalDpi
                                  ? 'bg-[#F4F8F4] text-[#2E6B38] border-[#CEE0CF]'
                                  : detectedDpi
                                  ? 'bg-[#FAF7EE] text-[#8C6D23] border-[#E8DFC2]'
                                  : 'bg-[#F4F0E8] text-[#57534E] border-[#E8E2D8]'
                              }`}
                            >
                              {detectedDpi ? `${detectedDpi} DPI ${isOptimalDpi ? '• Press Ready' : '• Check Scaling'}` : 'Analyzing Resolution'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px] text-[#3D3A36]">
                            <div>
                              <span className="text-[#8C827A]">Color Profile:</span>{' '}
                              <span className="font-medium text-[#1A1816]">{printJob?.colorSpace || 'sRGB'}</span>
                            </div>
                            <div>
                              <span className="text-[#8C827A]">Aspect Fit:</span>{' '}
                              <span className="font-medium text-[#1A1816]">
                                {printJob?.aspectRatioMatch ? '1:1 Exact' : 'Safe-crop'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8C827A]">EXIF Orient:</span>{' '}
                              <span className="font-medium text-[#1A1816]">
                                Tag {printJob?.exifOrientation || 1}
                              </span>
                            </div>
                          </div>

                          {/* Preflight Warnings */}
                          {printJob?.preflightWarnings && printJob.preflightWarnings.length > 0 && (
                            <div className="mt-1 pt-1.5 border-t border-[#E8E2D8]/60 text-[10px] font-mono text-[#8C6D23] flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{printJob.preflightWarnings.join(' • ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Customer & Delivery Info + Printable Docket Slip */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer & Delivery Card */}
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-2.5">
              Client Dossier & Dispatch
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">Commissioned By</span>
                <span className="font-serif text-base text-[#1A1816] font-medium">{order.customer?.name}</span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">Communication Wire</span>
                <p className="font-mono text-xs text-[#1A1816]">{order.customer?.phone || 'No phone recorded'}</p>
                <p className="font-mono text-[11px] text-[#8C827A]">{order.customer?.email}</p>
              </div>

              <div className="p-4 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
                  Method: <strong className="text-[#1A1816] font-bold">{order.deliveryMethod === 'PICKUP' ? 'Counter Pickup' : 'Curated Courier'}</strong>
                </span>

                {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress ? (
                  <div className="text-xs pt-1 space-y-0.5 font-serif text-[#1A1816]">
                    <p>{order.deliveryAddress.line1}</p>
                    <p className="font-mono text-[10px] text-[#8C827A]">
                      {order.deliveryAddress.city} — {order.deliveryAddress.pincode}
                    </p>
                  </div>
                ) : (
                  <p className="font-serif italic text-xs text-[#8C827A] pt-1">
                    Client will collect in person at the studio counter desk.
                  </p>
                )}
              </div>

              {order.notes && (
                <div className="p-4 rounded-[2px] bg-[#FAF3E8] border border-[#B8860B]/30 text-xs text-[#1A1816] space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] font-bold text-[#B8860B] block">
                    Curatorial Instructions:
                  </span>
                  <p className="font-serif italic text-[#3D3A36]">“{order.notes}”</p>
                </div>
              )}
            </div>
          </Card>

          {/* Printable Job Docket Slip */}
          <div
            id="printable-docket"
            className="rounded-[2px] border-2 border-dashed border-[#1A1816]/40 bg-[#FAF8F5] p-6 shadow-sm space-y-4 text-[#1A1816]"
          >
            <div className="text-center border-b border-[#E8E2D8] pb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8C827A] block">
                Chitrabazaar Atelier Work Order
              </span>
              <h4 className="text-xl font-serif font-normal text-[#1A1816] mt-0.5">
                Docket #{order.orderNumber}
              </h4>
            </div>

            <div className="font-mono text-xs space-y-2 text-[#3D3A36]">
              <div className="flex justify-between border-b border-[#E8E2D8]/60 pb-1">
                <span className="text-[#8C827A]">Atelier:</span>
                <span className="font-medium text-[#1A1816]">{order.studio?.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E2D8]/60 pb-1">
                <span className="text-[#8C827A]">Client:</span>
                <span className="font-medium text-[#1A1816]">{order.customer?.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#E8E2D8]/60 pb-1">
                <span className="text-[#8C827A]">Fulfillment:</span>
                <span className="font-medium text-[#1A1816]">{order.deliveryMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C827A]">Total Plates:</span>
                <span className="font-bold text-[#1A1816]">{totalPrints} physical prints</span>
              </div>
            </div>

            <div className="border-t border-[#E8E2D8] pt-3 text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A] text-center">
              Affix to archival print folder prior to packaging.
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Reject / Cancel Print Commission"
      >
        <div className="space-y-4">
          <p className="font-serif italic text-xs text-[#8C827A]">
            Specify the curatorial or mechanical reason for declining commission #{order.orderNumber}. The client will be refunded immediately.
          </p>

          <Textarea
            label="Cancellation Rationale"
            required
            placeholder="e.g. Master resolution below 300 DPI threshold for exhibition scale, or specialized paper stock depleted..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D8]">
            <Button variant="outline" size="md" onClick={() => setShowCancelModal(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isUpdating}
              onClick={() => updateStatus('CANCELLED', cancelReason)}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
