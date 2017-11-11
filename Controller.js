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

    "esri/InfoTemplate",
    "esri/request",
    "esri/geometry/scaleUtils",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/json",
    "dojo/on",
    "dojo/sniff",
    "dojo/_base/lang",

    "esri/renderers/SimpleRenderer", "esri/Color",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
    "esri/geometry/Multipoint",
    "dojo/i18n!esri/nls/jsapi",
    "dojo/_base/array", "dojo/parser", "dojo/keys", "dojo/dom",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!",

], function(
    Map, GeometryService, Query,
    ArcGISTiledMapServiceLayer, FeatureLayer, LayerList,
    Color, SimpleMarkerSymbol, SimpleLineSymbol,
    Editor, TemplatePicker,
    geometryEngine,
    esriConfig, InfoTemplate, request, scaleUtils, PictureMarkerSymbol, JSON, on, sniff, lang,



    SimpleRenderer, Color, SimpleFillSymbol, SimpleLineSymbol, Multipoint,



    jsapiBundle,
    arrayUtils, parser, keys, dom
) {
    parser.parse();
    var portalUrl = "https://www.arcgis.com";
    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start + "<br>Press <b>ALT</b> to enable snapping";
    var portalUrl = "https://www.arcgis.com";
    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "/proxy/";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    var score_content = document.getElementById('score');


    on(dom.byId("uploadForm"), "change", function(event) {
        var fileName = event.target.value.toLowerCase();

        if (sniff("ie")) { //filename is full path in IE so extract the file name
            var arr = fileName.split("\\");
            fileName = arr[arr.length - 1];
        }
        if (fileName.indexOf(".zip") !== -1) { //is file a zip - if not notify user
            generateFeatureCollection(fileName);
        } else {
            dom.byId('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
        }
    });



    function generateFeatureCollection(fileName) {
        var name = fileName.split(".");
        //Chrome and IE add c:\fakepath to the value - we need to remove it
        //See this link for more info: http://davidwalsh.name/fakepath
        name = name[0].replace("c:\\fakepath\\", "");

        dom.byId('upload-status').innerHTML = '<b>Loading… </b>' + name;

        //Define the input params for generate see the rest doc for details
        //http://www.arcgis.com/apidocs/rest/index.html?generate.html
        var params = {
            'name': name,
            'targetSR': map.spatialReference,
            'maxRecordCount': 1000,
            'enforceInputFileSizeLimit': true,
            'enforceOutputJsonSizeLimit': true
        };

        //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
        //This should work well when using web mercator.
        var extent = scaleUtils.getExtentForScale(map, 40000);
        var resolution = extent.getWidth() / map.width;
        params.generalize = true;
        params.maxAllowableOffset = resolution;
        params.reducePrecision = true;
        params.numberOfDigitsAfterDecimal = 0;

        var myContent = {
            'filetype': 'shapefile',
            'publishParameters': JSON.stringify(params),
            'f': 'json',
            'callback.html': 'textarea'
        };

        //use the rest generate operation to generate a feature collection from the zipped shapefile
        request({
            url: portalUrl + '/sharing/rest/content/features/generate',
            content: myContent,
            form: dom.byId('uploadForm'),
            handleAs: 'json',
            load: lang.hitch(this, function(response) {
                if (response.error) {
                    errorHandler(response.error);
                    return;
                }
                var layerName = response.featureCollection.layers[0].layerDefinition.name;
                dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                addShapefileToMap(response.featureCollection);
            }),
            error: lang.hitch(this, errorHandler)
        });
    }



    function errorHandler(error) {
        dom.byId('upload-status').innerHTML =
            "<p style='color:red'>" + error.message + "</p>";
    }



    function addShapefileToMap(featureCollection) {
        //add the shapefile to the map and zoom to the feature collection extent
        //If you want to persist the feature collection when you reload browser you could store the collection in
        //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
        //for an example of how to work with local storage.
        var fullExtent;
        var layers = [];

        arrayUtils.forEach(featureCollection.layers, function(layer) {
            var infoTemplate = new InfoTemplate("Details", "${*}");
            var featureLayer = new FeatureLayer(layer, {
                infoTemplate: infoTemplate
            });
            //associate the feature with the popup on click to enable highlight and zoom to
            featureLayer.on('click', function(event) {
                map.infoWindow.setFeatures([event.graphic]);
            });
            //change default symbol if desired. Comment this out and the layer will draw with the default symbology
            changeRenderer(featureLayer);
            fullExtent = fullExtent ?
                fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
            layers.push(featureLayer);
        });
        map.addLayers(layers);
        map.setExtent(fullExtent.expand(1.25), true);

        dom.byId('upload-status').innerHTML = "";
    }


    function changeRenderer(layer) {
        //change the default symbol for the feature collection for polygons and points
        var symbol = null;
        switch (layer.geometryType) {
            case 'esriGeometryPoint':
                symbol = new PictureMarkerSymbol({
                    'angle': 0,
                    'xoffset': 0,
                    'yoffset': 0,
                    'type': 'esriPMS',
                    'url': 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                    'contentType': 'image/png',
                    'width': 20,
                    'height': 20
                });
                responsePoints.applyEdits(layer.graphics);
                break;
            case 'esriGeometryPolygon':
                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                break;
        }
        if (symbol) {
            layer.setRenderer(new SimpleRenderer(symbol));
        }
    }


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
        opacity: 0.7,
        visible: false
    });

    var publicHealthLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Public_Health_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    var stormwaterLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Stormwater_Management_Features_Feasibility/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var urbanHeatLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Urban_Heat_Island/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    var economicHDILayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Economic_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    var criticalConnections = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Critical_Connections/FeatureServer/0", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });

    var highInjuryNetworkLayer = new FeatureLayer("https://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/hin_082015/FeatureServer/0/", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    var schoolPolysLayer = new FeatureLayer("https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/2", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });

    var downtownDashBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/1d%20Downtown%20DASH%20Bus%20Stop%20Areas%20(Quarter-Mile%20Buffer)/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    var streetDesign = new FeatureLayer("http://maps.lacity.org/lahub/rest/services/Street_Information/MapServer/36", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    var rStationConnectivity = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_TPA/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    var transDemand = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/9", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    var halfMileSchool = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_School_New/FeatureServer/1", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    var transitEN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/5", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    var bicycleN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/6", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    var neighborhoodN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/7", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    var pedestrianED = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/8", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    var greenN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/23", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    var highInjuryNetworkBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/2%20High%20Injury%20Network%20Half%20Mile%20Buffer/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    })

    var threeMileTripLayer = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/9", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    })

    //Geometry types for the project location
    /*
        var responseLines = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/losangeles_lines/FeatureServer/0", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ['*']
        });

        ///   https: //services8.arcgis.com/nfOa0issNhtH9leK/arcgis/rest/services/pointDomain_Test/FeatureServer

       
            var responsePoints = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/losangeles_points/FeatureServer/0", {
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ['*']
            });


                var responsePolys = new FeatureLayer("https://services8.arcgis.com/9YzOpduhkOqvcqYN/arcgis/rest/services/la_polygon/FeatureServer/0", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ['*']
        });

        */

    var responseLines = new FeatureLayer("https://services8.arcgis.com/nfOa0issNhtH9leK/ArcGIS/rest/services/Lines/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    var responsePoints = new FeatureLayer("https://services8.arcgis.com/nfOa0issNhtH9leK/ArcGIS/rest/services/Points/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    var responsePolys = new FeatureLayer("https://services8.arcgis.com/nfOa0issNhtH9leK/ArcGIS/rest/services/Polygons/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    var responseMultiPoint = new FeatureLayer("https://services8.arcgis.com/nfOa0issNhtH9leK/ArcGIS/rest/services/Multipoint/FeatureServer/0", {
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
    /*
        highInjuryNetworkLayer.on("load", function() {
            var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
            highInjuryNetworkLayer.setRenderer(renderer);
        });
    */
    schoolPolysLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 0, 255])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
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
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 255, 255])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        halfMileSchool.setRenderer(renderer);
    });

    transDemand.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        transDemand.setRenderer(renderer);
    });

    /*
        transitEN.on("load", function() {
            var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([170, 102, 205])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
            transitEN.setRenderer(renderer);
        });

        //    bicycleN.on("load", function() {
        //        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color(52, 52, 52])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        //      bicycleN.setRenderer(renderer);
        //    });

        neighborhoodN.on("load", function() {
            var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 0, 255])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
            neighborhoodN.setRenderer(renderer);
        });

        pedestrianED.on("load", function() {
            var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
            pedestrianED.setRenderer(renderer);
        });

        greenN.on("load", function() {
            var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
            greenN.setRenderer(renderer);
        });

    */

    highInjuryNetworkBuffer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        highInjuryNetworkBuffer.setRenderer(renderer);
    });

    threeMileTripLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        threeMileTripLayer.setRenderer(renderer);
    });


    map.addLayers([responseLines, responsePolys, responsePoints, responseMultiPoint]);
    var layers = [schoolBufferLayer, publicHealthLayer, stormwaterLayer, urbanHeatLayer, economicHDILayer, criticalConnections, highInjuryNetworkLayer, schoolPolysLayer, downtownDashBuffer, streetDesign, rStationConnectivity, transDemand, halfMileSchool, transitEN, bicycleN, neighborhoodN, pedestrianED, greenN, highInjuryNetworkBuffer, threeMileTripLayer];

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
            //{ layer: streetDesign, visible: true },
            { layer: rStationConnectivity, visible: true },
            { layer: transDemand, visible: true },
            { layer: halfMileSchool, visible: true },
            { layer: transitEN, visible: true },
            { layer: bicycleN, visible: true },
            { layer: neighborhoodN, visible: true },
            { layer: pedestrianED, visible: true },
            { layer: greenN, visible: true },
            { layer: highInjuryNetworkBuffer, visible: true },
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
            var layersAfterQuery = {
                "Half Mile Buffer Top 50": [],
                "California_HDI_Public_Health_Need_Indicator": [],
                "Stormwater_Management_Features_Feasibility": [],
                "Urban_Heat_Island": [],
                "California_HDI_Economic_Need_Indicator": [],
                "High Injury Network": [],
                "Schools - Half-Mile Buffer": [],
                "2 High Injury Network Half Mile Buffer": [],
                "Critical_Connections": [],
                "Percentage of Trips Under Three Miles": [],

            };

            var schoolBuffer = [];
            var publicHDI = [];
            var stormwater = [];
            var urbanHeat = [];
            var economicHDI = [];
            var highInjuryNetwork = [];
            var schoolPolys = [];
            var highInjuryBuffer = [];
            var criticalConnect = [];
            var threeMileTrips = [];

            //  search for features in these layers.
            schoolBufferLayer.queryFeatures(query, selectInBuffer);
            publicHealthLayer.queryFeatures(query, selectInBuffer);
            stormwaterLayer.queryFeatures(query, selectInBuffer);
            urbanHeatLayer.queryFeatures(query, selectInBuffer);
            economicHDILayer.queryFeatures(query, selectInBuffer);
            highInjuryNetworkLayer.queryFeatures(query, selectInBuffer);
            // schoolPolysLayer.queryFeatures(query, selectInBuffer);
            //  transDemand.queryFeatures(query, selectInBuffer);
            halfMileSchool.queryFeatures(query, selectInBuffer);
            // transitEN.queryFeatures(query, selectInBuffer);
            // bicycleN.queryFeatures(query, selectInBuffer);
            // neighborhoodN.queryFeatures(query, selectInBuffer);
            // pedestrianED.queryFeatures(query, selectInBuffer);
            // greenN.queryFeatures(query, selectInBuffer);
            highInjuryNetworkBuffer.queryFeatures(query, selectInBuffer);
            criticalConnections.queryFeatures(query, selectInBuffer);
            threeMileTripLayer.queryFeatures(query, selectInBuffer);
            // rStationConnectivity.queryFeatures(query, selectInBuffer);




            setTimeout(function() {


                var schoolBuffer = layersAfterQuery["Half Mile Buffer Top 50"];
                var publicHDI = layersAfterQuery["California_HDI_Public_Health_Need_Indicator"];
                var stormwater = layersAfterQuery["Stormwater_Management_Features_Feasibility"];
                var urbanHeat = layersAfterQuery["Urban_Heat_Island"];
                var economicHDI = layersAfterQuery["California_HDI_Economic_Need_Indicator"];
                var highInjuryNetwork = layersAfterQuery["High Injury Network"];
                var schoolPolys = layersAfterQuery["Schools - Half-Mile Buffer"];
                var highInjuryBuffer = layersAfterQuery["2 High Injury Network Half Mile Buffer"];
                var criticalConnect = layersAfterQuery["Critical_Connections"];
                //var threeMileTrips = layersAfterQuery["Percentage of Trips Under Three Miles"];

                //latentActiveTransportationScore(threeMileTrips);
                //safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryBuffer, publicHDI);
                //economicHDIScore(economicHDI);
                //criticalConnetionScore(criticalConnect);
                //sustainableAndResilientScore(stormwater, urbanHeat);
                totalScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI, economicHDI, criticalConnect, stormwater, urbanHeat);



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


            //Start of Section 1 Scoring
            //Need to implement scoring for 1a, 1b, 1d

            //1c
            function latentActiveTransportationScore(threeMileTrips) {
                score_content.innerHTML = " ";
                var score = 0;
                if (threeMileTrips.length > 0) {
                    if (threeMileTrips[0].attributes.PCT_3MI >= .5 && threeMileTrips[0].attributes.PCT_3MI <= .704) score = 5;
                    else if (threeMileTrips[0].attributes.PCT_3MI >= .35 && threeMileTrips[0].attributes.PCT_3MI < .5) score = 2.5;
                }
                score_content.innerHTML += "1c. Active Transportation Demand = " + score + "<br>"
                return score;
            }


            //Start of Section 2 Scoring
            function schoolLayerScores(schoolBuffer, schoolPolys) {
                var schoolBufferScore = 0;
                var schoolPolyScore = 0;
                if (schoolBuffer.length > 0) {
                    schoolBufferScore = 5;
                    schoolPolyScore = 5;
                } else if (schoolPolys.length > 0) {
                    schoolBufferScore = 0;
                    schoolPolyScore = 5;
                }
                score_content.innerHTML += "Top 50 School Score = " + schoolBufferScore + "<br>Half Mile School Score = " + schoolPolyScore + "<br>"
                return schoolBufferScore + schoolPolyScore;
            }


            function highInjuryNetworkScore(highInjuryNetwork, highInjuryBuffer) {
                var score = 0;
                if (highInjuryNetwork.length > 0) score = 5;
                else if (highInjuryBuffer.length > 0) score = 2.5;

                score_content.innerHTML += "High Injury Network Score = " + score + "<br>";
                return score;
            }

            function publicHDIScore(publicHDI) {
                var score = 0;
                if (publicHDI.length > 0) {
                    score = publicHDI[0].attributes.Health_Sco;
                    if (score == 5) score = 5;
                    else if (score == 4) score = 2.5;
                    else if (score == 3) score = 1.25;
                }
                score_content.innerHTML += "Public HDI Score = " + score + "<br>";
                return score;
            }


            function safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI) {
                //score_content.innerHTML = " ";
                var total = schoolLayerScores(schoolBuffer, schoolPolys) + highInjuryNetworkScore(highInjuryNetwork, highInjuryNetworkBuffer) + publicHDIScore(publicHDI);
                var score = total / 4;
                score_content.innerHTML += "<b>Category 2 Score = " + score + "</b><br>";
                return score;
            }
            //End of Section 2 Scoring

            //Start of Section 3 Scoring
            function economicHDIScore(economicHDI) {
                var score = 0;
                if (economicHDI.length > 0) {
                    score = economicHDI[0].attributes.econ_dis_1;
                    if (score == 5) score = 5;
                    else if (score == 4) score = 2.5;
                    else if (score == 3) score = 1.25;
                }
                score_content.innerHTML += "<b>Economic HDI Score = " + score + "</b><br>";
                return score;
            }
            //End of Section 3 Scoring

            //Start of Section 4 Scoring
            function criticalConnetionScore(criticalConnect) {
                var score = 0;
                if (criticalConnect.length > 0) {
                    if (criticalConnect[0].attributes.Ct_Need == "Highly Critical") score = 5;
                    else score = 2.5;
                }
                score_content.innerHTML += "<b>Critical Connection Score = " + score + "</b><br>";
                return score;
            }
            //End of Section 4 Scoring

            //Start of Section 5 Scoring
            function stormwaterScore(stormwater) {
                var score = 0;
                if (stormwater.length > 0) {
                    if (stormwater[0].attributes.sw_label == "Very High") score = 5;
                    else if (stormwater[0].attributes.sw_label == "High") score = 2.5;
                    else if (stormwater[0].attributes.sw_label == "Medium") score = 1.25;
                }
                score_content.innerHTML += "Storm Water Score = " + score + "<br>"
                return score;
            }

            function urbanHeatScore(urbanHeat) {
                var score = 0;
                if (urbanHeat.length > 0) {
                    if (urbanHeat[0].attributes.heatisland == "High") score = 5;
                    else if (urbanHeat[0].attributes.heatisland == "Medium High") score = 2.5;
                    else if (urbanHeat[0].attributes.heatisland == "Low") score = 1.25;
                }
                score_content.innerHTML += "Urban Heat Score = " + score + "<br>"
                return score;
            }

            function sustainableAndResilientScore(stormwater, urbanHeat) {
                var score = stormwaterScore(stormwater) + urbanHeatScore(urbanHeat);
                score_content.innerHTML += "<b>Category 5 Score = " + score + "</b><br>";
                return score;
            }


            function totalScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI, economicHDI, criticalConnect, stormwater, urbanHeat) {
                score_content.innerHTML = " ";

                var section2TotalScore = safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI);
                var section2WeightedScore = section2TotalScore * 0.75;

                var section3TotalScore = economicHDIScore(economicHDI);
                var section3WeightedScore = section3TotalScore * 2;

                var section4TotalScore = criticalConnetionScore(criticalConnect);
                var section4WeightedScore = section4TotalScore * 0.5;

                var section5TotalScore = sustainableAndResilientScore(stormwater, urbanHeat);
                var section5WeightedScore = section5TotalScore * 0.5;

                var total = section2TotalScore + section3TotalScore + section4TotalScore + section5TotalScore;
                var weighted = section2WeightedScore + section3WeightedScore + section4WeightedScore + section5WeightedScore;
                score_content.innerHTML += "<br><b>Total Score = " + total + "</b><br>";
                score_content.innerHTML += "<b>Weighted Score = " + weighted + "</b><br>";

            }

            //End of Section 5 Scoring

        }); // end of editToolbar.on
    }; //end of initEditor
}); //end of require