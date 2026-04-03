import type { GeoProjection } from "d3-geo";

export interface ProjectionDef {
  name: string;
  fn: () => GeoProjection;
  conic?: boolean;
}

export interface ProjectionGroup {
  label: string;
  projections: ProjectionDef[];
}

export interface MapParams {
  wanderSpeed: number;
  wanderAmount: number;
  noiseFrequency: number;
  noiseOctaves: number;
  noiseLacunarity: number;
  noisePersistence: number;
  lonLatRatio: number;
  graticuleStep: number;
  lineWidth: number;
}

export type Theme = "light" | "dark";
