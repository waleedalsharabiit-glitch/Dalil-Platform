
export const DEFAULT_MAP_CENTER: [number, number] = [
  15.3694,
  44.191,
];

export const DEFAULT_MAP_ZOOM = 6;

export const BUSINESS_MAP_ZOOM = 16;

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidCoordinates(
  latitude: number,
  longitude: number,
) {
  return (
    isValidLatitude(latitude) &&
    isValidLongitude(longitude)
  );
}

export function formatCoordinates(
  latitude: number,
  longitude: number,
) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
