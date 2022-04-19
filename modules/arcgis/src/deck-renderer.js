/* eslint-disable no-invalid-this */

import {initializeResources, render, finalizeResources} from './commons';

// ArcGIS fov is corner-to-corner
function arcgisFOVToDeckAltitude(fov, aspectRatio) {
  const D = Math.sqrt(1 + aspectRatio ** 2);
  const halfFOV = (fov / 2 / 180) * Math.PI;
  return D / 2 / Math.tan(halfFOV);
}

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

      console.log(this.view.camera.position.longitude, this.view.camera.position.latitude, this.view.center.longitude, this.view.center.latitude);
      // console.log(this.view.camera.fov);
      console.log("this.view.camera.position.z", this.view.camera.position.z);

      render.call(this, {
        gl: context.gl,
        width,
        height,
        viewState: {


          // longitude: this.view.center.longitude,
          // latitude: this.view.center.latitude,
          // longitude: 0.119,
          // latitude: 52.205,



          
          // longitude: this.view.camera.position.longitude,
          // latitude: this.view.camera.position.latitude,
          // position: [0, 0, this.view.camera.position.z],
          // bearing: this.view.camera.heading,
          // pitch: 90 - this.view.camera.tilt,
          // maxPitch: 90,
          // minPitch: -90



          latitude: this.view.center.latitude,
          longitude: this.view.center.longitude,
          altitude: arcgisFOVToDeckAltitude(this.view.camera.fov, width / height),
          zoom: this.view.zoom,
          bearing: this.view.camera.heading,
          pitch: this.view.camera.tilt,
          maxZoom: 100
        }
      });
    }
  }

  return DeckRenderer;
}
