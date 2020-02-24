import {loadArcGISModules} from '@deck.gl/arcgis';
import {GeoJsonLayer, ArcLayer} from '@deck.gl/layers';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

loadArcGISModules(['esri/Map', 'esri/views/SceneView', 'esri/views/3d/externalRenderers']).then(({ArcGISDeckExternalRenderer, modules}) => {
  const [ArcGISMap, SceneView, externalRenderers] = modules;
  
  const sceneView = new SceneView({
    container: "viewDiv",
    map: new ArcGISMap({
      basemap: "dark-gray-vector"
    }),
    environment: {
      atmosphereEnabled: false
    },
    center: [0.1278, 51.5074],
    camera: {
      position: {
        x: 0.1278,
        y: 30.5074,
        z: 10000000
      },

      tilt: 0
    },
    viewingMode: "local"
  });

  const extren = new ArcGISDeckExternalRenderer(sceneView, {
    deckLayers: [
      new GeoJsonLayer({
        id: 'airports',
        data: AIR_PORTS,
        // Styles
        filled: true,
        pointRadiusMinPixels: 2,
        pointRadiusScale: 2000,
        getRadius: f => 11 - f.properties.scalerank,
        getFillColor: [200, 0, 80, 180],
        // Interactive props
        pickable: false,
        autoHighlight: false

        // pickable: true,
        // autoHighlight: true,
        // onClick: info =>
        //   // eslint-disable-next-line
        //   info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
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
        getWidth: 10000000
      })
    ]
  });
  
  externalRenderers.add(sceneView, extren);
});
