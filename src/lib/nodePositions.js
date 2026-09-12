// Animation-only coordinates do not trigger React renders on every frame.
const positions = new Map();
export function rememberNodePosition(id, vector) {
  positions.set(id, [vector.x, vector.y, vector.z]);
}
export function currentNodePosition(id, fallback = [0, 0, 0]) {
  return [...(positions.get(id) || fallback)];
}
