var map;
var lastMouseEvent;

var ENDPOINT = "/lohsreunionlocations";

function closeInfoPane() {
   document.getElementById('black_overlay').style.display = 'none';
   document.getElementById('info_pane').style.display = 'none';
   clearInfoPane();
};

function clearInfoPane() {
   document.getElementById('info_first_name').value = "";
   document.getElementById('info_last_name').value = "";
};

function openInfoPane(mouseEvent) {
   lastMouseEvent = mouseEvent;
   document.getElementById('black_overlay').style.display = 'block';
   document.getElementById('info_pane').style.display = 'block';
};

function submitInfo() {
   var latlng = lastMouseEvent.latLng;
   var firstname = document.getElementById('info_first_name').value;
   var lastname = document.getElementById('info_last_name').value;
   
   var data = '{"firstname":"'+firstname+'", "lastname":"'+lastname+'",';
   data += '"lat":'+latlng.lat()+', "lon":'+latlng.lng();
   data += '}';
   
   var postRequest = new XMLHttpRequest();
   postRequest.onreadystatechange = function() {
      if (postRequest.readyState == 4 && postRequest.status == 200) {
         console.log("Post success: " + postRequest.responseText);
         closeInfoPane();
         addPin(firstname, lastname, latlng.lat(), latlng.lng(), postRequest.responseText);
      }
   };
   postRequest.open("POST", ENDPOINT, true);
   postRequest.send(data);
};

function addPin(firstname, lastname, lat, lon, id) {
   var infoWindowContent = firstname + " " + lastname;
   //infoWindowContent += "<br>Loc: " + lat + ", " + lon;
   
   var marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lon),
      map: map
   });
   var infowindow = new google.maps.InfoWindow({
      content: infoWindowContent
   });
   marker.addListener('click', function() {
      infowindow.open(map, marker);
   });
   marker.addListener('rightclick', function() {
      console.log("Deleting id: " + id);
      var deleteRequest = new XMLHttpRequest();
      deleteRequest.onreadystatechange = function() {
         if (deleteRequest.readyState == 4 && deleteRequest.status == 200) {
            infowindow.close();
            marker.setMap(null);
         }
      };
      deleteRequest.open("DELETE", ENDPOINT, true);
      deleteRequest.send(id);
   });
};

/*
 * The callback GoogleMaps will call when complete
 */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 45.494492, lng: -122.6498242},
    zoom: 6,
    maxZoom: 14,
    minZoom: 4
  });
  
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
     if (request.readyState == 4 && request.status == 200) {
        var data = JSON.parse(request.responseText).data;
        for (var i = 0; i < data.length; ++i) {
           var curr = data[i];
           addPin(curr.firstname, curr.lastname, curr.lat, curr.lon, curr.id);
        }
        
        map.addListener('click', openInfoPane);
     }
  };
  request.open("GET", ENDPOINT, true);
  request.send(null);
  
  
  
  document.getElementById('info_cancel').onclick = closeInfoPane;
  document.getElementById('info_submit').onclick = submitInfo;
};

