var map = L.map('map').setView([48.137154, 11.576124], 13); // Initial coordinates

var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ext: 'png'
}).addTo(map);

var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var drawnCircles = []; // Array to store drawn circles

var drawPluginOptions = {
  position: 'topright',
  draw: {
    marker: false,
    circlemarker: false,
    polyline: false,
    polygon: false,
    rectangle: false,
    circle: {
      shapeOptions: {
        fillColor: '#3CA03C',
        color: 'red'
      },
      metric: true,
      feet: false,
      showRadius: true,
    },
  },
  edit: {
    featureGroup: editableLayers,
    remove: true
  }
};

var drawControl = new L.Control.Draw(drawPluginOptions);
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (e) {
  var layer = e.layer;
  editableLayers.addLayer(layer);
  var radius = layer.getRadius().toFixed(2);
  layer.bindTooltip('Radius: ' + radius + ' meters', { permanent: true, opacity: 0.7 }).openTooltip();
  
  // Store reference to the drawn circle
  drawnCircles.push(layer);
});

$('#clear-layers').on('click', function () {
  editableLayers.clearLayers();
  drawnCircles = []; // Clear the stored circles array
});

map.on('draw:deleted', function (e) {
  var layers = e.layers;
  layers.eachLayer(function (layer) {
    removeFromDrawnCircles(layer);
  });
});


function removeFromDrawnCircles(layerToRemove) {
  var index = drawnCircles.indexOf(layerToRemove);
  if (index !== -1) {
    drawnCircles.splice(index, 1);
  }
}


function convertDDtoDMS(decimalDegrees) {
  const degrees = Math.floor(decimalDegrees);
  const minutesFloat = (decimalDegrees - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(2);

  return `${degrees}&deg;${minutes}'${seconds}"`;
}





// GLOBAL Variables
var intersectionLayer;
var marker;
// var resultDiv = document.getElementById('resultDiv');

function calculate() {

  if (typeof intersectionLayer != 'undefined') {
    map.removeLayer(intersectionLayer);
  }

  if (typeof marker != 'undefined') {
    map.removeLayer(marker);
  }
  
  var turfPolygons = [];

  if (drawnCircles.length === 3) {
    drawnCircles.forEach(function (circle) {
      var center = [circle._latlng.lng, circle._latlng.lat];
      var radius = circle.getRadius();
      var options = { units: 'meters' }; // More steps create a smoother polygon
      var circlePolygon = turf.circle(center, radius, options);
      turfPolygons.push(circlePolygon);
    });

    // console.log(turfPolygons);



      // const allIntersections = {
      //   type: 'FeatureCollections',
      //   features: [
      //     turf.intersect(turfPolygons[0], turfPolygons[1]),
      //     turf.intersect(turfPolygons[0], turfPolygons[2]),
      //     turf.intersect(turfPolygons[1], turfPolygons[2]),
      //   ],
      // };

      const multipolygon = turf.intersect(turfPolygons[0], turfPolygons[1]);
      // Get the intersection of the created multipolygon and the third geometry (multipolygon against 3)
      const intersection = turf.intersect(multipolygon, turfPolygons[2]);



      if (intersection === null) {

        // console.log("Count of circles drawn is not 3. Current circle count: " + drawnCircles.length);
    var resultDiv = document.getElementById('resultDiv');
    resultDiv.innerHTML = 'Your three circles do not intersect in a <b>mutual</b> location. Location cannot be determined';
    resultDiv.style.backgroundColor = 'yellow';

      } else {

        intersectionLayer = L.geoJSON(intersection, {
        style: function(feature) {
          return {
            color: 'darkblue', // Set the color to dark blue
            dashArray: '5, 5', // Set a dashed pattern (5 pixels dash, 5 pixels gap)
            weight: 2, // Set the weight of the line
            opacity: 1 // Set the opacity of the line
          };
        }
      }).addTo(map);

      var centroid = turf.centroid(intersection);
      marker = L.marker([centroid.geometry.coordinates[1],centroid.geometry.coordinates[0]], {icon: L.AwesomeMarkers.icon({icon: 'user', prefix: 'fa', markerColor: 'blue'}) }).addTo(map);

      var resultDiv = document.getElementById('resultDiv');
      resultDiv.innerHTML = "You're approximately located at: <br><b>Longitude:</b> " + convertDDtoDMS(centroid.geometry.coordinates[0]) + '<br><b>Latitude: </b>' + convertDDtoDMS(centroid.geometry.coordinates[1]);
      resultDiv.style.backgroundColor = 'green';


    }
  

  } else {
    // console.log("Count of circles drawn is not 3. Current circle count: " + drawnCircles.length);
    var resultDiv = document.getElementById('resultDiv');
    resultDiv.innerHTML = 'Create <b><i>exactly</i></b> three circles';
    resultDiv.style.backgroundColor = 'red';
  }
}





// DEBUG FUNCTION
  function visualizeTurfPolygon(polygon) {
    // Create a Leaflet GeoJSON layer from the Turf.js polygon
    var geoJSONLayer = L.geoJSON(polygon).addTo(map);

    // Fit the map bounds to the GeoJSON layer's bounds for better visibility
    map.fitBounds(geoJSONLayer.getBounds());
}

function addMarkersToMap(coordinatesArray) {
  var markers = L.layerGroup();

  coordinatesArray.forEach(function(coordinate) {
    var marker = L.marker([coordinate.coordinates[1],coordinate.coordinates[0]]);
    markers.addLayer(marker);
  });

  markers.addTo(map);
}


