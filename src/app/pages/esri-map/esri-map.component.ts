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
import { FirebaseService, Review } from "../../services/database/firebase";

import { MatDialog } from '@angular/material/dialog';
import { ReviewDialogComponent } from "src/app/component/reviews/review-dialog.component";
import { NgForm } from '@angular/forms';

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  // The <div> where we will place the map
  @ViewChild("mapViewNode", {static: true}) private mapViewEl: ElementRef;
  @ViewChild('myForm', { static: false }) myForm: NgForm;

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
  sketch: esri.Sketch;
  sketchGraphicsLayer: esri.GraphicsLayer;

  routeStopsGraphic: esri.GraphicsLayer;
  bobcatsGraphic: esri.GraphicsLayer;
  timeoutHandler = null

  bobcatsCenters = [
    {
      lat: 45.03520058721398,
      lon: 25.676690495690597
    },
    {
      lat: 45.005462,
      lon: 25.704955
    }, // ditesti
    {
      lat: 45.020500,
      lon: 25.583597
    }, // stanciu
    {
      lat: 44.993524,
      lon: 25.603386
    },// cristian
  ]

  bobcatsAngles = [0., 0.2, 0.47, 1.202]
  bobcatsRadiuses = [0.005, 0.0015, 0.007, 0.0023]

  // Attributes
  zoom = 13;
  center: Array<number> = [45.015705, 25.656930].reverse();

  basemap = "osm-streets-relief";

  loaded = false;


  // Traseele gata desenate pe harta
  // In aceste liste, se vor tine perechi {nume_traseu: FeatureLayerTraseu}
  // Fiind typescript, cand se vor adauga elemente, va arata asa
  // points.add({name: <string-nume-traseu>,
  //    layer: <referinta-obiect-layer>
  // })
  pointsLayers: any[] = [];
  roadsLayers: any[] = [];

  // aici in loc de un layer, un nume de traseu va fi imperecheat cu 2 numere care vor
  // reprezenta coordonatele punctului de start (necesara la partea de rutare)
  startPoints = {};

  // locate object
  locate: esri.Locate;

  measurements: HTMLElement;

  constructor(
    private router: Router, public authService: AuthService, private fbs: FirebaseService,
    private dialog: MatDialog 
  ) { }


  private addTrestia() {
    const pointsRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        size: 8,
        color: "#8bef1c",
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 0.5,
          color: "white"
        }
      }
    };
    const roadRenderer = {
      "type": "simple",
      "symbol": {
        "color": "#e3bb19",
        "type": "simple-line",
        "width": "6px",
        "height": "18px"
      }
    }

    let trailName = "Trestia - Ruda";
    let points = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseu_Trestia_Ruda/FeatureServer/0",
      renderer: pointsRenderer
    });
    let road = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseu_Trestia_Ruda/FeatureServer/1",
      renderer: roadRenderer
    });
    this.pointsLayers.push({name: trailName, layer: points});
    this.roadsLayers.push({name: trailName, layer: road});
    this.startPoints[trailName] = {lat: 45.010655, lon: 25.645282};
  }

  private addStanciu() {
    const pointsRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        size: 8,
        color: "#A349E0",
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 0.5,
          color: "white"
        }
      }
    }
    const roadRenderer = {
      "type": "simple",
      "symbol": {
        "color": "#38d9d4",
        "type": "simple-line",
        "width": "6px",
        "height": "18px"
      }
    }
    const trailName = "Colibasi - Vf Stanciu - Tisa";
    const points = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Colibasi_Stanciu_Tisa/FeatureServer/0",
      renderer: pointsRenderer
    });
    const road = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Colibasi_Stanciu_Tisa/FeatureServer/1",
      renderer: roadRenderer
    });
    this.pointsLayers.push({name: trailName, layer: points});
    this.roadsLayers.push({name: trailName, layer: road});
    this.startPoints[trailName] = {lat: 45.029639, lon: 25.611582};
  }

  private addBana() {
    const pointsRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        size: 8,
        color: "#e17a31",
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 0.5,
          color: "white"
        }
      }
    }
    const roadRenderer = {
      "type": "simple",
      "symbol": {
        "color": "#284de1",
        "type": "simple-line",
        "width": "6px",
        "height": "18px"
      }
    }
    const trailName = "Bana - Ditesti";
    const points = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseul_Bana_Ditesti/FeatureServer/0",
      renderer: pointsRenderer
    });
    const road = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseul_Bana_Ditesti/FeatureServer/1",
      renderer: roadRenderer
    });
    this.pointsLayers.push({name: trailName, layer: points});
    this.roadsLayers.push({name: trailName, layer: road});
    this.startPoints[trailName] = {lat: 44.973650, lon: 25.660220};
  }

  private addCristian() {
    const pointsRenderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
        size: 8,
        color: "#DB2A25",
        outline: {  // autocasts as new SimpleLineSymbol()
          width: 0.5,
          color: "white"
        }
      }
    }
    const roadRenderer = {
      "type": "simple",
      "symbol": {
        "color": "#9751A8",
        "type": "simple-line",
        "width": "6px",
        "height": "18px"
      }
    }
    const trailName = "Cristian";
    const points = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseu_Cristian/FeatureServer/0",
      renderer: pointsRenderer
    });
    const road = new this._FeatureLayer({
      url: "https://services8.arcgis.com/wnkN7vRJ1jovu0Z6/arcgis/rest/services/Traseu_Cristian/FeatureServer/1",
      renderer: roadRenderer
    });
    this.pointsLayers.push({name: trailName, layer: points});
    this.roadsLayers.push({name: trailName, layer: road});
    this.startPoints[trailName] = {lat: 44.991246, lon: 25.633313};
  }

  initAppLayers() {
    this.addTrestia();
    this.addStanciu();
    this.addBana();
    this.addCristian()
  }

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

      this.initAppLayers();
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

      this.addMeasureElements();

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
    this.routeStopsGraphic = new this._GraphicsLayer();
    this.map.add(this.routeStopsGraphic);

    this.bobcatsGraphic = new this._GraphicsLayer()
    this.map.add(this.bobcatsGraphic)
  }

  addRouteStop(lat: number, lng: number) {
    const point = {
      type: "point",
      longitude: lng,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [119, 226, 80],
      outline: {
        color: [255, 255, 255],
        width: 1
      }
    };
    let pointGraphic: esri.Graphic = new this._Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.routeStopsGraphic.add(pointGraphic)
  }

  addBobcatPoint(lat: number, lng: number) {
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

    this.bobcatsGraphic.add(pointGraphic);
  }

  // text for review description
  newText: string = "";
  // value for raing must be 1-5
  intValue: number = 0;
  // trail name for adding review
  trail_name: string = "";

  flag_for_submit_button: number = 0;
  createTrailReview() {
    this.flag_for_submit_button = 1
    if (this.newText.trim() !== "" && this.trail_name !== "" && this.intValue !== 0) {
      const item: Review = {
        name: this.newText,
        ratting: this.intValue
      };
      
      // Create or update trail with new item(review)
      this.fbs.createTrailReview(item, this.trail_name);
      this.myForm.resetForm();
      this.intValue = 0
    }
  }

  
  showReviews() {
    // Retrieve the reviews for 'Ceva' from the 'Reviews' collection
    
    if (this.trail_name == "") {
      return;
    }
    this.fbs.getReviewsForTrail(this.trail_name).subscribe((reviewsData: any) => {
      console.log('Retrieved Reviews for Trail:', reviewsData);
      const reviews = reviewsData || [];

      // Open the review dialog with the retrieved reviews
      this.dialog.open(ReviewDialogComponent, {
        data: {
          reviews: reviews,
          name: this.trail_name
        },
        width: '300px', // Set the width as needed
        height: '300px', // Set the height as needed
      });
    });
  }

  hideAllTrails() {
    this.map.layers.removeMany(this.pointsLayers.reduce((acc, point) => {
      acc.push(point.layer)
      return acc
    }, []))
    this.map.layers.removeMany(this.roadsLayers.reduce((acc, road) => {
      acc.push(road.layer)
      return acc
    }, []))
  }

  showTrail(name: string) {
    this.hideAllTrails()
    this.routeStopsGraphic.removeAll();

    // name for review db
    this.trail_name = name;

    // remove the possibly previous existing route displayed with
    // showRoute()
    this.view.graphics.removeAll();

    this.showRoad(name);
  }

  showRoad(id: string) {
    for (let i = 0; i < this.pointsLayers.length; i++) {
      if (id === this.pointsLayers[i].name) {
        this.map.add(this.roadsLayers[i].layer);
        this.map.add(this.pointsLayers[i].layer);
        break;
      }
    }
  }

  async startTrip(tripName: string) {
    this.hideAllTrails()
    this.routeStopsGraphic.removeAll();

    // set name for review db
    this.trail_name = tripName;

    // remove an eventually previous displayed route
    this.view.graphics.removeAll();

    let tripIndex = 0;

    for (let i = 0; i < this.pointsLayers.length; i++) {
      if (tripName === this.pointsLayers[i].name) {
        tripIndex = i;
        break;
      }
    }

    this.map.add(this.roadsLayers[tripIndex].layer);
    this.map.add(this.pointsLayers[tripIndex].layer);

    await this.locate.locate();
    await this.view.when(() => this.view.zoom = 14);

    await this.view.when(() => {
      this.addRouteStop(this.view.center.latitude, this.view.center.longitude);
      this.addRouteStop(this.startPoints[tripName].lat, this.startPoints[tripName].lon);
      this.getRoute();
    });
  }

  getRoute() {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    const routeParams = new this._RouteParameters({
      stops: new this._FeatureSet({
        features: this.routeStopsGraphic.graphics.toArray()
      })
    });

    this._Route.solve(routeUrl, routeParams)
      .then((data)=> {
        if (data.routeResults.length > 0) {
          this.showRoute(data.routeResults[0].route);
        } else {
          console.log('Data route results: ', data.routeResults);
          console.log('data:', data);
        }
      })
      .catch((error)=>{
        console.log(error);
      })
  }

  showRoute(routeResult) {
    routeResult.symbol = {
      type: "simple-line",
      color: [5, 150, 255],
      width: 3
    };

    this.view.graphics.add(routeResult, 0);
  }

  addMeasureElements() {
    const scalebar = new this._ScaleBar({
      view: this.view,
      unit: "metric"
    });

    this.view.ui.add(scalebar, "bottom-right");

    this.sketchGraphicsLayer = new this._GraphicsLayer();
    this.map.add(this.sketchGraphicsLayer);


    this.sketch = new this._Sketch({
      layer: this.sketchGraphicsLayer,
      view: this.view,
      availableCreateTools: ["polyline", "polygon", "rectangle"],
      creationMode: "update",
      updateOnGraphicClick: true,
      visibleElements: {
        createTools: {
          point: false,
          circle: false
        },
        selectionTools:{
          "lasso-selection": false,
          "rectangle-selection":false,
        },
        settingsMenu: false,
        undoRedoMenu: false
      }
    });

    this.view.ui.add(this.sketch, "top-right");

    this.measurements = document.getElementById("measurements");
    this.view.ui.add(this.measurements, "manual");

    const polygon = {
      type: "polygon",
      spatialReference: {
        wkid: 3857,
      },
      rings: [
        [
          [44.983412, 25.639960],
          [44.983352, 25.649337],
          [44.979330, 25.649230],
          [44.979390, 25.639960],
          [44.983412, 25.639960]
        ]
      ],
    };

    const simplePolygonSymbol = {
      type: "simple-fill",
      outline: {
        color: [200, 0, 0],
        width: 2,
      },
    };

    const polygonGraphic = new this._Graphic({
      geometry: polygon,
      symbol: simplePolygonSymbol
    });

    this.sketchGraphicsLayer.add(polygonGraphic);

    this.view.when(() => {
      this.sketch.update(polygonGraphic);
      this.getArea(polygonGraphic.geometry);
    });

    this.addSketchListener();
  }

  addSketchListener() {
    this.sketch.on("update", (e) => {
      const geometry = e.graphics[0].geometry;

      if (e.state === "start") {
        this.switchType(geometry);
      }

      if (e.state === "complete") {
        this.sketchGraphicsLayer.remove(this.sketchGraphicsLayer.graphics.getItemAt(0));
        this.measurements.innerHTML = null;
      }

      if (
        e.toolEventInfo &&
        (e.toolEventInfo.type === "scale-stop" ||
          e.toolEventInfo.type === "reshape-stop" ||
          e.toolEventInfo.type === "move-stop")
      ) {
        this.switchType(geometry);
      }
    });
  }

  getArea(polygon) {
    const planarArea = this._geometryEngine.planarArea(polygon, "square-kilometers");

    this.measurements.innerHTML =
      "<b>Planar area</b>: " + planarArea.toFixed(2) + "  km\xB2";
  }

  getLength(line) {
    const planarLength = this._geometryEngine.planarLength(line, "kilometers");

    this.measurements.innerHTML =
      "<b>Planar length</b>: " + planarLength.toFixed(2) + "  km";
  }

  switchType(geom) {
    switch (geom.type) {
      case "polygon":
        this.getArea(geom);
        break;
      case "polyline":
        this.getLength(geom);
        break;
      default:
        console.log("No value found");
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.runTimer()
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
    this.stopTimer()
  }

  signout() {
    this.authService.logout();
  }

  navigateHome() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  moveBobcat() {
    this.bobcatsGraphic.removeAll()
    const updatedPositions = []

    for (let i = 0; i < this.bobcatsCenters.length; i++) {
      const center = this.bobcatsCenters[i]
      const radius = this.bobcatsRadiuses[i]

      this.bobcatsAngles[i] += 0.1
      const angle = this.bobcatsAngles[i]

      const lat = center.lat + radius * Math.cos(angle)
      const lon = center.lon + radius * Math.sin(angle)
      this.addBobcatPoint(lat, lon)

      updatedPositions.push({lat, lon})
    }

    this.fbs.syncBobcatList(updatedPositions)
  }

  runTimer() {
    this.timeoutHandler = setTimeout(() => {
      this.moveBobcat()
      this.runTimer()
    }, 200)
  }

  stopTimer() {
    if (this.timeoutHandler != null) {
      clearTimeout(this.timeoutHandler)
      this.timeoutHandler = null
    }
  }
}
