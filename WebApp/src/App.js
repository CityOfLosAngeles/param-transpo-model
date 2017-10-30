import React, {Component} from 'react';
import * as esriLoader from 'esri-loader';
import './App.css';

class App extends Component {
  constructor() {
    super();

    if (!esriLoader.isLoaded()) {
      esriLoader.bootstrap((err) => {
        if (err) {
          console.error(err);
        } else {
          this.createMap();
        }
      }, {
         url: 'https://js.arcgis.com/3.21/'
      });
    } else {
      this.createMap();
    }

    this.state = {
      map: null
    }
  }

  createMap = () => {
    esriLoader.dojoRequire([
      "esri/map"
    ], (Map) => {
      let map = new Map("map",{
        basemap: "streets",
        center: [-118.2, 34],
        zoom: 12,
        slider: false
      });
      window.map = map;


      this.setState({
        map
      })
    });
  };

  render() {
    return (
        <div className="App">
          <div className="App-header">
            <h1>LADOT Parameterized Model for Active Transportation</h1>
          </div>
          <div id="map" />
        </div>
    );
  }
}

export default App;
