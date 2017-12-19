var ENDPOINT = '/crypto/';

window.onload = function() {
    // The buttons that open or submit a new account
    document.getElementById('addAccountPopup').onclick = addAccountPopup;
    document.getElementById('addAccount').onclick = addAccount;
    // The yellow update buttons
    document.getElementById('updateWalletsButton').onclick = updateWallets;
    document.getElementById('updateConversionsButton').onclick = updateConversions;
    document.getElementById('updateTransactions').onclick = updateTransactions;
    document.getElementById('logoutButton').onclick = logout;
    document.getElementById('setNickname').onclick = setNickname;
    
    // Give ability to close modal to each 'X' button
    var modalCloses = document.getElementsByClassName('modalClose');
    for (var ndx in modalCloses) {
        modalCloses[ndx].onclick = closeModal;
    }
    
    // Request exchanges from server
    sendRequest('GET', 'exchanges', null, function(result) {
        var select = document.getElementById('exchangeSelect');
        
        var data = result.data;
        for (var key in data) {
            var option = document.createElement('option');
            option.innerHTML = data[key];
            option.value = key;
            select.append(option);
        }
        
        updateWallets();
    }, function() {
        logout(false);
    });
};

function logout() {
    sendRequest('POST', 'logout');
    window.location.href = '/cryptobroker';
};

function addAccountPopup() {
    var popup = document.getElementById('modal');
    popup.style.display = 'block';
    
    document.getElementById('apikey').value = '';
    document.getElementById('passphrase').value = '';
    document.getElementById('secret').value = '';
};

function addAccount() {
    closeModal();
    
    var exchange = document.getElementById('exchangeSelect').value;
    var apikey = document.getElementById('apikey').value;
    var passphrase = document.getElementById('passphrase').value;
    var secret = document.getElementById('secret').value;
    
    if (apikey === '') {
        updateStatus('Enter an api key');
        return;
    }
    
    var param = {
        exchange: exchange,
        apikey: apikey,
        passphrase: passphrase,
        secret: secret
    };
    
    sendRequest('POST', 'addExchange', JSON.stringify(param), function() {
        updateWallets();
    });
};

/*
 * THE MAIN METHODS
 */

function updateWallets() {
    var updateButton = document.getElementById('updateWalletsButton');
    updateButton.disabled = true;

    var output = document.getElementById('wallets');
    dropChildren(output);
        
    sendRequest('GET', 'wallets', null, function(result) {
        var isUp = false;
        for (var ndx in result.data.accounts) {
            var account = result.data.accounts[ndx];
            
            var accountDiv = elem('div').className('account').className(isUp ? 'up' : 'down').elem;
            isUp = !isUp;
            
            elem('h2')
                .content(account.nickname + " (" + account.displayName + " " + account.apiTrunc + "...)")
                .appendTo(accountDiv);
            
            if (account.wallets.length > 0) {
            
                // Build a table holding currency type, balance, and conversion (to USD)
                var table = document.createElement('table');
                
                // And kick off with a header row
                var headerRow = document.createElement('tr');
                var headerCurrency = document.createElement('th');
                headerCurrency.innerHTML = 'CURRENCY';
                headerRow.append(headerCurrency);
                var headerBalance = document.createElement('th');
                headerBalance.innerHTML = 'BALANCE';
                headerRow.append(headerBalance);
                var headerConversion = document.createElement('th');
                headerConversion.innerHTML = 'USD CONVERSION (Last trade price)';
                headerRow.append(headerConversion);
                var headerUsdTotal = document.createElement('th');
                headerUsdTotal.innerHTML = 'USD TOTAL';
                headerRow.append(headerUsdTotal);
                var accountPercent = document.createElement('th');
                accountPercent.innerHTML = 'Percent of Account';
                headerRow.append(accountPercent);
                table.append(headerRow);
                
                // With the header done, build the rows
                for (var ndx in account.wallets) {
                    var wallet = account.wallets[ndx];
                    var walletRow = document.createElement('tr');
                    
                    var currencyCell = document.createElement('td');
                    currencyCell.innerHTML = wallet.currency;
                    walletRow.append(currencyCell);
                    
                    var balanceCell = document.createElement('td');
                    // THE ID IS <ACCOUNT_ID>+<CURRENCY>+balance
                    balanceCell.id = account.id + wallet.currency + 'balance';
                    balanceCell.innerHTML = wallet.balance;
                    balanceCell.currency = wallet.currency;
                    balanceCell.className = 'walletBalance';
                    walletRow.append(balanceCell);
                    
                    var conversionCell = document.createElement('td');
                    // THE ID IS <ACCOUNT_ID>+<CURRENCY>
                    conversionCell.id = account.id + wallet.currency;
                    walletRow.append(conversionCell);
                    
                    var usdTotalCell = document.createElement('td');
                    // THE ID IS <ACCOUNT_ID>+<CURRENCY>+total
                    usdTotalCell.id = account.id + wallet.currency + 'total';
                    // This also has a className of the currency
                    usdTotalCell.classList.toggle(wallet.currency + 'usd');
                    walletRow.append(usdTotalCell);
                    
                    var accountPercentCell = document.createElement('td');
                    // THE ID IS <ACCOUNT_ID>+<CURRENCY>+percent
                    accountPercentCell.id = account.id + wallet.currency + 'percent';
                    walletRow.append(accountPercentCell);
                    
                    table.append(walletRow);
                }
                accountDiv.append(table);
            
            }
            
            // Account total
            var totalTitle = document.createElement('h3');
            totalTitle.innerHTML = "Account total in USD";
            accountDiv.append(totalTitle);
            var totalAmount = document.createElement('p');
            totalAmount.className = 'accountTotal';
            totalAmount.id = account.id + 'total';
            totalAmount.innerHTML = "0.00";
            accountDiv.append(totalAmount);
            
            // Nickname button
            var button = document.createElement('button');
            button.innerHTML = "Set Nickname";
            button.className = 'orange';
            button.id = account.id;
            button.onclick = function() {
                id = this.id;
                document.getElementById('nicknameModal').style.display = 'block';
                document.getElementById('nickname').value = '';
            };
            accountDiv.append(button);
            
            // Delete button
            var deleteButton = document.createElement('button');
            deleteButton.innerHTML = 'DELETE EXCHANGE';
            deleteButton.className = 'red';
            deleteButton.id = account.id;
            deleteButton.onclick = function() {
                var param = { id : this.id };
                sendRequest('DELETE', 'exchange', JSON.stringify(param), function() {
                    updateWallets();
                });
            };
            accountDiv.append(deleteButton);
            
            // Space then the transactions accordion
            accountDiv.append(document.createElement('p'));
            
            var accordionHolder = document.createElement('div');
            accordionHolder.id = account.id + 'transactions';
            accountDiv.append(accordionHolder);
            
            //output.append(buildAccordion(exchangeTitle, accountDiv));
            output.append(accountDiv);
        }
        
        updateConversions();
        updateButton.disabled = false;
    }, function() {
        logout();
        updateButton.enabled = false;
    });
};

function updateConversions() {
    var conversionsButton = document.getElementById('updateConversionsButton');
    conversionsButton.disabled = true;

    var walletTotals = document.getElementById('totals');
    dropChildren(walletTotals);
    var loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader';
    walletTotals.append(loaderDiv);
    
    sendRequest('GET', 'usdConversions', null, function(res) {
        for (var tag in res.data) {
            var account = res.data[tag];
            
            var accountSum = 0;
            
            for (var ndx in account.conversions) {
                var conversion = account.conversions[ndx];
                
                var lastTradePrice = conversion.lastTradePrice;
                
                var tag = account.id + conversion.from;
                
                var conversionElem = document.getElementById(tag);
                if (conversionElem === null) {
                    continue;
                }
                conversionElem.innerHTML = lastTradePrice;
                
                var totalElem = document.getElementById(tag + 'total');
                var balanceElem = document.getElementById(tag + 'balance');
                var total = parseFloat(lastTradePrice) * parseFloat(balanceElem.innerHTML);
                totalElem.innerHTML = total;
                accountSum += total;
            }
            
            var accountTotalElem = document.getElementById(account.id + 'total');
            accountTotalElem.innerHTML = accountSum;
            
            for (var ndx in account.conversions) {
                var currency = account.conversions[ndx].from;
                var currencyTotalElem = document.getElementById(account.id + currency + 'total');
                var element = document.getElementById(account.id + currency + 'percent');
                if (element === null) {
                    continue;
                }
                element.innerHTML = ((parseFloat(currencyTotalElem.innerHTML) / accountSum) * 100).toFixed(8) + "%";
            }
        }
        
        updateTotals();
        conversionsButton.disabled = false;
    }, function() {
        conversionsButton.disabled = false;
    });
};

function updateTotals() {
    var walletTotals = document.getElementById('totals');
    
    var totalDiv = this.elem('div').className('totals').elem;
    
    // First compute the total USD value based on the account total of each account
    var items = document.getElementsByClassName('accountTotal');
    var usdTotal = 0;
    for (var i = 0; i < items.length; ++i) {
        var element = items[i];
        var value = parseFloat(element.innerHTML);
        usdTotal += value;
    }
    this.elem('h2').content("TOTAL USD VALUE: $" + usdTotal).id('usdValue').appendTo(totalDiv).elem.total = usdTotal;
    
    // Then save some space for the total deposits information
    this.elem('div').appendTo(totalDiv)
        .child(this.elem('label').innerHTML('Total Deposited:  ').elem)
        .child(this.elem('span')
            .innerHTML('<b>(Update Transactions to view)</b>')
            .id('totalUsdDeposited').elem)
        .child(this.elem('br').elem)
        .child(this.elem('label').innerHTML('Gain:  ').elem)
        .child(this.elem('span')
            .innerHTML('<b>(Update Transactions to view)</b>')
            .id('totalUsdEarned').elem)
        .child(this.elem('br').elem)
        .child(this.elem('label').innerHTML('Percent gain:  ').elem)
        .child(this.elem('span').id('percentGain').innerHTML('<b>0%</b>').elem);
    
    // Then display the sum of each coin across all accounts
    var totals = {};
    var balances = document.getElementsByClassName('walletBalance');
    for (var i = 0; i < balances.length; ++i) {
        var elem = balances[i];
        var currency = elem.currency;
        if (totals[currency] === undefined) {
            totals[currency] = 0;
        }
        totals[currency] += parseFloat(elem.innerHTML);
    }

    if (balances.length > 0) {
    var table = this.elem('table')
        .child(this.elem('tr')
            .child(this.elem('th').content("Coin").elem)
            .child(this.elem('th').content('Total Balance (across all accounts)').elem)
            .child(this.elem('th').content('Total in USD').elem)
            .child(this.elem('th').content('Percent of total').elem)
            .elem)
        .elem;
    
    for (var key in totals) {
        var usd = 0;
        var elems = document.getElementsByClassName(key + 'usd');
        for (var ndx = 0; ndx < elems.length; ++ndx) {
            var element = elems[ndx];
            usd += parseFloat(element.innerHTML);
        }
        
        this.elem('tr')
            .child(this.elem('td').content(key).elem)
            .child(this.elem('td').content(totals[key]).elem)
            .child(this.elem('td').content('$' + usd).elem)
            .child(this.elem('td').content(((usd / usdTotal) * 100).toFixed(8) + "%").elem)
            .appendTo(table);
    }
    totalDiv.append(table);
    }
    
    dropChildren(walletTotals);
    walletTotals.append(totalDiv);
    updateTransactions();
};

function updateTransactions() {
    document.getElementById('totalUsdDeposited').innerHTML = 'Updating';
    document.getElementById('totalUsdEarned').innerHTML = '';
    document.getElementById('percentGain').innerHTML = '';

    sendRequest('GET', 'transactions', null, function(res) {
        var totalUsdDeposited = 0;
        for (var id in res.data) {
            var transactions = res.data[id];
            if (transactions.length == 0) {
                continue;
            }
            
            var deposits = {'USD' : 0};
            var withdrawals = {'USD' : 0};
            
            var content = elem('ul').elem;
            
            var sumDepositsElem = elem('h3').appendTo(content).elem;
            var sumWithdrawalsElem = elem('h3').appendTo(content).elem;
            
            for (var ndx in transactions) {
                var transaction = transactions[ndx];
                var type = transaction.type;
                
                // Perform some processing based on the transaction type
                var className;
                if (type === 'BUY') {
                    className = 'red';
                } else if (type === 'SELL') {
                    className = 'green';
                } else if (type === 'DEPOSIT') {
                    className = 'yellow';
                    
                    if (deposits[transaction.creditType] == undefined) {
                        deposits[transaction.creditType] = 0;
                    }
                    deposits[transaction.creditType] += parseFloat(transaction.creditAmount);
                } else if (type === 'WITHDRAWAL') {
                    className = 'orange';
                    
                    if (withdrawals[transaction.debtType] == undefined) {
                        withdrawals[transaction.debtType] = 0;
                    }
                    withdrawals[transaction.debtType] += parseFloat(transaction.debtAmount);
                }
                
                // Build the actual transaction element here
                var transactionElem = elem('div').className(className).appendTo(content).elem;
                
                // Build the transaction details
                var str = "";
                if (type !== 'WITHDRAWAL') {
                    if (type === 'SELL') {
                        str += eightDecimalPlaces(transaction.debtAmount) + " " + transaction.debtType;
                    } else {
                        str += eightDecimalPlaces(transaction.creditAmount) + " " + transaction.creditType;
                    }
                }
                if (type === "BUY" || type === "SELL") {
                    str += " for ";
                }
                if (type !== 'DEPOSIT') {
                    if (type === 'SELL') {
                        str += eightDecimalPlaces(transaction.creditAmount) + " " + transaction.creditType;
                    } else {
                        str += eightDecimalPlaces(transaction.debtAmount) + " " + transaction.debtType;
                    }
                }
                if (type === "BUY" || type === "SELL") {
                    str += " at " + eightDecimalPlaces(transaction.price);
                }
                
                elem('h3').content(type).appendTo(transactionElem);
                elem('p').content(str).appendTo(transactionElem);
                
                // Build the date
                var date = new Date(transaction.timestamp);
                elem('p').content(date).appendTo(transactionElem);
            }
            
            sumDepositsElem.innerHTML = 'Total USD deposits: ' + deposits['USD'];
            totalUsdDeposited += deposits['USD'];
            sumWithdrawalsElem.innerHTML = 'Total USD withdrawals: ' + withdrawals['USD'];
            totalUsdDeposited -= withdrawals['USD'];
            
            var titleElem = elem('h2').content("Transactions").elem;
            var holderElem = document.getElementById(id + 'transactions');
            dropChildren(holderElem);
            holderElem.append(buildAccordion(titleElem, content));
        }
        
        // Finish out by updating the account's gain percentage (as a result of USD deposited)
        document.getElementById('totalUsdDeposited').innerHTML = '$' + totalUsdDeposited;
        var accountTotal = document.getElementById('usdValue').total;
        var delta = accountTotal - totalUsdDeposited;
        document.getElementById('totalUsdEarned').innerHTML = '$' + delta;
        var percentGain = (delta / totalUsdDeposited) * 100;
        document.getElementById('percentGain').innerHTML = '<b>' + percentGain + '%</b>';
    });
};

function setNickname() {
    var nickname = document.getElementById('nickname').value;
    var param = {
        nickname: nickname,
        id: id
    };
    sendRequest('POST', 'account/nickname', JSON.stringify(param), function() {
        updateWallets();
        closeModal();
    });
    id = null;
};

/*
 * UI HELPER METHODS
 */

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('nicknameModal').style.display = 'none';
};

function buildAccordion(titleElem, contentElem) {
    // Format the title element
    titleElem.classList.toggle('accordion');
    titleElem.onclick = function() {
        this.classList.toggle('active');
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    };
    
    // Build the accordion, attach the title then the content, and finally return
    return elem('div').className('accordionWrapper')
        .child(titleElem)
        .child(elem('div').className('panel').child(contentElem).elem)
        .elem;
};
