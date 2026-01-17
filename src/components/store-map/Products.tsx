import { useEffect, useRef } from 'react'
import { type InstancedMesh, Object3D } from 'three'
import type { Product } from './types'

interface ProductsProps {
  products: Product[]
}

const tempObject = new Object3D()

export const Products = ({ products }: ProductsProps) => {
  const meshRef = useRef<InstancedMesh>(null)

  useEffect(() => {
    if (!meshRef.current) return

    const count = products.length
    for (let i = 0; i < count; i++) {
      const product = products[i]

      tempObject.position.set(product.x, 0.5, product.y)
      tempObject.scale.set(1, 1, 1)
      tempObject.updateMatrix()

      meshRef.current.setMatrixAt(i, tempObject.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [products])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, products.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.5, 1.2, 0.5]} />
      <meshStandardMaterial color="#ffa500" roughness={0.6} />
    </instancedMesh>
  )
}
