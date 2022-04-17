import {DeckRenderer} from '@deck.gl/arcgis';
import {ScatterplotLayer} from '@deck.gl/layers';
import ArcGISMap from '@arcgis/core/Map';
import SceneView from '@arcgis/core/views/SceneView';
import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';

const sceneView = new SceneView({
  container: 'viewDiv',
  map: new ArcGISMap({
    basemap: 'dark-gray-vector'
  }),
  camera: {
    position: {x: 0.119, y: -60, z: 10000000},
    tilt: 60
  },
  viewingMode: 'local'
});

const renderer = new DeckRenderer(sceneView, {
  layers: [
    new ScatterplotLayer({
      data: [
        { position: [0.119, 52.205] }
      ],
      getPosition: d => d.position,
      getColor: [255, 0, 0],
      radiusMinPixels: 20
    })
  ]
});

externalRenderers.add(sceneView, renderer);
