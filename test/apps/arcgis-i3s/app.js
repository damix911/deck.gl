import {loadArcGISModules} from '@deck.gl/arcgis';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader} from '@loaders.gl/i3s';

// SF
const longitude = -122.4194;
const latitude = 37.7749;
const zoom = 14;

// RC
// const longitude = -117.5931;
// const latitude = 34.1064;
// const zoom = 14;

loadArcGISModules(['esri/Map', 'esri/views/SceneView', 'esri/views/3d/externalRenderers']).then(
  ({DeckLayer, DeckRenderer, modules}) => {
    const [ArcGISMap, SceneView, externalRenderers] = modules;

    const sceneView = new SceneView({
      container: 'viewDiv',
      qualityProfile: 'high',
      map: new ArcGISMap({
        basemap: 'dark-gray-vector'
      }),
      environment: {
        atmosphereEnabled: false
      },
      camera: {
        position: {
          x: longitude,
          y: latitude,
          z: 10000
        },

        // tilt: 40
      },
      viewingMode: 'local'
    });

    const renderer = new DeckRenderer(sceneView, {
      layers: [
        new Tile3DLayer({
          id: 'tile-3d-layer',
          // Tileset entry point: Indexed 3D layer file url
          data:
            `https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Rancho_Mesh_mesh_v17_1/SceneServer/layers/0`,
          // data:
          //   'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
          loader: I3SLoader,
          onTilesetLoad: tileset => {
            const { cartographicCenter } = tileset;
            const [longitude, latitude] = cartographicCenter;
            sceneView.goTo({ center: [longitude, latitude] });
          }
        })
      ]
    });

    externalRenderers.add(sceneView, renderer);
  }
);
