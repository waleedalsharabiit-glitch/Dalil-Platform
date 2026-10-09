"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Crosshair,
} from "lucide-react";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/lib/map/map-utils";

interface BusinessMapItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  city: string | null;
  district: string | null;
  address: string | null;
  image: string | null;
  categories: string[];
}

interface UserLocation {
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

function getDistanceKm(
  pointA: UserLocation,
  pointB: UserLocation,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLng = toRadians(pointB.longitude - pointA.longitude);

  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function MapFlyController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1,
    });
  }, [center, zoom, map]);

  return null;
}

function UserLocationController() {
  const map = useMap();

  useEffect(() => {
    function handleLocation(event: Event) {
      const customEvent = event as CustomEvent<UserLocation>;
      const { latitude, longitude } = customEvent.detail ?? {};

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return;
      }

      map.flyTo([latitude, longitude], 15, {
        duration: 1,
      });
    }

    window.addEventListener(
      "dalil-user-location",
      handleLocation,
    );

    return () => {
      window.removeEventListener(
        "dalil-user-location",
        handleLocation,
      );
    };
  }, [map]);

  return null;
}

export default function BusinessesMap() {
  const [businesses, setBusinesses] = useState<BusinessMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(
    null,
  );
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    DEFAULT_MAP_CENTER,
  );
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const response = await fetch("/api/map/businesses", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || "تعذر تحميل الأنشطة على الخريطة.",
          );
        }

        setBusinesses(data.businesses ?? []);
      } catch (error) {
        console.error("Failed to load businesses map data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          businesses.flatMap((business) => business.categories),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [businesses],
  );

  const filteredBusinesses = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase().replace(/\s+/g, " ");

    return businesses.filter((business) => {
      const matchesSearch =
        !normalizedTerm ||
        [
          business.name,
          business.slug,
          business.description,
          business.city,
          business.district,
          business.address,
          ...business.categories,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().replace(/\s+/g, " ").includes(normalizedTerm),
          );

      const matchesCategory =
        selectedCategory === "الكل" ||
        business.categories.includes(selectedCategory);

      let matchesNearby = true;

      if (nearbyOnly && userLocation) {
        const distanceKm = getDistanceKm(userLocation, {
          latitude: business.latitude,
          longitude: business.longitude,
        });

        matchesNearby = distanceKm <= 25;
      }

      return matchesSearch && matchesCategory && matchesNearby;
    });
  }, [businesses, nearbyOnly, searchTerm, selectedCategory, userLocation]);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("المتصفح لا يدعم تحديد الموقع الحالي.");
      return;
    }

    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setMapCenter([nextLocation.latitude, nextLocation.longitude]);
        setMapZoom(12);

        window.dispatchEvent(
          new CustomEvent("dalil-user-location", {
            detail: nextLocation,
          }),
        );
      },
      () => {
        setLocationError(
          "تعذر الحصول على موقعك الحالي. تأكد من السماح باستخدام الموقع في المتصفح.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  function resetMapCenter() {
    setNearbyOnly(false);
    setMapCenter(DEFAULT_MAP_CENTER);
    setMapZoom(DEFAULT_MAP_ZOOM);
  }

  return (
    <div className="relative h-[calc(100vh-64px)] min-h-[650px] w-full overflow-hidden bg-sky-50">
      <div className="absolute left-4 top-4 z-[500] flex w-[min(360px,calc(100%-2rem))] flex-col gap-3">
        <div className="rounded-3xl border border-white/90 bg-white/90 p-3 shadow-xl shadow-sky-100 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث عن نشاط أو خدمة أو منطقة..."
              className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-300"
            >
              <option value="الكل">الكل</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-3 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600"
            >
              <LocateFixed className="h-4 w-4" />
              قريب مني
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetMapCenter}
            className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/90 px-3 py-2 text-sm font-bold text-slate-700 shadow-md shadow-slate-100 backdrop-blur transition hover:bg-white"
          >
            <Crosshair className="h-4 w-4" />
            إعادة المركز
          </button>

          <button
            type="button"
            onClick={() => {
              if (!userLocation) {
                handleUseCurrentLocation();
                return;
              }

              setNearbyOnly((previous) => !previous);
              setMapCenter([userLocation.latitude, userLocation.longitude]);
              setMapZoom(12);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 shadow-md shadow-emerald-100 transition hover:bg-emerald-100"
          >
            <MapPin className="h-4 w-4" />
            تصفح القريب مني
          </button>
        </div>

        {locationError && (
          <div className="max-w-xs rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm">
            {locationError}
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 z-[450] flex items-center justify-center bg-sky-50/80 backdrop-blur-sm">
          <div className="rounded-3xl border border-sky-100 bg-white px-7 py-5 shadow-xl">
            <p className="text-sm font-bold text-sky-600">
              جاري تجهيز الخريطة...
            </p>
          </div>
        </div>
      )}

      {!loading && filteredBusinesses.length === 0 && (
        <div className="absolute inset-x-0 bottom-5 z-[450] flex justify-center px-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/90 px-4 py-3 text-sm font-bold text-slate-500 shadow-lg backdrop-blur-sm">
            لا توجد أنشطة تطابق البحث الحالي.
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapFlyController center={mapCenter} zoom={mapZoom} />
        <UserLocationController />

        {filteredBusinesses.map((business) => (
          <Marker
            key={business.id}
            position={[business.latitude, business.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="w-[260px] space-y-3 text-right">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-sky-50 text-sky-600">
                    {business.image ? (
                      <img
                        src={business.image}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800">
                      {business.name}
                    </p>

                    {business.isVerified && (
                      <p className="mt-0.5 text-[10px] font-bold text-sky-600">
                        نشاط موثق
                      </p>
                    )}
                  </div>
                </div>

                {business.description && (
                  <p className="line-clamp-3 text-xs leading-6 text-slate-500">
                    {business.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {business.categories.slice(0, 2).map((category) => (
                    <span
                      key={`${business.id}-${category}`}
                      className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
                  {business.city || business.district || business.address || "موقع النشاط"}
                </div>

                <Link
                  href={`/businesses/${business.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-black text-sky-600 transition hover:text-sky-700"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  عرض التفاصيل
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

