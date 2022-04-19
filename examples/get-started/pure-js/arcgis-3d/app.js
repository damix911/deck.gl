import {DeckRenderer} from '@deck.gl/arcgis';
import {ScatterplotLayer} from '@deck.gl/layers';
import ArcGISMap from '@arcgis/core/Map';
import SceneView from '@arcgis/core/views/SceneView';
import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';

const view = new SceneView({
  container: 'viewDiv',
  map: new ArcGISMap({
    basemap: 'dark-gray-vector'
  }),
  camera: {
    // position: {x: 0.119, y: 52.2055, z: 500},
    // tilt: 0,

    position: {x: 0.119, y: 52.2045, z: 500},
    tilt: 20

    // position: {x: -77.0365, y: 38.8977, z: 500 },
    // tilt: 20
  },
  viewingMode: 'local'
});

// setTimeout(() => {
//   view.goTo({
//     tilt: view.camera.tilt - 10
//   });
// }, 5000);

const renderer = new DeckRenderer(view, {
  layers: [
    new ScatterplotLayer({
      data: [
        { position: [0.118747, 52.205150] },
        { position: [0.118835, 52.205081] },
        { position: [0.119417, 52.205121] },
        { position: [0.119441, 52.205167] },
        { position: [0.119348, 52.205665] },
        { position: [0.119213, 52.205752] },
        { position: [0.118921, 52.205620] },
        { position: [0.118709, 52.205559] },
        { position: [0.118696, 52.205500] },
        { position: [0.118752, 52.205160] }
      ],
      getPosition: d => d.position,
      getColor: [255, 0, 0],
      radiusMinPixels: 2
    })
  ]
});

externalRenderers.add(view, renderer);
