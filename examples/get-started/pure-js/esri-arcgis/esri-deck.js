/**
 * esriDeck.js is an experimental library for creating ArcGIS JavaScript API
 * custom layers based on deck.gl.
 */

// import { registerLoaders } from '@loaders.gl/core';
// import { GLTFScenegraphLoader } from '@luma.gl/addons';
// import TestLayer from "./esri-deck-layers/test-layer";

import {
  Deck,
  Layer,
  CompositeLayer,
} from "@deck.gl/core";

import {
  ArcLayer,
  BitmapLayer,
  ColumnLayer,
  GeoJsonLayer,
  GridCellLayer,
  IconLayer,
  LineLayer,
  PathLayer,
  PointCloudLayer,
  PolygonLayer,
  ScatterplotLayer,
  SolidPolygonLayer,
  TextLayer,
} from '@deck.gl/layers';

// import {
//   GreatCircleLayer,
//   H3ClusterLayer,
//   H3HexagonLayer,
//   S2Layer,
//   TileLayer,
//   TripsLayer
// } from "@deck.gl/geo-layers";

// import {
//   ContourLayer,
//   CPUGridLayer,
//   GPUGridLayer,
//   GridLayer,
//   HexagonLayer,
//   ScreenGridLayer
// } from '@deck.gl/aggregation-layers';

// import {
//   ScenegraphLayer,
//   SimpleMeshLayer
// } from '@deck.gl/mesh-layers';

/**
 * The 'layers' namespace contain all the official deck.gl layers that ships with
 * the npm package.
 *
 * The 'layers.esri' namespace contains additional deck.gl layers made by Esri; at
 * present time it only contains a fork of the official 'ScatterplotLayer' called
 * 'TestLayer'.
 */
export const layers = {
  Layer,
  CompositeLayer,
  ArcLayer,
  BitmapLayer,
  ColumnLayer,
  // ContourLayer,
  GeoJsonLayer,
  IconLayer,
  LineLayer,
  PathLayer,
  PointCloudLayer,
  PolygonLayer,
  SolidPolygonLayer,
  ScatterplotLayer,
  TextLayer,
  // GPUGridLayer,
  // GreatCircleLayer,
  // CPUGridLayer,
  GridCellLayer,
  // HexagonLayer,
  // H3ClusterLayer,
  // H3HexagonLayer,
  // GridLayer,
  // S2Layer,
  // ScenegraphLayer,
  // ScreenGridLayer,
  // SimpleMeshLayer,
  // TileLayer,
  // TripsLayer,
  // esri: {
  //   TestLayer
  // }
};

// /**
//  * The 'loaders' namespace re-exports utilities from luma.gl and loaders.gl
//  * that can be used to load custom 3D models. Useful when using ScenegraphLayer.
//  * 
//  */
// export const loaders = {
//   registerLoaders,
//   GLTFScenegraphLoader
// };

/**
 * We load some asynchronous dependencies on Esri classes using window.require.
 * The references to those classes are stored in these variables.
 */
let _Layer;              // The esri.layers.Layer class.
let _BaseLayerViewGL2D;  // The esri.views.2d.layers.BaseLayerViewGL2D class.
let _Handles;            // The esri.core.Handles class.

/**
 * The new layer type exported by this library. It is a deck.gl-based ArcGIS layer.
 */
export let EsriDeckLayer;

/**
 * The GL-based layer view of an EsriDeckLayer instance.
 */
export let EsriDeckLayerView2D;

/**
 * The 'ready' promise resolves when the library has completed initialization.
 */
export const ready = new Promise((resolve) => {
  window["require"](["esri/layers/Layer", "esri/views/2d/layers/BaseLayerViewGL2D", "esri/core/Handles"], function (__Layer, __BaseLayerViewGL2D, __Handles) {
    _Layer = __Layer;
    _BaseLayerViewGL2D = __BaseLayerViewGL2D;
    _Handles = __Handles;
    
    EsriDeckLayerView2D = _BaseLayerViewGL2D.createSubclass({
      properties: {
        deck: {},
        handles: {}
      },
    
      constructor: function() {
        this.handles = new _Handles();
      },
    
      attach: function() {
        this.deck = new Deck({
          _customRender: redrawReason => this.deck._drawLayers(redrawReason, { clearCanvas: false }),
          gl: this.context,
          controller: false
        });
    
        this.handles.add([
          this.layer.on("redraw", () => {
            this.redraw();
          })
        ]);
    
        this.redraw();
      },
    
      redraw: function () {
        var deckLayer = this.layer.getDeckLayer();
    
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
    
    EsriDeckLayer = _Layer.createSubclass({
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

    resolve();
  });
});
