import {loadArcGISModules} from '@deck.gl/arcgis';
import {TripsLayer} from '@deck.gl/geo-layers';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips-v7.json';

function renderLayers() {
  return [
    new TripsLayer({
      id: 'trips',
      data: DATA_URL,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
      opacity: 1.0,
      widthMinPixels: 10,
      rounded: true,
      trailLength: 180,
      currentTime: (Date.now() % 10000) / 10,
      shadowEnabled: false
    })
  ];
}

loadArcGISModules([
  'esri/Map',
  'esri/views/MapView',
  'esri/views/SceneView',
  'esri/views/3d/externalRenderers'
]).then(({DeckLayer, DeckRenderer, modules}) => {
  const [ArcGISMap, MapView, SceneView, externalRenderers] = modules;

  // window.position = [0, 0, 5500];

  const layer = new DeckLayer({});

  // In the ArcGIS API for JavaScript the MapView is responsible
  // for displaying a Map, which usually contains at least a basemap.
  // eslint-disable-next-line
  const mapView = new MapView({
    container: 'mapViewDiv',
    map: new ArcGISMap({
      basemap: 'dark-gray-vector',
      layers: [layer]
    }),
    center: [-74, 40.72],
    zoom: 14
  });

  const sceneView = new SceneView({
    container: 'sceneViewDiv',
    qualityProfile: 'high',
    map: new ArcGISMap({
      basemap: 'dark-gray-vector'
    }),
    environment: {
      atmosphereEnabled: false
    },
    camera: {
      // position: {
      //   x: -74.56913418106207,
      //   y: 34.67944198112559,
      //   z: 306584.13835269737
      // },
      // tilt: 78.00556355941576,

      position: {
        longitude: -74.0060,
        latitude: 40.7128,
        z: 10000
      },
      tilt: 0,

      heading: 348.0400537930362
    },
    viewingMode: 'local'
  });

  const renderer = new DeckRenderer(sceneView, {});

  externalRenderers.add(sceneView, renderer);

  /* global setInterval */
  setInterval(() => {
    layer.deck.layers = renderLayers();
    renderer.deck.layers = renderLayers();

    // console.log(sceneView.camera.position.latitude, sceneView.camera.position.longitude, sceneView.camera.position.z, sceneView.camera.tilt, sceneView.camera.heading);
  }, 50);
});
