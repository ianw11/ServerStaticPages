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
// Users Name goes here
var input = null;

window.onload = function() {
   applyUserActions();
   
   // Set up WebSocket
   socket = new WebSocket("ws://"+endpoint+"/gamelobbysocket");
   socket.onopen = function(event) {
      console.log("Socket opened");
   };
   socket.onmessage = function(event) {
      handleSocketData(event.data);
   };
   socket.onclose = function(event) {
      console.log("Socket closed");
      console.log(event);
      //_swapActiveElement('socket_closed');
      //document.getElementById('_debug_close_socket_button').disabled = true;
   };
   socket.on = function(name, callback) {
      addSocketCallback(name, callback);
   }
   //socket.on('_resend_message', resendMessage);
   //socket.on('chat_message', chatMessage);
   //socket.on('_pending_rooms', openRooms);
   //socket.on('_in_room', inRoom);
   //socket.on('_player_list_update', playerListUpdate);
   //socket.on('_room_closed', roomClosed);
   //socket.on('_start_game', startGame);
   //socket.on('_start_game_error', startGameError);
};

/**
 * UI CALLBACKS
 */
function applyUserActions() {
   //$('#_debug_close_socket_button')[0].onclick = DEBUGcloseSocket;
	$('#enter_name')[0].onsubmit = sendName;
	$('#createGameButton')[0].onclick = createGame;
	$('.game_names')[0].onclick = selectGame;
	//$('#joinGameButton')[0].onclick = joinGame;
	// $('#refreshOpenRooms')[0].onclick = refreshOpenRooms;
	//$('#startGameButton')[0].onclick = requestStartGame;
};

function sendName() {
   input = $('#name_box')[0].value;
   console.log(input);
   if (input === undefined || input === '') {
      return;
   }
   
   socket.on("name_received", function() {
	   console.log(input);
      $('#enter_name').toggle(0);
	  $('#create_or_join').toggle(0);
	  document.getElementById('center_text_top').innerHTML = "Create or Join a game?";
   });
   sendSocketDataWithUI("name", input);
   return false;
};

function createGame() {
	socket.on("game_info", function() {
		console.log(input);
		var gameBox = document.getElementsByClassName('game_expander')[0];
			document.getElementById('center_text_top').innerHTML = "Choose a game, " + input + "!";
			$('#create_or_join').toggle(0);
			document.getElementById('game_name').style.display = 'inline-block';
			gameBox.classList.add('expanded_left');
			document.getElementById('game_name').innerHTML = "waiting on you...";
	});
	sendSocketDataWithUI("game_info");
};
   

function submitCreateGame() {
      sendSocketDataWithUI("_create_room", _selected_game.id);
};








function joinGame() {
		document.getElementById('center_text_top').innerHTML = "Choose a lobby, " + input + "!";
		$('#create_or_join').toggle(0);
		$('#modBox').animate({width:"toggle"}, 500);
		$('modBox').load(join_mtg.html);
		
   sendSocketDataWithUI('_pending_rooms');
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















function sendSocketDataWithUI() {
   sendSocketData(arguments);
};

function addSocketCallback(name, callback) {
   _socket_callbacks[name] = callback;
};

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
   