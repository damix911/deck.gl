import ArcGISMap from "esri/Map";
import MapView from "esri/views/MapView";

const view = new MapView({
  container: "app",
  map: new ArcGISMap({
    basemap: "dark-gray-vector",
    layers: []
  }),
  center: [0.119167, 52.205276],
  zoom: 7
});
