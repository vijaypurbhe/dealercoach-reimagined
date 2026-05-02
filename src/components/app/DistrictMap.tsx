import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { DEALERS } from "@/data/dealers";
import { computeHealth, latest } from "@/data/health";
import { cn } from "@/lib/utils";

// Approximate lat/lng for the demo dealer cities
const COORDS: Record<string, { lat: number; lng: number }> = {
  "Long Beach": { lat: 33.77, lng: -118.19 },
  Phoenix: { lat: 33.45, lng: -112.07 },
  Denver: { lat: 39.74, lng: -104.99 },
  "Kansas City": { lat: 39.1, lng: -94.58 },
  Chicago: { lat: 41.88, lng: -87.63 },
  Tampa: { lat: 27.95, lng: -82.46 },
  Edison: { lat: 40.52, lng: -74.41 },
  Charleston: { lat: 32.78, lng: -79.93 },
};

// Bounding box of continental US
const BBOX = { minLng: -125, maxLng: -66, minLat: 24, maxLat: 50 };

function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * w;
  const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * h;
  return { x, y };
}

export function DistrictMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const W = 900;
  const H = 460;

  const points = useMemo(() => {
    return DEALERS.map((d) => {
      const c = COORDS[d.city];
      if (!c) return null;
      const p = project(c.lat, c.lng, W, H);
      const h = computeHealth(d);
      const last = latest(d);
      return { dealer: d, x: p.x, y: p.y, health: h, csi: last.csi };
    }).filter(Boolean) as Array<{ dealer: (typeof DEALERS)[number]; x: number; y: number; health: ReturnType<typeof computeHealth>; csi: number }>;
  }, []);

  const colorFor = (s: string) =>
    s === "attention" ? "oklch(0.58 0.22 27)" : s === "watch" ? "oklch(0.78 0.16 78)" : "oklch(0.66 0.16 152)";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">District map</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Dealers colored by health · hover to preview, click to open.
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend color="oklch(0.66 0.16 152)" label="On track" />
          <Legend color="oklch(0.78 0.16 78)" label="Watch" />
          <Legend color="oklch(0.58 0.22 27)" label="Attention" />
        </div>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="bgFade" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="oklch(0.97 0.012 256)" />
              <stop offset="100%" stopColor="oklch(0.93 0.018 256)" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.88 0.012 256)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#bgFade)" />
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Region bands */}
          {[
            { x1: 0, x2: W * 0.38, label: "WEST" },
            { x1: W * 0.38, x2: W * 0.7, label: "CENTRAL" },
            { x1: W * 0.7, x2: W, label: "EAST" },
          ].map((band) => (
            <g key={band.label}>
              <line x1={band.x2} y1={0} x2={band.x2} y2={H} stroke="oklch(0.85 0.012 256)" strokeDasharray="4 6" />
              <text
                x={(band.x1 + band.x2) / 2}
                y={24}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                letterSpacing={2}
                fill="oklch(0.6 0.03 258)"
              >
                {band.label}
              </text>
            </g>
          ))}

          {points.map((p) => {
            const r = 10 + (p.csi - 85) * 0.6;
            const radius = Math.max(7, Math.min(16, r));
            const isHover = hovered === p.dealer.id;
            return (
              <g key={p.dealer.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={radius + 8}
                  fill={colorFor(p.health.status)}
                  opacity={isHover ? 0.25 : 0.12}
                  className="transition-opacity"
                />
                <Link to={`/dealers/${p.dealer.id}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={colorFor(p.health.status)}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-transform"
                    style={{ transform: isHover ? `scale(1.1)` : undefined, transformOrigin: `${p.x}px ${p.y}px` }}
                    onMouseEnter={() => setHovered(p.dealer.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                </Link>
                <text
                  x={p.x}
                  y={p.y + radius + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={500}
                  fill="oklch(0.3 0.03 258)"
                  pointerEvents="none"
                >
                  {p.dealer.city}
                </text>
                {isHover && (
                  <g pointerEvents="none">
                    <rect
                      x={p.x + 14}
                      y={p.y - 38}
                      width={210}
                      height={56}
                      rx={8}
                      fill="white"
                      stroke="oklch(0.88 0.012 256)"
                    />
                    <text x={p.x + 24} y={p.y - 20} fontSize={11} fontWeight={600} fill="oklch(0.2 0.03 258)">
                      {p.dealer.name}
                    </text>
                    <text x={p.x + 24} y={p.y - 6} fontSize={10} fill="oklch(0.5 0.03 258)">
                      Health {p.health.score} · CSI {p.csi.toFixed(1)}% · {p.dealer.sizeBand}
                    </text>
                    <text x={p.x + 24} y={p.y + 8} fontSize={10} fill="oklch(0.5 0.03 258)">
                      Click to open coaching view →
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
