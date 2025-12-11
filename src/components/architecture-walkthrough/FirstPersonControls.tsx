import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { checkCollision } from './collision'

export function FirstPersonControls() {
  const { camera } = useThree()
  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const moveSpeed = 0.03
  const playerRadius = 0.5
  const velocity = useRef<Vector3>(new Vector3())
  const direction = useRef<Vector3>(new Vector3())

  const keysPressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keysPressed.current.w = true
      if (key === 'a') keysPressed.current.a = true
      if (key === 's') keysPressed.current.s = true
      if (key === 'd') keysPressed.current.d = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keysPressed.current.w = false
      if (key === 'a') keysPressed.current.a = false
      if (key === 's') keysPressed.current.s = false
      if (key === 'd') keysPressed.current.d = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!controlsRef.current?.isLocked) return

    velocity.current.set(0, 0, 0)

    camera.getWorldDirection(direction.current)
    direction.current.y = 0
    direction.current.normalize()

    const right = new Vector3()
    right.crossVectors(camera.up, direction.current).normalize()

    if (keysPressed.current.w) {
      velocity.current.add(direction.current.multiplyScalar(moveSpeed))
    }
    if (keysPressed.current.s) {
      velocity.current.add(direction.current.multiplyScalar(-moveSpeed))
    }
    if (keysPressed.current.a) {
      velocity.current.add(right.multiplyScalar(moveSpeed))
    }
    if (keysPressed.current.d) {
      velocity.current.add(right.multiplyScalar(-moveSpeed))
    }

    const newPosition = camera.position.clone().add(velocity.current)

    if (!checkCollision(newPosition, playerRadius)) {
      camera.position.copy(newPosition)
    }
  })

  return <PointerLockControls ref={controlsRef} />
}
