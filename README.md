# LADOT Transportation Planning Group - Parameterized Model for Active Transportation 

## About

The project creates a needs-driven transportation capital project scoring web map to help prioritize projects to advance for funding and implementation according to their relative advancement of City policy priorities (Safety, Access, Sustainability, etc.). This map could be based on [a web-map tool](https://ladcp.maps.arcgis.com/apps/webappviewer/index.html?id=02d509dfe1ea458da1157b516249f4d9) DCP built for the [Great Streets Challenge](http://lagreatstreets.org/2016-challenge/) that helped to prioritize applications in accordance to policy priorities (MP 2035, Visions Zero, Plan for Healthy Los Angeles, etc.). LADOT is currently developing a project scoring web map that project managers will use to manually score their projects by a visual project overlay analysis. The Parameterized Model would advance the web map by automating the scoring process, based on project overlay with multiple map layers. This model could the project list developed [Active Transportation Planner](http://dsf.lacity.org/dot-active-transportation-planner) and expand to other LADOT/Public Works capital programs.

# Web Map Functionalities 

### How to add a new data layer from Geohub
In the `index.js` file, press `CTRL-F` or seach for this line 

`//Layers to display / pull data from using the featurelayer's service URL`


To add a new data layer, add the following block of code below the line above. Replace newLayerName with a new variable name and place in the new featurelayer's service URL inside of the quotation marks. The opacity of the layer can also be changed here with the values ranging from 0 to 1.0.

```
var newLayerName = new FeatureLayer("INSERT SERVICE URL HERE", {
    outFields: ['*'],
    opacity: 1,
    visible: false
});
```
Now to load that layer into the map, press `CTRL-F` or seach again for the following lines depending on the type of layer that is going to be added


>### Case 1: Layer that needs to be added to the drawing tool 

Search for `//Adds layers to the drawing tool`

Below that line will be the follwing code
`var projectLayers = [...]`

Insert the new variable name that was created into the brackets.

>### Case 2: Layer that the application only needs to pull data from for scoring


Search for `//Adds layers to be loaded into the application for scoring`

Below that line will be the follwing code
`var layers = [...]`

Insert the new variable name that was created into the layers array.
Now to query the new layer for scoring implementation, the following must be done

1. Search for or find `//Add layers to be queried for intersecting / overlapping features`
2. Insert the following line of code below with the name of the layer between in quotation marks `"INSERT NAME OF THE LAYER HERE": [],`
3. Search for or find `//Initialize arrays to store the overlapping / intersecting features`
4. Create a new array to store the queried features below with the format `var newArrayName = [];`
5. Search for or find `//Search for features in these layers`
6. Insert the following line of code below with the new layer name that was created `newLayerName.queryFeatures(query, selectInBuffer);`
7. Search for or find `//Set up query features`
8. Insert the following line of code below with the name of the featurelayer between the quotation marks `var newArrayName = layersAfterQuery["INSERT NAME OF LAYER HERE"];`

### How to update an existing data layer

Find or search the data layer that needs to be updated by variable name or service URL. The data layer should be in the following format
```
var layerName = new FeatureLayer("SERVICE URL", {
    outFields: ['*'],
    opacity: 1,
    visible: false
});
```
To update the layer, replace the service URL between the quotation marks with the new data layer's service URL.

### How to change the weight and total score with a new layer

Only those with administrator accounts will be allowed to change the weights for the scoring of the projects.

1. Log in with an administrator account 
2. Click the button labelled **Weights** on the right sidebar
3. Change the values of the weights for the desired categories in the new window that will pop up
4. Once all changes have been made, click the **Submit** button to apply the changes
5. Click the button labelled **Updated Scores** on the right sidebar to rescore the projects with the new weights

### How weighting by shape works

>##### Points
The scoring for point projects are based on whether the project intersects or overlaps the data layers. If the project does intersect or overlap the data layers then it is given a score based on the scoring guidelines.
>##### Lines & Polygons
Since lines and polygons can overlap with multiple areas, the scoring is based on the area of overlapping sections of the project. Otherwise it is the same as how point projects are scored.
>Example: A line or polygon project has an overlap in the Public Health Improvement Need Score section. 70% of the project is located in area with a `High` need and the other 30% located in a `Medium` area. The end result for the Public HDI Score would be **(0.7 * High value) + (0.3 * Medium value)**.


## Sponsors

Los Angeles Department of Transportation 

## Partners

Cal State University, Los Angeles

## City Team

David Somers, Transportation Planning and Policy Division 

Los Angeles Department of Transportation

Karina Macias, Transportation Planning and Policy Division 

Los Angeles Department of Transportation

## Goals

{{ Analytics we want to surface, questions to answer }} 

## Deliverables

An automated mapping tool to gather transportation capital project data and score projects based on LADOT priorities and City mobility goals 

## Data Sources

Mobility Plan 2035

The Plan for Healthy Los Angeles

City of Los Angeles Travel Demand Forecasting Model

U.C. Census, American Communities Survey

California Health Disadvantage Index (HDI)

LADOT Safe Routes to School

LADOT Vision Zero

Council for Watershed Health

Los Angeles County GIS Portal

USGS Land Processes Distributed Active Archive Center

## Timeline/Sprints

