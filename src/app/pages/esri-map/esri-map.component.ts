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

  private getBobcatSymbolUrl() {
    return "data:image/png;base64,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"
  }

  addBobcatPoint(lat: number, lng: number) {
    const imageUrl = this.getBobcatSymbolUrl()

    const point = { //Create a point
      type: "point",
      longitude: lng,
      latitude: lat
    };
    const pictureMarkerSymbol = {
        type: "picture-marker",
        url: imageUrl,
        width: "24px",
        height: "24px",
        xoffset: 0,
        yoffset: 0,
    };
    let pointGraphic: esri.Graphic = new this._Graphic({
      geometry: point,
      symbol: pictureMarkerSymbol
    });

    this.bobcatsGraphic.add(pointGraphic);
  }

  // text for review description
  newText: string = "";
  // value for raing must be 1-5
  intValue: number = 0;
  // trail name for adding review
  trail_name: string = "";
  // flag_for_submit_button: number = 0;
  createTrailReview() {
    // this.flag_for_submit_button = 1
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
      let total = 0;
      let nr = 0
      for (let index = 0; index < reviews.length; index++) {
        if (typeof reviews[index].ratting === 'number' && Number.isInteger(reviews[index].ratting)) {
          total += reviews[index].ratting;
          nr++;
        
        }
      }
      let avg_rating = total/nr;
    

      // Open  review dialog 
      this.dialog.open(ReviewDialogComponent, {
        data: {
          reviews: reviews,
          name: this.trail_name,
          avg: avg_rating
        },
        width: '300px', 
        height: '300px', 
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
        this.map.add(this.roadsLayers[i].layer, 0);
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

    this.map.add(this.roadsLayers[tripIndex].layer, 0);
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
