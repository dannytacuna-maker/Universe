import type { GalaxyDefinition, Vector3Tuple } from "./galaxy-definition";

export type GalaxyParticleLayer = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

export type ProceduralGalaxyData = Readonly<{
  arms: GalaxyParticleLayer;
  core: GalaxyParticleLayer;
  dust: GalaxyParticleLayer;
  halo: GalaxyParticleLayer;
}>;

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createGaussianRandom(random: () => number) {
  let first = 0;
  let second = 0;

  while (first === 0) {
    first = random();
  }

  while (second === 0) {
    second = random();
  }

  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function writeColor(
  colors: Float32Array,
  offset: number,
  first: Vector3Tuple,
  second: Vector3Tuple,
  mix: number,
  brightness: number,
) {
  const inverseMix = 1 - mix;

  colors[offset] = (first[0] * inverseMix + second[0] * mix) * brightness;
  colors[offset + 1] = (first[1] * inverseMix + second[1] * mix) * brightness;
  colors[offset + 2] = (first[2] * inverseMix + second[2] * mix) * brightness;
}

function createArmParticles(definition: GalaxyDefinition): GalaxyParticleLayer {
  const { palette, particleDistribution } = definition;
  const random = createSeededRandom(particleDistribution.seed);
  const positions = new Float32Array(particleDistribution.armParticleCount * 3);
  const colors = new Float32Array(particleDistribution.armParticleCount * 3);

  for (
    let index = 0;
    index < particleDistribution.armParticleCount;
    index += 1
  ) {
    const offset = index * 3;
    const radiusProgress = Math.pow(random(), 0.82);
    const armIndex = index % particleDistribution.armCount;
    const armOrigin = (armIndex / particleDistribution.armCount) * Math.PI * 2;
    const spiralAngle =
      armOrigin + radiusProgress * particleDistribution.twist * Math.PI * 2;
    const angularSpread =
      createGaussianRandom(random) *
      particleDistribution.armSpread *
      (0.46 + radiusProgress * 0.72);
    const radialJitter =
      createGaussianRandom(random) *
      particleDistribution.radius *
      (0.012 + radiusProgress * 0.026);
    const radius =
      particleDistribution.radius * (0.08 + radiusProgress * 0.92) +
      radialJitter;
    const angle = spiralAngle + angularSpread;
    const centralThickness = Math.pow(1 - radiusProgress, 1.8);

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      createGaussianRandom(random) *
      particleDistribution.thickness *
      (0.36 + centralThickness * 1.7);

    const accentMix = random();
    const usesAccent = accentMix > 0.86;
    const colorMix = usesAccent ? (accentMix - 0.86) / 0.14 : random();
    const brightness = 0.62 + random() * 0.24 + (1 - radiusProgress) * 0.12;

    writeColor(
      colors,
      offset,
      usesAccent ? palette.secondary : palette.primary,
      usesAccent ? palette.accent : palette.secondary,
      colorMix,
      brightness,
    );
  }

  return { colors, positions };
}

function createCoreParticles(
  definition: GalaxyDefinition,
): GalaxyParticleLayer {
  const { palette, particleDistribution } = definition;
  const random = createSeededRandom(particleDistribution.seed + 1);
  const positions = new Float32Array(
    particleDistribution.coreParticleCount * 3,
  );
  const colors = new Float32Array(particleDistribution.coreParticleCount * 3);
  const coreRadius = particleDistribution.radius * 0.24;

  for (
    let index = 0;
    index < particleDistribution.coreParticleCount;
    index += 1
  ) {
    const offset = index * 3;
    const radialFalloff = Math.pow(random(), 2.15);
    const angle = random() * Math.PI * 2;
    const radius = radialFalloff * coreRadius;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      createGaussianRandom(random) *
      particleDistribution.thickness *
      (0.55 + (1 - radialFalloff) * 1.8);

    writeColor(
      colors,
      offset,
      palette.secondary,
      palette.core,
      0.48 + random() * 0.48,
      0.76 + random() * 0.2,
    );
  }

  return { colors, positions };
}

function createHaloParticles(
  definition: GalaxyDefinition,
): GalaxyParticleLayer {
  const { palette, particleDistribution } = definition;
  const random = createSeededRandom(particleDistribution.seed + 2);
  const positions = new Float32Array(
    particleDistribution.haloParticleCount * 3,
  );
  const colors = new Float32Array(particleDistribution.haloParticleCount * 3);

  for (
    let index = 0;
    index < particleDistribution.haloParticleCount;
    index += 1
  ) {
    const offset = index * 3;
    const angle = random() * Math.PI * 2;
    const radiusProgress = Math.pow(random(), 0.68);
    const radius = particleDistribution.radius * radiusProgress * 1.08;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      createGaussianRandom(random) *
      particleDistribution.thickness *
      (1.25 - radiusProgress * 0.62);

    writeColor(
      colors,
      offset,
      palette.primary,
      palette.accent,
      random() * 0.54,
      0.36 + random() * 0.22,
    );
  }

  return { colors, positions };
}

function createDustParticles(
  definition: GalaxyDefinition,
): GalaxyParticleLayer {
  const { palette, particleDistribution } = definition;
  const particleCount = Math.round(
    particleDistribution.armParticleCount * 0.18,
  );
  const random = createSeededRandom(particleDistribution.seed + 3);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const radiusProgress = Math.pow(random(), 0.76);
    const armIndex = index % particleDistribution.armCount;
    const armOrigin = (armIndex / particleDistribution.armCount) * Math.PI * 2;
    const spiralAngle =
      armOrigin + radiusProgress * particleDistribution.twist * Math.PI * 2;
    const angle =
      spiralAngle +
      createGaussianRandom(random) * particleDistribution.armSpread * 1.85;
    const radius =
      particleDistribution.radius * (0.11 + radiusProgress * 0.94) +
      createGaussianRandom(random) * particleDistribution.radius * 0.045;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      createGaussianRandom(random) *
      particleDistribution.thickness *
      (0.85 + radiusProgress * 0.65);

    writeColor(
      colors,
      offset,
      palette.primary,
      palette.accent,
      0.18 + random() * 0.36,
      0.24 + random() * 0.14,
    );
  }

  return { colors, positions };
}

export function createProceduralGalaxyData(
  definition: GalaxyDefinition,
): ProceduralGalaxyData {
  return {
    arms: createArmParticles(definition),
    core: createCoreParticles(definition),
    dust: createDustParticles(definition),
    halo: createHaloParticles(definition),
  };
}
