/* eslint-disable no-invalid-this */

import {Deck, MapView, FirstPersonView} from '@deck.gl/core';
import {Model, Buffer, Framebuffer, instrumentGLContext, withParameters} from '@luma.gl/core';

export function initializeResources(gl, is3D) {
  instrumentGLContext(gl);

  this.buffer = new Buffer(gl, new Int8Array([-1, -1, 1, -1, -1, 1, 1, 1]));

  this.model = new Model(gl, {
    vs: `
      attribute vec2 a_pos;
      varying vec2 v_texcoord;
      void main(void) {
          gl_Position = vec4(a_pos, 0.0, 1.0);
          v_texcoord = (a_pos + 1.0) / 2.0;
      }
    `,
    fs: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_texcoord;
      void main(void) {
          vec4 rgba = texture2D(u_texture, v_texcoord);
          rgba.rgb *= rgba.a;
          gl_FragColor = rgba;
      }
    `,
    attributes: {
      a_pos: this.buffer
    },
    vertexCount: 4,
    drawMode: gl.TRIANGLE_STRIP
  });

  this.deckFbo = new Framebuffer(gl, {width: 1, height: 1});

  this.deckView = is3D ? new FirstPersonView({ near: 1, far: 50000 }) : new MapView();

  this.deckInstance = new Deck({
    views: [this.deckView],

    // Seems like I need to specify an initial view state, or
    // I get a byzantine @math.gl/web-mercator assertion failed
    // once in a while.
    initialViewState: {
      latitude: 40.65,
      longitude: -74,
      position: [0, 0, 5000],
      zoom: 0,
      pitch: 90
    },

    // Input is handled by the ArcGIS API for JavaScript.
    controller: false,

    // We use the same WebGL context as the ArcGIS API for JavaScript.
    gl,

    // We need depth testing in general; we don't know what layers might be added to the deck.
    parameters: {
      depthTest: true
    },

    // This deck renders into an auxiliary framebuffer.
    _framebuffer: this.deckFbo,

    _customRender: redrawReason => {
      if (redrawReason === 'arcgis') {
        this.deckInstance._drawLayers(redrawReason);
      } else {
        this.redraw();
      }
    }
  });
}

export function render({gl, width, height, viewState, fovy}) {
  const screenFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (fovy != null && this.deckView instanceof FirstPersonView) {
    this.deckInstance.setProps({
      views: [new FirstPersonView({ near: 1, far: 10000, fovy })] // WIP!
    });
  }
  
  /* global window */
  const dpr = window.devicePixelRatio;
  width = Math.round(width * dpr);
  height = Math.round(height * dpr);

  this.deckFbo.resize({width, height});

  this.deckInstance.setProps({viewState});
  // redraw deck immediately into deckFbo
  this.deckInstance.redraw('arcgis');

  // We overlay the texture on top of the map using the full-screen quad.
  withParameters(
    gl,
    {
      blend: true,
      blendFunc: [gl.ONE, gl.ONE_MINUS_SRC_ALPHA],
      framebuffer: screenFbo,
      viewport: [0, 0, width, height]
    },
    () => {
      this.model.setUniforms({u_texture: this.deckFbo}).draw();
    }
  );
}

export function finalizeResources() {
  if (this.deckInstance) {
    this.deckInstance.finalize();
    this.deckInstance = null;
  }

  if (this.model) {
    this.model.delete();
  }

  if (this.buffer) {
    this.buffer.delete();
  }

  if (this.deckFbo) {
    this.deckFbo.delete();
  }
}
