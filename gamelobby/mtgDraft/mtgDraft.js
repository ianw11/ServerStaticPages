var showingDraft = false;
var currentDiv = $('#chooseDraftDiv');

var selectedCube = null;

var sets = [];

var currentCard;

function start() {
   console.log("Start function called");
   console.log("Width: " + $(window).width());
   
   $(document).keypress(keypress);
   
   socket.on('_ready', ready);
   socket.on('background', background);
   socket.on("isOwner", isOwner);
   socket.on("cube_list", cubeList);
   socket.on("set_list", setList);
   socket.on('cube_selected', cubeSelected);
   socket.on('set_selected', setSelected);
   socket.on('cube_selected_error', selectionError);
   socket.on('set_selected_error', selectionError);
   socket.on('current_pack', currentPack);
   socket.on('wait_for_pack', waitForPack);
   socket.on('selected_cards', selectedCards);
   socket.on('no_more_packs', draftComplete);
   socket.on('draft_file', draftFile);
   
   document.getElementById('refreshBackgroundButton').onclick = refreshBackground;
   document.getElementById('toggleCardsButton').onclick = toggleDraftView;
   document.getElementById('selectPendingCardButton').onclick = submitCurrentCard;
   $('#draft').toggle(0);
   $('#selected').toggle(0);
   document.getElementById('packNumberInput').onchange = numSetPacksUpdate;
   document.getElementById('sameSetsCheckbox').onchange = numSetPacksUpdate;
   
   sendSocketTitle('_ready');
};

function ready() {
   sendSocketTitle('isOwner');
};

function refreshBackground() {
   sendSocketTitle('background');
};

function background(args) {
   var background = args[0];
   console.log(background);
   document.body.style.backgroundImage = 'url('+ background +')';
};

function isOwner(args) {
   if (args[0] === 'true') {
      sendSocketTitle('list_cubes');
      var startButton = document.getElementById('startDraftButton');
      startButton.onclick = function() {
         sendSocketTitle('start_draft');
         toggleDraftView();
      };
   } else {
      updateStatusBar("Please wait.... game creator is choosing what to draft");
      toggleDraftView();
      refreshBackground();
   }
};

function cubeList(args) {
   var root = document.getElementById('availableCubes');
   args.forEach(function(filename) {
      var button = document.createElement('button');
      button.innerHTML = filename;
      button.onclick = function() {
         selectedCube = filename;
         submitCube();
      };
      root.append(button);
      root.append(document.createElement('br'));
   });
   // Finally the owner can make a request to get the background
   refreshBackground();
};

function submitCube() {
   if (selectedCube == null) {
      return;
   }
   var numPacks = document.getElementById('packNumberInput').value;
   sendSocket('cube_selected', selectedCube, numPacks);
};

function setList(args) {
   sets = JSON.parse(args);
   sets.sort(function(a, b) {
      return a.name > b.name ? 1 : -1;
   });
   numSetPacksUpdate();
};

function numSetPacksUpdate() {
   var allSame = document.getElementById('sameSetsCheckbox').checked;
   var numPacks = document.getElementById('packNumberInput').value
   var root = document.getElementById('availableSets');
   dropChildren(root);
   if (allSame) {
      numPacks = 1;
   }
   for (var i = 0; i < numPacks; ++i) {
      var select = document.createElement('select');
      var defaultOption = document.createElement('option');
      select.append(defaultOption);
      for (var ndx = 0; ndx < sets.length; ++ndx) {
         var set = sets[ndx];
         var option = document.createElement('option');
         option.value = set.code;
         option.innerHTML = desanitizeText(set.name);
         select.append(option);
      }
      select.onchange = submitSets;
      root.append(select);
      root.append(document.createElement('br'));
   }
   
   // Attempt to submit the cube/sets (this should make life nicer for the creator)
   submitSets();
   submitCube();
};

function submitSets() {
   var selectedSets = [];
   var root = document.getElementById('availableSets');
   //var numSets = root.childNodes.length / 2;
   var numSets = document.getElementById('packNumberInput').value;
   var allSameSet = document.getElementById('sameSetsCheckbox').checked;
   
   for (var i = 0; i < numSets; ++i) {
      var setCode = allSameSet ? root.childNodes[0].value : root.childNodes[2*i].value;
      if (setCode.length === 0) {
         return;
      }
      selectedSets.push(setCode);
   }
   selectedSets.splice(0, 0, 'set_selected');
   selectedCube = null;
   sendSocketData(selectedSets);
};

function cubeSelected(args) {
   updateStatusBar("Drafting CUBE: " + args[0] + " num packs: " + args[1]);
   var button = document.getElementById('startDraftButton');
   button.disabled = false;
   button.innerHTML = "<h1>Begin Draft: " + args[0] + " WITH " + args[1] + " PACKS PER PLAYER</h1>";
};

function setSelected(args) {
   var str = "";
   for (var i = 0; i < args.length; ++i) {
      str += args[i] + " ";
   }
   updateStatusBar("Drafting SET(S): " + str);
   
   var button = document.getElementById('startDraftButton');
   button.disabled = false;
   button.innerHTML = "<h1>Begin Draft: " + str + "</h1>";
};

function selectionError(args) {
   updateStatusBar("Internal Error. Make another selection.  Better error codes will come later");
   var button = document.getElementById('startDraftButton');
   button.disabled = true;
   button.innerHTML = "ERROR - CAN'T START YET";
};

function currentPack(args) {
   var packCards = JSON.parse(args[0]);
   var packNum = args[1];
   var pickNum = args[2];
   var passDirection = args[3]; // Unused
   var numCards = packCards.length;
   updateStatusBar("Pack " + packNum + " Pick " + pickNum + " Num cards in pack: " + numCards);
   
   document.getElementById('selectPendingCardButton').disabled = true;
   
   var hoverlock = new Object();
   
   var table = document.createElement('table');
   var draftDiv = document.getElementById('currentPack')
   draftDiv.append(table);
   buildCardTable(packCards, table, hoverlock);
   /*
   packCards.forEach(function(packCard, ndx) {
      draftDiv.append(buildPackDiv(packCard));
   });
   */
};

function buildCardTable(cards, table, hoverlock) {
   var currentTr;
   cards.forEach(function(packCard, ndx) {
      if (ndx % 5 == 0) {
         currentTr = document.createElement('tr');
         table.append(currentTr);
      }
      currentTr.append(buildPackTd(packCard, hoverlock));
   });
};

function buildPackTd(packCard, hoverlock) {
   var multiverseId = packCard.card.multiverseId;
   
   var div = document.createElement('div');
   div.className = 'card';
   var td = document.createElement('td');
   td.append(div);
   
   var img = document.createElement('img');
   img.src = 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + multiverseId + '&type=card';
   img.width = $(window).width() < 1900 ? 125 : 170;
   img.className = 'unselected';
   div.append(img);
   
   td.onmouseover = function() {
      pendingCard(packCard, false);
   };
   td.onmouseout = function() {
      pendingCard(hoverlock.card, true);
   };
   td.onclick = function() {
      console.log("Single click");
      pendingCard(packCard, true);
      hoverlock.card = packCard;
      var oldElem = hoverlock.elem;
      if (oldElem !== undefined) {
         oldElem.className = "unselected";
      }
      img.className = "selected";
      hoverlock.elem = img;
   };
   td.ondblclick = function() {
      console.log("Double click");
      submitCurrentCard();
   };
   
   return td;
};

function pendingCard(card, enableButton) {
   var detailsDiv = document.getElementById('pendingCardDetails');
   var pendingImage = document.getElementById('pendingCardImg');
   var submitButton = document.getElementById('selectPendingCardButton');
   
   if (card === undefined) {
      submitButton.disabled = true;
      currentCard = null;
      return;
   }
   currentCard = card;
   
   dropChildren(detailsDiv);
   
   var name = card.card.name;
   var cardText = desanitizeText(card.card.text);
   var packId = card.packId;
   var multiverseId = card.card.multiverseId;
   
   pendingImage.src = 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + multiverseId + '&type=card';
   pendingImage.width = 250;
   
   var oracle = document.createElement('p');
   oracle.innerHTML = cardText;
   detailsDiv.append(oracle);
   
   
   submitButton.disabled = !enableButton;
};

function submitCurrentCard() {
   if (currentCard === undefined || currentCard === null) {
      return;
   }
   
   sendSocket('card_selected', currentCard.packId);
   currentCard = null;
   document.getElementById('pendingCardImg').src = "";
   document.getElementById('selectPendingCardButton').disabled = true;
   dropChildren(document.getElementById('pendingCardDetails'));
   dropChildren(document.getElementById('currentPack'));
};

function keypress(evt) {
   /*
   evt = evt || window.event;
   var charCode = evt.keyCode || evt.which;
   var charStr = String.fromCharCode(charCode);
   console.log(charStr);
   */
   var charCode = evt.which;
   var charStr = String.fromCharCode(charCode);
   console.log(charCode + " " + charStr);
   if (charCode == 13) {
      // Enter key
      submitCurrentCard();
   }
};

function waitForPack(args) {
   updateStatusBar("WAIT FOR PACK");
};

function toggleDraftView() {
   var button = document.getElementById('toggleCardsButton');
   button.disabled = false;
   if (showingDraft) {
      button.innerHTML = "Back";
      swapActiveElement('selected');
      var div = document.getElementById('selectedCards');
      dropChildren(div);
      sendSocketTitle('selected_cards');
   } else {
      button.innerHTML = "View Selected Cards";
      swapActiveElement('draft');
   }
   showingDraft = !showingDraft;
};

function swapActiveElement(newElemStr) {
   newElem = $("#"+newElemStr);
   currentDiv.toggle(0);
   newElem.toggle(0);
   currentDiv = newElem;
};

function selectedCards(args) {
   var cards = JSON.parse(args);
   var div = document.getElementById('selectedCards');
   document.getElementById('numSelectedCards').innerHTML = cards.length + " cards";
   
   cards.forEach(function(card) {
      var multiverseId = card.multiverseId;
      
      var img = document.createElement('img');
      img.src = img.src = 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + multiverseId + '&type=card';
      div.append(img);
   });
};

function draftComplete() {
   $('#toggleCardsButton').toggle(0);
   showingDraft = true;
   toggleDraftView();
   updateStatusBar("Draft complete");
};

function draftFile(args) {
   var filename = args[0];
   var p = document.getElementById('download');
   p.innerHTML = '<a href="http://www.nectarsac.com/'+filename+'" download="draft_deck.cod">Download: '+filename+'</a>';
};

/*
 * UTILITY METHODS
 */

function updateStatusBar(text) {
   document.getElementById('statusBar').innerHTML = text;
};

function desanitizeText(text) {
   return text.split("QUOTE").join("\"")
      .split("NEWLINE").join("<br>")
      .split("{").join("{<i>")
      .split("}").join("</i>}")
      ;
};
