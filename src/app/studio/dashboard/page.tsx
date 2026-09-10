'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getMediaUrl,
} from '@/lib/utils';
import {
  Printer,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building,
  BellRing,
  ExternalLink,
} from 'lucide-react';

export default function StudioDashboardPage() {
  const { data: session } = useSession();
  const studioId = session?.user?.studioId;

  const [orders, setOrders] = useState<any[]>([]);
  const [studio, setStudio] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      // Fetch orders for this studio
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const studioOrders = data.orders || [];

        // Check if there are newly placed orders
        const newUnaccepted = studioOrders.find((o: any) => o.status === 'PLACED');
        if (newUnaccepted) {
          setNewOrderAlert(newUnaccepted);
        } else {
          setNewOrderAlert(null);
        }

        setOrders(studioOrders);
      }

      // Fetch studio profile and payouts
      if (studioId) {
        const studioRes = await fetch(`/api/studios/${studioId}`);
        if (studioRes.ok) {
          const sData = await studioRes.json();
          setStudio(sData.studio);
        }

        const payoutsRes = await fetch(`/api/payouts?studioId=${studioId}`);
        if (payoutsRes.ok) {
          const pData = await payoutsRes.json();
          setPayouts(pData.payouts || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [studioId]);

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // KPIs
  const newOrdersCount = orders.filter((o) => o.status === 'PLACED').length;
  const printingCount = orders.filter((o) => o.status === 'PRINTING' || o.status === 'ASSIGNED').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const pendingPayoutTotal = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, p) => acc + p.netPayout, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="sm">
              Darkroom Atelier
            </Badge>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#2D4A3E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D4A3E] animate-pulse" />
              Live Press Wire
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            {studio?.name || 'Darkroom Operations'}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Locality: {studio?.city || 'Central Darkroom'} • Tariff Cut: {studio?.commissionRate || 15}% • Atelier Index: {studio?.rating || 5.0}★
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/studio/orders">
            <Button variant="outline" size="sm">
              All Orders ({orders.length})
            </Button>
          </Link>
          <Link href="/studio/profile">
            <Button variant="primary" size="sm">
              Atelier Ledger & Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Incoming Order Alert Banner */}
      {newOrderAlert && (
        <div className="p-5 rounded-[2px] bg-[#FAF3E8] border border-[#B8860B]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-[2px] bg-[#FAF8F5] border border-[#B8860B]/30 text-[#B8860B]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#B8860B] font-bold block">
                Urgent Transmission: Fresh Commission Docket
              </span>
              <p className="font-serif text-sm text-[#1A1816] mt-0.5">
                Docket #{newOrderAlert.orderNumber} ({newOrderAlert.items.length} plates) from {newOrderAlert.customer?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleQuickStatusUpdate(newOrderAlert.id, 'PRINTING')}
              className="px-4 py-2 bg-[#1A1816] hover:bg-[#3D3A36] text-[#FAF8F5] font-mono text-[11px] uppercase tracking-[0.15em] rounded-[2px] transition-colors shadow-xs"
            >
              Accept & Expose Prints
            </button>
            <Link href={`/studio/orders/${newOrderAlert.id}`}>
              <button className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] font-mono text-[11px] uppercase tracking-[0.15em] rounded-[2px] border border-[#E8E2D8] transition-colors shadow-xs">
                Inspect Docket
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
            I. Unaccepted Queue
          </span>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {newOrdersCount}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Awaiting inspection
          </span>
        </Card>

        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#B8860B] block">
            II. In Darkroom Press
          </span>
          <span className="text-3xl font-serif font-normal text-[#B8860B] block">
            {printingCount}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Exposing emulsion
          </span>
        </Card>

        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#2D4A3E] block">
            III. Ready for Handover
          </span>
          <span className="text-3xl font-serif font-normal text-[#2D4A3E] block">
            {readyCount}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Inspected & enveloped
          </span>
        </Card>

        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
            IV. Dispatched & Fulfilled
          </span>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {completedCount}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Delivered to client
          </span>
        </Card>

        <Card className="p-5 border border-[#1A1816] bg-[#1A1816] text-[#FAF8F5] rounded-[2px] space-y-1 col-span-2 lg:col-span-1 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FAF8F5]/70 block">
            V. Pending Net Settlement
          </span>
          <span className="text-3xl font-serif font-normal text-[#FAF8F5] block">
            {formatCurrency(pendingPayoutTotal)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FAF8F5]/60">
            Dedicated Audit Ledger
          </span>
        </Card>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#1A1816]" />
            <h2 className="font-serif text-lg font-normal text-[#1A1816]">
              Active Darkroom Queue
            </h2>
          </div>
          <Link
            href="/studio/orders"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] hover:underline flex items-center gap-1.5 transition-colors"
          >
            Complete Registry ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-16 text-center rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] font-serif italic text-sm text-[#8C827A]">
            No physical commissions currently assigned to your darkroom press.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.slice(0, 6).map((order) => {
              const statusConfig = getStatusColor(order.status);
              const totalPrints = order.items.reduce((acc: number, i: any) => acc + i.quantity, 0);

              return (
                <Card
                  key={order.id}
                  className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm hover:border-[#1A1816] transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                    <span className="font-mono text-xs font-semibold text-[#1A1816]">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-[2px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {order.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-14 h-14 rounded-[2px] border border-[#E8E2D8] bg-[#F4F0E8] p-0.5 shrink-0 overflow-hidden relative shadow-xs"
                      >
                        <img src={getMediaUrl(item.printJob?.proofAssetKey || item.photoUrl)} alt="" className="w-full h-full object-cover rounded-[1px]" />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-serif text-sm text-[#1A1816]">Client: {order.customer?.name}</p>
                    <p className="font-mono text-[11px] text-[#8C827A] uppercase tracking-[0.15em]">
                      {totalPrints} prints • {order.deliveryMethod === 'PICKUP' ? 'Counter Handover' : 'Artisan Courier'}
                    </p>
                    {order.notes && (
                      <p className="text-[#3D3A36] bg-[#F4F0E8] p-2.5 rounded-[2px] text-xs border border-[#E8E2D8] italic font-serif">
                        “{order.notes}”
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#E8E2D8]">
                    <Link href={`/studio/orders/${order.id}`} className="w-full">
                      <Button variant="outline" size="sm" fullWidth>
                        Open Console <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
