/* eslint-disable no-invalid-this */

import {initializeResources, render, finalizeResources} from './commons';
import { FirstPersonView } from '@deck.gl/core';

export default function createDeckRenderer(DeckProps, externalRenderers) {
  class DeckRenderer {
    constructor(view, props) {
      this.view = view;
      this.deck = new DeckProps(props);
    }

    setup(context) {
      const gl = context.gl;
      initializeResources.call(this, gl);

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

      this.deckInstance.setProps({
        // views: new FirstPersonView({x: 0, y: 0, width, height, near: 100, far: 1000000, fovy: this.view.camera.fov})
        views: new FirstPersonView({x: 0, y: 0, width, height, near: 100, far: 1000000, fovy: 28})
      });

      if (typeof this.view.camera.position.latitude === "undefined") {
        return;
      }

      render.call(this, {
        gl: context.gl,
        width,
        height,
        viewState: {
          latitude: this.view.camera.position.latitude,
          longitude: this.view.camera.position.longitude,
          position: [0, 0, this.view.camera.position.z],
          bearing: this.view.camera.heading,
          pitch: 90 - this.view.camera.tilt
        }
      });
    }
  }

  return DeckRenderer;
}
