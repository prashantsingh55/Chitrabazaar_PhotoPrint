'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LocationPicker } from '@/components/ui/LocationPicker';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Edit2,
  Trash2,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

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

export default function ProfilePage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRecord>({
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    city: 'Kathmandu',
    pincode: '44600',
    lat: 27.7172,
    lng: 85.324,
    isDefault: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
    }
  }, [session?.user]);

  // Identify Home and Work slots
  const homeAddress = addresses.find(
    (a) => a.label?.trim().toLowerCase() === 'home'
  );
  const workAddress = addresses.find(
    (a) => a.label?.trim().toLowerCase() === 'work'
  );
  const additionalAddresses = addresses.filter(
    (a) =>
      a.label?.trim().toLowerCase() !== 'home' &&
      a.label?.trim().toLowerCase() !== 'work'
  );

  const handleOpenAdd = (defaultLabel: 'Home' | 'Work') => {
    setSaveError(null);
    setEditingAddress({
      label: defaultLabel,
      fullName: session?.user?.name || '',
      phone: '',
      line1: '',
      city: 'Kathmandu',
      pincode: '44600',
      lat: 27.7172,
      lng: 85.324,
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleOpenEdit = (addr: AddressRecord) => {
    setSaveError(null);
    setEditingAddress({
      id: addr.id,
      label: addr.label || 'Home',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      city: addr.city || 'Kathmandu',
      pincode: addr.pincode || '44600',
      lat: addr.lat || 27.7172,
      lng: addr.lng || 85.324,
      isDefault: !!addr.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const method = editingAddress.id ? 'PUT' : 'POST';
      const res = await fetch('/api/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAddress),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address');
      }

      setShowAddressModal(false);
      fetchAddresses();
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || 'Error saving address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you wish to remove this delivery destination?')) return;

    try {
      const res = await fetch(`/api/addresses?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      {/* Header */}
      <div className="border-b border-[#E8E2D8] pb-5 mb-8">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
          Client Registry & Credentials
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
          Client Folio & Dispatch Destinations
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: User Dossier */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1816] text-[#FAF8F5] flex items-center justify-center font-serif text-lg font-bold">
                {session?.user?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-[#1A1816]">
                  {session?.user?.name || 'Client Folio'}
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A]">
                  {session?.user?.role || 'REGISTERED CLIENT'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-[#8C827A] block text-[10px] uppercase tracking-wider">
                  Registered Identity
                </span>
                <span className="text-[#1A1816] font-medium">{session?.user?.email}</span>
              </div>
              {(homeAddress?.phone || workAddress?.phone) && (
                <div>
                  <span className="text-[#8C827A] block text-[10px] uppercase tracking-wider">
                    Contact Wire
                  </span>
                  <span className="text-[#1A1816]">{homeAddress?.phone || workAddress?.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Home & Work Delivery Slots */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#1A1816]">
              Delivery Destinations (Home & Work)
            </h3>
            <p className="font-serif italic text-xs text-[#6B665F] mt-0.5">
              Pinned with Google Maps for precise courier dispatch and hand-to-hand delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Home Address Slot */}
            {homeAddress ? (
              <div className="border border-[#1A1816]/30 bg-[#FAF8F5] p-5 rounded-[2px] shadow-sm space-y-3 font-mono text-xs relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2.5">
                    <div className="flex items-center gap-1.5 font-serif text-sm text-[#1A1816] font-medium">
                      <Home className="w-4 h-4 text-[#1A1816]" /> Home Address
                    </div>
                    {homeAddress.isDefault && (
                      <Badge variant="default" size="sm">
                        Primary
                      </Badge>
                    )}
                  </div>

                  <p className="font-semibold text-sm text-[#1A1816] font-serif">
                    {homeAddress.fullName}
                  </p>
                  <p className="text-[#6B665F] leading-relaxed font-sans text-xs">
                    {homeAddress.line1}
                  </p>
                  <p className="text-[#8C827A] text-[11px]">
                    {homeAddress.city} • PIN {homeAddress.pincode}
                  </p>

                  {homeAddress.phone && (
                    <p className="text-[#8C827A] text-[11px]">Tel: {homeAddress.phone}</p>
                  )}

                  {/* GPS Coordinates Tag */}
                  {homeAddress.lat && homeAddress.lng ? (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-[#F4F8F4] text-[#2E6B38] border border-[#CEE0CF] text-[10px]">
                        <Navigation className="w-2.5 h-2.5" />
                        {homeAddress.lat.toFixed(4)}° N, {homeAddress.lng.toFixed(4)}° E (Google Pin Active)
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEdit(homeAddress)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#1A1816] hover:underline"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Home Details & Pin
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(homeAddress.id)}
                    className="text-[#8C827A] hover:text-[#A3432B] transition-colors p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleOpenAdd('Home')}
                className="border-2 border-dashed border-[#E8E2D8] hover:border-[#1A1816] bg-[#FAF8F5] p-6 rounded-[2px] flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 min-h-[190px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#F4F0E8] group-hover:bg-[#1A1816] text-[#1A1816] group-hover:text-[#FAF8F5] flex items-center justify-center transition-colors">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-medium text-[#1A1816]">
                    + Set Home Address
                  </h4>
                  <p className="text-[11px] font-serif italic text-[#8C827A] mt-0.5">
                    Residence dispatch destination & delivery pin
                  </p>
                </div>
              </div>
            )}

            {/* 2. Work Address Slot */}
            {workAddress ? (
              <div className="border border-[#1A1816]/30 bg-[#FAF8F5] p-5 rounded-[2px] shadow-sm space-y-3 font-mono text-xs relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2.5">
                    <div className="flex items-center gap-1.5 font-serif text-sm text-[#1A1816] font-medium">
                      <Briefcase className="w-4 h-4 text-[#1A1816]" /> Work / Office Address
                    </div>
                    {workAddress.isDefault && (
                      <Badge variant="default" size="sm">
                        Primary
                      </Badge>
                    )}
                  </div>

                  <p className="font-semibold text-sm text-[#1A1816] font-serif">
                    {workAddress.fullName}
                  </p>
                  <p className="text-[#6B665F] leading-relaxed font-sans text-xs">
                    {workAddress.line1}
                  </p>
                  <p className="text-[#8C827A] text-[11px]">
                    {workAddress.city} • PIN {workAddress.pincode}
                  </p>

                  {workAddress.phone && (
                    <p className="text-[#8C827A] text-[11px]">Tel: {workAddress.phone}</p>
                  )}

                  {/* GPS Coordinates Tag */}
                  {workAddress.lat && workAddress.lng ? (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[1px] bg-[#F4F8F4] text-[#2E6B38] border border-[#CEE0CF] text-[10px]">
                        <Navigation className="w-2.5 h-2.5" />
                        {workAddress.lat.toFixed(4)}° N, {workAddress.lng.toFixed(4)}° E (Google Pin Active)
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEdit(workAddress)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#1A1816] hover:underline"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Work Details & Pin
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(workAddress.id)}
                    className="text-[#8C827A] hover:text-[#A3432B] transition-colors p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleOpenAdd('Work')}
                className="border-2 border-dashed border-[#E8E2D8] hover:border-[#1A1816] bg-[#FAF8F5] p-6 rounded-[2px] flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 min-h-[190px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#F4F0E8] group-hover:bg-[#1A1816] text-[#1A1816] group-hover:text-[#FAF8F5] flex items-center justify-center transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-medium text-[#1A1816]">
                    + Set Work Address
                  </h4>
                  <p className="text-[11px] font-serif italic text-[#8C827A] mt-0.5">
                    Office or studio dispatch destination & delivery pin
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Any additional custom addresses */}
          {additionalAddresses.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8C827A]">
                Other Saved Destinations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-[#E8E2D8] bg-[#FAF8F5] p-4 rounded-[2px] text-xs font-mono space-y-1.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-1.5">
                      <span className="font-bold text-[#1A1816]">{addr.label}</span>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#8C827A] hover:text-[#A3432B]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[#6B665F] font-sans">{addr.line1}, {addr.city}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal with Google Map Location Picker */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title={editingAddress.id ? `Edit ${editingAddress.label} Destination` : `Register ${editingAddress.label} Destination`}
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-[#FAF1F1] border border-[#E8C7C8] text-[#A3432B] text-xs font-mono rounded-[2px]">
              {saveError}
            </div>
          )}

          {/* Slot Toggle: Home vs Work */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] block mb-1.5">
              Destination Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditingAddress({ ...editingAddress, label: 'Home' })}
                className={`py-2 px-3 rounded-[2px] border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${
                  editingAddress.label.toLowerCase() === 'home'
                    ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5] font-bold'
                    : 'border-[#E8E2D8] bg-[#FAF8F5] text-[#1A1816] hover:bg-[#F4F0E8]'
                }`}
              >
                <Home className="w-3.5 h-3.5" /> Home Address
              </button>
              <button
                type="button"
                onClick={() => setEditingAddress({ ...editingAddress, label: 'Work' })}
                className={`py-2 px-3 rounded-[2px] border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${
                  editingAddress.label.toLowerCase() === 'work'
                    ? 'border-[#1A1816] bg-[#1A1816] text-[#FAF8F5] font-bold'
                    : 'border-[#E8E2D8] bg-[#FAF8F5] text-[#1A1816] hover:bg-[#F4F0E8]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Work Address
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Recipient Name"
              required
              placeholder="e.g. Prashant Singh"
              value={editingAddress.fullName}
              onChange={(e) => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
            />
            <Input
              label="Contact Telephone"
              type="tel"
              required
              placeholder="+977 9800000000"
              value={editingAddress.phone || ''}
              onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
            />
          </div>

          <Input
            label="Street Address / House / Landmark"
            required
            placeholder="e.g. Lazimpat Marg, Building 14"
            value={editingAddress.line1}
            onChange={(e) => setEditingAddress({ ...editingAddress, line1: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City / Municipality"
              required
              value={editingAddress.city}
              onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
            />
            <Input
              label="Postal PIN Code"
              required
              value={editingAddress.pincode}
              onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
            />
          </div>

          {/* Interactive Google Map Location Picker */}
          <div className="pt-2 border-t border-[#E8E2D8]">
            <LocationPicker
              lat={editingAddress.lat}
              lng={editingAddress.lng}
              label={`${editingAddress.label} Map Location Pin`}
              onChange={(newLat, newLng) => {
                setEditingAddress((prev) => ({
                  ...prev,
                  lat: newLat,
                  lng: newLng,
                }));
              }}
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#E8E2D8]">
            <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#1A1816]">
              <input
                type="checkbox"
                checked={editingAddress.isDefault}
                onChange={(e) =>
                  setEditingAddress({ ...editingAddress, isDefault: e.target.checked })
                }
                className="w-3.5 h-3.5 accent-[#1A1816]"
              />
              <span>Set as default dispatch destination</span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                Save {editingAddress.label} Address
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
