'use client';

import React, { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/app/hooks/useGoogleMaps';

interface LocationMapProps {
  serviceLocation: string;
  contractorLocation: string;
  className?: string;
}

export default function LocationMap({
  serviceLocation,
  contractorLocation,
  className = '',
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const { isLoaded, hasError, error } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 0, lng: 0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    const map = mapInstanceRef.current;
    const markers: google.maps.Marker[] = [];

    // Clear existing markers and directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    // Initialize directions service and renderer if needed
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
      });
    }

    // Geocode locations and show route
    const geocoder = new google.maps.Geocoder();
    const geocodePromises = [serviceLocation, contractorLocation].map(
      address =>
        new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed for ${address}: ${status}`));
            }
          });
        })
    );

    Promise.all(geocodePromises)
      .then(([serviceResult, contractorResult]) => {
        // Add markers
        const serviceMarker = new google.maps.Marker({
          position: serviceResult.geometry.location,
          map,
          title: 'Service Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4F46E5',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        const contractorMarker = new google.maps.Marker({
          position: contractorResult.geometry.location,
          map,
          title: 'Contractor Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        markers.push(serviceMarker, contractorMarker);

        // Show route
        if (directionsServiceRef.current && directionsRendererRef.current) {
          directionsServiceRef.current.route(
            {
              origin: serviceResult.geometry.location,
              destination: contractorResult.geometry.location,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK' && result) {
                directionsRendererRef.current?.setDirections(result);
                // Fit bounds to show both markers and route
                result.routes[0].bounds.extend(serviceResult.geometry.location);
                result.routes[0].bounds.extend(contractorResult.geometry.location);
                map.fitBounds(result.routes[0].bounds);
              } else {
                console.error('Directions request failed:', status);
              }
            }
          );
        }
      })
      .catch(error => {
        console.error('Error geocoding locations:', error);
      });

    return () => {
      // Cleanup markers
      markers.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [isLoaded, serviceLocation, contractorLocation]);

  if (hasError) {
    return (
      <div className={`rounded-lg bg-red-50 p-4 text-red-700 ${className}`}>
        <p>Failed to load map: {error?.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`rounded-lg bg-gray-50 p-4 text-gray-700 ${className}`}>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`h-[300px] w-full rounded-lg ${className}`}
      role="img"
      aria-label="Map showing service and contractor locations"
    />
  );
}
