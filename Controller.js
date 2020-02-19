//Set default values for weights when application loads
let section1WeightValue = 0.75;
let section2WeightValue = 0.75;
let section3WeightValue = 2;
let section4WeightValue = 0.5;
let section5WeightValue = 0.5;

//Change weight value based on user input
function updateWeights(sect1, sect2, sect3, sect4, sect5) {
    if (sect1.value >= 0 && sect2.value >= 0 && sect3.value >= 0 && sect4.value >= 0 && sect5.value >= 0) {
        section1WeightValue = sect1.value;
        section2WeightValue = sect2.value;
        section3WeightValue = sect3.value;
        section4WeightValue = sect4.value;
        section5WeightValue = sect5.value;

        modal.style.display = "none"; //Hides weight window after valid numbers have been submitted
    } else alert("Please insert valid numbers only");
}


require([
    "esri/map",
    "esri/dijit/InfoWindow",
    "esri/dijit/AttributeInspector",
    "dojo/dom-construct",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
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
    "dojo/_base/event",
    "esri/renderers/SimpleRenderer", "esri/Color",
    "esri/symbols/SimpleFillSymbol",
    "esri/renderers/ClassBreaksRenderer",
    "dojo/i18n!esri/nls/jsapi",
    "dojo/_base/array", "dojo/parser", "dojo/keys", "dojo/dom",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"

], function(
    Map, InfoWindow, AttributeInspector, domConstruct, Draw, Edit, Graphic, GeometryService, Query,
    ArcGISTiledMapServiceLayer, FeatureLayer, LayerList,
    Color, SimpleMarkerSymbol, SimpleLineSymbol,
    Editor, TemplatePicker,
    geometryEngine, ExtractData, registry, domStyle, domUtils, ready, array, urlUtils, arcgisPortal, FindHotSpots, Legend,
    esriConfig, InfoTemplate, request, scaleUtils, PictureMarkerSymbol, JSON, on, sniff, lang, event,
    SimpleRenderer, Color, SimpleFillSymbol, ClassBreaksRenderer,
    jsapiBundle,
    arrayUtils, parser, keys, dom, BorderContainer, ContentPane
) {

    dojo.require("dijit.layout.BorderContainer");
    dojo.require("dijit.layout.ContentPane");
    dojo.require("esri.map");
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.toolbars.edit");
    dojo.require("esri.layers.FeatureLayer");
    dojo.require("esri.dijit.editing.TemplatePicker");
    dojo.require("esri.dijit.AttributeInspector");

    parser.parse();

    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start + "<br>Press <b>ALT</b> to enable snapping";
    let portalUrl = "https://www.arcgis.com";
    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "/proxy/";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
    esriConfig.defaults.geometryService = new GeometryService("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    let score_content = document.getElementById('score');
    let report = "";
    let score_features = "ID Number, Three Mile Trips, Transit Priority Area, Downtown Dash, " +
        "Community Dash, Half Mile School Buffer, School Safe, High Injury Network, " +
        "High Injury Buffer, Public HDI, Economic HDI, Critical Connection, Storm Water, Urban Heat\n";
    const deleteGraphicsButtondeleteGraphicsButton = document.getElementById('deleteGraphicsButton');
    const updateScoresButton = document.getElementById('updateScoresButton');

    esriConfig.defaults.io.corsEnabledServers.push('analysis.arcgis.com');
    on(dom.byId("uploadForm"), "change", function(event) {
        let fileName = event.target.value.toLowerCase();

        if (sniff("ie")) { //filename is full path in IE so extract the file name
            const arr = fileName.split("\\");
            fileName = arr[arr.length - 1];
        }
        if (fileName.indexOf(".zip") !== -1) { //is file a zip - if not notify user
            generateFeatureCollection(fileName);
        } else {
            dom.byId('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
        }
    });

    let currentUser = "";

    //Declare admininistrator users in this array - hardcoded for now
    const admins = ["david.somers_lahub", "karina.macias", "hunterowens", "rosemary.mccarron_lahub", "wajenda.chambeshi_lahub", "aneesa.andrabi_lahub"];

    //Creates the ArcGIS Map
    const map = new Map("map", {
        basemap: "streets", //Changes the display style of the map
        center: [-118.2, 34], //Starting coordinates to be displayed upon load
        zoom: 12,
        slider: false
    });

    map.on("layers-add-result", initializeHotSpotTool);
    map.on("layers-add-result", deleteGraphics);
    map.on("layers-add-result", updateScores);



    //Layers to display / pull data from using the featurelayer's service URL
    const publicHealthLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Public_Health_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    const stormwaterLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Stormwater_Management_Features_Feasibility/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.5,
        visible: false
    });

    const urbanHeatLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Urban_Heat_Island/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    const economicHDILayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Economic_Need_Indicator/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    const criticalConnections = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Critical_Connections/FeatureServer/0", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });


    const highInjuryNetworkLayer = new FeatureLayer("https://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/hin_082015/FeatureServer/0/", {
        outFields: ['*'],
        opacity: 0.7,
        visible: false
    });

    const schoolBufferLayer = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_School_New/FeatureServer/1", {
        outFields: ['*'],
        opacity: 1,
        visible: false
    });

    const downtownDashBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/1d%20Downtown%20DASH%20Bus%20Stop%20Areas%20(Quarter-Mile%20Buffer)/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    const dashCommunityBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/DASH%20Community%20Bus%20Stop%20Areas%20(Quarter-Mile%20Buffer)/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    const rStationConnectivity = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge_TPA/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    const transDemand = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/9", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    const transitEN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/5", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    const bicycleN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/6", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    const neighborhoodN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/7", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    const pedestrianED = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/8", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    const greenN = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/23", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    });

    const transitPrio = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/4", {
        outFields: ['*'],
        opacity: 1.0,
        visible: false
    });

    const highInjuryNetworkBuffer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/2%20High%20Injury%20Network%20Half%20Mile%20Buffer/FeatureServer/0", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    })

    const threeMileTripLayer = new FeatureLayer("https://services1.arcgis.com/tzwalEyxl2rpamKs/arcgis/rest/services/Great_Streets_Challenge/FeatureServer/9", {
        outFields: ['*'],
        opacity: 0.8,
        visible: false
    })

    const responseLines = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/MIP_Score_Templates/FeatureServer/1", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    const responsePoints = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/Point/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    const responsePolys = new FeatureLayer("https://services8.arcgis.com/bsI4aojNB8UUgFuY/arcgis/rest/services/Polygon/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    const responseMultiPoints = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/MIP_Multipoint/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });


    //Change layer visualization
    responseLines.on("load", function() {
        const symbol = new SimpleLineSymbol({
            "color": [0, 92, 230, 220],
            "width": 2.25,
            "type": "esriSLS",
            "style": "esriSLSSolid"
        })

        const renderer = new esri.renderer.SimpleRenderer(symbol)
        responseLines.setRenderer(renderer)
    })

    publicHealthLayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([15, 96, 5])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        publicHealthLayer.setRenderer(renderer);
    });

    stormwaterLayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([135, 12, 56])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        stormwaterLayer.setRenderer(renderer);
    });

    urbanHeatLayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([15, 200, 86])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([15, 255, 18]))));
        urbanHeatLayer.setRenderer(renderer);
    });

    economicHDILayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([110, 85, 25])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        economicHDILayer.setRenderer(renderer);
    });

    schoolBufferLayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 0, 255])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        schoolBufferLayer.setRenderer(renderer);
    });

    downtownDashBuffer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 100])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([29, 188, 255]))));
        downtownDashBuffer.setRenderer(renderer);
    });

    rStationConnectivity.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([158, 187, 215])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        rStationConnectivity.setRenderer(renderer);
    });

    transDemand.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([255, 0, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        transDemand.setRenderer(renderer);
    });

    highInjuryNetworkBuffer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        highInjuryNetworkBuffer.setRenderer(renderer);
    });


    threeMileTripLayer.on("load", function() {
        const renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([0, 128, 0])).setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([39, 108, 205]))));
        threeMileTripLayer.setRenderer(renderer);
    });
    

    //Adds layers to the drawing tool
    const projectLayers = [responseLines, responsePolys, responsePoints, responseMultiPoints]
    map.addLayers(projectLayers);

    //Adds layers to be loaded into the application for scoring
    const layers = [publicHealthLayer, stormwaterLayer, urbanHeatLayer, economicHDILayer, criticalConnections, highInjuryNetworkLayer, downtownDashBuffer, dashCommunityBuffer, rStationConnectivity, transDemand, schoolBufferLayer, transitEN, bicycleN, neighborhoodN, pedestrianED, greenN, highInjuryNetworkBuffer, threeMileTripLayer, transitPrio];

    layers.forEach(function(layer) {
        map.addLayer(layer);
    });



    //Download Score Report
    const downloadReport = (content) => {
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


    //Uploading Shapefiles to map
    const addShapefileToMap = (featureCollection) => {
        //add the shapefile to the map and zoom to the feature collection extent
        //If you want to persist the feature collection when you reload browser you could store the collection in
        //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
        //for an example of how to work with local storage.
        let fullExtent;
        let layers = [];

        arrayUtils.forEach(featureCollection.layers, function(layer) {

            let featureLayer = new FeatureLayer(layer, {

            });
            //associate the feature with the popup on click to enable highlight and zoom to
            featureLayer.on('click', function(event) {
                map.infoWindow.setFeatures([event.graphic]);
            });

            //change default symbol if desired. Comment this out and the layer will draw with the default symbology
            changeRenderer(featureLayer);
            fullExtent = fullExtent ? fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
            layers.push(featureLayer);
        });
        map.addLayers(layers);

        map.setExtent(fullExtent.expand(1.25), true);

        dom.byId('upload-status').innerHTML = "";
    }

    const changeRenderer = (layer) => {
        //change the default symbol for the feature collection for polygons and points
        let symbol = null;
        switch (layer.geometryType) {
            case 'esriGeometryPoint':
                responsePoints.applyEdits(layer.graphics);
                break;
            case 'esriGeometryPolygon':
                responsePolys.applyEdits(layer.graphics);
                break;
            case 'esriGeometryPolyline':
                responseLines.applyEdits(layer.graphics);
                break;
            case 'esriGeometryMultipoint':
                responseMultiPoints.applyEdits(layer.graphics);
                break;
        }
        if (symbol) {
            layer.setRenderer(new SimpleRenderer(symbol));
        }
    }


    //Extract Data
    function initializeHotSpotTool(evt) {
        showToolPanel();



        //Define the default inputs for the widget
        const extractDataParams = {
            featureLayers: [responseLines, responsePolys, responsePoints, responseMultiPoints],
            inputLayers: [responseLines, responsePolys, responsePoints, responseMultiPoints],
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


        while (!hotSpots) {

        }
        //console.log(hotSpots.signInPromise.isFulfilled());
        hotSpots.signInPromise.then(function() {

            while (!hotSpots.portalUser) {

            }

            //console.log(hotSpots.portalUser);
            currentUser = hotSpots.portalUser.username;
            //console.log(currentUser);
            initEditTool(evt);
            generateFeatureCollection("fake_file");
        }, function() {
            console.log("cancelled");
            initEditTool(evt);
        }, function() {
            console.log("fulfilled");
        }, function() {
            console.log("rejected");
        }, function() {
            console.log("resolved");
        }, function() {
            console.log("resolved");
        }, function() {
            console.log("resolved");
        }, function() {
            console.log("resolved");
        });
    }


    const showToolPanel = () => {
        // expand the right panel to display the content
        const cp = registry.byId("extractDiv");
        domStyle.set(cp.domNode, { width: "20%" });
        registry.byId("rightContainer").resize();


    }

    // Use a LayerList widget to toggle a layer's visibility on or off
    const layerListToggle = new LayerList({
        map: map,
        showLegend: true,
        showSubLayers: false,
        showOpacitySlider: true,
        layers: [
            //Add layers below to be added to the toggle widget
            { layer: publicHealthLayer, visible: true },
            { layer: stormwaterLayer, visible: true },
            { layer: urbanHeatLayer, visible: true },
            { layer: economicHDILayer, visible: true },
            { layer: criticalConnections, visible: true },
            { layer: highInjuryNetworkLayer, visible: true },
            { layer: schoolBufferLayer, visible: true },
            { layer: downtownDashBuffer, visible: true },
            { layer: dashCommunityBuffer, visible: true },
            { layer: rStationConnectivity, visible: true },
            { layer: transDemand, visible: true },
            { layer: transitEN, visible: true },
            { layer: bicycleN, visible: true },
            { layer: neighborhoodN, visible: true },
            { layer: pedestrianED, visible: true },
            { layer: greenN, visible: true },
            { layer: highInjuryNetworkBuffer, visible: true },
            { layer: transitPrio, visible: true },
        ],

    }, "layerListDom");


    layerListToggle.startup();

    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array)
        }
    }

    function updateScores() {
        const waitFor = (ms) => new Promise(r => setTimeout(r, ms))

        updateScoresButton.addEventListener("click", () => {
            projectLayers.forEach(layer => { //Iterate through every project layer

                const start = async() => {
                    await asyncForEach(layer.graphics, async(project) => {
                        await waitFor(1000)
                        generateScore({ graphic: project })
                    })

                }
                start()

            })

        });
    }



    updateScores();


    //Removes all features when delete graphics button is clicked
    function deleteGraphics() {
        deleteGraphicsButton.addEventListener("click", () => {
            projectLayers.forEach(layer => { //Iterate through every project layer
                layer.applyEdits(null, null, layer.graphics) //Delete all the graphics in that layer
            })
        });

        //build query filter
        const query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.outSpatialReference = { "wkid": 27700 };
        query.where = "1 = 1";
        // Query for the features with the given object ID
        pointsOfInterestD.queryFeatures(query, function(featureSet) {
            const graphics = featureSet.features;
            pointsOfInterestD.applyEdits(null, null, graphics, function(deletes) {
                    console.debug(deletes.length)
                },
                function errCallback(err) {
                    alert(err);
                })
        });
    }

    function initEditTool(results) {
        let canEdit = true;
        document.getElementById("weightChange").style.display = "block";
 

        const layers = array.map(results.layers, function(result) {
            return result.layer;
        });
        //display read-only info window when user clicks on feature
        const query = new Query();
        array.forEach(layers, function(layer) {
            layer.on("click", function(evt) {
                if (map.infoWindow.isShowing) {
                    map.infoWindow.hide();
                }

                var layerInfos = [{
                    'featureLayer': layer,
                    'isEditable': canEdit,
                    'showDeleteButton': canEdit,
                    'showAttachments': false,
                }]
                var attInspector = new AttributeInspector({
                    layerInfos: layerInfos
                }, domConstruct.create("div"));
                query.objectIds = [evt.graphic.attributes.OBJECTID];
                layer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(features) {
                    map.infoWindow.setTitle("");
                    map.infoWindow.setContent(attInspector.domNode);
                    map.infoWindow.resize(350, 400);
                    map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
                });
                attInspector.on("delete", function(result) {
                    result.feature.getLayer().applyEdits(null, null, [result.feature]);
                    map.infoWindow.hide();
                });
                attInspector.on("attribute-change", function(result) {
                    result.feature.attributes[result.fieldName] = result.fieldValue; // result will contains  a feature layer to access its attributes
                    result.feature.getLayer().applyEdits(null, [result.feature], null);
                });

                console.log(evt);
                generateScore(evt);
            });
        });
        const templatePicker = new TemplatePicker({
            featureLayers: layers,
            rows: 'auto',
            columns: 'auto',
            grouping: true
        }, "templatePickerDiv");
        templatePicker.startup();
        const drawToolbar = new Draw(map);
        let selectedTemplate;
        templatePicker.on("selection-change", function() {
            selectedTemplate = templatePicker.getSelected();
            if (selectedTemplate) {
                switch (selectedTemplate.featureLayer.geometryType) {
                    case "esriGeometryPoint":
                        drawToolbar.activate(Draw.POINT);
                        break;
                    case "esriGeometryPolyline":
                        selectedTemplate.template.drawingTool === 'esriFeatureEditToolFreehand' ? drawToolbar.activate(Draw.FREEHAND_POLYLINE) : drawToolbar.activate(Draw.POLYLINE);
                        break;
                    case "esriGeometryPolygon":
                        selectedTemplate.template.drawingTool === 'esriFeatureEditToolFreehand' ? drawToolbar.activate(Draw.FREEHAND_POLYGON) : drawToolbar.activate(Draw.POLYGON);
                        break;
                    case "esriGeometryMultipoint":
                        selectedTemplate.template.drawingTool === 'esriFeatureEditToolFreehand' ? drawToolbar.activate(Draw.MULTI_POINT) : drawToolbar.activate(Draw.MULTI_POINT);
                        break;
                }
            }
        });



        drawToolbar.on("draw-complete", function(result) {
            //display the editable info window for newly created features
            if (map.infoWindow.isShowing) {
                map.infoWindow.hide();
            }


            drawToolbar.deactivate();

            const fieldAttributes = layerFieldToAttributes(selectedTemplate.featureLayer.fields);
            const newAttributes = lang.mixin(fieldAttributes, selectedTemplate.template.prototype.attributes);
            const newGraphic = new Graphic(result.geometry, null, newAttributes);
            evt = { graphic: newGraphic };
            generateScore(evt);



            const layerInfos = [{
                'featureLayer': selectedTemplate.featureLayer,
                'isEditable': true
            }];
            const attInspector = new AttributeInspector({
                layerInfos: layerInfos
            }, domConstruct.create("div"));
            selectedTemplate.featureLayer.applyEdits([newGraphic], null, null, function() {
                const screenPoint = map.toScreen(getInfoWindowPositionPoint(newGraphic));
                map.infoWindow.setTitle("");
                map.infoWindow.setContent(attInspector.domNode);
                map.infoWindow.resize(325, 600);
                map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                templatePicker.clearSelection();


            });
            attInspector.on("attribute-change", function(result) {
                result.feature.attributes[result.fieldName] = result.fieldValue; // result will contains  a feature layer to access its attributes
                result.feature.getLayer().applyEdits(null, [result.feature], null);
            });
            attInspector.on("delete", function(result) {
                result.feature.getLayer().applyEdits(null, null, [result.feature]);
                map.infoWindow.hide();
            });
        });
    }

    function getInfoWindowPositionPoint(feature) {
        let point;
        switch (feature.getLayer().geometryType) {
            case "esriGeometryPoint":
                point = feature.geometry;
                break;
            case "esriGeometryPolyline":
                const pathLength = feature.geometry.paths[0].length;
                point = feature.geometry.getPoint(0, Math.ceil(pathLength / 2));
                break;
            case "esriGeometryPolygon":
                point = feature.geometry.getExtent().getCenter();
                break;
            case "esriGeometryMultipoint":
                point = feature.geometry.getExtent().getCenter();
                break;

        }
        return point;
    }



    function layerFieldToAttributes(fields) {
        let attributes = {};
        array.forEach(fields.Object, function(field) {
            attributes[field.name] = null;
        });
        return attributes;

    }

    function generateScore(evt) {
        report = "";
        score_features += evt.graphic.attributes.ID_Number + ", ";




        const query = new Query();
        query.geometry = evt.graphic.geometry;

        const projectLocation = query.geometry;
        const layersAfterQuery = {
            //Add layers to be queried for intersecting / overlapping features
            //Must be added by the "Name" field of the required feature layer
            "California_HDI_Public_Health_Need_Indicator": [],
            "Stormwater_Management_Features_Feasibility": [],
            "Urban_Heat_Island": [],
            "California_HDI_Economic_Need_Indicator": [],
            "High Injury Network": [],
            "Schools - Half-Mile Buffer": [],
            "2 High Injury Network Half Mile Buffer": [],
            "Critical_Connections": [],
            "Percentage of Trips Under Three Miles": [],
            "Bicycle Network": [],
            "Transit Enhanced Network (TEN)": [],
            "Neighborhood Network (NEN)": [],
            "Pedestrian Enhanced Districts (PEDs)": [],
            "Green Network": [],
            "Transit Priority Area (TPA)": [],
            "1d Downtown DASH Bus Stop Areas (Quarter-Mile Buffer)": [],
            "DASH Community Bus Stop Areas (Quarter-Mile Buffer)": [],


        };

        //Initialize arrays to store the overlapping / intersecting features of the all featurelayers and the user drawn project
        let publicHDI = [];
        let stormwater = [];
        let urbanHeat = [];
        let economicHDI = [];
        let highInjuryNetwork = [];
        let schoolBuffer = [];
        let highInjuryBuffer = [];
        let criticalConnect = [];
        let threeMileTrips = [];
        let bicycleNetwork = [];
        let transitNetwork = [];
        let neighborhoodNetwork = [];
        let pedestrianNetwork = [];
        let greenNetwork = [];
        let transitPrioArea = [];
        let downtownDash = [];
        let communityDash = [];

        //Search for features in these layers
        publicHealthLayer.queryFeatures(query, selectInBuffer);
        stormwaterLayer.queryFeatures(query, selectInBuffer);
        urbanHeatLayer.queryFeatures(query, selectInBuffer);
        economicHDILayer.queryFeatures(query, selectInBuffer);
        highInjuryNetworkLayer.queryFeatures(query, selectInBuffer);
        schoolBufferLayer.queryFeatures(query, selectInBuffer);
        highInjuryNetworkBuffer.queryFeatures(query, selectInBuffer);
        criticalConnections.queryFeatures(query, selectInBuffer);
        threeMileTripLayer.queryFeatures(query, selectInBuffer);
        bicycleN.queryFeatures(query, selectInBuffer);
        transitEN.queryFeatures(query, selectInBuffer);
        neighborhoodN.queryFeatures(query, selectInBuffer);
        pedestrianED.queryFeatures(query, selectInBuffer);
        greenN.queryFeatures(query, selectInBuffer);
        transitPrio.queryFeatures(query, selectInBuffer);
        downtownDashBuffer.queryFeatures(query, selectInBuffer);
        dashCommunityBuffer.queryFeatures(query, selectInBuffer);




        setTimeout(function() {
            //Set up query features
            let publicHDI = layersAfterQuery["California_HDI_Public_Health_Need_Indicator"];
            let stormwater = layersAfterQuery["Stormwater_Management_Features_Feasibility"];
            let urbanHeat = layersAfterQuery["Urban_Heat_Island"];
            let economicHDI = layersAfterQuery["California_HDI_Economic_Need_Indicator"];
            let highInjuryNetwork = layersAfterQuery["High Injury Network"];
            let schoolBuffer = layersAfterQuery["Schools - Half-Mile Buffer"];
            let highInjuryBuffer = layersAfterQuery["2 High Injury Network Half Mile Buffer"];
            let criticalConnect = layersAfterQuery["Critical_Connections"];
            let threeMileTrips = layersAfterQuery["Percentage of Trips Under Three Miles"];
            let bicycleNetwork = layersAfterQuery["Bicycle Network"];
            let transitNetwork = layersAfterQuery["Transit Enhanced Network (TEN)"];
            let neighborhoodNetwork = layersAfterQuery["Neighborhood Network (NEN)"];
            let pedestrianNetwork = layersAfterQuery["Pedestrian Enhanced Districts (PEDs)"];
            let greenNetwork = layersAfterQuery["Green Network"];
            let transitPrioArea = layersAfterQuery["Transit Priority Area (TPA)"];
            let downtownDash = layersAfterQuery["1d Downtown DASH Bus Stop Areas (Quarter-Mile Buffer)"];
            let communityDash = layersAfterQuery["DASH Community Bus Stop Areas (Quarter-Mile Buffer)"];



            totalScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork, threeMileTrips, transitPrioArea, downtownDash, communityDash, schoolBuffer, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI, economicHDI, criticalConnect, stormwater, urbanHeat);

        }, 2000);



        function selectInBuffer(response) {
            let feature;
            const features = response.features;
            const inBuffer = [];
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

                            const intersectPolygon = geometryEngine.intersect(feature.geometry, projectLocation);
                            const area = geometryEngine.geodesicArea(intersectPolygon, 'square-meters');
                            const area_score = { "area": area, "score": feature.attributes.Health_Sco }
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





        //Start of Mobility Plan Alignment (Section 1) Scoring
        //1a
        function modeScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork) {
            score_content.innerHTML = " ";
            let score = 0;

            if (evt.graphic.attributes.Modal_Prio == 'Pedestrian') { //Pedestrian Scoring
                if (bicycleNetwork.length > 0) {
                    bicycleNetwork.forEach(function(feature) {
                        if (feature.attributes.BICYCLE_N == 1) score = 0.5
                    });
                }
                if (transitNetwork.length > 0) score += 0.5
                if (neighborhoodNetwork.length > 0) score += 0.5
                if (pedestrianNetwork.length > 0) score += 1

            } else if (evt.graphic.attributes.Modal_Prio == 'Bicyclist') { //Bicyclist Scoring
                if (bicycleNetwork.length > 0) score += 1
                if (neighborhoodNetwork.length > 0) score += 0.5
                if (greenNetwork.length > 0) score += 1

            } else if (evt.graphic.attributes.Modal_Prio == 'Transit') { //Transit Scoring
                if (transitNetwork.length > 0) score += 1

            }

            score_content.innerHTML += "MP Network Concept Score = " + score + "<br>"
            report += "1a. Mobility Plan Network Concept Score = " + score + "\n";
            evt.graphic.attributes.MP_Network_Concept_Score = score;

            return score;
        }

        //1c
        function latentActiveTransportationScore(threeMileTrips) {
            let score = 0;
            if (threeMileTrips.length > 0) {
                score_features += threeMileTrips[0].attributes.PCT_3MI + ", ";
                if (threeMileTrips[0].attributes.PCT_3MI >= .5 && threeMileTrips[0].attributes.PCT_3MI <= .704) score = 5;
                else if (threeMileTrips[0].attributes.PCT_3MI >= .35 && threeMileTrips[0].attributes.PCT_3MI < .5) score = 2.5;
            } else {
                score_features += "0, ";
            }
            score_content.innerHTML += "Active Transportation Score = " + score + "<br>"
            report += "1c. Active Transportation Demand Score = " + score + "\n";
            evt.graphic.attributes.Active_Transportation_Score = score;

            return score;
        }

        //1d
        function connectivityScore(transitPrioArea, downtownDash, communityDash) {
            let score = 0;
            if (transitPrioArea.length > 0) { //First check Transit Priority layer
                transitPrioArea.forEach(function(feature) {
                    if (score < 5) {
                        if (feature.attributes.NEW_TYPE == "ROW BRT" || feature.attributes.NEW_TYPE == "Intersection") score = 2.5;
                        if (feature.attributes.NEW_TYPE == "Heavy Rail" || feature.attributes.NEW_TYPE == "Light Rail" || feature.attributes.NEW_TYPE == "Rail Station") score = 5;
                    }
                });
            }
            if (score == 2.5) {
                score_features += "intersection, ";
            } else if (score == 5) {
                score_features += "rail, ";
            } else {
                score_features += "no connection, ";
            }

            if (score == 0) {
                if (downtownDash.length > 0 || communityDash.length > 0) score = 2.5;
            }

            if (downtownDash.length > 0) {
                score_features += "yes, ";
            } else {
                score_features += "no, ";
            }

            if (communityDash.length > 0) {
                score_features += "yes, ";
            } else {
                score_features += "no, ";
            }

            score_content.innerHTML += "Connectivity Score = " + score + "<br>"
            report += "1d. First/Last Mile Connectivity Score = " + score + "\n";
            evt.graphic.attributes.Connectivity_Score = score;

            return score;
        }

        //Section 1 Total Score
        function mobilityPlanAlignmentScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork, threeMileTrips, transitPrioArea, downtownDash, communityDash) {
            const total = modeScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork) + latentActiveTransportationScore(threeMileTrips) + connectivityScore(transitPrioArea, downtownDash, communityDash);
            const score = total / 3;
            score_content.innerHTML += "<b>Category 1 Score = " + score.toFixed(2) + "</b><br>";
            report += "Category 1 Score = " + score.toFixed(2) + "\n";
            return score;
        }
        //End of Section 1 Scoring

        //Start of Safe & Healthy (Section 2) Scoring

        //Proximity to Schools and Safe Routes to School Program Target Areas
        function schoolLayerScores(schoolBuffer) {
            let schoolBufferScore = 0; //Half Mile Score
            let schoolSafeScore = 0; //Top 50 SRS Score

            if (schoolBuffer.length > 0) {
                schoolBufferScore = 5;
                score_features += "yes, ";
                schoolBuffer.forEach(feature => {
                    if (feature.attributes.F50_Safe == 'Yes') { //Check if Top 50 Schools with needed safety interventions
                        schoolSafeScore = 5;
                    }


                })

            } else {
                score_features += "no, ";
            }

            if (schoolSafeScore == 5) {
                score_features += "yes, ";
            } else {
                score_features += "no, ";
            }
            score_content.innerHTML += "Half Mile School Score = " + schoolBufferScore + "<br>Safe Routes Score = " + schoolSafeScore + "<br>"
            report += "Half Mile School Score = " + schoolBufferScore + "\nSafe Routes School Score = " + schoolSafeScore + "\n";
            evt.graphic.attributes.Half_Mile_School_Score = schoolBufferScore;
            evt.graphic.attributes.Safe_Routes_School_Score = schoolSafeScore;

            return schoolBufferScore + schoolSafeScore;

        }

        //Vision Zero High Injury Network
        function highInjuryNetworkScore(highInjuryNetwork, highInjuryBuffer) {
            let score = 0;
            if (highInjuryNetwork.length > 0) {
                score = 5; //Give score of 5 if it is on street
                score_features += "yes, yes, ";
            } else if (highInjuryBuffer.length > 0) { //Give score of 2.5 if it is within a half mile buffer zone of the street
                score = 2.5;
                score_features += "no, yes, ";
            } else {
                score_features += "no, no, ";
            }

            score_content.innerHTML += "High Injury Network Score = " + score + "<br>";
            report += "High Injury Network Score = " + score + "\n";
            evt.graphic.attributes.High_Injury_Network_Score = score;

            return score;
        }

        //Public Health Improvement Need Score
        function publicHDIScore(publicHDI) {

            let score = 0;
            if ((publicHDI.length > 0) && (projectLocation.type == "polygon")) {

                // score_features += publicHDI[0].attributes.Health_Sco  + ", ";
                var totalArea = 0;
                for (var i = 0; i < publicHDI.length; i++) {
                    totalArea += publicHDI[i].area;
                }
                for (var i = 0; i < publicHDI.length; i++) {
                    score += (publicHDI[i].area / totalArea) * publicHDI[i].score;
                }
            } else {
                if (publicHDI.length > 0) {
                    score_features += publicHDI[0].attributes.Health_Sco + ", ";
                    score = publicHDI[0].attributes.Health_Sco;
                    if (score == 5) score = 5
                    else if (score == 4) score = 2.5;
                    else if (score == 3) score = 1.25;
                }
            }
            score_content.innerHTML += "Public HDI Score = " + score.toFixed(2) + "<br>";
            report += "Public HDI Score = " + score.toFixed(2) + "\n";
            evt.graphic.attributes.Public_HDI_Score = score.toFixed(2);

            return score;
        }

        //Section 2 Total Score
        function safeAndHealthyScore(schoolBuffer, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI) {
            //score_content.innerHTML = " ";
            const total = schoolLayerScores(schoolBuffer) + highInjuryNetworkScore(highInjuryNetwork, highInjuryNetworkBuffer) + publicHDIScore(publicHDI);
            const score = total / 4;
            score_content.innerHTML += "<b>Category 2 Score = " + score.toFixed(2) + "</b><br>";
            report += "Category 2 Score = " + score + "\n";
            return score;
        }
        //End of Section 2 Scoring

        //Start of Equitable and Inclusive (Section 3) Scoring

        //Economic Need Indicator
        function economicHDIScore(economicHDI) {
            let score = 0;
            if (economicHDI.length > 0) {
                score = economicHDI[0].attributes.econ_dis_1;
                score_features += economicHDI[0].attributes.econ_dis_1 + ", ";
                if (score == 5) score = 5;
                else if (score == 4) score = 2.5;
                else if (score == 3) score = 1.25;
            } else {
                score_features += "0, ";
            }
            score_content.innerHTML += "<b>Economic HDI Score = " + score + "</b><br>";
            report += "Economic HDI Score = " + score + "\n";
            evt.graphic.attributes.Economic_HDI_Score = score;

            return score;
        }
        //End of Section 3 Scoring

        //Start of Accessible and Affordable (Section 4) Scoring

        //Critical Conenction Indicator
        function criticalConnetionScore(criticalConnect) {
            let score = 0;
            if (criticalConnect.length > 0) {
                score_features += criticalConnect[0].attributes.Ct_Need + ", ";
                if (criticalConnect[0].attributes.Ct_Need == "Highly Critical") score = 5;
                else score = 2.5;
            } else {
                score_features += "Not Critical, ";
            }

            score_content.innerHTML += "<b>Critical Connection Score = " + score + "</b><br>";
            report += "Critical Connection Score = " + score + "\n";
            evt.graphic.attributes.Critical_Connection_Score = score;

            return score;
        }
        //End of Section 4 Scoring

        //Start of Sustainable and Resilient (Section 5) Scoring

        //Stormwater Management Features Feasibility
        function stormwaterScore(stormwater) {
            let score = 0;
            if (stormwater.length > 0) {
                stormwater.forEach(function(feature) {
                    if (score < 5) {
                        if (score == 0 && feature.attributes.sw_label == "Medium") score = 1.25
                        if (feature.attributes.sw_label == "High") score = 2.5;
                        if (feature.attributes.sw_label == "Very High") score = 5;
                    }
                });

                if (score == 1.25) {
                    score_features += "Medium, ";
                } else if (score == 2.5) {
                    score_features += "High, ";
                } else if (score == 5) {
                    score_features += "Very High, ";
                } else {
                    score_features += "Low, ";
                }
            }
            score_content.innerHTML += "Storm Water Score = " + score + "<br>";
            report += "Storm Water Score = " + score + "\n";
            evt.graphic.attributes.Stormwater_Score = score;

            return score;
        }

        //Urban Heat Island Effect Mitigation Need
        function urbanHeatScore(urbanHeat) {
            let score = 0;
            if (urbanHeat.length > 0) {
                urbanHeat.forEach(function(feature) {
                    if (score < 5) {
                        if (score == 0 && feature.attributes.heatisland == "Low") score = 1.25;
                        if (feature.attributes.heatisland == "Medium High") score = 2.5;
                        if (feature.attributes.heatisland == "High") score = 5;
                    }
                });
            }

            if (score == 1.25) {
                score_features += "Low\n";
            } else if (score == 2.5) {
                score_features += "Medium High\n";
            } else if (score == 5) {
                score_features += "High\n";
            } else {
                score_features += "null\n";
            }
            score_content.innerHTML += "Urban Heat Score = " + score + "<br>";
            report += "Urban Heat Score = " + score + "\n";
            evt.graphic.attributes.Urban_Heat_Score = score;

            return score;
        }

        //Section 5 Total Score
        function sustainableAndResilientScore(stormwater, urbanHeat) {
            const total = stormwaterScore(stormwater) + urbanHeatScore(urbanHeat);
            const score = total / 2;
            score_content.innerHTML += "<b>Category 5 Score = " + score + "</b><br>";
            report += "Category 5 Score = " + score + "\n";
            return score;
        }

        //Overall Score
        function totalScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork, threeMileTrips, transitPrioArea, downtownDash, communityDash, schoolBuffer, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI, economicHDI, criticalConnect, stormwater, urbanHeat) {
            score_content.innerHTML = " ";

            const section1TotalScore = mobilityPlanAlignmentScore(bicycleNetwork, transitNetwork, neighborhoodNetwork, pedestrianNetwork, greenNetwork, threeMileTrips, transitPrioArea, downtownDash, communityDash);
            const section1WeightedScore = (section1TotalScore / 2) * section1WeightValue;

            const section2TotalScore = safeAndHealthyScore(schoolBuffer, highInjuryNetwork, highInjuryNetworkBuffer, publicHDI);
            const section2WeightedScore = section2TotalScore * section2WeightValue;

            const section3TotalScore = economicHDIScore(economicHDI);
            const section3WeightedScore = section3TotalScore * section3WeightValue;

            const section4TotalScore = criticalConnetionScore(criticalConnect);
            const section4WeightedScore = section4TotalScore * section4WeightValue;

            const section5TotalScore = sustainableAndResilientScore(stormwater, urbanHeat);
            const section5WeightedScore = section5TotalScore * section5WeightValue;

            const total = (section1TotalScore + section2TotalScore + section3TotalScore + section4TotalScore + section5TotalScore).toFixed(2);
            const weighted = (section1WeightedScore + section2WeightedScore + section3WeightedScore + section4WeightedScore + section5WeightedScore).toFixed(2);
            score_content.innerHTML = "<br><b>Total Score = " + total + "</b><br><b>Weighted Score = " + weighted + "</b><br><br>" + score_content.innerHTML;
            //score_content.innerHTML += "<b>Weighted Score = " + weighted + "</b><br>";
            report += "\nTotal Score = " + total + "\n";
            report += "Weighted Score = " + weighted + "\n";

            //Assign score to seleceted graphic
            evt.graphic.attributes.Tot_Score = total;
            evt.graphic.attributes.Weight_Score = weighted;

            //Update layer of respective graphic after assigning score as attribute
            switch (evt.graphic.geometry.type) {
                case 'point':
                    responsePoints.applyEdits(null, [evt.graphic], null);
                    break;
                case 'polyline':
                    responseLines.applyEdits(null, [evt.graphic], null);
                    break;
                case 'polygon':
                    responsePolys.applyEdits(null, [evt.graphic], null);
                    break;
                default:
                    responseMultiPoints.applyEdits(null, [evt.graphic], null);
                    break;
            }


            console.log(score_features);
            score_features = "";
            const reportArray = [];
            reportArray.push(("FID: " + evt.graphic.attributes.FID + "\n\n"));
            reportArray.push(("ID_Number: " + evt.graphic.attributes.ID_Number + "\n\n"));
            reportArray.push(("Id: " + evt.graphic.attributes.Id + "\n\n"));
            reportArray.push(("MIP_Progra: " + evt.graphic.attributes.MIP_Progra + "\n\n"));
            reportArray.push(("Modal_Prio: " + evt.graphic.attributes.Modal_Prio + "\n\n"));
            reportArray.push(("Name: " + evt.graphic.attributes.Name + "\n\n"));
            reportArray.push(("Scope: " + evt.graphic.attributes.Scope + "\n\n"));

            reportArray.push(report);



            downloadReport(reportArray);


        } // end of totaScore
    } // end of generateScore

}); //end of require
