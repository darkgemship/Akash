// d3-force-3d không kèm types — khai báo tối thiểu cho các lực ta dùng (forceX/Y/Z) cho cụm thiên hà 3D.
declare module 'd3-force-3d' {
  interface PositionForce {
    (alpha: number): void
    strength(s: number | ((d: unknown, i: number) => number)): PositionForce
    x?: (x: number | ((d: unknown, i: number) => number)) => PositionForce
  }
  export function forceX(x?: number | ((d: unknown, i: number) => number)): PositionForce
  export function forceY(y?: number | ((d: unknown, i: number) => number)): PositionForce
  export function forceZ(z?: number | ((d: unknown, i: number) => number)): PositionForce
}
