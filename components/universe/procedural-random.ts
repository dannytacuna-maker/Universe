export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createGaussianRandom(random: () => number) {
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
