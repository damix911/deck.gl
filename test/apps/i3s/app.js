import {ScatterplotLayer} from '@deck.gl/layers';
import {Deck} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader} from '@loaders.gl/i3s';

const longitude = -122.4194;
const latitude = 37.7749;
const zoom = 14;

const scatterplot = new ScatterplotLayer({
  id: 'scatterplot-layer',
  data: [{ coordinates: [longitude, latitude] }],
  pickable: true,
  opacity: 0.8,
  stroked: true,
  filled: true,
  radiusScale: 6,
  radiusMinPixels: 1,
  radiusMaxPixels: 100,
  lineWidthMinPixels: 1,
  getPosition: d => d.coordinates,
  getRadius: d => 10,
  getFillColor: d => [255, 140, 0],
  getLineColor: d => [0, 0, 0]
});

const tiles = new Tile3DLayer({
  id: 'tile-3d-layer',
  // Tileset entry point: Indexed 3D layer file url
  data:
    'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
  loader: I3SLoader
});

const deck = new Deck({
  initialViewState: {
    longitude,
    latitude,
    zoom
  },
  controller: true,
  layers: [
    tiles,
    scatterplot
  ]
});