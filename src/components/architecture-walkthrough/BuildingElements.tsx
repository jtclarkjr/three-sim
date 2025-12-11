export function Wall({
  position,
  args,
  rotation
}: {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#f5f5f5" roughness={0.85} metalness={0.05} />
    </mesh>
  )
}

export function Column({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <cylinderGeometry args={[0.4, 0.4, 5, 16]} />
      <meshStandardMaterial color="#d0d0d0" roughness={0.7} metalness={0.2} />
    </mesh>
  )
}

export function Window({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.1, 2, 2]} />
      <meshStandardMaterial
        color="#87ceeb"
        emissive="#87ceeb"
        emissiveIntensity={0.3}
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.9}
      />
    </mesh>
  )
}

export function Furniture({
  position
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      {/* Table/Display pedestal */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 1, 16]} />
        <meshStandardMaterial color="#8b7355" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Decorative element on top */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#4a90e2" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  )
}
