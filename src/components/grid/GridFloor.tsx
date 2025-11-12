import { Scene3D } from '../_resuables/Scene3D'
import { GridScene } from './GridScene'

export const GridFloor = () => {
  return (
    <Scene3D 
      camera={{ position: [8, 8, 8], fov: 50 }}
      useDragControls={false}
      showFloor={false}
    >
      {() => <GridScene />}
    </Scene3D>
  )
}
