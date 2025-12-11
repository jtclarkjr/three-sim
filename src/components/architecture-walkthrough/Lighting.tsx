export function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.2} />

      {/* Main directional light (sunlight through windows) */}
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill light from opposite direction */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#b8d4ff"
      />

      {/* Spot lights for dramatic interior lighting */}
      <spotLight
        position={[0, 8, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        castShadow
      />
      <spotLight
        position={[8, 8, 8]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.3}
        castShadow
      />
    </>
  )
}
