//var endpoint = 'localhost:8100'
var endpoint = 'nectarsac.com'

// The socket to the server
var socket;
// Socket callbacks
var _socket_callbacks = {};
// The current visible element (html)
var _visibleElem = null;
// The last sent message, just in case
var _lastSentMessage = null;

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
   socket = new WebSocket("ws://"+endpoint+"/gamelobbysocket");
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
      //document.getElementById('_debug_close_socket_button').disabled = true;
   };
   socket.on = function(name, callback) {
      addSocketCallback(name, callback);
   }
   socket.on('_resend_message', resendMessage);
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
   //$('#_debug_close_socket_button')[0].onclick = DEBUGcloseSocket;
   $('#submit_name_button')[0].onclick = sendName;
   $('#_submit_name_form').submit(sendName);
   $('#createGameButton')[0].onclick = createGame;
   $('#createGameRoomButton')[0].onclick = submitCreateGame;
   $('#gameTitleInputForm').submit(submitCreateGame);
   $('#joinGameButton')[0].onclick = joinGame;
   $('#refreshOpenRooms')[0].onclick = refreshOpenRooms;
   $('#startGameButton')[0].onclick = requestStartGame;
};

function sendName(button) {
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
   document.getElementById('playerNumberRequirements').innerHTML = _selected_game.playerRequirementDisplayString;
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
      
      var top = document.createElement('p');
      top.innerHTML = "<b>" + room.title + "</b> hosted by <b>" + room.ownerName + '</b>. Connected: ' + room.numConnected;
      div.append(top);
      var mid = document.createElement('p');
      mid.innerHTML = 'Game: ' + room.game.name + '.  ' + room.game.playerRequirementDisplayString;
      div.append(mid);
      var joinButton = document.createElement('button');
      joinButton.innerHTML = "Join";
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

function resendMessage(args) {
   console.log("ERROR! Message needs a resend");
   console.log("Resending " + _lastSentMessage);
   socket.send(_lastSentMessage);
};

function DEBUGcloseSocket() {
   document.getElementById('_debug_close_socket_button').disabled = true;
   console.log("Closing socket");
   socket.close();
};

