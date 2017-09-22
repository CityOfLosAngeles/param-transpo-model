
  require([
    "esri/map",
    "esri/tasks/GeometryService",
    "esri/tasks/query",

    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/FeatureLayer",

    "esri/Color",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",

    "esri/dijit/editing/Editor",
    "esri/dijit/editing/TemplatePicker",

    "esri/geometry/geometryEngine",

    "esri/config",
    "dojo/i18n!esri/nls/jsapi",

    "dojo/_base/array", "dojo/parser", "dojo/keys",

    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"
  ], function(
    Map, GeometryService, Query,
    ArcGISTiledMapServiceLayer, FeatureLayer,
    Color, SimpleMarkerSymbol, SimpleLineSymbol,
    Editor, TemplatePicker,
    geometryEngine,
    esriConfig, jsapiBundle,
    arrayUtils, parser, keys
  ) {
    parser.parse();

    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start = jsapiBundle.toolbars.draw.start +  "<br>Press <b>ALT</b> to enable snapping";

    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "/proxy/";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    var map = new Map("map", {
      basemap: "satellite",
      center: [-118, 34],
      zoom: 14,
      slider: false
    });

    map.on("layers-add-result", initEditor);

    //add boundaries and place names
    var labels = new ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer");
    map.addLayer(labels);

    //layers

    var schoolBufferLayer = new FeatureLayer("http://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/Half%20Mile%20Buffer%20Top%2050/FeatureServer/0", {
        outFields: ['*']
    });

    var publicHealthLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Public_Health_Need_Indicator/FeatureServer/0", {
        outFields: ['*']
    });

    var stormwaterLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Stormwater_Management_Features_Feasibility/FeatureServer/0", {
        outFields: ['*']
    });

    var urbanHeatLayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Urban_Heat_Island/FeatureServer/0", {
        outFields: ['*']
    });

    var economicHDILayer = new FeatureLayer("https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/California_HDI_Economic_Need_Indicator/FeatureServer/0", {
        outFields: ['*']
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
    map.addLayers([ responseLines, responsePolys, responsePoints]);
    var layers = [schoolBufferLayer, publicHealthLayer, stormwaterLayer, urbanHeatLayer, economicHDILayer];

    layers.forEach(function(layer){
      map.addLayer(layer);
    });


    function initEditor(evt) {
      var templateLayers = arrayUtils.map(evt.layers, function(result){
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
          polylineDrawTools:[ Editor.CREATE_TOOL_FREEHAND_POLYLINE ],
          polygonDrawTools: [ Editor.CREATE_TOOL_FREEHAND_POLYGON,
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



          //search for features in these layers.

         schoolBufferLayer.queryFeatures(query, selectInBuffer);
         publicHealthLayer.queryFeatures(query, selectInBuffer);
         stormwaterLayer.queryFeatures(query, selectInBuffer);
         urbanHeatLayer.queryFeatures(query, selectInBuffer);
         economicHDILayer.queryFeatures(query, selectInBuffer);



          function selectInBuffer(response){
              var feature;
              var features = response.features;
              var inBuffer = [];
              // Check for intersection and containment of each feature in the the layer.
              for (var i = 0; i < features.length; i++) {
                feature = features[i];

                //If the projectLocation is  a point, check to see if it is inside the buffer zone of each feature for this layer.
                if(projectLocation.type == "point") {
                  if(geometryEngine.contains(feature.geometry, projectLocation)){
                    //add to the array
                    inBuffer.push(feature);
                  }

                //If it is not a point, then it must be a line or polygon.  Check to see if it intersects with the buffer zone of each feature for this layer.

                }else {
                  if(geometryEngine.intersects(feature.geometry, projectLocation)){
                    //add to the array
                  inBuffer.push(feature);
                  }
                }

              }

              //print out array of features.
              console.log(inBuffer);
          }
      });
  };
});
