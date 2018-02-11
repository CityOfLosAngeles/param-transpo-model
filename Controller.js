require([
    "esri/map",
    "esri/toolbars/draw",
    "esri/graphic",
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
    "esri/dijit/analysis/ExtractData",
    "dijit/registry",
    "dojo/dom-style",
    "esri/domUtils",
    "dojo/ready",
    "dojo/_base/array",
    "esri/urlUtils",
    "esri/arcgis/Portal",
    "esri/dijit/analysis/FindHotSpots",
    "esri/dijit/Legend",

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

    "dojo/i18n!esri/nls/jsapi",
    "dojo/_base/array", "dojo/parser", "dojo/keys", "dojo/dom",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"





], function(
    Map, Draw, Graphic, GeometryService, Query,
    ArcGISTiledMapServiceLayer, FeatureLayer, LayerList,
    Color, SimpleMarkerSymbol, SimpleLineSymbol,
    Editor, TemplatePicker,
    geometryEngine, ExtractData, registry, domStyle, domUtils, ready, array, urlUtils, arcgisPortal, FindHotSpots, Legend,
    esriConfig, InfoTemplate, request, scaleUtils, PictureMarkerSymbol, JSON, on, sniff, lang,
    SimpleRenderer, Color, SimpleFillSymbol, SimpleLineSymbol,
    jsapiBundle,
    arrayUtils, parser, keys, dom, BorderContainer, ContentPane
) {
    parser.parse();

    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start + "<br>Press <b>ALT</b> to enable snapping";
    var portalUrl = "https://www.arcgis.com";
    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "/proxy/";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    var score_content = document.getElementById('score');
    var report = "";

    document.getElementById("extractData").addEventListener("click", initializeHotSpotTool);


    esriConfig.defaults.io.corsEnabledServers.push('analysis.arcgis.com');
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


    var map = new Map("map", {
        basemap: "streets",
        center: [-118.2, 34],
        zoom: 12,
        slider: false
    });

    map.on("layers-add-result", initEditor);

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


    //Added 3 new Layers - Need to implement into intersection
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

    //adding 2 layers to the list - sept 29
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

    // added layers 1C & 2A - oct 6
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

    // added all of 1a - oct 6

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

    var responseLines = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/Line/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });


    var responsePoints = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/Point/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    var responsePolys = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/Polygon/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    /*
    var responseMultiPoints = new FeatureLayer("https://services8.arcgis.com/DcGhva9ip32u1Ab8/ArcGIS/rest/services/Multipoint/FeatureServer/0", {
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ['*']
    });
*/


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
    //Need to recolor these 2 layers -- erase this comment when done
    highInjuryNetworkBuffer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        highInjuryNetworkBuffer.setRenderer(renderer);
    });

    threeMileTripLayer.on("load", function() {
        var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        threeMileTripLayer.setRenderer(renderer);
    });


    map.addLayers([responseLines, responsePolys, responsePoints /*, responseMultiPoints*/ ]);


    var layers = [schoolBufferLayer, publicHealthLayer, stormwaterLayer, urbanHeatLayer, economicHDILayer, criticalConnections, highInjuryNetworkLayer, schoolPolysLayer, downtownDashBuffer, streetDesign, rStationConnectivity, transDemand, halfMileSchool, transitEN, bicycleN, neighborhoodN, pedestrianED, greenN, highInjuryNetworkBuffer, threeMileTripLayer];

    layers.forEach(function(layer) {
        map.addLayer(layer);
    });

    console.log(map.graphicsLayerIds);


    //Download Score Report
    function downloadReport(content) {
        data = [];

        data.push(content);
        properties = { type: 'plain/text' }; // Specify the file's mime-type.
        try {
            // Specify the filename using the File constructor, but ...
            file = new File(content, "file.doc", properties);
        } catch (e) {
            // ... fall back to the Blob constructor if that isn't supported.
            file = new Blob(data, properties);
        }
        url = URL.createObjectURL(file);
        document.getElementById('report').href = url;

    }





    //Create Feature Collection to be added into the map
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

    function includesId(responseLayer, id) {

        for (var i = 0; i < responseLayer.graphics.length; i++) {
            console.log(responseLayer.graphics[i]);
            if (responseLayer.graphics[i].attributes.projectid == id) {
                console.log(true);
                return true;

            }

        }

        return false;
    }


    function includesPoly(responseLayer, id) {

        for (var i = 0; i < responseLayer.graphics.length; i++) {
            console.log(responseLayer.graphics[i]);
            if (responseLayer.graphics[i].attributes.ProjectID == id) {
                console.log(true);
                return true;

            }

        }

        return false;
    }


    //Add new Features
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
            //    console.log(featureLayer);
            layers.push(featureLayer);
        });
        map.addLayers(layers);
        map.setExtent(fullExtent.expand(1.25), true);


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
                var pointGraphics = [];
                for (var i = 0; i < layer.graphics.length; i++) {
                    //console.log(layer.graphics[i].attributes.ProjectID);
                    if (!includesId(responsePoints, layer.graphics[i].attributes.ProjectID)) {
                        pointGraphics.push(layer.graphics[i]);
                        console.log(true);
                    }
                }

                console.log(pointGraphics.length);
                responsePoints.applyEdits(pointGraphics);
                break;
            case 'esriGeometryPolygon':
                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));

                var polygonGraphics = [];

                for (var i = 0; i < layer.graphics.length; i++) {
                    if (!includesPoly(responsePolys, layer.graphics[i].attributes.ProjectID)) {
                        console.log(layer.graphics[i]);
                        polygonGraphics.push(layer.graphics[i]);

                    }
                }
                console.log(layer.graphics);
                //console.log(polygonGraphics);
                responsePolys.applyEdits(polygonGraphics);
                break;
            case 'esriGeometryPolyline':

                var polylineGraphics = [];

                for (var i = 0; i < layer.graphics.length; i++) {

                    if (!includesId(responsePoints, layer.graphics[i].attributes.ProjectID)) {
                        polylineGraphics.push(layer.graphics[i]);
                        console.log(layer.graphics[i]);
                    }
                }
                console.log(polylineGraphics.length);
                responseLines.applyEdits(polylineGraphics);
                break;

        }
        if (symbol) {
            layer.setRenderer(new SimpleRenderer(symbol));
        }
    }


    //Extract Data
    function initializeHotSpotTool() {
        showToolPanel();

        //Define the default inputs for the widget
        var extractDataParams = {
            featureLayers: [responseLines, responsePolys, responsePoints],
            inputLayers: [responseLines, responsePolys, responsePoints],
            portalUrl: "https://www.arcgis.com",
            showSelectFolder: true,
            showChooseExtent: false,
            showCredits: false,
            clip: false,
            map: map
        };

        hotSpots = new ExtractData(extractDataParams, "analysisDiv");

        // the only way i can get this tool to execute is when users sketch a study area of their own
        hotSpots.startup();

        //If any errors occur reset the widget (Not Working...troubleshoot)
        on(hotSpots, "job-fail", function(params) {
            // handle
        });
        on(hotSpots, "job-status", function(status) {
            if (status.jobStatus === 'esriJobFailed') {
                alert("Job Failed: " + status.messages[0].description);
                // handle
            }

        });
        on(hotSpots, "job-cancel", function() {
            // handle
        });
        on(hotSpots, "job-submit", function(result) {
            //display the loading icon
            domUtils.show(dom.byId("loader"));

        });

        on(hotSpots, "job-result", function(result) {
            //hide the loading icon
            domUtils.hide(dom.byId("loader"));
            // fetch/display the results
        });
    }

    function showToolPanel() {
        // expand the right panel to display the content
        var cp = registry.byId("extractDiv");
        domStyle.set(cp.domNode, { width: "20%" });
        registry.byId("rightContainer").resize();


    }


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
            { layer: highInjuryNetworkBuffer, visible: true },
        ],

    }, "layerListDom");


    layerListToggle.startup();




    //Initiate Editor
    function initEditor(evt) {
        var templateLayers = arrayUtils.map(evt.layers, function(result) {
            return result.layer;
        });


        var drawToolbar = new Draw(map);

        var templatePicker = new TemplatePicker({
            featureLayers: templateLayers,
            grouping: true,
            rows: "auto",
            columns: 3
        }, "templateDiv");
        templatePicker.startup();


        var selectedTemplate;
        templatePicker.on("selection-change", function() {
            if (templatePicker.getSelected()) {
                selectedTemplate = templatePicker.getSelected();
            }
            switch (selectedTemplate.featureLayer.geometryType) {

                case "esriGeometryMultipoint":
                    drawToolbar.activate(Draw.MULTI_POINT);
                    break;
                default:
                    break;
            }
        });

        drawToolbar.on("draw-end", function(evt) {
            drawToolbar.deactivate();

            var newAttributes = lang.mixin({}, selectedTemplate.template.prototype.attributes);
            var newGraphic = new Graphic(evt.geometry, null, newAttributes);
            console.log(newGraphic);
            selectedTemplate.featureLayer.applyEdits([newGraphic], null, null);
        });

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
            report = "";
            var query = new Query();
            query.geometry = evt.graphic.geometry;
            console.log(evt);
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

                    } else if (projectLocation.type == "polygon") {
                        if (geometryEngine.intersects(feature.geometry, projectLocation)) {
                            //add to the array

                            if (feature._layer.name == "California_HDI_Public_Health_Need_Indicator") {

                                var intersectPolygon = geometryEngine.intersect(feature.geometry, projectLocation);
                                var area = geometryEngine.geodesicArea(intersectPolygon, 'square-meters');
                                var area_score = { "area": area, "score": feature.attributes.Health_Sco }
                                layersAfterQuery[feature._layer.name].push(area_score);

                            } else {

                                layersAfterQuery[feature._layer.name].push(feature);
                            }

                        }
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
                report += "1c. Active Transportation Demand = " + score + "\n";
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
                report += "Top 50 School Score = " + schoolBufferScore + "\nHalf Mile School Score = " + schoolPolyScore + "\n";
                return schoolBufferScore + schoolPolyScore;
            }


            function highInjuryNetworkScore(highInjuryNetwork, highInjuryBuffer) {
                var score = 0;
                if (highInjuryNetwork.length > 0) score = 5;
                else if (highInjuryBuffer.length > 0) score = 2.5;

                score_content.innerHTML += "High Injury Network Score = " + score + "<br>";
                report += "High Injury Network Score = " + score + "\n";
                return score;
            }

            function publicHDIScore(publicHDI) {

                var score = 0;
                if ((publicHDI.length > 0) && (projectLocation.type == "polygon")) {

                    var totalArea = 0;
                    for (var i = 0; i < publicHDI.length; i++) {
                        totalArea += publicHDI[i].area;
                    }
                    for (var i = 0; i < publicHDI.length; i++) {
                        score += (publicHDI[i].area / totalArea) * publicHDI[i].score;
                    }
                } else {
                    if (publicHDI[0]) {

                        score = publicHDI[0].attributes.Health_Sco;
                    }
                }
                score_content.innerHTML += "Public HDI Score = " + score.toFixed(2) + "<br>";
                report += "Public HDI Score = " + score.toFixed(2) + "\n";
                return score;
            }


            function safeAndHealthyScore(schoolBuffer, schoolPolys, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI) {
                //score_content.innerHTML = " ";
                var total = schoolLayerScores(schoolBuffer, schoolPolys) + highInjuryNetworkScore(highInjuryNetwork, highInjuryNetworkBuffer) + publicHDIScore(publicHDI);
                var score = total / 4;
                score_content.innerHTML += "<b>Category 2 Score = " + score.toFixed(2) + "</b><br>";
                report += "Category 2 Score = " + score + "\n";
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
                report += "Economic HDI Score = " + score + "\n";
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
                report += "Critical Connection Score = " + score + "\n";
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
                score_content.innerHTML += "Storm Water Score = " + score + "<br>";
                report += "Storm Water Score = " + score + "\n";

                return score;
            }

            function urbanHeatScore(urbanHeat) {
                var score = 0;
                if (urbanHeat.length > 0) {
                    if (urbanHeat[0].attributes.heatisland == "High") score = 5;
                    else if (urbanHeat[0].attributes.heatisland == "Medium High") score = 2.5;
                    else if (urbanHeat[0].attributes.heatisland == "Low") score = 1.25;
                }
                score_content.innerHTML += "Urban Heat Score = " + score + "<br>";
                report += "Urban Heat Score = " + score + "\n";
                return score;
            }

            function sustainableAndResilientScore(stormwater, urbanHeat) {
                var score = stormwaterScore(stormwater) + urbanHeatScore(urbanHeat);
                score_content.innerHTML += "<b>Category 5 Score = " + score + "</b><br>";
                report += "Category 5 Score = " + score + "\n";
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
                score_content.innerHTML += "<br><b>Total Score = " + total.toFixed(2) + "</b><br>";
                score_content.innerHTML += "<b>Weighted Score = " + weighted.toFixed(2) + "</b><br>";
                report += "\nTotal Score = " + total.toFixed(2) + "\n";
                report += "Weighted Score = " + weighted.toFixed(2) + "\n";


                var reportArray = [];
                reportArray.push(("Project Name: " + evt.graphic.attributes.project_name + "\n\n"));
                reportArray.push(report);



                downloadReport(reportArray);

            }

            //End of Section 5 Scoring

        }); // end of editToolbar.on
    }; //end of initEditor
}); //end of require