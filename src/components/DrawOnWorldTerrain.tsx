import { useEffect, useRef, useState } from 'react'
import {
  Ion, Terrain, Viewer, Math as CesiumMath, Cartesian3, 
  ScreenSpaceEventHandler, ScreenSpaceEventType, defined, 
  Color, HeightReference, CallbackProperty, 
  Entity, PositionProperty, ConstantPositionProperty,
} from 'cesium';
// import 'cesium/Build/Cesium/Widgets/widgets.css';

// https://sandcastle.cesium.com/?src=Drawing%20on%20Terrain.html
// https://cesium.com/learn/cesiumjs/ref-doc/Entity.html
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

const DrawOnWorldTerrain = () => {
  const worldLocationInfo: WorldLocationInfo = {
    LONGITUDE: lopburi.LONGITUDE,
    LATITUDE: lopburi.LATITUDE,
    HEIGHT: lopburi.HEIGHT,
    Heading: lopburi.Heading,
    Pitch: lopburi.Pitch,
    Roll: lopburi.Roll,
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const activeShapePointsRef = useRef<Cartesian3[]>([]);
  const floatingPointRef = useRef<PositionProperty>(new ConstantPositionProperty());
  const activeShapeRef = useRef<Entity>(new Entity());

  const drawPoint = (viewer: Viewer, worldPosition: Cartesian3) => {
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

  const drawLine = (
    viewer: Viewer,
    points: CallbackProperty | Cartesian3[],
    colour?: Color
  ) => {
    const line = viewer.entities.add({
      polyline: {
        positions: points,
        clampToGround: true,
        width: 3,
        material: colour ?? Color.WHITE,
      },
    });

    return line;
  };

  useEffect(() => {
    // Ensure the Cesium Ion access token is set from environment variables
    // This is necessary for accessing terrain and other Cesium Ion services
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
    if (!Ion.defaultAccessToken) {
      console.error('>>> Cesium Ion access token is not set. Please set the VITE_CESIUM_ION_ACCESS_TOKEN environment variable.');
    }

    document.title = `${DrawOnWorldTerrain.name} - Lopburi`;
    const viewer = new Viewer('cesiumContainer', {
      terrain: Terrain.fromWorldTerrain(),
    });

    const removeEventListener = viewer.scene.globe.tileLoadProgressEvent
      .addEventListener(() => setIsLoading(false));

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

      const updateFloatingPoint = (event: ScreenSpaceEventHandler.MotionEvent) => {
          if (defined(floatingPointRef.current)) {
            const ray = viewer.camera.getPickRay(event.endPosition);
            if(!ray) { // Big Oopsies - Shouldnt ever be here
              console.error('Failed to get pick ray from camera position.');
              return;
            }
            const newPosition = viewer.scene.globe.pick(ray, viewer.scene);
            if (defined(newPosition)) {
              const convertedToPosition = new ConstantPositionProperty(newPosition);
              floatingPointRef.current = convertedToPosition;
              if (activeShapePointsRef.current.length > 0) {
                activeShapePointsRef.current.pop(); // comment this guy and experience true artistry ;)
                activeShapePointsRef.current.push(newPosition);
              }
            }
          }
        };

      const plotNewLineWithPoint = (event: ScreenSpaceEventHandler.PositionedEvent) => {
          const ray = viewer.camera.getPickRay(event.position);
          if(!ray) { // Big Oopsies - Shouldnt ever be here
            console.error('Failed to get pick ray from camera position.');
            return;
          }
          const earthPosition = viewer.scene.globe.pick(ray, viewer.scene);
          if (defined(earthPosition)) {
            // Create new active shape + init
            if (activeShapePointsRef.current.length === 0) {
              floatingPointRef.current = drawPoint(viewer, earthPosition).position ?? new ConstantPositionProperty();
              activeShapePointsRef.current.push(earthPosition);
              
              const dynamicPositions = new CallbackProperty(() => activeShapePointsRef.current, false);
              activeShapeRef.current = drawLine(viewer, dynamicPositions);
            }
            activeShapePointsRef.current.push(earthPosition);
            drawPoint(viewer, earthPosition);
          }
        };

      const removePoints = (viewer: Viewer) =>
        viewer.entities.values
          .filter(e => e.point !== undefined)
          .forEach(e => viewer.entities.remove(e));

      const resetShapeEntityAndPoints = () => {
        // Reset floatingPoint to undefined value
        floatingPointRef.current = new ConstantPositionProperty();
        // Remove entity for the temp ref for the active shape
        viewer.entities.remove(activeShapeRef.current);
        // Reset Entity, used for drawing the activeShape
        activeShapeRef.current = new Entity();
        // Reset Cartesian3[], remove all points
        activeShapePointsRef.current.length = 0;
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const commitCurrentLine = (_event: ScreenSpaceEventHandler.PositionedEvent) => {
        // To undo the last point of contact for the line when RightClicked
        activeShapePointsRef.current.pop();
        // Create independent var to persist shape points (outside of local ref)
        const committedPoints = [...activeShapePointsRef.current];
        // Persist our current line via our independent var (before resetting ref)
        drawLine(viewer, committedPoints);
        // Points are here only to show user what is not yet committed
        removePoints(viewer);
        // Cleanup
        resetShapeEntityAndPoints();
      };
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const deleteCurrentLine = (_event: ScreenSpaceEventHandler.PositionedEvent) => {
        removePoints(viewer);
        resetShapeEntityAndPoints();
      };

      // const deleteAllLines = (event: ScreenSpaceEventHandler.PositionedEvent) => {
      //   viewer.entities.removeAll();
      //   resetShapeEntityAndPoints();
      // };

      viewer.screenSpaceEventHandler
        .setInputAction(updateFloatingPoint, ScreenSpaceEventType.MOUSE_MOVE);
      viewer.screenSpaceEventHandler
        .setInputAction(plotNewLineWithPoint, ScreenSpaceEventType.LEFT_CLICK);
      viewer.screenSpaceEventHandler
        .setInputAction(commitCurrentLine, ScreenSpaceEventType.RIGHT_CLICK);
      viewer.screenSpaceEventHandler
        .setInputAction(deleteCurrentLine, ScreenSpaceEventType.MIDDLE_CLICK);
    }

    return () => {
      if (viewer) {
        removeEventListener();
        viewer.screenSpaceEventHandler
          .removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        viewer.screenSpaceEventHandler
          .removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        viewer.screenSpaceEventHandler
          .removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
        viewer.screenSpaceEventHandler
          .removeInputAction(ScreenSpaceEventType.MIDDLE_CLICK);
        viewer.destroy();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ui = () => (
    <div>
      <h2>{DrawOnWorldTerrain.name} 3D Line (LEFT = Make point, RIGHT = Commit line)</h2>
    </div>
  );

  return (
    <>
      {isLoading
        ? <h1>loading...</h1>
        : ui()
      }
      <div id="cesiumContainer" />
    </>
  )
}

export default DrawOnWorldTerrain