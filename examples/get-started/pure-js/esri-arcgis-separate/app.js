/* global document, esri */

import { Deck } from "@deck.gl/core";
import { ScatterplotLayer } from '@deck.gl/layers';
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
      const canvas = document.createElement("canvas");
      canvas.style.border = "1px solid black";
      canvas.style.position = "absolute";
      canvas.style.left = "1000px";
      canvas.style.top = "1000px";
      document.body.appendChild(canvas);
      this.deckGLContext = canvas.getContext("webgl2", {
        preserveDrawingBuffer: true
      });






      const gl = this.context;

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      this.imageData = new Uint8Array(913 * 920 * 4);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 913, 920, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.imageData);
      // var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `
      attribute vec2 a_pos;

      varying vec2 v_texcoord;

      void main(void) {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_texcoord = (a_pos + 1.0) / 2.0;
      }
      `);
      gl.compileShader(vs);
      console.log(gl.getShaderInfoLog(vs));

      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, `
      precision mediump float;

      uniform sampler2D u_texture;

      varying vec2 v_texcoord;

      void main(void) {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
      `);
      gl.compileShader(fs);
      console.log(gl.getShaderInfoLog(fs));

      this.program = gl.createProgram();
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);
      console.log(gl.getProgramInfoLog(this.program));

      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);






      this.deck = new Deck({
        initialViewState: {},
        
        // Input is handled by the ArcGIS API for JavaScript.
        controller: false,

        // We use the same WebGL context as the ArcGIS API for JavaScript.
        gl: this.deckGLContext,
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
      // CAPTURE
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

      this.deckGLContext.readPixels(
        0,
        0,
        this.deckGLContext.canvas.width,
        this.deckGLContext.canvas.height,
        this.deckGLContext.RGBA,
        this.deckGLContext.UNSIGNED_BYTE,
        this.imageData
      );

      
      const gl = renderParameters.context;
      
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      // var data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      
      // var theImageData = new Uint8Array(913 * 920 * 4);
      // for (let i = 0; i < 913 * 920 * 4; ++i) {
      //   theImageData[i] = Math.floor(Math.random() * 256);
      // }
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 913, 920, 0, gl.RGBA, gl.UNSIGNED_BYTE, theImageData);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 913, 920, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.imageData);
      
      gl.bindTexture(gl.TEXTURE_2D, null);

      // BLIT
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(0, 2, gl.BYTE, false, 2, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      

      gl.useProgram(this.program);
      gl.uniform1i(gl.getUniformLocation(this.program, "u_texture"), 0);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
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
    // Returns a time-dependent scatterplot layer.
    getDeckLayer() {
      return new TripsLayer({
        // id: 'scatterplot-layer',
        // data: [
        //   {
        //     city: "My Point",
        //     coordinates: [
        //       -74 + 0.005 * Math.cos(performance.now() * 0.001),
        //       40.72 + 0.005 * Math.sin(performance.now() * 0.001)
        //     ]
        //   }
        // ],
        // stroked: true,
        // filled: true,
        // lineWidthMinPixels: 1,
        // getPosition: d => d.coordinates,
        // getRadius: d => 50,
        // getFillColor: d => [0, 200, 140],
        // getLineColor: d => [200, 200, 200]

        id: 'trips',
        data: './trips-v7.json',
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,
        getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
        opacity: 0.9,
        widthMinPixels: 2,
        rounded: true,
        trailLength: 1000,
        currentTime: performance.now() / 10.0,
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
    zoom: 10
  });
});
