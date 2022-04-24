import {DeckRenderer} from '@deck.gl/arcgis';
import ArcGISMap from '@arcgis/core/Map';
import SceneView from '@arcgis/core/views/SceneView';
import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const view = new SceneView({
  container: 'viewDiv',
  map: new ArcGISMap({
    basemap: 'dark-gray-vector'
  }),
  center: [0.119167, 52.205276],
  zoom: 5,
  viewingMode: 'local'
});

const renderer = new DeckRenderer(view, {
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
