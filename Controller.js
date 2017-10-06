require([
    "esri/map",
    "esri/tasks/GeometryService",
    "esri/tasks/query",

    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/FeatureLayer",

    "esri/dijit/LayerList",

    "esri/Color",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",

    "esri/dijit/editing/Editor",
    "esri/dijit/editing/TemplatePicker",

    "esri/geometry/geometryEngine",

    "esri/config",

    "esri/renderers/SimpleRenderer", "esri/Color",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",

    "dojo/i18n!esri/nls/jsapi",
    "dojo/_base/array", "dojo/parser", "dojo/keys",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"
], function(
    Map, GeometryService, Query,
    ArcGISTiledMapServiceLayer, FeatureLayer, LayerList,
    Color, SimpleMarkerSymbol, SimpleLineSymbol,
    Editor, TemplatePicker,
    geometryEngine,
    esriConfig,


    SimpleRenderer, Color, SimpleFillSymbol, SimpleLineSymbol,



    jsapiBundle,
    arrayUtils, parser, keys
) {
    parser.parse();

    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start + "<br>Press <b>ALT</b> to enable snapping";

    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "/proxy/";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    var score_content = document.getElementById('score');


    var map = new Map("map", {
        basemap: "streets",
        center: [-118.2, 34],
        zoom: 12,
        slider: false
    });

    map.on("layers-add-result", initEditor);


    //add boundaries and place names
    //var labels = new ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer");
    //map.addLayer(labels);

    //layers

    var schoolBufferLayer = new FeatureLayer("http://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/Half%20Mile%20Buffer%20Top%2050/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var publicHealthLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Public_Health_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var stormwaterLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Stormwater_Management_Features_Feasibility/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var urbanHeatLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Urban_Heat_Island/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var economicHDILayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Economic_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });


    //Added 3 new Layers - Need to implement into intersection
    var criticalConnections = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Critical_Connections/FeatureServer/0", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });


    var highInjuryNetworkLayer = new FeatureLayer("https://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/hin_082015/FeatureServer/0/", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });

    var schoolPolysLayer = new FeatureLayer("https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/2", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });

    var downtownDashBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/1d%20Downtown%20DASH%20Bus%20Stop%20Areas%20(Quarter-Mile%20Buffer)/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    //adding 2 layers to the list - sept 29
    var streetDesign = new FeatureLayer("http://maps.lacity.org/lahub/rest/services/Street_Information/MapServer/36", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var rStationConnectivity = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_TPA/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    // added layers 1C & 2A - oct 6
    var transDemand = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/9", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    var halfMileSchool = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_School_New/FeatureServer/1", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    // added all of 1a - oct 6

    var transitEN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/5", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    var bicycleN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/6", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    var neighborhoodN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/7", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    var pedestrianED = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/8", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });

    var greenN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/23", {
      outFields: ['*'],
      opacity: 0.5,
      visible: false
    });


    //Geometry types for the project location
    var responseLines = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/losangeles_lines/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });


    var responsePoints = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/losangeles_points/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    var responsePolys = new FeatureLayer("https://services8.arcgis.com/9YzOpduhkOqvcqYN/arcgis/rest/services/la_polygon/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });


    schoolBufferLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([15, 12, 218])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        schoolBufferLayer.setRenderer(renderer);
    });

    publicHealthLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([15, 96, 5])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        publicHealthLayer.setRenderer(renderer);
    });

    stormwaterLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([135, 12, 56])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        stormwaterLayer.setRenderer(renderer);
    });

    urbanHeatLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([15, 200, 86])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        urbanHeatLayer.setRenderer(renderer);
    });

    economicHDILayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([110, 85, 25])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        economicHDILayer.setRenderer(renderer);
    });

    highInjuryNetworkLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([110, 85, 25])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        highInjuryNetworkLayer.setRenderer(renderer);
    });

    schoolPolysLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([110, 85, 25])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        schoolPolysLayer.setRenderer(renderer);
    });


    downtownDashBuffer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 100])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        downtownDashBuffer.setRenderer(renderer);
    });

    streetDesign.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([102, 55, 25])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([19, 88, 255]))));
      streetDesign.setRenderer(renderer);
    });

    rStationConnectivity.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([158, 187, 215])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      rStationConnectivity.setRenderer(renderer);
    });

    halfMileSchool.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([165, 245, 122])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      halfMileSchool.setRenderer(renderer);
    });

    transDemand.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      transDemand.setRenderer(renderer);
    });

    transitEN.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([170, 102, 205])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      transitEN.setRenderer(renderer);
    });

//    bicycleN.on("load", function() {
//        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color(52, 52, 52])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
//      bicycleN.setRenderer(renderer);
//    });

    neighborhoodN.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([245, 122, 182])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      neighborhoodN.setRenderer(renderer);
    });

    pedestrianED.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([245, 162, 122])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
      pedestrianED.setRenderer(renderer);
    });

    greenN.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([158, 187, 215])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        greenN.setRenderer(renderer);
    });
    map.addLayers([responseLines, responsePolys, responsePoints]);
    var layers = [schoolBufferLayer, publicHealthLayer, stormwaterLayer, urbanHeatLayer, economicHDILayer, criticalConnections, highInjuryNetworkLayer, schoolPolysLayer, downtownDashBuffer, streetDesign, rStationConnectivity, transDemand, halfMileSchool, transitEN, bicycleN, neighborhoodN, pedestrianED, greenN];

    layers.forEach(function(layer) {
        map.addLayer(layer);
    });

    // Use a LayerList widget to toggle a layer's visibility on or off

    var layerListToggle = new LayerList({
        map: map,
        showLegend: true,
        showSubLayers: false,
        showOpacitySlider: true,
        layers: [
            { layer: schoolBufferLayer, visible: true },
            { layer: publicHealthLayer, visible: true },
            { layer: stormwaterLayer, visible: true },
            { layer: urbanHeatLayer, visible: true },
            { layer: economicHDILayer, visible: true },
            { layer: criticalConnections, visible: true },
            { layer: highInjuryNetworkLayer, visible: true },
            { layer: schoolPolysLayer, visible: true },
            { layer: downtownDashBuffer, visible: true },
            { layer: streetDesign, visible: true },
            { layer: rStationConnectivity, visible: true },
            { layer: transDemand, visible: true },
            { layer: halfMileSchool, visible: true },
            { layer: transitEN, visible: true },
            { layer: bicycleN, visible: true },
            { layer: neighborhoodN, visible: true },
            { layer: pedestrianED, visible: true },
            { layer: greenN, visible: true },
        ],

    }, "layerListDom");


    layerListToggle.startup();

    function initEditor(evt) {
        var templateLayers = arrayUtils.map(evt.layers, function(result) {
            return result.layer;
        });
        var templatePicker = new TemplatePicker({
            featureLayers: templateLayers,
            grouping: true,
            rows: "auto",
            columns: 3
        }, "templateDiv");
        templatePicker.startup();

        var layers = arrayUtils.map(evt.layers, function(result) {
            return { featureLayer: result.layer };
        });
        var settings = {
            map: map,
            templatePicker: templatePicker,
            layerInfos: layers,
            toolbarVisible: true,
            createOptions: {
                polylineDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYLINE],
                polygonDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYGON,
                    Editor.CREATE_TOOL_CIRCLE,
                    Editor.CREATE_TOOL_TRIANGLE,
                    Editor.CREATE_TOOL_RECTANGLE
                ]
            },
            toolbarOptions: {
                reshapeVisible: true
            }
        };

        var params = { settings: settings };
        var myEditor = new Editor(params, 'editorDiv');
        //define snapping options
        var symbol = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_CROSS,
            15,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0, 0.5]),
                5
            ),
            null
        );
        map.enableSnapping({
            snapPointSymbol: symbol,
            tolerance: 20,
            snapKey: keys.ALT
        });

        myEditor.startup();

        myEditor.editToolbar.on('activate', function(evt) {
            var query = new Query();
            query.geometry = evt.graphic.geometry;
            var projectLocation = query.geometry;
            var layersAfterQuery = {"Half Mile Buffer Top 50":[], "California_HDI_Public_Health_Need_Indicator":[],
                                    "Stormwater_Management_Features_Feasibility":[], "Urban_Heat_Island":[],
                                    "California_HDI_Economic_Need_Indicator":[], "High Injury Network":[],
                                    "School Campuses (LAUSD)":[]
                                    };

            var schoolBuffer = [];
            var publicHDI = [];
            var stormwater =[];
            var urbanHeat =[];
            var economicHDI =[];
            var highInjuryNetwork =[];
            var schoolPolys =[];

          //  search for features in these layers.
            schoolBufferLayer.queryFeatures(query, selectInBuffer);
            publicHealthLayer.queryFeatures(query, selectInBuffer);
            stormwaterLayer.queryFeatures(query, selectInBuffer);
            urbanHeatLayer.queryFeatures(query, selectInBuffer);
            economicHDILayer.queryFeatures(query, selectInBuffer);
            highInjuryNetworkLayer.queryFeatures(query, selectInBuffer);
            schoolPolysLayer.queryFeatures(query, selectInBuffer);
            transDemand.queryFeatures(query, selectInBuffer);
            halfMileSchool.queryFeatures(query, selectInBuffer);
            transitEN.queryFeatures(query, selectInBuffer);
            bicycleN.queryFeatures(query, selectInBuffer);
            neighborhoodN.queryFeatures(query, selectInBuffer);
            pedestrianED.queryFeatures(query, selectInBuffer);
            greenN.queryFeatures(query, selectInBuffer);
      //    rStationConnectivity.queryFeatures(query, selectInBuffer);




            setTimeout(function(){


              var schoolBuffer =layersAfterQuery["Half Mile Buffer Top 50"];
              var publicHDI = layersAfterQuery["California_HDI_Public_Health_Need_Indicator"];
              var stormwater = layersAfterQuery["Stormwater_Management_Features_Feasibility"];
              var urbanHeat = layersAfterQuery["Urban_Heat_Island"];
              var economicHDI = layersAfterQuery["California_HDI_Economic_Need_Indicator"];
              var highInjuryNetwork = layersAfterQuery["High Injury Network"];
              var schoolPolys = layersAfterQuery["School Campuses (LAUSD)"];

              safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, publicHDI);





            }, 2000);

            function selectInBuffer(response) {
                var feature;
                var features = response.features;
                var inBuffer = [];
                // Check for intersection and containment of each feature in the the layer.
                for (var i = 0; i < features.length; i++) {
                    feature = features[i];

                    //If the projectLocation is  a point, check to see if it is inside the buffer zone of each feature for this layer.
                    if (projectLocation.type == "point") {
                        if (geometryEngine.contains(feature.geometry, projectLocation)) {
                            //add to the array
                            inBuffer.push(feature);
                            layersAfterQuery[feature._layer.name].push(feature);
                        }

                        //If it is not a point, then it must be a line or polygon.  Check to see if it intersects with the buffer zone of each feature for this layer.

                    } else {
                        if (geometryEngine.intersects(feature.geometry, projectLocation)) {
                            //add to the array
                            inBuffer.push(feature);
                            layersAfterQuery[feature._layer.name].push(feature);
                        }
                    }
                }

            } //end of SelectInBuffer

            function schoolBufferScore(schoolBuffer) {
              var score = 0;
              if(schoolBuffer.length > 0) {
                score = 5;
              }
              console.log("Half mile school buffer score = " + score);
              return score;
            }

            function schoolPolysScore(schoolPolys) {
              var score = 0;
              if (schoolPolys.length > 0) {
                score = 5;
              }
              console.log("School safety route score = " + score);
              score_content.innerHTML += "School safety route score = " + score +"<br>"
              return score;
            }

            function highInjuryNetworkScore(highInjuryNetwork) {
              var score = 0;
              if (highInjuryNetwork.length > 0) {
                score = 5;
              }

              score_content.innerHTML += "High injury network score = " + score + "<br>";
              return score;
            }

            function publicHDIScore(publicHDI) {
              var score =0;
              if(publicHDI.length > 0){
                score = publicHDI[0].attributes.Health_Sco;
              }
              score_content.innerHTML +="public HDI score = " + score + "<br>";
              return score;
            }

            function stormwaterScore(stormwater) {
              var score = 0;
              if (stormwater.length > 0) {
                score = 5;
              }
              score_content.innerHTML += "storm water score = " + score + "<br>"
              return score;
            }




            function safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, publicHDI) {
              score_content.innerHTML = " ";
              var total = schoolBufferScore(schoolBuffer) + schoolPolysScore(schoolPolys) + highInjuryNetworkScore(highInjuryNetwork) + publicHDIScore(publicHDI);
              var score = total /4;
              score_content.innerHTML += "Category 2: Safe And Healthy score = " + score + "<br>";
              return score;
            }










        }); // end of editToolbar.on
    }; //end of initEditor
}); //end of require
