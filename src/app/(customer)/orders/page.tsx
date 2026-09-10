'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getMediaUrl,
} from '@/lib/utils';
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Building,
} from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session?.user]);

  const handleReorder = (order: any) => {
    const reorderItems = order.items.map((item: any) => ({
      id: `reorder-${Date.now()}-${item.id}`,
      url: item.photoUrl,
      filename: item.originalFilename || 'reorder_photo.jpg',
      size: item.size,
      paperType: item.paperType,
      finish: item.finish,
      quantity: item.quantity,
      rotation: item.cropRotation || 0,
      aspect: item.cropAspect || 'original',
    }));
    localStorage.setItem('chitrabazaar_cart_items', JSON.stringify(reorderItems));
    router.push('/upload');
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return true;
    return o.status === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6 mb-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
            Client Archive & Chronology
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Print Commissions Folio
          </h1>
          <p className="font-serif italic text-xs text-[#6B665F] mt-1">
            Review production progress, lab dockets, and historical print invoices.
          </p>
        </div>

        <Link href="/upload">
          <Button variant="primary" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Commission New Prints
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {['ALL', 'PLACED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] rounded-[2px] border transition-all ${
              activeFilter === f
                ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816] shadow-xs'
                : 'bg-white/80 text-[#6B665F] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
            }`}
          >
            {f === 'ALL' ? 'All Commissions' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-[#8C827A]">
          Consulting commission ledger...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-12 text-center max-w-md mx-auto space-y-3 rounded-[2px]">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] block">
            Folio Empty
          </span>
          <p className="font-serif italic text-sm text-[#6B665F]">
            {activeFilter === 'ALL'
              ? 'No print commissions have been recorded in this ledger yet.'
              : `No orders currently registered under "${activeFilter.toLowerCase()}" status.`}
          </p>
          <div className="pt-2">
            <Link href="/upload">
              <Button variant="primary" size="md">
                Begin Your First Print Run
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusColor(order.status);

            return (
              <div
                key={order.id}
                className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm hover:border-[#1A1816]/50 transition-all space-y-4"
              >
                {/* Order Card Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-medium text-[#1A1816]">
                      Docket #{order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[1px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#8C827A] uppercase tracking-wider">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>

                {/* Main Order Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Photo Thumbnails Preview */}
                  <div className="md:col-span-4 flex items-center gap-2 overflow-x-auto pb-1">
                    {order.items.slice(0, 4).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-14 h-14 rounded-[1px] border border-[#E8E2D8] shrink-0 overflow-hidden relative bg-white p-1"
                      >
                        <img
                          src={getMediaUrl(item.printJob?.proofAssetKey || item.photoUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-14 h-14 rounded-[1px] border border-[#E8E2D8] shrink-0 bg-[#F4F0E8] flex items-center justify-center font-mono text-xs text-[#6B665F]">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Studio & Delivery Details */}
                  <div className="md:col-span-5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-serif text-sm text-[#1A1816]">
                      <Building className="w-3.5 h-3.5 text-[#8C827A]" />
                      {order.studio?.name || 'Assigned Regional Atelier'}
                    </div>
                    <p className="text-[#6B665F] font-sans">
                      Fulfillment: <span className="font-mono uppercase text-[#1A1816]">{order.deliveryMethod}</span>
                      {order.deliveryAddress && ` • ${order.deliveryAddress.city}`}
                    </p>
                    <p className="text-[#8C827A] font-mono text-[10px] uppercase tracking-wider">
                      {order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} Physical Impressions
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="md:col-span-3 flex flex-col sm:items-end justify-between gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#8C827A] uppercase tracking-wider block">
                        Settled Total
                      </span>
                      <span className="font-serif text-xl font-medium text-[#1A1816]">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="p-2 rounded-[2px] border border-[#E8E2D8] bg-white hover:border-[#1A1816] text-[#6B665F] hover:text-[#1A1816] transition-colors"
                        title="Reorder exact plates"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <Link href={`/orders/${order.id}`} className="flex-1 sm:flex-initial">
                        <Button variant="primary" size="sm">
                          Chronicle <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

