'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MapPin, Plus, Home, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    city: 'Kathmandu',
    pincode: '44600',
    isDefault: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
      setNewAddress((prev) => ({
        ...prev,
        fullName: session.user.name || '',
      }));
    }
  }, [session?.user]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      <div className="border-b border-[#E8E2D8] pb-5 mb-8">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
          Client Registry & Credentials
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
          Client Folio & Dispatch Destinations
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1816] text-[#FAF8F5] flex items-center justify-center font-serif text-lg">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-[#1A1816]">
                  {session?.user?.name || 'Client'}
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A]">
                  {session?.user?.role || 'CLIENT'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <span className="text-[#8C827A] block text-[10px] uppercase tracking-wider">Registered Identity</span>
              <span className="text-[#1A1816]">{session?.user?.email}</span>
            </div>
          </div>
        </div>

        {/* Address Book */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                Recorded Dispatch Destinations
              </h3>
              <p className="font-serif italic text-xs text-[#6B665F]">
                Used for direct studio dispatch and courier delivery.
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-[#E8E2D8] bg-[#FAF8F5] p-5 rounded-[2px] shadow-sm space-y-2 text-xs font-mono relative">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                  <div className="flex items-center gap-1.5 font-serif text-sm text-[#1A1816]">
                    {addr.label === 'Home' ? (
                      <Home className="w-3.5 h-3.5 text-[#8C827A]" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5 text-[#8C827A]" />
                    )}
                    {addr.label}
                  </div>
                  {addr.isDefault && (
                    <Badge variant="success" size="sm">
                      Default
                    </Badge>
                  )}
                </div>

                <p className="font-semibold text-[#1A1816]">{addr.fullName}</p>
                <p className="text-[#6B665F] leading-relaxed font-sans text-xs">{addr.line1}</p>
                <p className="text-[#8C827A]">
                  {addr.city} • PIN {addr.pincode}
                </p>
                {addr.phone && (
                  <p className="text-[#8C827A] text-[11px] pt-1">Tel: {addr.phone}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Dispatch Destination"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Destination Tag"
              placeholder="Residence / Atelier / Office"
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            />
            <Input
              label="Recipient Name"
              required
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
            />
          </div>

          <Input
            label="Contact Telephone"
            type="tel"
            required
            placeholder="+977 9800000000"
            value={newAddress.phone}
            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
          />

          <Input
            label="Postal Street Address"
            required
            placeholder="Street name, building, apartment..."
            value={newAddress.line1}
            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
            />
            <Input
              label="Postal PIN Code"
              required
              value={newAddress.pincode}
              onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="md" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              Register Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

