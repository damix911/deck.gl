/* global document, esri */

import { Deck, MapView as DeckMapView } from "@deck.gl/core";
import { ScatterplotLayer } from '@deck.gl/layers';

// In this sample app we loaded the ArcGIS JavaScript API
// using a <script> tag. We can access all the classes in
// the public API through the global require() function.
const globalRequire = window["require"];

globalRequire([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/Layer",
  "esri/views/2d/layers/BaseLayerViewGL2D",
  "esri/core/Handles"
],
function(
    Map,
    MapView
  ) {
  function getDeckLayer() {
    return new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: [
        {
          city: "My Point",
          coordinates: [
            -117.1825 + 0.005 * Math.cos(performance.now() * 0.001),
            34.0556 + 0.005 * Math.sin(performance.now() * 0.001)
          ]
        }
      ],
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getPosition: d => d.coordinates,
      getRadius: d => 50,
      getFillColor: d => [0, 200, 140],
      getLineColor: d => [200, 200, 200]
    });
  }

  // Add the map to the web page.
  const view = new MapView({
    container: "viewDiv",
    map: new Map({
      basemap: "streets-night-vector"
    }),
    center: [-117.1825, 34.0556],
    zoom: 14
  });

  var deck = new Deck({
    controller: false,
    views: new DeckMapView({id: 'mini-map'})
  });

  view.when().then(() => {
    // Animate the layer.
    setInterval(() => {
      deck.setProps({
        layers: [
          getDeckLayer()
        ],
        viewState: {
          latitude: view.center.latitude,
          longitude: view.center.longitude,
          zoom: view.featuresTilingScheme.scaleToLevel(view.state.scale),
          bearing: -view.state.rotation,
          pitch: 0
        }
      });
    }, 0);
  })
});
