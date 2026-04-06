import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_RADIUS_KM } from '../lib/constants';

interface ISSData {
  latitude: number;
  longitude: number;
  altitude_km: number;
}

function geoToScene(lat: number, lon: number, altKm: number): THREE.Vector3 {
  const r = (EARTH_RADIUS_KM + altKm) / EARTH_RADIUS_KM; // in Earth radii
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  // ECI approximation: X toward vernal equinox, Z toward north pole
  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.cos(latRad) * Math.sin(lonRad);
  const z = r * Math.sin(latRad);
  // Convert J2000-style (Z-up) to Three.js (Y-up): x, z, -y
  return new THREE.Vector3(x, z, -y);
}

export function ISSMarker() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { data } = useQuery({
    queryKey: ['iss-position'],
    queryFn: async (): Promise<ISSData | null> => {
      const res = await fetch('/v1/iss');
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const position = useMemo(() => {
    if (!data) return new THREE.Vector3(0, 0, 0);
    return geoToScene(data.latitude, data.longitude, data.altitude_km);
  }, [data]);

  useFrame(() => {
    if (meshRef.current && data) {
      meshRef.current.position.copy(position);
    }
  });

  if (!data) return null;

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <Html position={position} style={{ pointerEvents: 'none' }} center>
        <div
          style={{
            color: '#fbbf24',
            fontSize: 9,
            fontFamily: 'system-ui',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
            transform: 'translateY(-14px)',
          }}
        >
          ISS
        </div>
      </Html>
    </group>
  );
}
