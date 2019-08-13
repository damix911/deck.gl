/* global document, esri */

import { Deck } from "@deck.gl/core";
import { ScatterplotLayer } from '@deck.gl/layers';

// In this sample app we loaded the ArcGIS JavaScript API
// using a <script> tag. We can access all the classes in
// the public API through the global require() function.
const globalRequire = window["require"];

globalRequire([
  "esri/Map",
  "esri/views/MapView"
],
function(
    Map,
    MapView
  ) {
  // Returns a time-dependent scatterplot layer.
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

  // In the ArcGIS API for JavaScript the MapView is responsible
  // for displaying a Map, which usually contains at least a basemap.
  const view = new MapView({
    container: "viewDiv",
    map: new Map({
      basemap: "streets-night-vector"
    }),
    center: [-117.1825, 34.0556],
    zoom: 14
  });

  // We wait for the map view to be ready...
  view.when().then(() => {
    // ...then we create the deck...
    const deck = new Deck({
      controller: false,
      initialViewState: {}
    });
    
    // ...and we update the props at intervals of 10 milliseconds.
    setInterval(() => {
      deck.setProps({
        // The layer is time-dependent, so we need to call
        // getDeckLayer() repeatedly.
        layers: [
          getDeckLayer()
        ],

        // The view state must be kept in-sync with the MapView of the ArcGIS API.
        viewState: {
          latitude: view.center.latitude,
          longitude: view.center.longitude,
          zoom: view.featuresTilingScheme.scaleToLevel(view.state.scale),
          bearing: -view.state.rotation,
          pitch: 0
        }
      });
    }, 10);
  })
});
