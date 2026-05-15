'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Star, StarOff, Edit2, X } from 'lucide-react';
import {
  formatAddress,
  saveFavoriteLocation,
  removeFavoriteLocation,
  getFavoriteLocations,
  AddressFormat,
  LocationCategory,
  locationCategories,
  FavoriteLocation,
} from '@/lib/location-utils';

interface AddressInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (
    address: string,
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    zipCode?: string
  ) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
  showFavorites?: boolean;
  addressFormat?: AddressFormat;
}

export default function AddressInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter address...',
  className = '',
  required = false,
  error,
  showFavorites = true,
  addressFormat = 'full',
}: AddressInputProps) {
  const _containerRef = useRef<HTMLDivElement>(null);
  const _inputRef = useRef<HTMLInputElement>(null);
  const _autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<FavoriteLocation | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavoriteForm, setShowFavoriteForm] = useState(false);
  const [favoriteCategory, setFavoriteCategory] = useState<LocationCategory>('residential');
  const [favoriteNotes, setFavoriteNotes] = useState('');

  useEffect(() => {
    if (showFavorites) {
      setFavorites(getFavoriteLocations());
    }
  }, [showFavorites]);

  useEffect(() => {
    if (!window.google || !_inputRef.current) return;

    // Initialize the Autocomplete
    _autocompleteRef.current = new window.google.maps.places.Autocomplete(_inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'geometry', 'formatted_address'],
    });

    // Add place_changed listener
    _autocompleteRef.current.addListener('place_changed', () => {
      const _place = _autocompleteRef.current?.getPlace();
      if (!_place?.geometry?.location) {
        setIsValid(false);
        return;
      }

      setIsLoading(true);
      // Extract address components
      let city = '';
      let state = '';
      let zipCode = '';
      _place.address_components?.forEach((component: any) => {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      });

      // Create location object
      const location: FavoriteLocation = {
        address: _place.formatted_address || '',
        latitude: _place.geometry.location.lat(),
        longitude: _place.geometry.location.lng(),
        city,
        state,
        zipCode,
      };

      setCurrentLocation(location);
      setIsValid(true);
      setIsLoading(false);
      setIsFavorite(
        favorites.some(
          fav => fav.latitude === location.latitude && fav.longitude === location.longitude
        )
      );
      onChange(
        _place.formatted_address || '',
        _place.geometry.location.lat(),
        _place.geometry.location.lng(),
        city,
        state,
        zipCode
      );
      console.log('[AddressInput] Place selected:', location);
    });

    // Cleanup
    return () => {
      if (_autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(_autocompleteRef.current);
      }
    };
  }, [favorites, onChange]);

  const _handleFavoriteToggle = () => {
    if (!currentLocation) return;

    if (isFavorite) {
      removeFavoriteLocation(currentLocation);
      setFavorites(
        favorites.filter(
          fav =>
            fav.latitude !== currentLocation.latitude || fav.longitude !== currentLocation.longitude
        )
      );
      setIsFavorite(false);
    } else {
      setShowFavoriteForm(true);
    }
  };

  const _handleSaveFavorite = () => {
    if (!currentLocation) return;

    const favoriteLocation: FavoriteLocation = {
      ...currentLocation,
      category: favoriteCategory,
      notes: favoriteNotes,
    };

    saveFavoriteLocation(favoriteLocation);
    setFavorites([...favorites, favoriteLocation]);
    setIsFavorite(true);
    setShowFavoriteForm(false);
    setFavoriteNotes('');
  };

  const _handleFavoriteSelect = (location: FavoriteLocation) => {
    setCurrentLocation(location);
    setIsFavorite(true);
    onChange(
      location.address,
      location.latitude,
      location.longitude,
      location.city,
      location.state,
      location.zipCode
    );
  };

  // Helper: Geocode an address string and call onChange with coordinates
  const _geocodeAddress = (address: string) => {
    if (!window.google || !address) return;
    setIsLoading(true);
    const _geocoder = new window.google.maps.Geocoder();
    _geocoder.geocode(
      {
        address,
        componentRestrictions: {
          country: 'us',
        },
      },
      (results: any, status: any) => {
        setIsLoading(false);
        if (status === 'OK' && results && results[0]) {
          const _loc = results[0].geometry.location;
          let city = '',
            state = '',
            zipCode = '';
          results[0].address_components?.forEach((component: any) => {
            const types = component.types;
            if (types.includes('locality')) city = component.long_name;
            else if (types.includes('administrative_area_level_1')) state = component.short_name;
            else if (types.includes('postal_code')) zipCode = component.long_name;
          });
          setIsValid(true);
          setCurrentLocation({
            address: results[0].formatted_address,
            latitude: _loc.lat(),
            longitude: _loc.lng(),
            city,
            state,
            zipCode,
          });
          setIsFavorite(
            favorites.some(fav => fav.latitude === _loc.lat() && fav.longitude === _loc.lng())
          );
          onChange(results[0].formatted_address, _loc.lat(), _loc.lng(), city, state, zipCode);
          console.log(
            '[AddressInput] Geocoded address:',
            address,
            'Lat:',
            _loc.lat(),
            'Lng:',
            _loc.lng()
          );
        } else {
          setIsValid(false);
          console.log('[AddressInput] Failed to geocode address:', address, 'Status:', status);
        }
      }
    );
  };

  const _ariaInvalid = isValid === false ? 'true' : 'false';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div ref={_containerRef} className="relative">
        <input
          ref={_inputRef}
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          className={`w-full rounded border p-2 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
            isValid === false ? 'border-red-500' : isValid ? 'border-green-500' : 'border-gray-300'
          }`}
          onChange={e => {
            setIsValid(null);
            // Don't reset coordinates here, let the autocomplete handle it
            onChange(e.target.value, 0, 0);
          }}
          onBlur={e => {
            // Only geocode if we don't have valid coordinates and the address isn't empty
            if (!isValid && e.target.value.trim()) {
              _geocodeAddress(e.target.value);
            }
          }}
          required={required}
          {...(isValid === false ? { 'aria-invalid': 'true' } : {})}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : isValid ? (
            <>
              {showFavorites && (
                <button
                  type="button"
                  onClick={_handleFavoriteToggle}
                  className="text-gray-400 transition-colors hover:text-yellow-500"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? (
                    <Star className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <StarOff className="h-5 w-5" />
                  )}
                </button>
              )}
              <CheckCircle className="h-5 w-5 text-green-500" />
            </>
          ) : isValid === false ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : null}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}

      {showFavoriteForm && (
        <div className="favorite-form">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium">Add to Favorites</h4>
            <button
              type="button"
              onClick={() => setShowFavoriteForm(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Close favorite form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Category</label>
              <select
                value={favoriteCategory}
                onChange={e => setFavoriteCategory(e.target.value as LocationCategory)}
                className="w-full rounded border p-2 text-sm"
                title="Select location category"
                aria-label="Location category"
              >
                {locationCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Notes</label>
              <textarea
                value={favoriteNotes}
                onChange={e => setFavoriteNotes(e.target.value)}
                placeholder="Add notes about this location..."
                className="w-full rounded border p-2 text-sm"
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={_handleSaveFavorite}
              className="w-full rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              Save Favorite
            </button>
          </div>
        </div>
      )}

      {showFavorites && favorites.length > 0 && (
        <div className="favorites-list">
          {favorites.map((location, index) => (
            <div
              key={index}
              className="favorite-item"
              onClick={() => _handleFavoriteSelect(location)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{formatAddress(location, addressFormat)}</div>
                  {location.category && (
                    <div className="text-xs text-gray-500">
                      {location.category.charAt(0).toUpperCase() + location.category.slice(1)}
                    </div>
                  )}
                  {location.notes && (
                    <div className="mt-1 text-xs text-gray-600">{location.notes}</div>
                  )}
                </div>
                <Star className="h-4 w-4 flex-shrink-0 text-yellow-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isValid === false && (
        <div className="mt-1 text-xs text-red-600">
          Could not find this address. Please check and try again.
        </div>
      )}
    </div>
  );
}
