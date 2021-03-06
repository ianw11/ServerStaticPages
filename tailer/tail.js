//var endpoint = 'ws://localhost:8100';
var endpoint = 'wss://nectarsac.com';

var socket;
var _socket_callbacks = {};

var lines = [];
var autoScroll = false;

window.onload = function() {
   socket = new WebSocket(endpoint + "/logtailsocket");
   
   socket.onopen = function() {
      sendSocketData(["LIST"]);
   };
   socket.onmessage = function(event) {
      handleSocketData(event.data);
   };
   socket.onclose = function(event) {
      console.log(event);
      text("Socket closed");
      dropChildren(document.getElementById("availableFiles"));
      socket = null;
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
   var dataArr = sanitizeLine(args.join("|"));
   for (var ndx in dataArr) {
      var line = dataArr[ndx];
      if (line.length === 0) {
         continue;
      }
      lines.push(line);
   }
   if (lines.length > maxLines) {
      // Remove the first n elements where n is the number in excess
      // Eg 12 in array 10 capacity then: 12-10 => 2 and we remove elements 0 and 1 or [0, 2)
      lines.splice(0, lines.length - maxLines);
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
         if (line.startsWith("E")) {
            p.className = 'red';
         } else if (line.startsWith("D")) {
            p.className = 'blue';
         } else if (line.startsWith("I")) {
            p.className = 'green';
         }
         content.append(p);
      }
   }

   if (autoScroll) {
     window.scrollTo(0, document.body.scrollHeight);
   }
};

function sanitizeLine(oldStr) {
   // Also clean up anything that might look like real html
   var str = oldStr.split("<").join("");
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
