import { useEffect, useState } from 'react'
import { Ion, Terrain, Viewer, Math as CesiumMath, Cartesian3 } from 'cesium';
// import 'cesium/Build/Cesium/Widgets/widgets.css';

// https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/#quickstart

interface WorldLocationInfo {
  LONGITUDE: number;
  LATITUDE: number;
  HEIGHT: number;
  Heading: number;
  Pitch: number;
  Roll: number;
}

// const lopburiInteresting: WorldLocationInfo = {
//   LONGITUDE: 100.731303,  // Centroid of your model
//   LATITUDE: 14.930298,    // Centroid of your model
//   HEIGHT: 293,            // Approx height above terrain (units assumed to be meters)
//   Heading: 329.45,        // Camera heading in degrees
//   Pitch: -13.90,          // Camera pitch in degrees
//   Roll: 360.0,            // Camera roll in degrees
// }
const lopburi: WorldLocationInfo = {
  LONGITUDE: 100.684488,  // Centroid of your model
  LATITUDE: 14.973118,    // Centroid of your model
  HEIGHT: 251,            // Approx height above terrain (units assumed to be meters)
  Heading: 125.32,        // Camera heading in degrees
  Pitch: -8.60,           // Camera pitch in degrees
  Roll: 360.0,            // Camera roll in degrees
};

const NavWorldTerrain = () => {
  const [worldLocationInfo, setWorldLocationInfo] = useState<WorldLocationInfo>({
    LONGITUDE: lopburi.LONGITUDE,
    LATITUDE: lopburi.LATITUDE,
    HEIGHT: lopburi.HEIGHT,
    Heading: lopburi.Heading,
    Pitch: lopburi.Pitch,
    Roll: lopburi.Roll,
  });

  useEffect(() => {
    // Ensure the Cesium Ion access token is set from environment variables
    // This is necessary for accessing terrain and other Cesium Ion services
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
    if (!Ion.defaultAccessToken) {
      console.error('>>> Cesium Ion access token is not set. Please set the VITE_CESIUM_ION_ACCESS_TOKEN environment variable.');
    }

    document.title = `${NavWorldTerrain.name} - Lopburi`;

    const viewer = new Viewer('cesiumContainer', {
      terrain: Terrain.fromWorldTerrain(),
    });

    if (viewer) {
      viewer.resize();
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          worldLocationInfo.LONGITUDE, worldLocationInfo.LATITUDE, worldLocationInfo.HEIGHT),
        orientation: {
          heading: CesiumMath.toRadians(worldLocationInfo.Heading),
          pitch: CesiumMath.toRadians(worldLocationInfo.Pitch),
        },
      });

      // Camera Move event handler
      viewer.camera.moveEnd.addEventListener(() => {
        const mapCamPos = viewer.camera.positionCartographic;

        console.log('Camera moved to:', {
          Longitude: CesiumMath.toDegrees(mapCamPos.longitude).toFixed(6),
          Latitude: CesiumMath.toDegrees(mapCamPos.latitude).toFixed(6),
          Height: Math.round(mapCamPos.height),
          Heading: CesiumMath.toDegrees(viewer.camera.heading).toFixed(2),
          Pitch: CesiumMath.toDegrees(viewer.camera.pitch).toFixed(2),
          Roll: CesiumMath.toDegrees(viewer.camera.roll).toFixed(2)
        });

        setWorldLocationInfo({
          LONGITUDE: CesiumMath.toDegrees(mapCamPos.longitude),
          LATITUDE: CesiumMath.toDegrees(mapCamPos.latitude),
          HEIGHT: Math.round(mapCamPos.height),
          Heading: CesiumMath.toDegrees(viewer.camera.heading),
          Pitch: CesiumMath.toDegrees(viewer.camera.pitch),
          Roll: CesiumMath.toDegrees(viewer.camera.roll),
        });
      });
    }

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    }
  }, []);

  return (
    <div>
      <h2>{NavWorldTerrain.name} example (Move around the map, updated coords)</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingInline: '1rem',
        backgroundColor: '#f0f0f0',
      }}>
        <p>LONG: {worldLocationInfo.LONGITUDE.toFixed(6)}°</p>
        <p>LAT: {worldLocationInfo.LATITUDE.toFixed(6)}°</p>
        <p>HEIGHT: {worldLocationInfo.HEIGHT}m</p>
        <p>Heading: {worldLocationInfo.Heading.toFixed(2)}°</p>
        <p>Pitch: {worldLocationInfo.Pitch.toFixed(2)}°</p>
        <p>Roll: {worldLocationInfo.Roll.toFixed(2)}°</p>
      </div>
      <div id="cesiumContainer" />
    </div>
  )
}

export default NavWorldTerrain