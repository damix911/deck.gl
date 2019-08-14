/* global document, esri */

import { Deck } from "@deck.gl/core";
import { TripsLayer } from '@deck.gl/geo-layers';

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
  function getDeckLayer() {
    const loopLength = 1800;
    const animationSpeed = 30;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;
    let currentTime = ((timestamp % loopTime) / loopTime) * loopLength;
    
    return new TripsLayer({
      id: 'trips',
      data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips-v7.json',
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
      opacity: 1.0,
      widthMinPixels: 4,
      rounded: true,
      trailLength: 180,
      currentTime,
      shadowEnabled: false
    });
  }

  // In the ArcGIS API for JavaScript the MapView is responsible
  // for displaying a Map, which usually contains at least a basemap.
  const view = new MapView({
    container: "viewDiv",
    map: new Map({
      basemap: "streets-night-vector"
    }),
    center: [-74, 40.72],
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
