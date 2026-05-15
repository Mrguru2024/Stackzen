import { z } from 'zod';

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  notes?: string;
}

export interface TravelDetails {
  distance: number; // in kilometers
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes
  travelCost: number;
  suggestedPrice?: number;
  marketAnalysis?: MarketAnalysis;
}

export interface MarketAnalysis {
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  competitionLevel: 'low' | 'medium' | 'high';
  suggestedMarkup: number;
  profitMargin: number;
}

export interface TimeBasedRate {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  rate: number; // per kilometer
  baseFee: number;
  dayMultiplier?: number; // Multiplier for specific days
}

export interface DayRate {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  multiplier: number;
  isHoliday?: boolean;
}

export const dayRates: DayRate[] = [
  { day: 'monday', multiplier: 1.0 },
  { day: 'tuesday', multiplier: 1.0 },
  { day: 'wednesday', multiplier: 1.0 },
  { day: 'thursday', multiplier: 1.0 },
  { day: 'friday', multiplier: 1.2 }, // Higher rates for Friday
  { day: 'saturday', multiplier: 1.5 }, // Weekend rates
  { day: 'sunday', multiplier: 1.5 }, // Weekend rates
];

export const locationCategories = [
  'residential',
  'commercial',
  'industrial',
  'retail',
  'office',
  'medical',
  'educational',
  'other',
] as const;

export type LocationCategory = (typeof locationCategories)[number];

export const timeBasedRates: Record<string, TimeBasedRate[]> = {
  basic: [
    { startTime: '00:00', endTime: '06:00', rate: 0.5, baseFee: 20 },
    { startTime: '06:00', endTime: '18:00', rate: 0.4, baseFee: 15 },
    { startTime: '18:00', endTime: '00:00', rate: 0.6, baseFee: 25 },
  ],
  standard: [
    { startTime: '00:00', endTime: '06:00', rate: 0.6, baseFee: 25 },
    { startTime: '06:00', endTime: '18:00', rate: 0.5, baseFee: 20 },
    { startTime: '18:00', endTime: '00:00', rate: 0.7, baseFee: 30 },
  ],
  premium: [
    { startTime: '00:00', endTime: '06:00', rate: 0.7, baseFee: 30 },
    { startTime: '06:00', endTime: '18:00', rate: 0.6, baseFee: 25 },
    { startTime: '18:00', endTime: '00:00', rate: 0.8, baseFee: 35 },
  ],
};

// Market data simulation (in a real app, this would come from an API)
async function getMarketData(location: Location, _serviceType: string): Promise<MarketAnalysis> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // This is a simplified simulation. In a real app, you would:
  // 1. Call a real estate API to get property values
  // 2. Call a business API to get local business density
  // 3. Call a pricing API to get competitor rates
  // 4. Consider local economic indicators

  const _basePrice = 100; // Base price for the service
  const _locationFactor = location.city ? 1.2 : 1.0; // Cities tend to have higher rates
  const _competitionFactor = Math.random() * 0.4 + 0.8; // Random competition level
  const _timeFactor = new Date().getHours() < 18 ? 1.0 : 1.2; // Higher rates after hours

  const averagePrice = _basePrice * _locationFactor * _competitionFactor * _timeFactor;
  const priceRange = {
    min: averagePrice * 0.8,
    max: averagePrice * 1.2,
  };

  const competitionLevel =
    _competitionFactor < 0.9 ? 'low' : _competitionFactor < 1.1 ? 'medium' : 'high';
  const suggestedMarkup =
    competitionLevel === 'low' ? 1.3 : competitionLevel === 'medium' ? 1.2 : 1.1;
  const profitMargin = (suggestedMarkup - 1) * 100;

  return {
    averagePrice: averagePrice,
    priceRange: priceRange,
    competitionLevel: competitionLevel,
    suggestedMarkup: suggestedMarkup,
    profitMargin: profitMargin,
  };
}

export const addressFormatSchema = z.enum(['full', 'short', 'city-state', 'coordinates']);

export type AddressFormat = z.infer<typeof addressFormatSchema>;

export function formatAddress(location: Location, format: AddressFormat = 'full'): string {
  switch (format) {
    case 'short':
      return `${location.city}, ${location.state}`;
    case 'city-state':
      return `${location.city}, ${location.state} ${location.zipCode}`;
    case 'coordinates':
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    case 'full':
    default:
      return location.address;
  }
}

export function getCurrentTimeBasedRate(tier: keyof typeof timeBasedRates): TimeBasedRate {
  const _now = new Date();
  const _currentTime = `${_now.getHours().toString().padStart(2, '0')}:${_now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const _dayOfWeek = _now
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase() as DayRate['day'];
  const _dayRate = dayRates.find(d => d.day === _dayOfWeek) || dayRates[0];

  const rates = timeBasedRates[tier];
  const _timeRate =
    rates.find(rate => _currentTime >= rate.startTime && _currentTime < rate.endTime) || rates[0];

  return {
    ..._timeRate,
    dayMultiplier: _dayRate.multiplier,
  };
}

export async function calculateTravelDetails(
  origin: Location,
  destination: Location,
  tier: keyof typeof timeBasedRates,
  _serviceType = 'general'
): Promise<TravelDetails> {
  // Wait for Google Maps API to be available
  let attempts = 0;
  while (!window.google && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.google) {
    return {
      distance: 0,
      duration: 0,
      travelCost: 0,
    };
  }

  const service = new google.maps.DistanceMatrixService();
  const _currentRate = getCurrentTimeBasedRate(tier);
  const _marketData = await getMarketData(destination, _serviceType);

  return new Promise((resolve, _reject) => {
    service.getDistanceMatrix(
      {
        origins: [{ lat: origin.latitude, lng: origin.longitude }],
        destinations: [{ lat: destination.latitude, lng: destination.longitude }],
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const _element = response.rows[0].elements[0];
          const distance = _element.distance.value / 1000; // Convert to kilometers
          const duration = _element.duration.value / 60; // Convert to minutes
          const durationInTraffic = _element.duration_in_traffic?.value
            ? _element.duration_in_traffic.value / 60
            : undefined;

          const _baseTravelCost = _currentRate.baseFee + distance * _currentRate.rate;
          const travelCost = _baseTravelCost * (_currentRate.dayMultiplier || 1);
          const suggestedPrice = _marketData.averagePrice * _marketData.suggestedMarkup;

          resolve({
            distance: distance,
            duration: duration,
            durationInTraffic: durationInTraffic,
            travelCost: travelCost,
            suggestedPrice: suggestedPrice,
            marketAnalysis: _marketData,
          });
        } else {
          resolve({
            distance: 0,
            duration: 0,
            travelCost: 0,
          });
        }
      }
    );
  });
}

// Local storage keys
const _FAVORITE_LOCATIONS_KEY = 'favorite_locations';

export interface FavoriteLocation extends Location {
  category?: LocationCategory;
  notes?: string;
  lastUsed?: string;
  useCount?: number;
}

export function saveFavoriteLocation(location: FavoriteLocation): void {
  const _favorites = getFavoriteLocations();
  const _exists = _favorites.some(
    fav => fav.latitude === location.latitude && fav.longitude === location.longitude
  );

  if (!_exists) {
    _favorites.push({
      ...location,
      lastUsed: new Date().toISOString(),
      useCount: 1,
    });
  } else {
    const _index = _favorites.findIndex(
      fav => fav.latitude === location.latitude && fav.longitude === location.longitude
    );
    _favorites[_index] = {
      ..._favorites[_index],
      ...location,
      lastUsed: new Date().toISOString(),
      useCount: (_favorites[_index].useCount || 0) + 1,
    };
  }

  localStorage.setItem(_FAVORITE_LOCATIONS_KEY, JSON.stringify(_favorites));
}

export function getFavoriteLocations(): FavoriteLocation[] {
  const _stored = localStorage.getItem(_FAVORITE_LOCATIONS_KEY);
  return _stored ? JSON.parse(_stored) : [];
}

export function removeFavoriteLocation(location: Location): void {
  const _favorites = getFavoriteLocations();
  const _updated = _favorites.filter(
    fav => fav.latitude !== location.latitude || fav.longitude !== location.longitude
  );
  localStorage.setItem(_FAVORITE_LOCATIONS_KEY, JSON.stringify(_updated));
}

export function getFavoriteLocationsByCategory(category: LocationCategory): FavoriteLocation[] {
  return getFavoriteLocations().filter(loc => loc.category === category);
}

export function getMostUsedLocations(limit = 5): FavoriteLocation[] {
  return getFavoriteLocations()
    .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
    .slice(0, limit);
}

export function getRecentlyUsedLocations(limit = 5): FavoriteLocation[] {
  return getFavoriteLocations()
    .sort((a, b) => {
      const _dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const _dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return _dateB - _dateA;
    })
    .slice(0, limit);
}
