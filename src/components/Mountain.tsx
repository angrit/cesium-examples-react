import { useEffect } from 'react'
import { Cartesian3, Ion, Terrain, Viewer, /*Cesium3DTileset*/ } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const Mountain = () => {
  const LONGITUDE = 100.71197; // Centroid of your model
  const LATITUDE = 14.90811;  // Centroid of your model
  const HEIGHT = 200;     // Approx height above terrain

  // const addGltfAsTileset = (viewer: Viewer) => {
  //   const modelUrl = new URL('../assets/scene-gltf/lopburi-3d-scene2.gltf', import.meta.url).href;
  //   Cesium3DTileset.fromUrl(modelUrl)
  //     .then((tileset) => {
  //       viewer.scene.primitives.add(tileset);
  //       viewer.flyTo(tileset);
  //     });
  // }

  const add3dAssetAsEntity = (viewer: Viewer) => {
    const modelUrl = new URL('../assets/scene-gltf/lopburi-3d-scene2.glb', import.meta.url).href;
    
    try {
      // Position where the imported model will be placed on the world
      const position = Cartesian3.fromDegrees(LONGITUDE, LATITUDE, HEIGHT);
      
      // Create a model as an entity to appear in the world
      const modelEntity = viewer.entities.add({
        name: 'Lopburi Mountain',
        position: position,
        model: {
          uri: modelUrl,
          minimumPixelSize: 128,
          maximumScale: 1000,
          scale: 1.0
        }
      });
      
      viewer.flyTo(modelEntity);
      
      console.log('Model added successfully:', modelEntity);
    } catch (error) {
      console.error('Error creating model:', error);
    }
  }

  useEffect(() => {
    // Ensure the Cesium Ion access token is set from environment variables
    // This is necessary for accessing terrain and other Cesium Ion services
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
    if (!Ion.defaultAccessToken) {
      console.error('>>> Cesium Ion access token is not set. Please set the VITE_CESIUM_ION_ACCESS_TOKEN environment variable.');
    }

    document.title = `${Mountain.name} - Lopburi`;

    const viewer = new Viewer('cesiumContainer', {
      terrain: Terrain.fromWorldTerrain(),
    });

    add3dAssetAsEntity(viewer);
    // addGltfAsTileset(viewer);

    return () => {
      if (viewer) viewer.destroy();
    }
  }, []);

  return (
    <div>
      <h2>{Mountain.name} example (an imported asset from gltf/glb) </h2>
      <div id="cesiumContainer" />
    </div>
  )
}

export default Mountain