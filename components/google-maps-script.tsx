'use client';

import React from 'react';

import Script from 'next/script';

export default function GoogleMapsScript() {
  return (
    <Script
      id="google-maps"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`}
      strategy="lazyOnload"
      onLoad={() => {
        window.dispatchEvent(new CustomEvent('google-maps-loaded'));
      }}
      onError={e => {
        window.dispatchEvent(new CustomEvent('google-maps-error'));
        console.error('Error loading Google Maps:', e);
      }}
    />
  );
}
