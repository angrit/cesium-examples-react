import {useState} from 'react'
import Building from './components/Building'
import Mountain from './components/Mountain'
import NavWorldTerrain from './components/NavWorldTerrain'
import DrawOnWorldTerrain from './components/DrawOnWorldTerrain'

function App() {
  const MapExamples = {
    NavWorldTerrain: 0,
    DrawOnWorldTerrain: 1,
    Building: 2,
    Mountain: 3,
  }
  const numMapExamples = Object.keys(MapExamples).length;
  const [selectedComponent, setSelectedComponent] = useState<number>(1);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          height: '100vh',
        }}
        onDoubleClick={() => {
          const nextComponent = selectedComponent + 1;
          setSelectedComponent(nextComponent < numMapExamples ? nextComponent : 0);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, backgroundColor: '#227799' }}>
          <div style={{ flex: 4, paddingInline: '1rem' }}>
            <h1>Cesium World Example</h1>
            <p>This example demonstrates how to use Cesium in a React application.</p>
            <p>Make sure to have the Cesium API Key properly configured in your project.</p>
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#ccc' }}>
            <div style={{ paddingBlock: '1rem' }}>DoubleClick anywhere...</div>
            <div style={{ paddingBlock: '1rem' }}>to switch between the examples</div>
          </div>
        </div>
        <div style={{ flex: 4, width: '100%', height: '100%' }}>
          {selectedComponent === MapExamples.NavWorldTerrain && <NavWorldTerrain />}
          {selectedComponent === MapExamples.DrawOnWorldTerrain && <DrawOnWorldTerrain />}
          {selectedComponent === MapExamples.Building && <Building />}
          {selectedComponent === MapExamples.Mountain && <Mountain />}
        </div>
      </div>
    </>
  )
}

export default App
