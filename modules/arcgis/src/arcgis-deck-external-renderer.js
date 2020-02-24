/* eslint-disable no-invalid-this */

import {FirstPersonView} from '@deck.gl/core';

import {
  initializeResources,
  createOrResizeFramebuffer,
  createFramebuffer,
  destroyFramebuffer,
  initializeDeckGL
} from './commons';

const Z_OFFSET = 0;

export default function loadArcGISDeckExternalRenderer(externalRenderers, Collection) {
  function ArcGISDeckExternalRenderer(view, conf) {
    this.view = view;
    this.deckLayers = new Collection();
    this.deckLayers.addMany(conf.deckLayers);
  }
  ArcGISDeckExternalRenderer.prototype.initializeResources = initializeResources;
  ArcGISDeckExternalRenderer.prototype.createOrResizeFramebuffer = createOrResizeFramebuffer;
  ArcGISDeckExternalRenderer.prototype.createFramebuffer = createFramebuffer;
  ArcGISDeckExternalRenderer.prototype.destroyFramebuffer = destroyFramebuffer;
  ArcGISDeckExternalRenderer.prototype.initializeDeckGL = initializeDeckGL;

  function setup(context) {
    const gl = context.gl;
    this.initializeResources(gl);
    // eslint-disable-next-line
    const dpr = window.devicePixelRatio;
    this.createFramebuffer(
      gl,
      Math.round(this.view.size[0] * dpr),
      Math.round(this.view.size[1] * dpr)
    );
    this.initializeDeckGL(gl);
    
    const esriPos = this.view.camera.position;
    // const fovy = 0.5 * this.view.size[1] * this.view.camera.fov / this.view.size[0];
    // const fovy = this.view.size[1] * this.view.camera.fov / this.view.size[0];
    // const fovy = 2 * this.view.size[1] * this.view.camera.fov / this.view.size[0];
    // const fovy = 0.5 * this.view.camera.fov;
    // const fovy = this.view.camera.fov;
    // const fovy = 2 * this.view.camera.fov;
    const fovy = 30;

    this.deckgl.setProps({
      views: new FirstPersonView({ id: 'first-person', controller: false, near: 100000, far: 100000000, fovy }),
      viewState: {
        latitude: 0,
        longitude: 0,
        position: [esriPos.x, esriPos.y, esriPos.z + Z_OFFSET],
        bearing: this.view.camera.heading,
        pitch: 90 - this.view.camera.tilt
      }
    });
    this.deckLayers.on('change', () => {
      externalRenderers.requestRender(this.view);
    });
  }

  ArcGISDeckExternalRenderer.prototype.setup = setup;

  function render(context) {
    const gl = context.gl;
    const screenFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    // eslint-disable-next-line
    const dpr = window.devicePixelRatio;
    this.createOrResizeFramebuffer(
      gl,
      Math.round(this.view.size[0] * dpr),
      Math.round(this.view.size[1] * dpr)
    );

    const esriPos = this.view.camera.position;

    this.deckgl.setProps({
      layers: this.deckLayers.items.slice(),
      viewState: {
        latitude: 0,
        longitude: 0,
        position: [esriPos.x, esriPos.y, esriPos.z + Z_OFFSET],
        bearing: this.view.camera.heading,
        pitch: 90 - this.view.camera.tilt
      }
    });

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.deckgl.redraw(true);

    // We overlay the texture on top of the map using the full-screen quad.
    gl.bindFramebuffer(gl.FRAMEBUFFER, screenFbo);
    gl.viewport(0, 0, Math.round(this.view.size[0] * dpr), Math.round(this.view.size[1] * dpr));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(0, 2, gl.BYTE, false, 2, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(this.program);
    gl.uniform1i(this.uTexture, 0);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  ArcGISDeckExternalRenderer.prototype.render = render;

  return ArcGISDeckExternalRenderer;
}
