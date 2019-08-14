/* global document, esri */

import { Deck } from "@deck.gl/core";
import { TripsLayer } from '@deck.gl/geo-layers';

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
    MapView,
    Layer,
    BaseLayerViewGL2D,
    Handles
  ) {
  // Layer view that delegates rendering to a deck.gl instance.
  const EsriDeckLayerView2D = BaseLayerViewGL2D.createSubclass({
    properties: {
      deck: {},
      handles: {}
    },
  
    constructor: function() {
      // Handles are used to keep track of the properties
      // and events we start listening to.
      this.handles = new Handles();
    },
  
    // Attach is called as soon as the layer view is ready to start rendering.
    attach: function() {
      this.deck = new Deck({
        initialViewState: {},

        // We don't want the backbuffer to be cleared because it is where
        // the ArcGIS API for JavaScript has already rendered a map; we
        // want to keep drawing on top of it.
        _customRender: redrawReason => this.deck._drawLayers(redrawReason, { clearCanvas: false }),
        
        // Input is handled by the ArcGIS API for JavaScript.
        controller: false,

        // We use the same WebGL context as the ArcGIS API for JavaScript.
        gl: this.context,

        // This must be set to false or the we may experience flickering for certain
        // viewport sizes with non-1 pixel ratios.
        autoResizeDrawingBuffer: false
      });
  
      // The redraw() request must be forwarded from the layer to the layer view.
      // We listen to the event on the layer and propagate it to the layer view.
      this.handles.add([
        this.layer.on("redraw", () => {
          this.redraw();
        })
      ]);
  
      // We need to start drawing the deck.gl layer immediately.
      this.redraw();
    },
  
    // This method is called whenever the deck.gl layer changes and must be
    // displayed.
    redraw: function () {
      let deckLayer = this.layer.getDeckLayer();
  
      if (!Array.isArray(deckLayer)) {
        deckLayer = [deckLayer];
      }
  
      this.deck.setProps({
        layers: deckLayer
      });

      // We need to tell the layer view that it must redraw itself.
      this.requestRender();
    },
  
    // Called when the layer must be destroyed.
    detach: function () {
      this.deck = null;
      this.handles.removeAll();
    },
  
    // Called every time that the layer view must be rendered.
    render: function(renderParameters) {
      const state = renderParameters.state;
  
      // The view state must be kept in-sync with the MapView of the ArcGIS API.
      this.deck.setProps({
        viewState: {
          latitude: this.view.center.latitude,
          longitude: this.view.center.longitude,
          zoom: this.view.featuresTilingScheme.scaleToLevel(state.scale),
          bearing: -state.rotation,
          pitch: 0
        }
      });
  
      // We redraw the deck immediately.
      this.deck.redraw(true);
    }
  });
  
  // A layer that displays inside a MapView using an instance
  // of the layer view defined above.
  const EsriDeckLayer = Layer.createSubclass({
    properties: {
      getDeckLayer: {}
    },
  
    // Calling redraw() on the layer causes redraw() to
    // be called on the layer view.
    redraw: function () {
      this.emit("redraw");
    },
  
    // Called by the MapView whenever a layer view
    // needs to be created for a given layer.
    createLayerView: function(view) {
      if (view.type === "2d") {
        return new EsriDeckLayerView2D({
          view: view,
          layer: this
        });
      }
    }
  });
  
  // We use this new layer class to wrap a deck.gl layer.
  // The deck.gl layer is the result of a callback.
  const layer = new EsriDeckLayer({
    getDeckLayer() {
      const loopLength = 1800;
      const animationSpeed = 30;
      const timestamp = Date.now() / 1000;
      const loopTime = loopLength / animationSpeed;
      let currentTime = ((timestamp % loopTime) / loopTime) * loopLength;
      
      return new TripsLayer({
        id: "trips",
        data: "https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips-v7.json",
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
  });

  // Animate the layer.
  setInterval(() => {
    layer.redraw();
  }, 10);

  // In the ArcGIS API for JavaScript the MapView is responsible
  // for displaying a Map, which usually contains at least a basemap.
  const view = new MapView({
    container: "viewDiv",
    map: new Map({
      basemap: "streets-night-vector",
      layers: [layer]
    }),
    center: [-74, 40.72],
    zoom: 14
  });
});
