'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, AlertCircle, Check } from 'lucide-react';
import { Button } from './Button';

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  label?: string;
  defaultCity?: string;
}

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 }; // Kathmandu Valley Default

export function LocationPicker({
  lat,
  lng,
  onChange,
  label = 'Delivery Pinpoint Location',
  defaultCity = 'Kathmandu',
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const currentCoords = {
    lat: lat && !isNaN(lat) ? lat : DEFAULT_CENTER.lat,
    lng: lng && !isNaN(lng) ? lng : DEFAULT_CENTER.lng,
  };

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const newLat = parseFloat(position.coords.latitude.toFixed(6));
        const newLng = parseFloat(position.coords.longitude.toFixed(6));
        onChange(newLat, newLng);
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === 1
            ? 'Location access denied. Please click on the map or input coordinates.'
            : 'Unable to retrieve precise GPS fix. Please select on map.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] flex items-center gap-1.5 font-bold">
          <MapPin className="w-3.5 h-3.5 text-[#1A1816]" /> {label}
        </label>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-[#F4F0E8] hover:bg-[#E8E2D8] text-[#1A1816] rounded-[2px] border border-[#E8E2D8] transition-colors"
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Detect My Location'}</span>
        </button>
      </div>

      {locationError && (
        <div className="text-[10px] font-mono text-[#A3432B] bg-[#FAF1F1] border border-[#E8C7C8] p-2 rounded-[2px] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Map or Fallback Container */}
      <div className="relative rounded-[2px] border border-[#E8E2D8] bg-[#F4F0E8] overflow-hidden">
        {apiKey ? (
          <div style={{ height: '240px', width: '100%', position: 'relative' }}>
            <APIProvider apiKey={apiKey}>
              <Map
                style={{ width: '100%', height: '100%' }}
                defaultCenter={currentCoords}
                center={currentCoords}
                defaultZoom={15}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                gestureHandling="greedy"
                disableDefaultUI={false}
                onClick={(e) => {
                  if (e.detail.latLng) {
                    onChange(
                      parseFloat(e.detail.latLng.lat.toFixed(6)),
                      parseFloat(e.detail.latLng.lng.toFixed(6))
                    );
                  }
                }}
              >
                <AdvancedMarker
                  position={currentCoords}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      onChange(
                        parseFloat(e.latLng.lat().toFixed(6)),
                        parseFloat(e.latLng.lng().toFixed(6))
                      );
                    }
                  }}
                >
                  <Pin background="#1A1816" glyphColor="#FAF8F5" borderColor="#FAF8F5" />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
        ) : (
          /* Graceful Fallback when Google Maps API key is not yet provided */
          <div className="p-4 bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
              <span className="font-mono text-[10px] text-[#8C827A] uppercase tracking-wider">
                Geographic Coordinates
              </span>
              <span className="font-mono text-[10px] text-[#2D4A3E] bg-[#F4F8F4] border border-[#CEE0CF] px-2 py-0.5 rounded-[1px] flex items-center gap-1">
                <Compass className="w-3 h-3" />
                {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° E
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase text-[#8C827A] block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat ?? ''}
                  onChange={(e) =>
                    onChange(parseFloat(e.target.value) || 0, lng || DEFAULT_CENTER.lng)
                  }
                  placeholder="27.7172"
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-[2px] border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#1A1816]"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase text-[#8C827A] block mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lng ?? ''}
                  onChange={(e) =>
                    onChange(lat || DEFAULT_CENTER.lat, parseFloat(e.target.value) || 0)
                  }
                  placeholder="85.3240"
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-[2px] border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#1A1816]"
                />
              </div>
            </div>

            <div className="text-[10px] font-serif italic text-[#8C827A] flex items-center justify-between pt-1">
              <span>Click "Detect My Location" above to auto-pin with your device GPS.</span>
            </div>
          </div>
        )}

        {/* Selected Coordinates Chip */}
        {lat && lng ? (
          <div className="px-3 py-1.5 bg-[#FAF8F5] border-t border-[#E8E2D8] flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#8C827A]">Pinned Delivery Coordinates:</span>
            <span className="font-semibold text-[#1A1816]">
              {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
