import { Line, Html } from '@react-three/drei';

const AXIS_LENGTH = 50; // Earth radii (~half lunar distance)

const axes = [
  {
    points: [[0, 0, 0], [AXIS_LENGTH, 0, 0]] as [number, number, number][],
    color: '#ff4444',
    label: 'X · Vernal Equinox ♈',
    labelPos: [AXIS_LENGTH + 0.5, 0, 0] as [number, number, number],
  },
  {
    points: [[0, 0, 0], [0, AXIS_LENGTH, 0]] as [number, number, number][],
    color: '#44ff44',
    label: 'Z · North Celestial Pole',
    labelPos: [0, AXIS_LENGTH + 0.5, 0] as [number, number, number],
  },
  {
    points: [[0, 0, 0], [0, 0, -AXIS_LENGTH]] as [number, number, number][],
    color: '#4488ff',
    label: 'Y · 90° East',
    labelPos: [0, 0, -(AXIS_LENGTH + 0.5)] as [number, number, number],
  },
];

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  textShadow: '0 0 4px #000, 0 0 8px #000',
  pointerEvents: 'none',
};

export function AxesGuide() {
  return (
    <group>
      {axes.map(({ points, color, label, labelPos }) => (
        <group key={label}>
          <Line
            points={points}
            color={color}
            lineWidth={2}
            transparent
            opacity={0.7}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
          <Html position={labelPos} center style={{ pointerEvents: 'none' }}>
            <span style={{ ...labelStyle, color }}>{label}</span>
          </Html>
        </group>
      ))}

      {/* Equatorial plane grid ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[49.5, 50, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} side={2} />
      </mesh>
      <Html position={[-50, 0.5, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ ...labelStyle, color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>
          Equatorial Plane
        </span>
      </Html>
    </group>
  );
}
