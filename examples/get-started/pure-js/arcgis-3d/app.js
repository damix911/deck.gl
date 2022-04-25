import {DeckRenderer} from '@deck.gl/arcgis';
import ArcGISMap from '@arcgis/core/Map';
import Basemap from '@arcgis/core/Basemap';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import SceneView from '@arcgis/core/views/SceneView';
import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

// const basemap = "dark-gray-vector";
// const scaleFactor = 1;

// const basemap = "dark-gray";
// const scaleFactor = 2;

const basemap = "satellite";
const scaleFactor = 2;

// const basemap = "topo-vector";
// const scaleFactor = 2;

// const basemap = "topo";
// const scaleFactor = 2;

// const basemap = new Basemap({
//   baseLayers: [new VectorTileLayer({ url: "https://www.arcgis.com/sharing/rest/content/items/75f4dfdff19e445395653121a95a85db/resources/styles/root.json" })]
// });
// const scaleFactor = 1;

// const basemap = "streets-vector";
// const scaleFactor = 1;

// const basemap = new Basemap({
//   baseLayers: [new VectorTileLayer({ url: "https://www.arcgis.com/sharing/rest/content/items/effe3475f05a4d608e66fd6eeb2113c0/resources/styles/root.json" })]
// });
// const scaleFactor = 1;

const view = new SceneView({
  container: 'viewDiv',
  map: new ArcGISMap({
    basemap
  }),
  camera: {
    position: [0, -20, 10000000],
    heading: 20,
    tilt: 40
  },
  zoom: 5,
  viewingMode: 'local'
});

const renderer = new DeckRenderer(view, {
  scaleFactor,
  layers: [
    new GeoJsonLayer({
      id: 'airports',
      data: AIR_PORTS,
      // Styles
      filled: true,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 2000,
      getPointRadius: f => 11 - f.properties.scalerank,
      getFillColor: [200, 0, 80, 180],
      // Interactive props
      pickable: true,
      autoHighlight: true,
      onClick: info =>
        info.object &&
        // eslint-disable-next-line
        alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
    }),
    new ArcLayer({
      id: 'arcs',
      data: AIR_PORTS,
      dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
      // Styles
      getSourcePosition: f => [-0.4531566, 51.4709959], // London
      getTargetPosition: f => f.geometry.coordinates,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      getWidth: 1
    })
  ]
});

externalRenderers.add(view, renderer);
