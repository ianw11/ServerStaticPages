var ENDPOINT = "/crypto/";

window.onload = function() {
    var selectedAccountId = document.getElementById('selectedAccountId');
    var selectedCurrencyPair = document.getElementById('selectedCurrencyPair');
    
    document.getElementById('accountSelect').onchange = function() {
        loadCurrencyPairs(this.value);
        selectedAccountId.innerHTML = this.value;
        selectedCurrencyPair.innerHTML = '';
    };
    document.getElementById('currencyPairSelect').onchange = function() {
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
        console.log(res);
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
    var currencyPair = document.getElementById('selectedCurrencyPair').innerHTML;
    var previousNodeId = document.getElementById('previousNodeId').innerHTML;
    var price = document.getElementById('createNodePrice').value;
    var percent = "" + document.getElementById('createNodePercent').value / 100;
    var fromCurrency = document.getElementById('createNodeCurrencySelect').value;
    
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