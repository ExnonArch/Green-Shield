import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { BAND_LABEL } from "@/lib/gs/scoring";
import type { GeoLocation, SeverityBand } from "@/lib/gs/types";
import { locationLabel } from "@/lib/gs/format";

const SEV_VAR: Record<SeverityBand, string> = {
  low: "--color-sev-1",
  moderate: "--color-sev-2",
  elevated: "--color-sev-3",
  high: "--color-sev-4",
  severe: "--color-sev-5",
};

function markerIcon(band: SeverityBand | undefined) {
  const color = `var(${SEV_VAR[band ?? "moderate"]})`;
  return L.divIcon({
    className: "gs-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px color-mix(in oklab, ${color} 28%, transparent), 0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function Recenter({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom, { animate: true });
  }, [lat, lon, zoom, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick?: (lat: number, lon: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onPick) return;
    const handler = (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onPick]);
  return null;
}

export default function MapView({
  location,
  band,
  zoom = 10,
  onPick,
  markers = [],
}: {
  location: GeoLocation;
  band?: SeverityBand;
  zoom?: number;
  onPick?: (lat: number, lon: number) => void;
  markers?: Array<{ location: GeoLocation; band?: SeverityBand; score?: number }>;
}) {
  const icon = useMemo(() => markerIcon(band), [band]);

  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={zoom}
      scrollWheelZoom
      className="size-full"
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Recenter lat={location.latitude} lon={location.longitude} zoom={zoom} />
      <ClickHandler onPick={onPick} />
      <Marker position={[location.latitude, location.longitude]} icon={icon} title={locationLabel(location)} />
      {markers
        .filter((m) => m.location.id !== location.id)
        .map((m) => (
          <Marker
            key={m.location.id}
            position={[m.location.latitude, m.location.longitude]}
            icon={markerIcon(m.band)}
            title={`${locationLabel(m.location)}${m.band ? ` — ${BAND_LABEL[m.band]}` : ""}`}
            eventHandlers={onPick ? { click: () => onPick(m.location.latitude, m.location.longitude) } : undefined}
          />
        ))}
    </MapContainer>
  );
}
