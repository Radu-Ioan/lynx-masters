/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import { setDefaultOptions, loadModules } from 'esri-loader';
import { Router } from '@angular/router';
import esri = __esri; // Esri TypeScript Types
import { AuthService } from "src/app/shared/auth.service";


@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  // The <div> where we will place the map
  @ViewChild("mapViewNode", {static: true}) private mapViewEl: ElementRef;

  // register Dojo AMD dependencies
  _Map;
  _MapView;
  _FeatureLayer;
  _Graphic;
  _GraphicsLayer;
  _Route;
  _RouteParameters;
  _FeatureSet;
  _Point;
  _Locate;
  _Sketch;
  _ScaleBar;
  _geometryEngine;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;
  sketch: esri.Sketch;
  sketchGraphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 13;
  center: Array<number> = [45.015705, 25.656930].reverse();

  basemap = "osm-streets-relief";

  loaded = false;

  // locate object
  locate: esri.Locate;


  constructor(
    private router: Router, private authService: AuthService
  ) { }

  async initializeMap() {
    try {
      // configure esri-loader to use version x from the ArcGIS CDN
      // setDefaultOptions({ version: '3.3.0', css: true });
      setDefaultOptions({ css: true });

      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point,
        GraphicsLayer, route, RouteParameters, FeatureSet, Search, Locate, Sketch, ScaleBar, geometryEngine]
            = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/widgets/Search",
        "esri/widgets/Locate",
        "esri/widgets/Sketch",
        "esri/widgets/ScaleBar",
        "esri/geometry/geometryEngine"
      ]);

      esriConfig.apiKey = "AAPKf63f82faeb074c05889cc64b3114ec87f1hx78tJwFzoumsUQhHLAy_XmkJXmscS9WIYXc6IK6w9RDLx9AToG50W5apMRHjh";

      this._Map = Map;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;
      this._Locate = Locate;
      this._ScaleBar = ScaleBar;
      this._Sketch = Sketch;
      this._geometryEngine = geometryEngine;


      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      this.addGraphicLayers();

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      const search = new Search({
        view: this.view
      });

      this.view.ui.add(search, "top-right");

      this.locate = new Locate({
        view: this.view,
        useHeadingEnabled: false
      });
      this.view.ui.add(this.locate, "top-left");


      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on('pointer-move', ["Shift"], (event) => {
        let point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");
      console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  addGraphicLayers() {
    // obiectul asta e initializat acum si dupa pe parcurs se pot adauga
    // puncte in el cu this.graphicsLayer.add(pointGrahpic)
    this.graphicsLayer = new this._GraphicsLayer();
    this.map.add(this.graphicsLayer);
  }

  addPoint(lat: number, lng: number, register: boolean) {
    const point = { //Create a point
      type: "point",
      longitude: lng,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };
    let pointGraphic: esri.Graphic = new this._Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayer.add(pointGraphic);
    if (register) {
      this.pointGraphic = pointGraphic;
    }
  }


  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  signout() {
    this.authService.logout();
  }

  navigateHome() {
    this.router.navigate(['/home']);
  }
}
