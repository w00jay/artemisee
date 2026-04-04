import * as THREE from 'three';
import { EARTH_RADIUS_KM } from '../lib/constants';

/**
 * Convert J2000 ECI coordinates (Z-up) to Three.js (Y-up).
 * Scaled so 1 unit = 1 Earth radius.
 */
export function j2000ToThreeJS(
  x: number,
  y: number,
  z: number,
  scale = 1 / EARTH_RADIUS_KM,
): THREE.Vector3 {
  return new THREE.Vector3(x * scale, z * scale, -y * scale);
}
