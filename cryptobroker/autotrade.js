var ENDPOINT = "/crypto/";

window.onload = function() {
    var selectedAccountId = document.getElementById('selectedAccountId');
    var selectedCurrencyPair = document.getElementById('selectedCurrencyPair');
    var chart = document.getElementById('chart');
    
    document.getElementById('accountSelect').onchange = function() {
        dropChildren(chart);
        
        loadCurrencyPairs(this.value);
        selectedAccountId.innerHTML = this.value;
        selectedCurrencyPair.innerHTML = '';
    };
    document.getElementById('currencyPairSelect').onchange = function() {
        dropChildren(chart);
        
        var option = this.options[this.selectedIndex];
        loadTradePlan(option.accountId, option.value);
        selectedCurrencyPair.innerHTML = option.value;
        
        resetAddForm();
    };
    
    document.getElementById('addNodeButton').onclick = addNewNode;
    
    sendRequest('GET', 'accounts', null, function(res) {
        show(document.getElementById('content'));
        resetAccountSelect(res.data.accounts);
    }, function() {
        show(document.getElementById('errorDiv'));
    });
};

function resetAccountSelect(accounts) {
    var accountSelect = document.getElementById('accountSelect');
    dropChildren(accountSelect);
    accountSelect.append(buildEmptyOption());
    
    for (var ndx in accounts) {
        var account = accounts[ndx];
        
        var option = document.createElement('option');
        option.innerHTML = account.nickname + " (" + account.exchange + " " + account.apiTrunc + ")";
        option.value = account.id;
        accountSelect.append(option);
    }
    loadCurrencyPairs('');
};

function loadCurrencyPairs(accountId) {
    var pairSelect = document.getElementById('currencyPairSelect');
    dropChildren(pairSelect);
    pairSelect.append(buildEmptyOption());
    
    if (accountId === '') {
        pairSelect.disabled = true;
        return;
    }
    sendRequest('GET', 'currencyPairs?accountId=' + accountId, null, function(res) {
        pairSelect.disabled = false;
        
        for (var ndx in res.data.pairs) {
            var pair = res.data.pairs[ndx];
            
            var option = document.createElement('option');
            option.innerHTML = pair;
            option.value = pair;
            option.accountId = accountId;
            pairSelect.append(option);
        }
    });
};

function loadTradePlan(accountId, currencyPair) {
    console.log("Loading " + currencyPair + " for account id " + accountId);
    sendRequest('GET', 'trades?accountId=' + accountId + '&currencyPair=' + currencyPair, null, function(res) {
        var chart = document.getElementById('chart');
        dropChildren(chart);
        
        if (res.data.root === undefined) {
            console.log("Aborting trade plan");
            return;
        }
        
        var rootUl = document.createElement('ul');
        rootUl.append(buildNodeElement(res.data.root, false, res.data));
        chart.append(rootUl);
    });
};

function buildEmptyOption() {
    var emptyOption = document.createElement('option');
    emptyOption.innerHTML = "--Select one--";
    emptyOption.value = '';
    return emptyOption;
};

function resetAddForm() {
    var previousNode = document.getElementById('previousNodeId');
    var price = document.getElementById('createNodePrice');
    var percent = document.getElementById('createNodePercent');
    var currencySelect = document.getElementById('createNodeCurrencySelect');
    
    previousNode.innerHTML = "-1";
    price.value = 0;
    percent.value = 0;
    dropChildren(currencySelect);
    currencySelect.append(buildEmptyOption());
    
    var currencyPair = document.getElementById('selectedCurrencyPair').innerHTML;
    var currencies = currencyPair.split('/');
    
    for (var ndx in currencies) {
        var currency = currencies[ndx];
        var option = document.createElement('option');
        option.innerHTML = currency;
        option.value = currency;
        currencySelect.append(option);
    }
};

function addNewNode() {
    var accountId = document.getElementById('selectedAccountId').innerHTML;
    if (accountId === '') {
        updateStatus('Account/wallet required');
        return;
    }
    var currencyPair = document.getElementById('selectedCurrencyPair').innerHTML;
    if (currencyPair === '') {
        updateStatus('Currency pair required');
        return;
    }
    var previousNodeId = document.getElementById('previousNodeId').innerHTML;
    var price = document.getElementById('createNodePrice').value;
    var percent = "" + document.getElementById('createNodePercent').value / 100;
    var fromCurrency = document.getElementById('createNodeCurrencySelect').value;
    if (fromCurrency === '') {
        updateStatus('No currency selected');
        return;
    }
    
    var param = {
        accountId: accountId,
        currencyPair: currencyPair,
        previousNodeId: previousNodeId,
        price: price,
        percent: percent,
        fromCurrency: fromCurrency
    };
    
    sendRequest('POST', 'autotrade', JSON.stringify(param), function() {
        loadTradePlan(accountId, currencyPair);
    });
};

function buildNodeElement(ndx, isGreater, nodes) {
    var content = nodes[ndx + ""];
    
    var li = document.createElement('li');
    li.append(buildNodeContent(content, isGreater));
    
    var nodeElems = [];
    if (content.nextLT !== -1) {
        nodeElems.push(buildNodeElement(content.nextLT, false, nodes));
    }
    if (content.nextGT !== -1) {
        nodeElems.push(buildNodeElement(content.nextGT, true, nodes));
    }
    if (nodeElems.length > 0) {
        var childUl = document.createElement('ul');
        for (var ndx in nodeElems) {
            childUl.append(nodeElems[ndx]);
        }
        li.append(childUl);
    }
    
    return li;
};

function buildNodeContent(content, isGreater) {
    var div = document.createElement('div');
    
    var closeButton = document.createElement('span');
    closeButton.className = 'modalClose';
    closeButton.innerHTML = '&times;';
    div.append(closeButton);
    closeButton.onclick = function() {
        if (confirm("Delete entire branch? (TODO: Implement delete)")) {
            console.log("Clicked");
        } else {
            console.log("Cancelled");
        }
    };
    
    var h2 = document.createElement('h2');
    h2.innerHTML = (isGreater ? ">" : "<") + " " + content.price;
    div.append(h2);
    
    var transactionText = (parseFloat(content.percent) * 100) + "% ";
    if (content.tradeDirection === 'TO_QUOTE') {
        transactionText += content.baseCurrency + " -> " + content.quoteCurrency;
    } else {
        transactionText += content.quoteCurrency + " -> " + content.baseCurrency;
    }
    var transaction = document.createElement('p');
    transaction.innerHTML = transactionText;
    div.append(transaction);
    
    var baseAmount = document.createElement('p');
    baseAmount.innerHTML = content.baseCurrency + ": " + eightDecimalPlaces(content.baseAmountAfter);
    div.append(baseAmount);
    
    var quoteAmount = document.createElement('p');
    quoteAmount.innerHTML = content.quoteCurrency + ": " + eightDecimalPlaces(content.quoteAmountAfter);
    div.append(quoteAmount);
    
    div.onclick = function() {
        var oldSelections = document.getElementsByClassName('selected');
        for (var i = 0; i < oldSelections.length; ++i) {
            oldSelections[i].classList.remove('selected');
        }
        div.classList.add('selected');
        document.getElementById('previousNodeId').innerHTML = content.id;
    };
    
    return div;
};

