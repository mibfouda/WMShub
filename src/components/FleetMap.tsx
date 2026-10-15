import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Bin, Driver, DriverLoc, BinState } from "@/lib/wm";

const COLORS: Record<BinState, string> = {
  collected: "var(--status-collected)",
  pending: "var(--status-pending)",
  failed: "var(--status-failed)",
  none: "var(--muted-foreground)",
};

export default function FleetMap({
  bins,
  states,
  drivers,
  locations,
  onAssign,
}: {
  bins: Bin[];
  states: Map<number, BinState>;
  drivers: Driver[];
  locations: DriverLoc[];
  onAssign: (binId: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const assignRef = useRef(onAssign);
  assignRef.current = onAssign;

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([23.58, 58.38], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g || !map.current) return;
    g.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const b of bins) {
      const st = states.get(b.bin_id) ?? "none";
      const icon = L.divIcon({
        className: "",
        html: `<div class="bin-marker" style="--c:${COLORS[st]}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const div = document.createElement("div");
      div.className = "map-popup";
      div.innerHTML = `<strong>${b.bin_code}</strong><span>${b.address_description ?? ""}</span><em data-s="${st}">${st === "none" ? "No task" : st}</em>`;
      const btn = document.createElement("button");
      btn.textContent = "Assign to driver";
      btn.onclick = () => assignRef.current(b.bin_id);
      div.appendChild(btn);
      L.marker([b.latitude, b.longitude], { icon }).bindPopup(div).addTo(g);
      pts.push([b.latitude, b.longitude]);
    }
    for (const l of locations) {
      const d = drivers.find((x) => x.driver_id === l.driver_id);
      const icon = L.divIcon({
        className: "",
        html: `<div class="truck-marker"><i><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></i><span>${d?.truck_number ?? "Truck"}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([l.latitude, l.longitude], { icon, zIndexOffset: 1000 })
        .bindPopup(`<div class="map-popup"><strong>${d?.truck_number ?? "Truck"}</strong><span>Driver: ${d?.username ?? l.driver_id}</span><span>Last seen: ${new Date(l.timestamp).toLocaleString()}</span></div>`)
        .addTo(g);
      pts.push([l.latitude, l.longitude]);
    }
    if (!fitted.current && pts.length) {
      map.current.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
      fitted.current = true;
    }
  }, [bins, states, drivers, locations]);

  return <div ref={el} className="h-full w-full rounded-xl" />;
}
