/* eslint-disable no-invalid-this */

import {initializeResources, render, finalizeResources} from './commons';

export default function createDeckRenderer(DeckProps, externalRenderers) {
  class DeckRenderer {
    constructor(view, props) {
      this.view = view;
      this.deck = new DeckProps(props);
    }

    setup(context) {
      const gl = context.gl;
      initializeResources.call(this, gl, true);

      this.deck.on('change', props => this.deckInstance.setProps(props));

      this.deckInstance.setProps(this.deck.toJSON());
    }

    dispose() {
      finalizeResources.call(this);
    }

    redraw() {
      externalRenderers.requestRender(this.view);
    }

    render(context) {
      const [width, height] = this.view.size;

      const fov = Math.PI * this.view.camera.fov / 180;
      const fovy = fov * (window["fovfix"] || 0.441);
      
      const offset = this.view.camera.position.z * Math.tan(Math.PI * this.view.camera.tilt / 180);
      const co = Math.cos(Math.PI * this.view.camera.heading / 180);
      const si = Math.sin(Math.PI * this.view.camera.heading / 180);
      const xOffset = -si * offset;
      const yOffset = -co * offset;

      render.call(this, {
        gl: context.gl,
        width,
        height,
        viewState: {
          latitude: this.view.center.latitude,
          longitude: this.view.center.longitude,
          position: [xOffset, yOffset, this.view.camera.position.z],
          bearing: this.view.camera.heading,
          pitch: 90 - this.view.camera.tilt
        },
        fovy: 180 * fovy / Math.PI
      });
    }
  }

  return DeckRenderer;
}
