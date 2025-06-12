import { useEffect } from 'react'
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';

const Building = () => {
  const createOsmBuildings = async (viewer: Viewer) => {
    console.log('>>> Creating OSM buildings...', viewer);
    // Add Cesium OSM Buildings, a global 3D buildings layer.
    try {
      const buildingTileset = await createOsmBuildingsAsync();
      viewer.scene.primitives.add(buildingTileset);
    } catch (error) {
      console.error('>>> Error creating OSM buildings:', error);
    }

    // Fly the camera to San Francisco at the given longitude, latitude, and height.
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      }
    });
  }

  useEffect(() => {
    // Ensure the Cesium Ion access token is set from environment variables
    // This is necessary for accessing terrain and other Cesium Ion services
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
    if (!Ion.defaultAccessToken) {
      console.error('>>> Cesium Ion access token is not set. Please set the VITE_CESIUM_ION_ACCESS_TOKEN environment variable.');
    }

    document.title = `${Building.displayName} - OSM Buildings Example`;

    const viewer = new Viewer('cesiumContainer', {
      terrain: Terrain.fromWorldTerrain(),
    });

    if (viewer) createOsmBuildings(viewer);

    return () => { if (viewer) viewer.destroy(); }
  }, []);

  return (
    <div>
      <h2>{Building.displayName}s example (Examine the buildings)</h2>
      <div id="cesiumContainer" />
    </div>
  )
}

Building.displayName = "Building";

export default Building