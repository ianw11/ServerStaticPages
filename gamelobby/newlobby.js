var DEBUG = false;
var endpoint = DEBUG ? 'localhost:8100' : 'nectarsac.com';

// The socket to the server
var socket;
// Socket callbacks
var _socket_callbacks = {};
// The current visible element (html)
var _visibleElem = null;

var _selected_game = null;

window.onload = function() {
   applyOnClick();
   
   // Set the current visible element
   _visibleElem = $('#enterNameDiv');
   // Hide all other divs
   $('._hidden').each(function(index) {
      $(this).toggle(0);
   });
   
   // Set up WebSocket
   socket = new WebSocket("wss://"+endpoint+"/gamelobbysocket");
   socket.onopen = function(event) {
      console.log("Socket opened");
      console.log(event);
   };
   socket.onmessage = function(event) {
      handleSocketData(event.data);
   };
   socket.onclose = function(event) {
      console.log("Socket closed");
      console.log(event);
      _swapActiveElement('socket_closed');
      if (DEBUG) {
         document.getElementById('_debug_close_socket_button').disabled = true;
      }
   };
   socket.on = function(name, callback) {
      addSocketCallback(name, callback);
   }
   socket.on('chat_message', chatMessage);
   socket.on('_pending_rooms', openRooms);
   socket.on('_in_room', inRoom);
   socket.on('_player_list_update', playerListUpdate);
   socket.on('_room_closed', roomClosed);
   socket.on('_start_game', startGame);
   socket.on('_start_game_error', startGameError);
};

/**
 * UI CALLBACKS
 */
function applyOnClick() {
   if (DEBUG) {
      $('#_debug_close_socket_button')[0].onclick = DEBUGcloseSocket;
   } else {
      $('#_debug_close_socket_button')[0].style.display = 'none';
   }
   $('#submit_name_button')[0].onclick = sendName;
   $('#_submit_name_form').on('submit', sendName);
   $('#createGameButton')[0].onclick = createGame;
   $('#createGameRoomButton')[0].onclick = submitCreateGame;
   $('#gameTitleInputForm').submit(submitCreateGame);
   $('#joinGameButton')[0].onclick = joinGame;
   $('#refreshOpenRooms')[0].onclick = refreshOpenRooms;
   $('#startGameButton')[0].onclick = requestStartGame;
   
   
   $('#joinGameBackButton')[0].onclick = function() {
      _swapActiveElement('createOrJoin');
   };
   $('#createGameBackButton')[0].onclick = function() {
      _swapActiveElement('createOrJoin');
   };
};

function sendName(e) {
   if (e !== undefined) {
       e.preventDefault();
   }
   var input = $('#name_input')[0].value;
   if (input === undefined || input === '') {
      return;
   }
   
   socket.on("name_received", function(args) {
      _swapActiveElement('createOrJoin');
   });
   sendSocketDataWithUI("name", input);
   
   return false;
};

/*
 * CREATE GAME
 */
function createGame() {
   socket.on("game_info", function(args) {
      var chooseGameForm = document.getElementById('chooseGameForm');
      dropChildren(chooseGameForm);
      
      var gamesArr = JSON.parse(args[0]).games;
      gamesArr.forEach(function(val, ndx) {
         console.log("Name: " + val.name + " displayString: " + val.playerRequirementDisplayString);
         var button  = document.createElement('button');
         button.onclick = function() {
            _selected_game = val;
            showSelectedGame();
            return false;
         };
         button.innerHTML = val.name;
         button.id = val.id;
         
         console.log("Donal:")
         console.log(chooseGameForm);
         chooseGameForm.append(button);
         chooseGameForm.append(document.createElement('br'));
      });
      _swapActiveElement('createGame');
   });
   sendSocketDataWithUI("game_info");
};

function showSelectedGame() {
   document.getElementById('createGameRoomButton').disabled = false;
   document.getElementById('selectedGameName').innerHTML = "Selected: " + _selected_game.name;
   document.getElementById('selectedGameName').className = 'green';
   document.getElementById('playerNumberRequirements').innerHTML = _selected_game.playerRequirementDisplayString;
   document.getElementById('playerNumberRequirements').className = 'red';
};

function submitCreateGame() {
   var gameTitle = document.getElementById('gameTitleInput').value;
   if (gameTitle.length > 0) {
      sendSocketDataWithUI("_create_room", _selected_game.id, gameTitle);
   } else {
      sendSocketDataWithUI("_create_room", _selected_game.id);
   }
   return false;
};

/*
 * JOIN GAME
 */
function joinGame() {
   sendSocketDataWithUI('_pending_rooms');
   _swapActiveElement('joinGame');
};

function openRooms(args) {
   var rooms = JSON.parse(args);
   console.log(rooms);
   var root = document.getElementById('openGamesDiv');
   dropChildren(root);
   rooms.forEach(function(room) {
      var div = document.createElement('div');
      div.className += ' border';
      
      var roomTitle = document.createElement('p');
      roomTitle.innerHTML = '<h1>' + room.title + '</h1>';
      roomTitle.className = 'roomTitle';
      div.append(roomTitle);
      
      var gameName = document.createElement('p');
      gameName.innerHTML = '<b>' + room.game.name + '</b>';
      gameName.className = 'gameName';
      div.append(gameName);
      
      var hostedBy = document.createElement('p');
      hostedBy.innerHTML = 'Hosted by <b>' + room.ownerName + '</b>';
      hostedBy.className = 'hostedBy';
      div.append(hostedBy);
      
      var mid = document.createElement('p');
      mid.innerHTML = '<b>Limits:</b> ' + room.game.playerRequirementDisplayString + '  <b>Currently Connected:</b> ' + room.numConnected;
      div.append(mid);
      
      var joinButton = document.createElement('button');
      joinButton.innerHTML = "Join";
      joinButton.className = "_joinButton";
      joinButton.onclick = function() {
         console.log("Joining game " + room.id);
         sendSocketDataWithUI('_join_room', room.id);
      };
      div.append(joinButton);
      
      root.appendChild(div);
   });
};

function refreshOpenRooms() {
   joinGame();
};

/*
 * IN ROOM
 */

function inRoom(args) {
   console.log(args);
   var json = JSON.parse(args);
   var title = json.title + " (" + json.gameInfo.name + ")";
   document.getElementById('lobbyTitle').innerHTML = title;
   var playerReq = "Need: " + json.gameInfo.playerRequirementDisplayString;
   document.getElementById('playerNumberRequirementBar').innerHTML = playerReq;
   document.getElementById('startGameButton').style.visibility = (json.isOwner ? 'visible' : 'hidden');
   _swapActiveElement('waiting_room');
};

function playerListUpdate(args) {
   var players = JSON.parse(args);
   var ul = document.getElementById('connectedPlayersList');
   dropChildren(ul);
   players.forEach(function(name) {
      var li = document.createElement('li');
      li.innerHTML = name;
      ul.append(li);
   });
};

function requestStartGame() {
   sendSocketDataWithUI('_start_game');
};

function roomClosed() {
   alert("Game closed, please choose another");
   document.body.style.backgroundImage = "";
   joinGame();
};

/*
 * IN GAME
 */

function startGame(args) {
   var url = args[0];
   $('#_in_game').load(url, null, function(responseText, textStatus, jqxhr) {
      console.log(textStatus);
      console.log(jqxhr);
      if (jqxhr.status != 200) {
         console.log("Bad status: " + jqxhr.status);
         startGame(args);
         return;
      }
      
      start();
      _swapActiveElement('_in_game');
   });
};

function startGameError(args) {
   _swapActiveElement('waiting_room');
   document.getElementById('errorBar').innerHTML = args[0];
};

/**
 * UI HELPER METHODS
 */
// Show the loading div
function showLoadingDiv() {
   _swapActiveElement('loadingDiv');
};

function _swapActiveElement(newElemStr) {
   newElem = $("#"+newElemStr);
   _visibleElem.toggle(0);
   newElem.toggle(0);
   _visibleElem = newElem;
};

function dropChildren(parentElem) {
   while(parentElem.firstChild) {
      parentElem.removeChild(parentElem.firstChild);
   }
}

function chatMessage(args) {
   for (var i = 0; i < args.length; ++i) {
      console.log("Chat " + i + ": " + args[i]);
   }
}

/**
 * SOCKET HELPER METHODS
 */

// Accepts an array of Strings
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

function sendSocketTitle(title) {
   sendSocketData([title]);
};

function sendSocket() {
   var args = [];
   for (var i = 0; i < arguments.length; ++i) {
      args[i] = arguments[i];
   }
   sendSocketData(args);
};

// This method uses the implied 'arguments' object
function sendSocketDataWithUI() {
   showLoadingDiv();
   sendSocketData(arguments);
};

function handleSocketData(data) {
   console.log("Socket received: " + data);
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

function DEBUGcloseSocket() {
   document.getElementById('_debug_close_socket_button').disabled = true;
   console.log("Closing socket");
   socket.close();
};
