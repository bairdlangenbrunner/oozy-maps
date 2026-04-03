import { useEffect, useRef, useCallback, useId } from "react";
import * as d3 from "d3-geo";
import { select } from "d3-selection";
import { getWanderRotation, getDriftRotation } from "../lib/noise";
import type { ProjectionDef, MapParams, Theme } from "../types";

interface Props {
  projectionDef: ProjectionDef;
  params: MapParams;
  paused: boolean;
  freeDrift: boolean;
  canvasWidth: number;
  world: GeoJSON.GeoJsonObject | null;
  theme: Theme;
}

export default function MapView({
  projectionDef,
  params,
  paused,
  freeDrift,
  canvasWidth,
  world,
  theme,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const projRef = useRef<d3.GeoProjection | null>(null);
  const pathRef = useRef<d3.GeoPath | null>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const freeDriftRef = useRef(freeDrift);
  freeDriftRef.current = freeDrift;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const worldRef = useRef(world);
  worldRef.current = world;
  const projDefRef = useRef(projectionDef);
  projDefRef.current = projectionDef;

  const clipId = useId();
  const clipIdSafe = clipId.replace(/:/g, "-");

  // Compute natural height for this projection at a given width
  const getDimensions = useCallback(
    (w: number) => {
      const proj = projectionDef.fn();
      const fitObject = projectionDef.conic
        ? d3.geoGraticule().extent([[-180, -80], [180, 84]]).outline()
        : ({ type: "Sphere" } as d3.GeoPermissibleObjects);
      proj.fitWidth(w, fitObject);
      const bounds = d3.geoPath(proj).bounds(fitObject);
      return Math.max(Math.ceil(bounds[1][1] - bounds[0][1]) + 8, 100);
    },
    [projectionDef]
  );

  // Build the SVG structure once, then just update paths each frame
  const initSVG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const w = canvasWidth;
    const h = getDimensions(w);

    const root = select(svg);
    root.selectAll("*").remove();

    root
      .attr("width", w)
      .attr("height", h)
      .attr("viewBox", `0 0 ${w} ${h}`)
      .style("display", "block")
      .style("overflow", "hidden");

    // Set up projection (will be reused — only rotation changes per frame)
    const pDef = projDefRef.current;
    const proj = pDef.fn();
    const fitObject = pDef.conic
      ? d3.geoGraticule().extent([[-180, -80], [180, 84]]).outline()
      : ({ type: "Sphere" } as d3.GeoPermissibleObjects);

    const margin = 4;
    proj.fitExtent(
      [
        [margin, margin],
        [w - margin, h - margin],
      ],
      fitObject
    );

    if (pDef.conic) {
      const pad = 50;
      proj.clipExtent([
        [margin - pad, margin - pad],
        [w - margin + pad, h - margin + pad],
      ]);
    }

    projRef.current = proj;
    pathRef.current = d3.geoPath(proj);

    // Build SVG DOM structure
    const defs = root.append("defs");
    const clip = defs.append("clipPath").attr("id", clipIdSafe);
    clip.append("path").attr("class", "clip-path");

    // Outline (behind clip group)
    root.append("path").attr("class", "outline-path");

    // Clipped group for graticule + land
    const clipped = root.append("g").attr("clip-path", `url(#${clipIdSafe})`);
    clipped.append("path").attr("class", "graticule-path");
    clipped.append("path").attr("class", "land-path");

    initializedRef.current = true;
  }, [canvasWidth, getDimensions, clipIdSafe]);

  // Update all path `d` attributes — called every frame
  const updatePaths = useCallback(() => {
    const svg = svgRef.current;
    const proj = projRef.current;
    const path = pathRef.current;
    if (!svg || !proj || !path) return;

    const root = select(svg);
    const pDef = projDefRef.current;
    const p = paramsRef.current;
    const isDark = themeRef.current === "dark";
    const fg = isDark ? "#e8e8e8" : "#1a1a1a";
    const lw = p.lineWidth;

    const fitObject = pDef.conic
      ? d3.geoGraticule().extent([[-180, -80], [180, 84]]).outline()
      : ({ type: "Sphere" } as d3.GeoPermissibleObjects);

    const outlinePath = path(fitObject) ?? "";

    // Clip path + outline
    root.select(".clip-path").attr("d", outlinePath);
    root
      .select(".outline-path")
      .attr("d", outlinePath)
      .attr("fill", "none")
      .attr("stroke", fg)
      .attr("stroke-width", lw);

    // Graticule
    const step = p.graticuleStep;
    const graticule = pDef.conic
      ? d3.geoGraticule().extent([[-180, -80], [180, 84]]).step([step, step])()
      : d3.geoGraticule().step([step, step])();
    root
      .select(".graticule-path")
      .attr("d", path(graticule))
      .attr("fill", "none")
      .attr("stroke", fg)
      .attr("stroke-width", lw);

    // Land
    if (worldRef.current) {
      root
        .select(".land-path")
        .attr("d", path(worldRef.current as any))
        .attr("fill", fg)
        .attr("stroke", "none");
    }
  }, []);

  // Init SVG when projection or size changes
  useEffect(() => {
    initSVG();
    updatePaths();
  }, [initSVG, updatePaths]);

  // Animation loop — only updates rotation + path strings
  useEffect(() => {
    if (!initializedRef.current) return;

    const animate = (timestamp: number) => {
      if (!pausedRef.current) {
        const dt = lastFrameRef.current
          ? (timestamp - lastFrameRef.current) / 1000
          : 0;
        timeRef.current += dt;
      }
      lastFrameRef.current = timestamp;

      const proj = projRef.current;
      if (proj) {
        const p = paramsRef.current;
        const t = timeRef.current;
        const [wanderLon, wanderLat] = freeDriftRef.current
          ? getDriftRotation(t, p.wanderSpeed, p.wanderAmount, p.noiseFrequency, p.noiseOctaves, p.noiseLacunarity, p.noisePersistence, p.lonLatRatio)
          : getWanderRotation(t, p.wanderSpeed, p.wanderAmount, p.noiseFrequency, p.noiseOctaves, p.noiseLacunarity, p.noisePersistence, p.lonLatRatio);

        proj.rotate([wanderLon, wanderLat, 0]);
        updatePaths();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [updatePaths, projectionDef, canvasWidth]);

  // Update paths when world data loads
  useEffect(() => {
    if (world && initializedRef.current) {
      updatePaths();
    }
  }, [world, updatePaths]);

  const displayH = getDimensions(canvasWidth);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label="animated map projection"
      style={{ width: canvasWidth, height: displayH, display: "block" }}
    />
  );
}
