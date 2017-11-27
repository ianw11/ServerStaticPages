var ENDPOINT = "/crypto/";

window.onload = function() {
    var selectedRootId = document.getElementById('selectedRootId');
    var selectedCurrencyPair = document.getElementById('selectedCurrencyPair');
    var chart = document.getElementById('chart');
    
    document.getElementById('accountSelect').onchange = function() {
        dropChildren(chart);
        loadCurrencyPairs(this.value);
        selectedRootId.innerHTML = '';
        selectedCurrencyPair.innerHTML = '';
    };
    document.getElementById('currencyPairSelect').onchange = function() {
        dropChildren(chart);
        
        var option = this.options[this.selectedIndex];
        selectedRootId.innerHTML = option.value;
        loadTradePlan(option.value);
        selectedCurrencyPair.innerHTML = option.pair;
        
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
            var data = res.data.pairs[ndx];
            
            var option = document.createElement('option');
            option.innerHTML = data.pair;
            option.value = data.rootId;
            option.pair = data.pair;
            pairSelect.append(option);
        }
    });
};

function loadTradePlan(rootId) {
    sendRequest('GET', 'trades?rootId=' + rootId, null, function(res) {
        var chart = document.getElementById('chart');
        dropChildren(chart);
        
        var data = res.data;
        
        if (data.root === undefined) {
            console.log("Aborting trade plan");
            return;
        }
        
        var root = data.root;
        
        if (data.gt !== undefined) {
            var gtUl = document.createElement('ul');
            gtUl.append(buildNodeElement(data.gt, true, root));
            chart.append(gtUl);
        }
        
        /*
        var root = document.createElement('ul');
        var rootLi = document.createElement('li');
        */
        
        
        /*
        var rootUl = document.createElement('ul');
        rootUl.append(buildNodeElement(res.data.root, false, res.data));
        chart.append(rootUl);
        */
    });
};

function addNewNode() {
    var rootId = document.getElementById('selectedRootId').innerHTML;
    if (rootId === '') {
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
        rootId: rootId,
        parentId: previousNodeId,
        price: price,
        percent: percent,
        fromCurrency: fromCurrency
    };
    
    sendRequest('POST', 'autotrade', JSON.stringify(param), function() {
        loadTradePlan(rootId);
    });
};

/*
 * Trade Tree helper methods
 */

function buildNodeElement(tree, isGreater, root) {
    var pair = tree.pair;
    
    var li = document.createElement('li');
    li.append(buildNodeContent(pair, isGreater, root));
    
    var nodeElems = [];
    if (tree.nextLT !== undefined) {
        nodeElems.push(buildNodeElement(tree.nextLT, false, root));
    }
    if (tree.nextGT !== undefined) {
        nodeElems.push(buildNodeElement(tree.nextGT, true, root));
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

function buildNodeContent(pair, isGreater, root) {
    var node = pair.node;
    var executionNode = pair.executionNode;
    
    var div = document.createElement('div');
    
    // Start with the close button
    var closeButton = document.createElement('span');
    closeButton.className = 'modalClose';
    closeButton.innerHTML = '&times;';
    div.append(closeButton);
    closeButton.onclick = function() {
        if (confirm("Delete entire branch? (TODO: Implement delete)")) {
            var param = {
                rootId: root.id,
                nodeId: node.id
            };
            sendRequest('DELETE', 'autotrade', JSON.stringify(param), function() {
                loadTradePlan(root.id);
            });
        } else {
            console.log("Cancelled");
        }
    };
    
    // Now insert data
    var h2 = document.createElement('h2');
    h2.innerHTML = (isGreater ? ">" : "<") + " " + executionNode.price;
    div.append(h2);
    
    var transactionText = (parseFloat(executionNode.percent) * 100) + "% ";
    if (executionNode.direction === 'TO_QUOTE') {
        transactionText += root.baseCurrency + " -> " + root.quoteCurrency;
    } else {
        transactionText += root.quoteCurrency + " -> " + root.baseCurrency;
    }
    var transaction = document.createElement('p');
    transaction.innerHTML = transactionText;
    div.append(transaction);
    
    /*
    var baseAmount = document.createElement('p');
    baseAmount.innerHTML = baseCurrency + ": " + eightDecimalPlaces(content.baseAmountAfter);
    div.append(baseAmount);
    
    var quoteAmount = document.createElement('p');
    quoteAmount.innerHTML = quoteCurrency + ": " + eightDecimalPlaces(content.quoteAmountAfter);
    div.append(quoteAmount);
    */
    
    div.onclick = function() {
        var oldSelections = document.getElementsByClassName('selected');
        for (var i = 0; i < oldSelections.length; ++i) {
            oldSelections[i].classList.remove('selected');
        }
        div.classList.add('selected');
        document.getElementById('previousNodeId').innerHTML = node.id;
    };
    
    return div;
};

/*
 * Helper methods
 */

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

