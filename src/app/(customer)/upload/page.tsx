'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PRINT_SIZE_LABELS,
  PRINT_SIZE_PRICES,
  PAPER_TYPE_SURCHARGES,
  formatCurrency,
  getMediaUrl,
} from '@/lib/utils';
import {
  UploadCloud,
  RotateCw,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck,
  Sliders,
  Check,
  X,
} from 'lucide-react';

export interface PhotoItem {
  id: string;
  url: string;
  previewUrl?: string;
  filename: string;
  size: string; // PrintSize enum
  paperType: string; // PaperType enum
  finish: string; // PrintFinish enum
  quantity: number;
  rotation: number; // 0, 90, 180, 270
  aspect: string;
}

interface EstimatorSpecs {
  size: string;
  paperType: string;
  quantity: number;
}

const SAMPLE_DEMO_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    filename: 'portrait_study_i.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    filename: 'highland_fog_morning.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    filename: 'family_archive_plate.jpg',
  },
];

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paramSize = searchParams.get('size');
  const paramPaper = searchParams.get('paper');
  const paramQty = searchParams.get('qty');

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [activeSpecs, setActiveSpecs] = useState<EstimatorSpecs>({
    size: 'SIZE_4X6',
    paperType: 'GLOSSY',
    quantity: 1,
  });
  const [hasEstimatorApplied, setHasEstimatorApplied] = useState(false);
  const [showSpecsBanner, setShowSpecsBanner] = useState(false);
  const isCartInitializedRef = useRef(false);

  // Initialize specs from URL params or localStorage, and load cart
  useEffect(() => {
    let resolvedSpecs: EstimatorSpecs = {
      size: 'SIZE_4X6',
      paperType: 'GLOSSY',
      quantity: 1,
    };
    let isFromEstimator = false;

    // 1. Check query parameters first
    if (paramSize && PRINT_SIZE_LABELS[paramSize]) {
      resolvedSpecs.size = paramSize;
      isFromEstimator = true;
    }
    if (paramPaper && ['GLOSSY', 'MATTE', 'LUSTRE'].includes(paramPaper)) {
      resolvedSpecs.paperType = paramPaper;
      isFromEstimator = true;
    }
    if (paramQty && !isNaN(Number(paramQty)) && Number(paramQty) > 0) {
      resolvedSpecs.quantity = parseInt(paramQty, 10);
      isFromEstimator = true;
    }

    // 2. Check localStorage fallback if not specified in query params
    if (!isFromEstimator && typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem('chitrabazaar_estimator_prefs');
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (parsed.size && PRINT_SIZE_LABELS[parsed.size]) {
            resolvedSpecs.size = parsed.size;
            isFromEstimator = true;
          }
          if (parsed.paper && ['GLOSSY', 'MATTE', 'LUSTRE'].includes(parsed.paper)) {
            resolvedSpecs.paperType = parsed.paper;
            isFromEstimator = true;
          }
          if (parsed.qty && Number(parsed.qty) > 0) {
            resolvedSpecs.quantity = Number(parsed.qty);
            isFromEstimator = true;
          }
        } catch (e) {
          console.error('Failed to parse estimator preferences:', e);
        }
      }
    }

    setActiveSpecs(resolvedSpecs);
    if (isFromEstimator) {
      setHasEstimatorApplied(true);
      setShowSpecsBanner(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'chitrabazaar_estimator_prefs',
          JSON.stringify({
            size: resolvedSpecs.size,
            paper: resolvedSpecs.paperType,
            qty: resolvedSpecs.quantity,
          })
        );
      }
    }

    // 3. Hydrate existing items from localStorage (e.g. from home page direct upload)
    if (typeof window !== 'undefined' && !isCartInitializedRef.current) {
      const stored = localStorage.getItem('chitrabazaar_cart_items');
      if (stored) {
        try {
          const parsedItems = JSON.parse(stored);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setItems(parsedItems);
          }
        } catch (e) {
          console.error('Failed to parse cart items from localStorage', e);
        }
      }
      isCartInitializedRef.current = true;
    }
  }, [paramSize, paramPaper, paramQty]);

  // Keep localStorage cart items in sync with items state
  useEffect(() => {
    if (isCartInitializedRef.current && typeof window !== 'undefined') {
      localStorage.setItem('chitrabazaar_cart_items', JSON.stringify(items));
    }
  }, [items]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedFiles: { url: string; previewUrl: string; filename: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const localPreviewUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';

        // 1. Attempt Cloudflare R2 Direct Presigned Upload
        try {
          const presignRes = await fetch('/api/upload/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
            }),
          });

          if (presignRes.ok) {
            const presignData = await presignRes.json();
            if (presignData.uploadUrl && presignData.uploadUrl.startsWith('http')) {
              // Direct stream to Cloudflare R2! Zero web server RAM overhead
              const r2PutRes = await fetch(presignData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
              });

              if (r2PutRes.ok) {
                uploadedFiles.push({
                  url: presignData.assetKey || presignData.publicUrl,
                  previewUrl: localPreviewUrl,
                  filename: file.name,
                });
                continue; // Successfully streamed to R2
              }
            }
          }
        } catch (presignErr) {
          console.warn('[Direct R2 Upload] Presign streaming fallback to standard upload:', presignErr);
        }

        // 2. Fallback to standard server-buffered upload for resilience
        const formData = new FormData();
        formData.append('files', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        if (data.files && data.files.length > 0) {
          uploadedFiles.push(
            ...data.files.map((f: any) => ({
              ...f,
              previewUrl: localPreviewUrl,
            }))
          );
        }
      }

      const newItems: PhotoItem[] = uploadedFiles.map((f) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: f.url,
        previewUrl: f.previewUrl,
        filename: f.filename,
        size: activeSpecs.size,
        paperType: activeSpecs.paperType,
        finish: 'BORDERLESS',
        quantity: activeSpecs.quantity,
        rotation: 0,
        aspect: 'original',
      }));

      setItems((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to process image upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSamplePhotos = () => {
    const sampleItems: PhotoItem[] = SAMPLE_DEMO_PHOTOS.map((p, idx) => ({
      id: `sample-${Date.now()}-${idx}`,
      url: p.url,
      filename: p.filename,
      size: activeSpecs.size,
      paperType: activeSpecs.paperType,
      finish: 'BORDERLESS',
      quantity: activeSpecs.quantity,
      rotation: 0,
      aspect: 'original',
    }));
    setItems((prev) => [...prev, ...sampleItems]);
  };

  const applySpecsToAllPlates = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        size: activeSpecs.size,
        paperType: activeSpecs.paperType,
        quantity: activeSpecs.quantity,
      }))
    );
  };

  const updateItem = (id: string, updates: Partial<PhotoItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  // Calculate totals
  const subtotal = items.reduce((acc, item) => {
    const basePrice = PRINT_SIZE_PRICES[item.size] || 1.2;
    const paperSur = PAPER_TYPE_SURCHARGES[item.paperType] || 0;
    return acc + (basePrice + paperSur) * item.quantity;
  }, 0);

  const totalPrintsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    localStorage.setItem('chitrabazaar_cart_items', JSON.stringify(items));
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6 mb-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
            Department of Physical Prints
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Photo Curation & Specifications
          </h1>
          <p className="font-serif italic text-xs text-[#6B665F] mt-1">
            Specify paper chemistry, dimensions, matting border, and orientation for each plate.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSamplePhotos}
            className="text-xs"
            title="Add high-res sample photos for rapid testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6B665F] mr-1.5" />
            Load Sample Plates
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Plates
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/tiff"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 rounded-[2px] bg-[#F4F0E8] border border-[#A3432B]/30 text-[#A3432B] text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Active Estimator Preset Banner */}
      {showSpecsBanner && hasEstimatorApplied && (
        <div className="mb-6 p-4 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A1816] text-[#FAF8F5] flex items-center justify-center shrink-0 mt-0.5 md:mt-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
                  Commission Estimator Specification Active
                </span>
                <Badge variant="default" size="sm">Synchronized</Badge>
              </div>
              <p className="font-serif text-sm text-[#1A1816] mt-0.5">
                Target Spec: <span className="font-semibold">{PRINT_SIZE_LABELS[activeSpecs.size]?.split('(')[0].trim() || activeSpecs.size}</span> • <span className="font-semibold">{activeSpecs.paperType === 'GLOSSY' ? 'High Gloss' : activeSpecs.paperType === 'MATTE' ? 'Velvet Matte' : 'Crystal Luster'}</span> • <span className="font-semibold">{activeSpecs.quantity} print{activeSpecs.quantity > 1 ? 's' : ''}</span> each
              </p>
              <p className="text-[11px] font-mono text-[#6B665F]">
                All newly uploaded plates automatically inherit these dimensions, paper stock, and copies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={applySpecsToAllPlates}
                className="text-xs"
                title="Batch-apply this specification to all plates currently on workbench"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-[#2D4F3E]" />
                Apply Spec to All ({items.length}) Plates
              </Button>
            )}
            <button
              onClick={() => setShowSpecsBanner(false)}
              className="p-1.5 text-[#8C827A] hover:text-[#1A1816] transition-colors rounded-[2px]"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Studio View */}
      {items.length === 0 ? (
        /* Empty Drag & Drop State */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E8E2D8] hover:border-[#1A1816] bg-[#F4F0E8]/40 hover:bg-[#F4F0E8]/80 p-12 sm:p-20 text-center cursor-pointer transition-all rounded-[2px]"
        >
          <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center mx-auto mb-4 text-[#1A1816]">
            <UploadCloud className="w-6 h-6" />
          </div>

          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
            Archival Intake
          </span>
          <h3 className="font-serif text-2xl font-normal text-[#1A1816] mb-2">
            Drag and deposit digital photographs here
          </h3>
          <p className="font-serif italic text-xs text-[#6B665F] max-w-sm mx-auto mb-6 leading-relaxed">
            Or click to select files from your storage archive. Native resolution JPG, PNG, WEBP, and TIFF supported.
          </p>

          <div className="inline-flex items-center gap-3">
            <Button variant="primary" size="md">
              Browse Files
            </Button>
            <span className="text-xs font-mono text-[#8C827A]">or</span>
            <Button
              variant="outline"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                handleAddSamplePhotos();
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6B665F] mr-1.5" />
              Use 3 Curated Plates
            </Button>
          </div>
        </div>
      ) : (
        /* Active Photo Configuration Grid + Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Photo Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] text-xs font-mono">
              <span className="text-[#1A1816] uppercase tracking-wider">
                {items.length} Photographic Plates Selected • {totalPrintsCount} Physical Prints
              </span>
              <button
                onClick={() => setItems([])}
                className="text-[#A3432B] hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <Trash2 className="w-3 h-3" /> Clear Atelier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item, idx) => {
                const itemBasePrice = PRINT_SIZE_PRICES[item.size] || 1.2;
                const itemPaperSur = PAPER_TYPE_SURCHARGES[item.paperType] || 0;
                const itemUnitPrice = itemBasePrice + itemPaperSur;
                const itemTotal = itemUnitPrice * item.quantity;

                return (
                  <div key={item.id} className="border border-[#E8E2D8] bg-[#FAF8F5] p-4 rounded-[2px] shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                      <span className="text-[11px] font-mono text-[#1A1816] truncate max-w-[190px] uppercase tracking-wider">
                        Plate {idx + 1} • {item.filename}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#8C827A] hover:text-[#A3432B] transition-colors p-1"
                        title="Remove plate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Matting Plate Frame */}
                    <div className="p-2.5 bg-white border border-[#E8E2D8] rounded-[2px]">
                      <div className="relative aspect-[4/3] bg-[#F4F0E8] overflow-hidden flex items-center justify-center border border-[#E8E2D8]/60">
                        <img
                          src={item.previewUrl || getMediaUrl(item.url)}
                          alt={item.filename}
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                          className="max-h-full max-w-full object-contain transition-transform duration-300"
                        />

                        {/* Rotation Tool */}
                        <button
                          type="button"
                          onClick={() => rotateItem(item.id)}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-[#FAF8F5]/90 border border-[#E8E2D8] text-[10px] font-mono text-[#1A1816] flex items-center gap-1 hover:bg-white rounded-[2px]"
                          title="Rotate plate"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>{item.rotation}°</span>
                        </button>

                        <div className="absolute top-2 left-2 bg-[#1A1816]/90 text-[#FAF8F5] text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[1px]">
                          {item.finish}
                        </div>
                      </div>
                    </div>

                    {/* Print Configuration Controls */}
                    <div className="space-y-3 pt-1 text-xs">
                      {/* Size Selector */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1">
                          Print Dimensions
                        </label>
                        <select
                          value={item.size}
                          onChange={(e) => updateItem(item.id, { size: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white/90 text-[#1A1816] text-xs font-serif rounded-[2px] border border-[#E8E2D8] focus:border-[#1A1816] outline-none"
                        >
                          {Object.entries(PRINT_SIZE_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label} — {formatCurrency(PRINT_SIZE_PRICES[k])}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Paper Type & Finish */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1">
                            Paper Stock
                          </label>
                          <select
                            value={item.paperType}
                            onChange={(e) => updateItem(item.id, { paperType: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white/90 text-[#1A1816] text-xs font-serif rounded-[2px] border border-[#E8E2D8] focus:border-[#1A1816] outline-none"
                          >
                            <option value="GLOSSY">High Gloss</option>
                            <option value="MATTE">Velvet Matte (+{formatCurrency(0.5)})</option>
                            <option value="LUSTRE">Crystal Luster (+{formatCurrency(0.8)})</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1">
                            Border Matting
                          </label>
                          <select
                            value={item.finish}
                            onChange={(e) => updateItem(item.id, { finish: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white/90 text-[#1A1816] text-xs font-serif rounded-[2px] border border-[#E8E2D8] focus:border-[#1A1816] outline-none"
                          >
                            <option value="BORDERLESS">Full Bleed (Borderless)</option>
                            <option value="WHITE_BORDER">Parchment White Border</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E2D8]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                            }
                            className="w-6 h-6 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] hover:border-[#1A1816] text-[#1A1816] flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs w-6 text-center text-[#1A1816] font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                            className="w-6 h-6 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] hover:border-[#1A1816] text-[#1A1816] flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#8C827A] block">
                            {formatCurrency(itemUnitPrice)} ea
                          </span>
                          <span className="font-serif text-base text-[#1A1816] font-medium">
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Sticky Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] block">
                      Commission Manifest
                    </span>
                    <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                      Atelier Summary
                    </h3>
                  </div>
                  <Badge variant="default" size="sm">
                    {totalPrintsCount} units
                  </Badge>
                </div>

                <div className="space-y-2 text-xs font-mono text-[#6B665F]">
                  <div className="flex justify-between">
                    <span>Curated Plates:</span>
                    <span className="text-[#1A1816]">{items.length} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Impressions:</span>
                    <span className="text-[#1A1816]">{totalPrintsCount} prints</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E8E2D8] pt-3 text-sm">
                    <span className="font-serif text-[#1A1816]">Print Subtotal:</span>
                    <span className="font-serif text-xl font-medium text-[#1A1816]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8C827A] pt-1 leading-relaxed font-sans italic">
                    Regional darkroom assignment, counter pickup vs. courier transit, and taxes will be confirmed in the checkout ledger.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E2D8]">
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleProceedToCheckout}
                  >
                    Proceed to Dispatch <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Quality Guarantee Note */}
              <div className="border border-[#E8E2D8] bg-[#F4F0E8]/50 p-4 rounded-[2px] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-serif text-sm text-[#1A1816]">
                  <FileCheck className="w-4 h-4 text-[#2D4F3E]" />
                  Darkroom Standards Guarantee
                </div>
                <p className="text-[#6B665F] text-[11px] leading-relaxed font-sans">
                  Digital plates are transmitted uncompressed. Certified technicians inspect emulsion and density prior to physical exposure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center font-serif">
          <p className="text-[#8C827A] font-mono text-xs uppercase tracking-widest">
            Opening Darkroom Atelier...
          </p>
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}

