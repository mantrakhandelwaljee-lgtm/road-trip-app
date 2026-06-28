const MOCK_PLACES = [
  { place_name: "Starbucks", latitude: 34.0522, longitude: -118.2437 },
  { place_name: "McDonald's", latitude: 34.0531, longitude: -118.2445 },
  { place_name: "Gas Station — Shell", latitude: 34.054, longitude: -118.245 },
  { place_name: "Gas Station — Chevron", latitude: 34.055, longitude: -118.246 },
  { place_name: "Rest Area — I-40 West", latitude: 34.056, longitude: -118.247 },
  { place_name: "In-N-Out Burger", latitude: 34.057, longitude: -118.248 },
  { place_name: "Walmart Supercenter", latitude: 34.058, longitude: -118.249 },
  { place_name: "Dunkin' Donuts", latitude: 34.059, longitude: -118.25 },
  { place_name: "Subway", latitude: 34.06, longitude: -118.251 },
  { place_name: "Taco Bell", latitude: 34.061, longitude: -118.252 },
  { place_name: "Pilot Travel Center", latitude: 34.062, longitude: -118.253 },
  { place_name: "Cracker Barrel", latitude: 34.063, longitude: -118.254 },
  { place_name: "Buc-ee's", latitude: 34.064, longitude: -118.255 },
  { place_name: "Love's Travel Stop", latitude: 34.065, longitude: -118.256 },
  { place_name: "Denny's", latitude: 34.066, longitude: -118.257 },
];

export function fetchPlaces(query, lat, lng) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return MOCK_PLACES.filter((place) =>
    place.place_name.toLowerCase().includes(normalized),
  ).map((place) => ({
    ...place,
    latitude: lat ?? place.latitude,
    longitude: lng ?? place.longitude,
  }));
}
