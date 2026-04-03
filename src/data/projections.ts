import * as d3 from "d3-geo";
import * as d3Proj from "d3-geo-projection";
import type { ProjectionDef, ProjectionGroup } from "../types";

export const projectionGroups: ProjectionGroup[] = [
  {
    label: "conformal",
    projections: [
      { name: "mercator", fn: () => d3.geoMercator().precision(0.1) },
      {
        name: "transverse mercator",
        fn: () => d3.geoTransverseMercator().precision(0.1),
      },
      {
        name: "stereographic",
        fn: () => d3.geoStereographic().precision(0.1).clipAngle(140),
      },
      {
        name: "lambert conformal conic",
        fn: () =>
          d3.geoConicConformal().precision(0.1).parallels([30, 60]),
        conic: true,
      },
    ],
  },
  {
    label: "equal-area",
    projections: [
      { name: "mollweide", fn: () => d3Proj.geoMollweide().precision(0.1) },
      { name: "hammer", fn: () => d3Proj.geoHammer().precision(0.1) },
      { name: "sinusoidal", fn: () => d3Proj.geoSinusoidal().precision(0.1) },
      { name: "eckert IV", fn: () => d3Proj.geoEckert4().precision(0.1) },
      {
        name: "boggs eumorphic",
        fn: () => d3Proj.geoBoggs().precision(0.1),
      },
      { name: "eckert VI", fn: () => d3Proj.geoEckert6().precision(0.1) },
      {
        name: "conic equal-area",
        fn: () =>
          d3.geoConicEqualArea().precision(0.1).parallels([20, 60]),
        conic: true,
      },
      {
        name: "azimuthal equal-area",
        fn: () => d3.geoAzimuthalEqualArea().precision(0.1),
      },
      {
        name: "interrupted goode homolosine",
        fn: () => d3Proj.geoInterruptedHomolosine().precision(0.1),
      },
    ],
  },
  {
    label: "compromise",
    projections: [
      { name: "robinson", fn: () => d3Proj.geoRobinson().precision(0.1) },
      { name: "winkel tripel", fn: () => d3Proj.geoWinkel3().precision(0.1) },
      {
        name: "natural earth",
        fn: () => d3.geoNaturalEarth1().precision(0.1),
      },
      { name: "aitoff", fn: () => d3Proj.geoAitoff().precision(0.1) },
      {
        name: "kavrayskiy VII",
        fn: () => d3Proj.geoKavrayskiy7().precision(0.1),
      },
      { name: "patterson", fn: () => d3Proj.geoPatterson().precision(0.1) },
    ],
  },
  {
    label: "equidistant",
    projections: [
      {
        name: "equirectangular",
        fn: () => d3.geoEquirectangular().precision(0.1),
      },
      {
        name: "conic equidistant",
        fn: () =>
          d3.geoConicEquidistant().precision(0.1).parallels([20, 60]),
        conic: true,
      },
    ],
  },
  {
    label: "azimuthal",
    projections: [
      {
        name: "orthographic",
        fn: () => d3.geoOrthographic().precision(0.1).clipAngle(90),
      },
      {
        name: "gnomonic",
        fn: () => d3.geoGnomonic().precision(0.1).clipAngle(60),
      },
    ],
  },
  {
    label: "other",
    projections: [
      {
        name: "van der grinten",
        fn: () => d3Proj.geoVanDerGrinten().precision(0.1),
      },
      { name: "baker", fn: () => d3Proj.geoBaker().precision(0.1) },
      { name: "lagrange", fn: () => d3Proj.geoLagrange().precision(0.1) },
      { name: "august", fn: () => d3Proj.geoAugust().precision(0.1) },
      { name: "armadillo", fn: () => d3Proj.geoArmadillo().precision(0.1) },
      { name: "collignon", fn: () => d3Proj.geoCollignon().precision(0.1) },
      { name: "eisenlohr", fn: () => d3Proj.geoEisenlohr().precision(0.1) },
      { name: "gingery", fn: () => d3Proj.geoGingery().precision(0.1) },
      {
        name: "peirce quincuncial",
        fn: () => d3Proj.geoPeirceQuincuncial().precision(0.1),
      },
      {
        name: "berghaus star",
        fn: () => d3Proj.geoBerghaus().precision(0.1),
      },
      { name: "loximuthal", fn: () => d3Proj.geoLoximuthal().precision(0.1) },
      { name: "polyconic", fn: () => d3Proj.geoPolyconic().precision(0.1) },
      { name: "bottomley", fn: () => d3Proj.geoBottomley().precision(0.1) },
    ],
  },
];

export const allProjections: ProjectionDef[] = projectionGroups.flatMap(
  (g) => g.projections
);

export const defaultProjectionName = "interrupted goode homolosine";
