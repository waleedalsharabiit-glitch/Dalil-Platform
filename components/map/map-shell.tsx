
"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/lib/map/map-utils";

interface MapShellProps {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

export default function MapShell({
  center,
  zoom,
  children,
  className = "",
}: MapShellProps) {
  const mapCenter = useMemo(
    () => center ?? DEFAULT_MAP_CENTER,
    [center],
  );

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom ?? DEFAULT_MAP_ZOOM}
      scrollWheelZoom
      className={`h-full w-full ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {children}
    </MapContainer>
  );
}
