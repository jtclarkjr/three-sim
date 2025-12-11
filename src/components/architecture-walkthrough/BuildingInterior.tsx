import { ContactShadows } from '@react-three/drei'
import { DoubleSide } from 'three'
import { Column, Furniture, Wall, Window } from './BuildingElements'

export function BuildingInterior() {
  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Contact shadows for more realism */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
        far={10}
      />

      {/* Walls */}
      <Wall position={[0, 2.5, -10]} args={[30, 5, 0.3]} />
      <Wall
        position={[-15, 2.5, 5]}
        args={[20, 5, 0.3]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Wall
        position={[15, 2.5, 5]}
        args={[20, 5, 0.3]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Ceiling */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          side={DoubleSide}
        />
      </mesh>

      {/* Columns */}
      <Column position={[-8, 2.5, -5]} />
      <Column position={[8, 2.5, -5]} />
      <Column position={[-8, 2.5, 5]} />
      <Column position={[8, 2.5, 5]} />

      {/* Windows (emissive for light effect) */}
      <Window position={[-14.85, 2.5, -5]} />
      <Window position={[-14.85, 2.5, 0]} />
      <Window position={[-14.85, 2.5, 5]} />

      {/* Furniture elements */}
      <Furniture position={[-5, 0.5, -5]} />
      <Furniture position={[5, 0.5, -5]} />
      <Furniture position={[0, 0.5, 0]} />
    </group>
  )
}
