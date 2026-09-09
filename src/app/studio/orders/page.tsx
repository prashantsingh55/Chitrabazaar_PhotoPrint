'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
} from '@/lib/utils';
import {
  Printer,
  Search,
  ArrowRight,
  ExternalLink,
  Package,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E8E2D8] pb-6">
        <div>
          <Badge variant="outline" size="sm">
            Atelier Queue
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Darkroom Orders Logbook
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Physical print specifications, docket manifests & fulfillment timeline
          </p>
        </div>

        <Link href="/studio/dashboard">
          <Button variant="outline" size="sm">
            ← Return to Console
          </Button>
        </Link>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PLACED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border transition-all ${
                activeFilter === f
                  ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#8C827A] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
              }`}
            >
              {f === 'ALL' ? 'All Dockets' : f.charAt(0) + f.slice(1).toLowerCase()} ({orders.filter((o) => f === 'ALL' || o.status === f).length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Search docket #, client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="p-20 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
          Loading darkroom logbook registry...
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="outline" size="sm">
            Registry Clean
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">
            No commissions match your filtered query.
          </p>
        </Card>
      ) : (
        <div className="rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F0E8] border-b border-[#E8E2D8] text-[#8C827A] font-mono text-[10px] uppercase tracking-[0.15em] select-none">
              <tr>
                <th className="p-4">Docket #</th>
                <th className="p-4">Client</th>
                <th className="p-4">Plates Count</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4">Gross Tariff</th>
                <th className="p-4">Atelier Status</th>
                <th className="p-4">Received</th>
                <th className="p-4 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusColor(order.status);
                const totalPrints = order.items.reduce((acc: number, i: any) => acc + i.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-[#1A1816]">
                      #{order.orderNumber}
                    </td>

                    <td className="p-4">
                      <span className="font-serif text-sm font-medium text-[#1A1816] block">{order.customer?.name}</span>
                      <span className="font-mono text-[10px] text-[#8C827A] block mt-0.5">
                        {order.customer?.phone || order.customer?.email}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-xs text-[#3D3A36]">
                      {order.items.length} plates ({totalPrints} prints)
                    </td>

                    <td className="p-4 font-serif text-xs text-[#1A1816]">
                      {order.deliveryMethod === 'PICKUP' ? 'Counter Pickup' : 'Courier Dispatch'}
                    </td>

                    <td className="p-4 font-mono font-semibold text-[#1A1816]">
                      {formatCurrency(order.subtotal)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-[2px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[10px] text-[#8C827A]">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="p-4 text-right">
                      <Link href={`/studio/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Console <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
