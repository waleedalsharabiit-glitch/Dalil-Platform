
"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";

import {
  ExternalLink,
  MapPin,
} from "lucide-react";

interface BusinessLocationMapProps {
  latitude: number;
  longitude: number;
  businessName: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
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

export default function BusinessLocationMap({
  latitude,
  longitude,
  businessName,
  address,
  city,
  district,
}: BusinessLocationMapProps) {
  const addressParts = [
    address,
    district,
    city,
  ].filter(Boolean);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl shadow-sky-100/40">
      <div className="border-b border-slate-100 bg-gradient-to-l from-sky-50 via-white to-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-slate-900">
              موقع النشاط
            </h2>

            {addressParts.length > 0 && (
              <p className="mt-1 text-sm text-slate-500">
                {addressParts.join("، ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full sm:h-[430px]">
        <MapContainer
          center={[
            latitude,
            longitude,
          ]}
          zoom={16}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <Marker
            position={[
              latitude,
              longitude,
            ]}
            icon={markerIcon}
          >
            <Popup>
              <div
                dir="rtl"
                className="min-w-[180px] text-right"
              >
                <p className="font-bold text-slate-900">
                  {businessName}
                </p>

                {addressParts.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {addressParts.join("، ")}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 p-4">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
        >
          <ExternalLink className="h-4 w-4" />
          فتح الموقع في الخرائط
        </a>
      </div>
    </div>
  );
}
