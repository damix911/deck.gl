/* global document, esri */

import { Deck } from "@deck.gl/core";
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
      this.handles = new Handles();
    },
  
    attach: function() {
      this.deck = new Deck({
        _customRender: redrawReason => this.deck._drawLayers(redrawReason, { clearCanvas: false }),
        gl: this.context,
        controller: false,
        autoResizeDrawingBuffer: false,
        initialViewState: {}
      });
  
      this.handles.add([
        this.layer.on("redraw", () => {
          this.redraw();
        })
      ]);
  
      this.redraw();
    },
  
    redraw: function () {
      let deckLayer = this.layer.getDeckLayer();
  
      if (!Array.isArray(deckLayer)) {
        deckLayer = [deckLayer];
      }
  
      this.deck.setProps({
        layers: deckLayer
      });
  
      this.requestRender();
    },
  
    detach: function () {
      this.deck = null;
      this.handles.removeAll();
    },
  
    render: function(renderParameters) {
      const state = renderParameters.state;
  
      this.deck.setProps({
        viewState: {
          latitude: this.view.center.latitude,
          longitude: this.view.center.longitude,
          zoom: this.view.featuresTilingScheme.scaleToLevel(state.scale),
          bearing: -state.rotation,
          pitch: 0
        }
      });
  
      this.deck.redraw(true);
    }
  });
  
  // A layer that displays inside a MapView using an instance
  // of the layer view defined above.
  const EsriDeckLayer = Layer.createSubclass({
    properties: {
      getDeckLayer: {}
    },
  
    redraw: function () {
      this.emit("redraw");
    },
  
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
  const layer = new EsriDeckLayer({
    getDeckLayer() {
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
  });

  // Animate the layer.
  setInterval(() => {
    layer.redraw();
  }, 20);

  // Add the map to the web page.
  const view = new MapView({
    container: "viewDiv",
    map: new Map({
      basemap: "streets-night-vector",
      layers: [layer]
    }),
    center: [-117.1825, 34.0556],
    zoom: 14
  });
});
