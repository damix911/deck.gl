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

      if (this.view.camera.position.latitude == null || this.view.camera.position.longitude == null) {
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
          pitch: 90//this.view.camera.tilt
        }
      });
    }
  }

  return DeckRenderer;
}
