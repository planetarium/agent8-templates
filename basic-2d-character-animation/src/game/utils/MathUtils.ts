export const MathUtils = {
  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  },

  getDiagonalLength(width: number, height: number): number {
    return Math.sqrt(width ** 2 + height ** 2);
  },

  getRandomPointOnCircle(radius: number): { x: number; y: number } {
    const theta = Math.random() * Math.PI * 2;

    return {
      x: radius * Math.cos(theta),
      y: radius * Math.sin(theta),
    };
  },
};
