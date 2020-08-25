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

      if (this.view.camera.position.latitude == null || this.view.camera.position.longitude == null || this.view.camera.fov == null) {
        return;
      }

      // console.log(this.view.camera.position.latitude, this.view.center.latitude);
      // console.log(this.view.camera.position.longitude, this.view.center.longitude);
      
      const fov = Math.PI * this.view.camera.fov / 180;

      const fovy = fov * (window["fovfix"] || 0.441);

      // const co = Math.cos(Math.PI * this.view.camera.tilt / 180);
      // const yfix = (-this.view.camera.position.z * (1 - co));
      const yfix = 0;

      render.call(this, {
        gl: context.gl,
        width,
        height,
        viewState: {
          latitude: this.view.camera.position.latitude,
          longitude: this.view.camera.position.longitude,
          position: [window["xfix"] || 0, window["yfix"] || yfix, this.view.camera.position.z + (window["zfix"] || 0)],
          bearing: this.view.camera.heading,
          pitch: 90 - this.view.camera.tilt
        },
        fovy: 180 * fovy / Math.PI
      });
    }
  }

  return DeckRenderer;
}
