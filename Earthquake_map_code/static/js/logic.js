// Helper function to calculate marker size based on magnitude
function markerSize(mag) {
  let radius = 1;


  if (mag > 0) {
    radius = mag ** 7;
  }

  return radius
}

// Helper function to choose color based on depth level
function chooseColor(depth) {
  let color = "black";

  if (depth <= 10) return "#98EE00";
  if (depth <= 30) return "#D4EE00";
  if (depth <= 50) return "#EECC00";
  if (depth <= 70) return "#EE9C00";
  if (depth <= 90) return "#EA822C";
  return "#EA2C2C";

  // return color
  return (color);
}

// Function to create the map and add layers
function createMap(data, geo_data) {
  // Initialize base layers
  
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Initialize overlay layers
  let markers = L.markerClusterGroup();
  let heatArray = [];
  let circleArray = [];

  for (let i = 0; i < data.length; i++){
    let row = data[i];
    let location = row.geometry;

    // Create the marker
    if (location) {
      // Extract coordinates
      let point = [location.coordinates[1], location.coordinates[0]];

      // Make the marker
      let marker = L.marker(point);
      let popup = `<h1>${row.properties.title}</h1>`;
      marker.bindPopup(popup);
      markers.addLayer(marker);

      // Add to heatmap
      heatArray.push(point);

      // Create and add circle marker
      let circleMarker = L.circle(point, {
        fillOpacity: 0.8,
        color: chooseColor(location.coordinates[2]),
        fillColor: chooseColor(location.coordinates[2]),
        radius: markerSize(row.properties.mag)
      }).bindPopup(popup);

      circleArray.push(circleMarker);
    }
  }

  // Create the heat layer
  let heatLayer = L.heatLayer(heatArray, {
    radius: 25,
    blur: 20
  });

  let circleLayer = L.layerGroup(circleArray);

  // Create the Tectonic plate layer
  let geo_layer = L.geoJSON(geo_data, {
    style: {
      "color": "orange",
      "weight": 3
    }
  });

  // Only one base layer can be shown at a time.
  let baseLayers = {
    Street: street,
    Topography: topo
  };

  let overlayLayers = {
    Markers: markers,
    Heatmap: heatLayer,
    Circles: circleLayer,
    "Tectonic Plates": geo_layer
  }

  // Initialize map
  let myMap = L.map("map", {
    center: [40.7, -94.5],
    zoom: 3,
    layers: [street, markers, geo_layer]
  });

  // Add layer controls
  L.control.layers(baseLayers, overlayLayers).addTo(myMap);

  // Add legend to the map
  let legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");

    let legendInfo = "<h4>Legend</h4>"
    legendInfo += "<i style='background: #98EE00'></i>-10-10<br/>";
    legendInfo += "<i style='background: #D4EE00'></i>10-30<br/>";
    legendInfo += "<i style='background: #EECC00'></i>30-50<br/>";
    legendInfo += "<i style='background: #EE9C00'></i>50-70<br/>";
    legendInfo += "<i style='background: #EA822C'></i>70-90<br/>";
    legendInfo += "<i style='background: #EA2C2C'></i>90+";

    div.innerHTML = legendInfo;
    return div;
  };

  legend.addTo(myMap);
}

// Function to fetch data and initialize the map
function doWork() {
  // Store the API query URLs

  let baseURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
  let baseURL2 = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

  // Fetch data from the API and create features
  d3.json(baseURL).then(function (data) {
    d3.json(baseURL2).then(function (geo_data) {
      let data_rows = data.features;

      // Make map with both datasets (URL/URL2)
      createMap(data_rows, geo_data);
    });
  });
}

doWork();