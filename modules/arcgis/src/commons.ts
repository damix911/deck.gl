// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-invalid-this */

import {GL} from '@luma.gl/constants';
import type {Device, Texture, Framebuffer} from '@luma.gl/core';
import {Deck} from '@deck.gl/core';
import {Model, Geometry} from '@luma.gl/engine';
import {WebGLDevice} from '@luma.gl/webgl';
import { GlueWEBGLFramebuffer } from './glue';

interface Renderer {
  redraw: () => void;
}

export type RenderResources = {
  deck: Deck;
  texture: Texture;
  model: Model;
  fbo: Framebuffer;
};

async function createDeckInstance(gl: WebGL2RenderingContext): Promise<{
  deckInstance: Deck;
  device: Device;
}> {
  return new Promise(resolve => {
    const deckInstance = new Deck({
      // Input is handled by the ArcGIS API for JavaScript.
      controller: false,

      // We use the same WebGL context as the ArcGIS API for JavaScript.
      gl,

      // We need depth testing in general; we don't know what layers might be added to the deck.
      parameters: {
        depthCompare: 'less-equal'
      },

      // To disable canvas resizing, since the FBO is owned by the ArcGIS API for JavaScript.
      width: null,
      height: null,

      onDeviceInitialized: (device: Device) => {
        resolve({deckInstance, device});
      }
    });
  });
}

export async function initializeResources(
  this: Renderer,
  gl: WebGL2RenderingContext
): Promise<RenderResources> {
  const {deckInstance, device} = await createDeckInstance(gl);

  const texture = device.createTexture({
    format: 'rgba8unorm',
    width: 1000,
    height: 600,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      mipmapFilter: "none",
    }
  });

  // const texture2 = device.createTexture({
  //   format: 'rgba8unorm',
  //   width: 128,
  //   height: 128,
  //   sampler: {
  //     minFilter: 'linear',
  //     magFilter: 'linear',
  //     addressModeU: 'clamp-to-edge',
  //     addressModeV: 'clamp-to-edge',
  //     mipmapFilter: "none",
  //   }
  // });

  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "100px sans-serif";
  ctx.fillStyle = "blue";
  ctx.fillRect(20, 20, 1000 - 40, 600 - 40);
  ctx.fillStyle = "red";
  ctx.fillText(":-)", 500, 300);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeText(":-)", 500, 300);

  // texture2.copyExternalImage({
  //   image: canvas,
  // });

  texture.copyExternalImage({
    image: canvas,
  });

  const model = new Model(device, {
    vs: `\
#version 300 es
in vec2 pos;
out vec2 v_texcoord;
void main(void) {
    gl_Position = vec4(pos, 0.0, 1.0);
    v_texcoord = (pos + 1.0) / 2.0;
}
    `,
    fs: `\
#version 300 es
precision mediump float;
uniform sampler2D deckglTexture;
in vec2 v_texcoord;
out vec4 fragColor;

void main(void) {
    vec4 imageColor = texture(deckglTexture, v_texcoord);
    imageColor.a *= 0.4;
    imageColor.rgb *= imageColor.a;
    // imageColor = vec4(v_texcoord, 0.0, 1.0);
    // imageColor *= 100.0;
    fragColor = imageColor;
}
    `,
    bindings: {
      deckglTexture: texture
    },
    parameters: {
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one-minus-src-alpha',
      blendAlphaSrcFactor: 'one',
      blendAlphaDstFactor: 'one-minus-src-alpha',
      blendColorOperation: 'add',
      blendAlphaOperation: 'add',
      blend: true,
    },
    geometry: new Geometry({
      topology: 'triangle-list',
      attributes: {
        pos: {size: 2, value: new Int8Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, -1])}
      }
    }),
    vertexCount: 6,
    disableWarnings: true
  });

  const fbo = device.createFramebuffer({
    id: 'deckfbo',
    width: 1000,
    height: 600,
    colorAttachments: [texture],
    depthStencilAttachment: 'depth16unorm'
  });

  deckInstance.setProps({
    // This deck renders into an auxiliary framebuffer.
    _framebuffer: fbo,

    _customRender: redrawReason => {
      if (redrawReason === 'arcgis') {
        deckInstance._drawLayers(redrawReason);
      } else {
        this.redraw();
      }
    }
  });

  return {deck: deckInstance, texture, fbo, model};
}

export function render(
  resources: RenderResources,
  viewport: {
    width: number;
    height: number;
    longitude: number;
    latitude: number;
    zoom: number;
    altitude?: number;
    pitch: number;
    bearing: number;
  }
) {
  const {model, deck, fbo} = resources;
  const device = model.device;
  if (device instanceof WebGLDevice) {
    // device.gl.blendColor(1, 1, 1, 1);
    const handle = device.getParametersWebGL(GL.FRAMEBUFFER_BINDING);
    const screenFbo = new GlueWEBGLFramebuffer(device, {
      handle,
    });
    const {width, height, ...viewState} = viewport;

    /* global window */
    const dpr = window.devicePixelRatio;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    fbo.resize({width: pixelWidth, height: pixelHeight});

    deck.setProps({viewState});
    // redraw deck immediately into deckFbo
    deck.redraw('arcgis');

    // We overlay the texture on top of the map using the full-screen quad.

    const textureToScreenPass = device.beginRenderPass({
      framebuffer: screenFbo as any as Framebuffer,
      parameters: {viewport: [0, 0, pixelWidth, pixelHeight]},
      clearColor: false,
      clearDepth: false
    });
    try {
      device.gl.blendColor(1, 1, 1, 1);
      model.draw(textureToScreenPass);

      // const { gl } = device;
      // const pixels = new Uint8Array(width * height * 4); // 4 components (R, G, B, A) per pixel
      // gl.readPixels(
      //     0,                                  // x
      //     0,                                  // y
      //     width,                              // width
      //     height,                             // height
      //     gl.RGBA,                            // format
      //     gl.UNSIGNED_BYTE,                   // type
      //     pixels                              // destination array
      // );

      // // Create a temporary 2D canvas
      // const tempCanvas = document.createElement('canvas');
      // tempCanvas.width = width;
      // tempCanvas.height = height;
      // const ctx = tempCanvas.getContext('2d')!;
      // const imageData = ctx.createImageData(width, height);
      // imageData.data.set(pixels);
      // ctx.putImageData(imageData, 0, 0);
      // (window as any).image = tempCanvas;
    } finally {
      textureToScreenPass.end();
    }
  }
}

export function finalizeResources(resources: RenderResources) {
  resources.deck.finalize();
  resources.model.destroy();
  resources.fbo.destroy();
  resources.texture.destroy();
}
