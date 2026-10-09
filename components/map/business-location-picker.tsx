
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import {
  Crosshair,
  MapPin,
  Navigation,
  Save,
  Loader2,
} from "lucide-react";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  formatCoordinates,
  isValidCoordinates,
} from "@/lib/map/map-utils";

interface BusinessLocationPickerProps {
  businessId: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onSaved?: (latitude: number, longitude: number) => void;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({
  coordinates,
}: {
  coordinates: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates) return;

    map.flyTo(
      [coordinates.latitude, coordinates.longitude],
      16,
      {
        duration: 0.8,
      },
    );
  }, [coordinates, map]);

  return null;
}

function LocationSelector({
  onSelect,
}: {
  onSelect: (coordinates: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function BusinessLocationPicker({
  businessId,
  initialLatitude,
  initialLongitude,
  onSaved,
}: BusinessLocationPickerProps) {
  const hasInitialLocation =
    typeof initialLatitude === "number" &&
    typeof initialLongitude === "number" &&
    isValidCoordinates(
      initialLatitude,
      initialLongitude,
    );

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(
      hasInitialLocation
        ? {
            latitude: initialLatitude!,
            longitude: initialLongitude!,
          }
        : null,
    );

  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const center: [number, number] = coordinates
    ? [
        coordinates.latitude,
        coordinates.longitude,
      ]
    : DEFAULT_MAP_CENTER;

  async function saveLocation() {
    if (!coordinates) {
      setError("اختر موقع النشاط على الخريطة أولاً.");
      return;
    }

    if (
      !isValidCoordinates(
        coordinates.latitude,
        coordinates.longitude,
      )
    ) {
      setError("إحداثيات الموقع غير صحيحة.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/businesses/${businessId}/location`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "تعذر حفظ موقع النشاط.",
        );
      }

      setMessage("تم حفظ موقع النشاط بنجاح.");

      onSaved?.(
        coordinates.latitude,
        coordinates.longitude,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ الموقع.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "المتصفح لا يدعم تحديد الموقع.",
      );
      return;
    }

    setIsLocating(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCoordinates(nextCoordinates);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError(
          "تعذر الحصول على موقعك. تأكد من السماح للمتصفح باستخدام الموقع.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl shadow-sky-100/40">
        <div className="border-b border-slate-100 bg-gradient-to-l from-sky-50 via-white to-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    موقع النشاط
                  </h2>

                  <p className="text-sm text-slate-500">
                    حدد موقع نشاطك بدقة على الخريطة
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}

              {isLocating
                ? "جاري تحديد موقعك..."
                : "استخدام موقعي الحالي"}
            </button>
          </div>
        </div>

        <div className="relative h-[420px] w-full sm:h-[500px]">
          <MapContainer
            center={center}
            zoom={
              coordinates
                ? 16
                : DEFAULT_MAP_ZOOM
            }
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <LocationSelector
              onSelect={setCoordinates}
            />

            <MapController
              coordinates={coordinates}
            />

            {coordinates && (
              <Marker
                position={[
                  coordinates.latitude,
                  coordinates.longitude,
                ]}
                icon={markerIcon}
                draggable
                eventHandlers={{
                  dragend: (event) => {
                    const marker =
                      event.target as L.Marker;

                    const position =
                      marker.getLatLng();

                    setCoordinates({
                      latitude: position.lat,
                      longitude: position.lng,
                    });
                  },
                }}
              />
            )}
          </MapContainer>

          <div className="pointer-events-none absolute left-4 top-4 z-[500]">
            <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-sky-500" />

                <span className="text-xs font-semibold text-slate-700">
                  اضغط على الخريطة لتحديد الموقع
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 p-5">
          {coordinates ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  الإحداثيات الحالية
                </p>

                <p
                  dir="ltr"
                  className="font-mono text-sm font-semibold text-slate-800"
                >
                  {formatCoordinates(
                    coordinates.latitude,
                    coordinates.longitude,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={saveLocation}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}

                {isSaving
                  ? "جاري الحفظ..."
                  : "حفظ الموقع"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <MapPin className="h-5 w-5 text-sky-500" />

              <span>
                لم يتم تحديد موقع النشاط بعد.
              </span>
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
