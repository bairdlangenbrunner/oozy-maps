import { createNoise4D } from "simplex-noise";

const wanderNoise = createNoise4D();

/**
 * Sample fBm noise at a 1D point with configurable octaves, lacunarity, persistence.
 */
function fbm1D(
  x: number,
  y: number,
  octaves: number,
  frequency: number,
  lacunarity: number,
  persistence: number
): number {
  let value = 0;
  let amp = 1;
  let freq = frequency;
  let maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * wanderNoise(x * freq, y * freq, 0, 0);
    maxAmp += amp;
    amp *= persistence;
    freq *= lacunarity;
  }
  return value / maxAmp;
}

/**
 * Smooth position-based wander. Noise drives position directly.
 * lonLatRatio > 1 = more lon movement, < 1 = more lat movement.
 */
export function getWanderRotation(
  time: number,
  speed: number,
  amount: number,
  frequency: number,
  octaves: number,
  lacunarity: number,
  persistence: number,
  lonLatRatio: number
): [number, number] {
  const t = time * speed * 0.05;
  const lonScale = Math.sqrt(lonLatRatio);
  const latScale = 1 / lonScale;
  const lonWander = fbm1D(t, 100, octaves, frequency, lacunarity, persistence) * amount * lonScale;
  const latWander = fbm1D(200, t, octaves, frequency, lacunarity, persistence) * amount * latScale;
  return [lonWander, latWander];
}

// --- Free drift mode ---

let driftLon = 0;
let driftLat = 0;
let lastTime = -1;
let smoothLonVel = 0;
let smoothLatVel = 0;

export function getDriftRotation(
  time: number,
  speed: number,
  amount: number,
  frequency: number,
  octaves: number,
  lacunarity: number,
  persistence: number,
  lonLatRatio: number
): [number, number] {
  if (lastTime < 0) {
    lastTime = time;
    return [driftLon, driftLat];
  }

  const dt = Math.min(time - lastTime, 0.1);
  lastTime = time;

  const t = time * speed * 0.05;
  const lonScale = Math.sqrt(lonLatRatio);
  const latScale = 1 / lonScale;
  const targetLonVel = fbm1D(t, 100, octaves, frequency, lacunarity, persistence) * amount * lonScale;
  const targetLatVel = fbm1D(200, t, octaves, frequency, lacunarity, persistence) * amount * latScale;

  const smoothing = 0.02;
  smoothLonVel += (targetLonVel - smoothLonVel) * smoothing;
  smoothLatVel += (targetLatVel - smoothLatVel) * smoothing;

  driftLon += smoothLonVel * dt;
  driftLat += smoothLatVel * dt;

  return [driftLon, driftLat];
}

export function resetDrift() {
  driftLon = 0;
  driftLat = 0;
  smoothLonVel = 0;
  smoothLatVel = 0;
  lastTime = -1;
}
