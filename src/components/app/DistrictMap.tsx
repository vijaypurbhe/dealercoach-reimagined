import { Link } from "react-router-dom";
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { DEALERS } from "@/data/dealers";
import { computeHealth, latest } from "@/data/health";

const COORDS: Record<string, [number, number]> = {
  "Long Beach": [-118.19, 33.77],
  Phoenix: [-112.07, 33.45],
  Denver: [-104.99, 39.74],
  "Kansas City": [-94.58, 39.1],
  Chicago: [-87.63, 41.88],
  Tampa: [-82.46, 27.95],
  Edison: [-74.41, 40.52],
  Charleston: [-79.93, 32.78],
};

const GEO_URL = "/us-states.json";

const colorFor = (s: string) =>
  s === "attention" ? "oklch(0.58 0.22 27)" : s === "watch" ? "oklch(0.78 0.16 78)" : "oklch(0.66 0.16 152)";

export function DistrictMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const points = DEALERS.map((d) => {
    const c = COORDS[d.city];
    if (!c) return null;
    const h = computeHealth(d);
    const last = latest(d);
    return { dealer: d, coords: c, health: h, csi: last.csi };
  }).filter(Boolean) as Array<{
    dealer: (typeof DEALERS)[number];
    coords: [number, number];
    health: ReturnType<typeof computeHealth>;
    csi: number;
  }>;

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

      <div className="relative w-full">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={900}
          height={500}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="oklch(0.96 0.012 256)"
                  stroke="oklch(0.85 0.012 256)"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "oklch(0.94 0.012 256)" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {points.map((p) => {
            const isHover = hovered === p.dealer.id;
            const r = Math.max(7, Math.min(14, 9 + (p.csi - 88) * 0.6));
            return (
              <ProjectedMarker key={p.dealer.id} coordinates={p.coords}>
                {(x, y) => (
                  <g>
                    <circle cx={x} cy={y} r={r + 8} fill={colorFor(p.health.status)} opacity={isHover ? 0.3 : 0.15} />
                    <Link to={`/dealers/${p.dealer.id}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={r}
                        fill={colorFor(p.health.status)}
                        stroke="white"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onMouseEnter={() => setHovered(p.dealer.id)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    </Link>
                    <text
                      x={x}
                      y={y + r + 11}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={600}
                      fill="oklch(0.3 0.03 258)"
                      pointerEvents="none"
                      style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 3 }}
                    >
                      {p.dealer.city}
                    </text>
                    {isHover && (
                      <g pointerEvents="none">
                        <rect
                          x={x + 12}
                          y={y - 42}
                          width={230}
                          height={56}
                          rx={6}
                          fill="white"
                          stroke="oklch(0.85 0.012 256)"
                          filter="drop-shadow(0 4px 8px rgb(0 0 0 / 0.08))"
                        />
                        <text x={x + 22} y={y - 24} fontSize={11} fontWeight={600} fill="oklch(0.2 0.03 258)">
                          {p.dealer.name}
                        </text>
                        <text x={x + 22} y={y - 10} fontSize={10} fill="oklch(0.5 0.03 258)">
                          Health {p.health.score} · CSI {p.csi.toFixed(1)}% · {p.dealer.sizeBand}
                        </text>
                        <text x={x + 22} y={y + 4} fontSize={10} fill="oklch(0.45 0.18 258)">
                          Click to open coaching view →
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </ProjectedMarker>
            );
          })}
        </ComposableMap>
      </div>
    </div>
  );
}

// react-simple-maps' <Marker> handles projection internally, but we need the projected
// (x,y) to draw extra UI (tooltip, halo). Easiest is to use a Marker child render trick:
// wrap Marker and read the transform that's applied. Simpler: use d3-geo directly.
import { geoAlbersUsa } from "d3-geo";

const projection = geoAlbersUsa().scale(1000).translate([900 / 2, 500 / 2]);

function ProjectedMarker({
  coordinates,
  children,
}: {
  coordinates: [number, number];
  children: (x: number, y: number) => React.ReactNode;
}) {
  const projected = projection(coordinates);
  if (!projected) return null;
  return <>{children(projected[0], projected[1])}</>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
