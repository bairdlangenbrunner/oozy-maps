import { useState, useCallback, useRef, useEffect } from "react";
import * as topojson from "topojson-client";
import MapView from "./components/MapView";
import SliderPanel from "./components/SliderPanel";
import Controls from "./components/Controls";
import { allProjections, defaultProjectionName } from "./data/projections";
import { resetDrift } from "./lib/noise";
import type { MapParams, Theme } from "./types";
import "./App.css";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json";

const defaultParams: MapParams = {
  wanderSpeed: 0.3,
  wanderAmount: 40,
  noiseFrequency: 1.0,
  noiseOctaves: 1,
  noiseLacunarity: 2.0,
  noisePersistence: 0.5,
  lonLatRatio: 1.0,
  graticuleStep: 15,
  lineWidth: 1.25,
};

export default function App() {
  const [projectionName, setProjectionName] = useState(defaultProjectionName);
  const [params, setParams] = useState<MapParams>(defaultParams);
  const [paused, setPaused] = useState(false);
  const [freeDrift, setFreeDrift] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [world, setWorld] = useState<GeoJSON.GeoJsonObject | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projDef =
    allProjections.find((p) => p.name === projectionName) ?? allProjections[0];

  useEffect(() => {
    fetch(WORLD_URL)
      .then((r) => r.json())
      .then((topo: any) => {
        setWorld(topojson.feature(topo, topo.objects.land));
      });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => setCanvasWidth(container.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleParamChange = useCallback(
    (key: keyof MapParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setParams(defaultParams);
    setProjectionName(defaultProjectionName);
    setPaused(false);
    setFreeDrift(false);
    resetDrift();
  }, []);

  const handleRandomize = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      wanderSpeed: +(Math.random() * 2).toFixed(2),
      wanderAmount: Math.round(5 + Math.random() * 85),
      noiseFrequency: +(0.1 + Math.random() * 4.9).toFixed(1),
      noiseOctaves: Math.ceil(Math.random() * 6),
      noiseLacunarity: +(1 + Math.random() * 3).toFixed(1),
      noisePersistence: +(0.1 + Math.random() * 0.8).toFixed(2),
      lonLatRatio: +(0.2 + Math.random() * 4.8).toFixed(1),
    }));
  }, []);

  return (
    <div className="app">
      <div className="canvas-container" ref={containerRef}>
        <MapView
          projectionDef={projDef}
          params={params}
          paused={paused}
          freeDrift={freeDrift}
          canvasWidth={canvasWidth}
          world={world}
          theme={theme}
        />
      </div>
      <SliderPanel
        params={params}
        onChange={handleParamChange}
        freeDrift={freeDrift}
        onToggleFreeDrift={() => {
          setFreeDrift((f) => {
            if (f) resetDrift();
            return !f;
          });
        }}
      />
      <Controls
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        onReset={handleReset}
        onRandomize={handleRandomize}
      />
      <button
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        aria-label={theme === "light" ? "switch to dark mode" : "switch to light mode"}
      >
        {theme === "light" ? "\u263E" : "\u2600"}
      </button>
    </div>
  );
}
