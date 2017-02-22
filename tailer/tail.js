//var endpoint = 'localhost:8100';
var endpoint = 'nectarsac.com';

var socket;
var _socket_callbacks = {};

var lines = [];
var autoScroll = false;

window.onload = function() {
   socket = new WebSocket("ws://" + endpoint + "/logtailsocket");
   
   socket.onopen = function() {
      sendSocketData(["LIST"]);
   };
   socket.onmessage = function(event) {
      handleSocketData(event.data);
   };
   socket.onclose = function(event) {
      console.log(event);
      text("Socket closed");
   };
   addSocketCallback("LIST", list);
   addSocketCallback("TEXT", text);
   
   document.getElementById('autoScrollButton').onclick = toggleAutoscroll;
   toggleAutoscroll();
   var filter = document.getElementById('filter');
   filter.oninput = displayLines;
};

function toggleAutoscroll() {
   autoScroll = !autoScroll;
   var button = document.getElementById('autoScrollButton');
   button.innerHTML = "Auto-scroll " + (autoScroll ? "ENABLED" : "DISABLED") +
      ".  Click to " + (autoScroll ? "DISABLE" : "ENABLE");
   button.style.backgroundColor = (autoScroll ? "#45D96A" : "#F01355");
};

function list(args) {
   args = JSON.parse(args);
   args.forEach(function(val) {
      var button = document.createElement("button");
      button.innerHTML = val.name;
      button.onclick = function() {
         lines = [];
         dropChildren(document.getElementById("content"));
         sendSocketData(["FILE", val.id]);
         document.getElementById('selectedFile').innerHTML = "Tailing file " + val.name;
      };
      
      document.getElementById("availableFiles").append(button);
   });
};

function text(args) {
   var maxLines = document.getElementById('maxLines').value;
   var dataArr = splitNewline(args);
   for (var ndx in dataArr) {
      var line = dataArr[ndx];
      if (line.length === 0) {
         continue;
      }
      lines.push(line);
      while(lines.length > maxLines) {
         lines.splice(0, 1);
      }
   }
   displayLines();
};

// Helpers

function displayLines() {
   var limiter = document.getElementById("filter").value;
   if (limiter === null || limiter === undefined) {
      limiter = "";
   }

   var content = document.getElementById("content");
   dropChildren(content);
   for (var ndx in lines) {
      var line = lines[ndx];
      if (line.includes(limiter)) {
         var p = document.createElement("p");
         p.innerHTML = line;
         content.append(p);
      }
   }

   if (autoScroll) {
     window.scrollTo(0, document.body.scrollHeight);
   }
};

function splitNewline(arr) {
   var str = "";
   for (var ndx in arr) {
      str += arr[ndx];
   }
   return str.split("NEWLINE");
};

function dropChildren(parentElem) {
   while(parentElem.firstChild) {
      parentElem.removeChild(parentElem.firstChild);
   }
};

// Socket

function sendSocketData(args) {
   var message = "";
   for (var i = 0; i < args.length; ++i) {
      message += args[i];
      if (i < args.length-1) {
         message += "|";
      }
   }
   console.log("Socket sending: " + message);
   _lastSentMessage = message;
   socket.send(message);
};

function handleSocketData(data) {
   var split = data.split("|");
   var command = split[0];
   if (_socket_callbacks[command] === undefined) {
      console.error("Unknown callback: " + command);
      return;
   }
   var args = split.slice(1, split.length);
   _socket_callbacks[command](args);
};

function addSocketCallback(name, callback) {
   _socket_callbacks[name] = callback;
};
