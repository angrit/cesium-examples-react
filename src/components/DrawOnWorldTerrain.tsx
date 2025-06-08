import { useEffect, useRef, useState } from 'react'
import {
  Ion, Terrain, Viewer, Math as CesiumMath, Cartesian3, 
  ScreenSpaceEventHandler, ScreenSpaceEventType, defined, 
  Color, HeightReference, CallbackProperty, 
  Entity, PositionProperty, ConstantPositionProperty,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// https://sandcastle.cesium.com/?src=Drawing%20on%20Terrain.html
// https://community.cesium.com/t/an-example-from-sandcastle-doesnt-work/16587/17
// https://github.com/CesiumGS/cesium/issues/8927

interface WorldLocationInfo {
  LONGITUDE: number;
  LATITUDE: number;
  HEIGHT: number;
  Heading: number;
  Pitch: number;
  Roll: number;
}

const lopburiInteresting: WorldLocationInfo = {
  LONGITUDE: 100.731303,  // Centroid of your model
  LATITUDE: 14.930298,    // Centroid of your model
  HEIGHT: 293,            // Approx height above terrain (units assumed to be meters)
  Heading: 329.45,        // Camera heading in degrees
  Pitch: -13.90,          // Camera pitch in degrees
  Roll: 360.0,            // Camera roll in degrees
}
const lopburi: WorldLocationInfo = {
  LONGITUDE: 100.684488,  // Centroid of your model
  LATITUDE: 14.973118,    // Centroid of your model
  HEIGHT: 251,            // Approx height above terrain (units assumed to be meters)
  Heading: 125.32,        // Camera heading in degrees
  Pitch: -8.60,           // Camera pitch in degrees
  Roll: 360.0,            // Camera roll in degrees
};

const DrawOnWorldTerrain = () => {
  const [worldLocationInfo, setWorldLocationInfo] = useState<WorldLocationInfo>({
    LONGITUDE: lopburi.LONGITUDE,
    LATITUDE: lopburi.LATITUDE,
    HEIGHT: lopburi.HEIGHT,
    Heading: lopburi.Heading,
    Pitch: lopburi.Pitch,
    Roll: lopburi.Roll,
  });
  // https://cesium.com/learn/cesiumjs/ref-doc/Entity.html#position
  // https://cesium.com/learn/cesiumjs/ref-doc/PositionPropertyArray.html#setValue
  const activeShapePointsRef = useRef<Cartesian3[]>([]);
  const floatingPointRef = useRef<PositionProperty>(new ConstantPositionProperty());
  const activeShapeRef = useRef<Entity>(new Entity);

  // Ensure the Cesium Ion access token is set from environment variables
  // This is necessary for accessing terrain and other Cesium Ion services
  Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
  if (!Ion.defaultAccessToken) {
    console.error('>>> Cesium Ion access token is not set. Please set the VITE_CESIUM_ION_ACCESS_TOKEN environment variable.');
  }

  const addPointEntity = (viewer: Viewer, worldPosition: Cartesian3) => {
    const entity = viewer.entities.add({
      position: worldPosition,
      point: {
        color: Color.RED,
        pixelSize: 10,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      }
    });
    return entity;
  }

  const addLineEntity = (
    viewer: Viewer,
    linePositions: CallbackProperty | Cartesian3[],
    colour?: Color
  ) => {
    const line = viewer.entities.add({
      polyline: {
        positions: linePositions,
        clampToGround: true,
        width: 3,
        material: colour ?? Color.WHITE,
      },
    });

    return line;
  };

  useEffect(() => {
    document.title = `${DrawOnWorldTerrain.name} - Lopburi`;
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
          roll: CesiumMath.toRadians(worldLocationInfo.Roll),
        },
      });

      // // Finish plotting the line
      // viewer.screenSpaceEventHandler.removeInputAction(
      //   ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      // );

      // // Update next point based on mouse current location
      // viewer.screenSpaceEventHandler.setInputAction(
      //   // (event: ScreenSpaceEventHandler.PositionedEvent) => {
      //   (event: ScreenSpaceEventHandler.MotionEvent) => {
      //     if (defined(floatingPoint)) {
      //       const ray = viewer.camera.getPickRay(event.endPosition);
      //       // Oopsies - Probably never get here, but need to handle undefined
      //       if(!ray) {
      //         console.error('Failed to get pick ray from camera position.');
      //         return; // Absconded into obscruity!!!! Begone into the depths of the void, null and the undefined!
      //       }
      //       const newPosition = viewer.scene.globe.pick(ray, viewer.scene);
      //       if (defined(newPosition)) {
      //         const convertedToPosition = new ConstantPositionProperty(newPosition);
      //         setFloatingPoint(convertedToPosition);
      //         setActiveShapePoints((previous) => {
      //           previous.pop();
      //           previous.push(newPosition);
      //           return previous;
      //         });
      //       }
      //     }
      //   }, ScreenSpaceEventType.MOUSE_MOVE);

      // Begin/Continue plotting the line
      viewer.screenSpaceEventHandler.setInputAction(
        (event: ScreenSpaceEventHandler.PositionedEvent) => {
          const ray = viewer.camera.getPickRay(event.position);
          // Oopsies - Probably never get here, but need to handle undefined
          if(!ray) {
            console.error('Failed to get pick ray from camera position.');
            return; // Absconded into obscruity!!!! Begone into the depths of the void, null and the undefined!
          }
          const earthPosition = viewer.scene.globe.pick(ray, viewer.scene);
          if (defined(earthPosition)) {
            // Create new active shape + init
            if (activeShapePointsRef.current.length === 0) {
              floatingPointRef.current = addPointEntity(viewer, earthPosition).position ?? new ConstantPositionProperty;
              activeShapePointsRef.current.push(earthPosition);
              
              const dynamicPositions = new CallbackProperty(() => activeShapePointsRef.current, false);
              
              activeShapeRef.current = addLineEntity(viewer, dynamicPositions);
            }
            activeShapePointsRef.current.push(earthPosition);
            addPointEntity(viewer, earthPosition);
          }
        }, ScreenSpaceEventType.LEFT_CLICK
      );

      const resetShapeEntityAndPoints = () => {
        // Reset floatingPoint if we were using it... fine
        floatingPointRef.current = new ConstantPositionProperty();
        // Reset activeShape, to be ready for the next ???
        activeShapeRef.current = new Entity();
        // Reset Cartesian3[], remove all points
        activeShapePointsRef.current.length = 0;
      };

      const deleteLine = (event: ScreenSpaceEventHandler.PositionedEvent) => {
        addLineEntity(viewer, new CallbackProperty(() => activeShapePointsRef.current, false));
        // Remove all Points from viewer
        viewer.entities.removeAll();

        resetShapeEntityAndPoints();
      };

      const commitLine = (event: ScreenSpaceEventHandler.PositionedEvent) => {
        // Create independent var with shape points
        const committedPoints = [...activeShapePointsRef.current];

        // Create new line with independent var
        addLineEntity(viewer, committedPoints);

        // Remove only Point Entities from viewer
        viewer.entities.values
          .filter(e => e.point !== undefined)
          .forEach(entity => {
            viewer.entities.remove(entity)
          });


        // Remove ref for the temporary line (we just published points we're keeping)
        viewer.entities.remove(activeShapeRef.current);

        resetShapeEntityAndPoints();
      };

      const originalTerminateLine = (event: ScreenSpaceEventHandler.PositionedEvent) => {
        // We pop() to remove the latest floatingPoint (if we're adding it)
        activeShapePointsRef.current.pop();

        // Using Cartesian[] re-Draw after the latest pop()
        addLineEntity(viewer, new CallbackProperty(() => activeShapePointsRef.current, false));

        // Remove last Entity from viewer ??? Why remove our shape ???
        viewer.entities.remove(activeShapeRef.current);

        resetShapeEntityAndPoints();
      };

      // terminate - what do we want to do
      // Allow only 1 line, so we remove everything and start again
      // Make an additional line ??? We need more storage to preserve the 1st line and one for the next
      viewer.screenSpaceEventHandler.setInputAction(
        // deleteLine
        commitLine
        // originalTerminateLine
        , ScreenSpaceEventType.RIGHT_CLICK);
    }

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    }
  }, []);

  return (
    <div>
      <h2>{DrawOnWorldTerrain.name} example</h2>
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

export default DrawOnWorldTerrain