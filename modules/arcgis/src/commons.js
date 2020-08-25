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

  this.deckInstance = new Deck({
    views: [is3D ? new FirstPersonView({ near: 1, far: 10000/*, latitude: 40.65, longitude: -74*/ }) : new MapView()],

    initialViewState: {
      latitude: 40.65,
      longitude: -74,
      position: [0, 0, 5000],
      zoom: 0,
      pitch: 90
    },

    // The view state will be set dynamically to track the MapView current extent.
    // viewState: {},

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

// export function getArcGISFov(deckInstance) {
//   if (!deckInstance) {
//     return 35;
//   }

//   const viewManager = deckInstance && deckInstance.viewManager;

//   if (!viewManager) {
//     return 35;
//   }

//   const view0 = viewManager && viewManager.views[0];

//   if (!view0) {
//     return 35;
//   }
  
//   const fovy = view0.props.fovy;

//   return fovy;
// }

export function render({gl, width, height, viewState, fovy}) {
  const screenFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (fovy != null && this.deckInstance.viewManager) {
    const viewManager = this.deckInstance.viewManager;

    if (viewManager && viewManager.views && viewManager.views.length > 0) {
      const view = this.deckInstance.viewManager.views[0];
      
      if (view instanceof FirstPersonView) {
        this.deckInstance.setProps({
          views: [new FirstPersonView({ near: 1, far: 10000, fovy })]
        });
      }
    }
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
