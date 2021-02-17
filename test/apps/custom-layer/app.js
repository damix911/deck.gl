import { Deck, Layer, project } from "@deck.gl/core";
import { ScatterplotLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { Model, CubeGeometry } from "@luma.gl/core";

class AwesomeLayer extends Layer {
  initializeState() {
    const { gl } = this.context;
    
    this.setState({
      model: this._getModel(gl)
    });

    this.getAttributeManager().addInstanced({
      instanceCenters: {
        size: 4,
        transition: true,
        accessor: 'getPosition'
      },
      instanceSizes: {
        size: 1,
        transition: true,
        accessor: 'getSize',
        defaultValue: 1
      }
    });
  }

  _getModel(gl) {
    return new Model(gl, Object.assign({}, {
      vs: `
      // instanced geometry
      attribute vec4 positions;
      // instance attributes
      attribute vec4 instanceCenters;
      attribute float instanceSizes;
      
      void main(void) {
        vec4 center = project_position(instanceCenters);
        vec4 vertex = positions;
        vertex.xyz *= project_size(instanceSizes);
        gl_Position = project_common_position_to_clipspace(center + vertex);
      }
      `,
      fs: `
        void main(void) {
          gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
      `,
      modules: [project]

    }, {
      id: this.props.id,
      geometry: new CubeGeometry(),
      isInstanced: true
    }));
  }
}

AwesomeLayer.layerName = "AwesomeLayer";

AwesomeLayer.defaultProps = {
  color: [255, 0, 0]
};

const bartStations = "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-stations.json";

const deck = new Deck({
  mapStyle: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  layers: [
    new TileLayer({
      data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: props => {
        const {
          bbox: {west, south, east, north}
        } = props.tile;
  
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        });
      }
    }),
    new ScatterplotLayer({
      id: "my-scatterplot-layer",
      data: bartStations,
      opacity: 0.8,
      getFillColor: () => [255, 0, 0],
      getLineColor: () => [0, 0, 0],
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 10,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: d => d.coordinates,
      getRadius: d => 1
    }),
    new AwesomeLayer({
      id: "my-awesome-layer",
      data: bartStations,
      getPosition: d => d.coordinates,
      getSize: d => 100
    })
  ]
});

deck.setProps({
  viewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11,
    pitch: 60
  }
});