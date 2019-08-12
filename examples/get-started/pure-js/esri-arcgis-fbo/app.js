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
      const gl = this.context;

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 640, 360, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(640 * 360 * 4));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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
        _customRender: redrawReason => this.deck._drawLayers(redrawReason, { clearCanvas: false }),
        gl: gl,
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
      const gl = renderParameters.context;

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
  
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      this.deck.redraw(true);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      

      // gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      // gl.vertexAttribPointer(0, 2, gl.BYTE, false, 2, 0);
      // gl.bindBuffer(gl.ARRAY_BUFFER, null);
      

      // gl.useProgram(this.program);
      // gl.uniform1i(gl.getUniformLocation(this.program, "u_texture"), 0);
      // gl.activeTexture(gl.TEXTURE0 + 0);
      // gl.bindTexture(gl.TEXTURE_2D, this.texture);

      // gl.enableVertexAttribArray(0);
      // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
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
