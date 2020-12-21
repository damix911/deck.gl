import { ScatterplotLayer } from '@deck.gl/layers';
import { loadArcGISModules } from '@deck.gl/arcgis';

const DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json';

function renderLayers() {
  return [
    new ScatterplotLayer({
      id: 'ScatterplotLayer',
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-stations.json',
      getFillColor: [255, 140, 0],
      getLineColor: [0, 0, 0],
      getPosition: d => d.coordinates,
      getRadius: d => Math.sqrt(d.exits),
      lineWidthMinPixels: 1,
      radiusMaxPixels: 100,
      radiusMinPixels: 1,
      radiusScale: 6,
      stroked: true,
      opacity: 0.8,
      pickable: true
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
    center: [-122.4194, 37.7749],
    zoom: 10
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
      position: {
        x: -122.4194,
        y: 37.7749,
        z: 80000
      },

      tilt: 0
    },
    viewingMode: 'local'
  });

  const renderer = new DeckRenderer(sceneView, {});

  externalRenderers.add(sceneView, renderer);

  layer.deck.layers = renderLayers();
  renderer.deck.layers = renderLayers();
});
