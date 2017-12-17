var ENDPOINT = "/crypto/";

var id;

window.onload = function() {
    document.getElementById('loginButton').onclick = login;
    document.getElementById('showRegisterModalButton').onclick = showRegisterModal;
    document.getElementById('registerButton').onclick = register;
    document.getElementById('addAccount').onclick = addAccount;
    document.getElementById('addAccountPopup').onclick = addAccountPopup;
    document.getElementById('updateWalletsButton').onclick = updateWallets;
    document.getElementById('updateConversionsButton').onclick = updateConversions;
    document.getElementById('updateTransactions').onclick = updateTransactions;
    document.getElementById('logoutButton').onclick = logout;
    document.getElementById('setNickname').onclick = setNickname;
    
    // Give ability to close modal
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
        
        updateWallets(true);
    });
};

/*
    Login screen functions
 */

function showRegisterModal() {
    var modal = document.getElementById('registerModal');
    modal.style.display = 'block';
    
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('firstname').value = '';
    document.getElementById('lastname').value = '';
};

function register() {
    closeModal();
    
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var firstname = document.getElementById('firstname').value;
    var lastname = document.getElementById('lastname').value;
    
    var param = {
        email: email,
        password: password,
        first_name: firstname,
        last_name: lastname
    };
    
    sendRequest('POST', 'register', JSON.stringify(param));
};

function login() {
    var loginButton = document.getElementById('loginButton');
    loginButton.disabled = true;
    
    var email = document.getElementById('email_login').value;
    var password = document.getElementById('password_login').value;
    document.getElementById('email_login').value = '';
    document.getElementById('password_login').value = '';
    
    var param = {
        email: email,
        password: password
    };
    
    sendRequest('POST', 'login', JSON.stringify(param), function(result) {
        document.getElementById('loginDiv').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        updateWallets();
        
        loginButton.disabled = false;
    }, function() {
        loginButton.disabled = false;
    });
};

/*
    Logged in screen functions
 */

function logout(suppressServer) {
    if (suppressServer !== true) {
        sendRequest('POST', 'logout');
    }
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('content').style.display = 'none';
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

function updateWallets(isCodeInitiated) {
    var updateButton = document.getElementById('updateWalletsButton');
    updateButton.disabled = true;

    var output = document.getElementById('wallets');
    dropChildren(output);
        
    sendRequest('GET', 'wallets', null, function(result) {
        var isUp = false;
        for (var tag in result.data) {
            var account = result.data[tag];
            
            var accountDiv = document.createElement('div');
            accountDiv.className = isUp ? 'accountUp' : 'accountDown';
            isUp = !isUp;
            
            var exchangeTitle = document.createElement('h2');
            exchangeTitle.innerHTML = account.nickname + " (" + account.displayName + " " + account.apiTrunc + "...)";
            accountDiv.append(exchangeTitle);
            
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
        
        if (isCodeInitiated) {
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('content').style.display = 'block';
        }
        
        updateConversions();
        updateButton.disabled = false;
    }, function() {
        logout(isCodeInitiated);
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
                var elem = document.getElementById(account.id + currency + 'percent');
                if (elem === null) {
                    continue;
                }
                elem.innerHTML = ((parseFloat(currencyTotalElem.innerHTML) / accountSum) * 100).toFixed(8) + "%";
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
    
    var totalDiv = document.createElement('div');
    totalDiv.className = 'totals';
    
    // First compute the total USD value based on the account total of each account
    var items = document.getElementsByClassName('accountTotal');
    var usdTotal = 0;
    for (var i = 0; i < items.length; ++i) {
        var elem = items[i];
        var value = parseFloat(elem.innerHTML);
        usdTotal += value;
    }
    var usdTotalElem = document.createElement('h2');
    usdTotalElem.innerHTML = "TOTAL USD VALUE: $" + usdTotal;
    usdTotalElem.total = usdTotal;
    totalDiv.append(usdTotalElem);
    
    // Then save some space for the total deposits information
    var percentGainDiv = document.createElement('div');
    var totalUsdDeposited = document.createElement('h3');
    totalUsdDeposited.id = 'totalUsdDeposited';
    percentGainDiv.append(totalUsdDeposited);
    totalDiv.append(percentGainDiv);
    
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
    var table = document.createElement('table');
    var titleRow = document.createElement('tr');
    var title = document.createElement('th');
    title.innerHTML = "Coin";
    titleRow.append(title);
    var titleBalance = document.createElement('th');
    titleBalance.innerHTML = "Total Balance (across all accounts)";
    titleRow.append(titleBalance);
    var titleUsd = document.createElement('th');
    titleUsd.innerHTML = "Total in USD";
    titleRow.append(titleUsd);
    var titlePercent = document.createElement('th');
    titlePercent.innerHTML = "Percent of total";
    titleRow.append(titlePercent);
    table.append(titleRow);
    
    for (var key in totals) {
        var row = document.createElement('tr');
        var name = document.createElement('td');
        name.innerHTML = key;
        var value = document.createElement('td');
        value.innerHTML = totals[key];
        var usdElem = document.createElement('td');
        var usd = 0;
        var elems = document.getElementsByClassName(key + 'usd');
        for (var ndx = 0; ndx < elems.length; ++ndx) {
            var elem = elems[ndx];
            usd += parseFloat(elem.innerHTML);
        }
        usdElem.innerHTML = "$" + usd;
        var percentElem = document.createElement('td');
        percentElem.innerHTML = ((usd / usdTotal) * 100).toFixed(8) + "%";

        row.append(name);
        row.append(value);
        row.append(usdElem);
        row.append(percentElem);
        table.append(row);
    }
    totalDiv.append(table);
    
    dropChildren(walletTotals);
    walletTotals.append(totalDiv);
};

function updateTransactions() {
    sendRequest('GET', 'transactions', null, function(res) {
        var totalUsdDeposited = 0;
        for (var id in res.data) {
            var transactions = res.data[id];
            if (transactions.length == 0) {
                continue;
            }
            
            var deposits = {'USD' : 0};
            var withdrawals = {'USD' : 0};
            
            var content = document.createElement('ul');
            var sumDepositsElem = document.createElement('h3');
            content.append(sumDepositsElem);
            var sumWithdrawalsElem = document.createElement('h3');
            content.append(sumWithdrawalsElem);
            
            for (var ndx in transactions) {
                var transaction = transactions[ndx];
                var type = transaction.type;
                
                var transactionElem = document.createElement('div');
                if (type === 'BUY') {
                    transactionElem.className = 'green';
                } else if (type === 'SELL') {
                    transactionElem.className = 'red';
                } else if (type === 'DEPOSIT') {
                    transactionElem.className = 'yellow';
                    
                    if (deposits[transaction.creditType] == undefined) {
                        deposits[transaction.creditType] = 0;
                    }
                    deposits[transaction.creditType] += parseFloat(transaction.creditAmount);
                } else if (type === 'WITHDRAWAL') {
                    transactionElem.className = 'yellow';
                    
                    if (withdrawals[transaction.debtType] == undefined) {
                        withdrawals[transaction.debtType] = 0;
                    }
                    withdrawals[transaction.debtType] += parseFloat(transaction.debtAmount);
                }
                
                // Build the transaction details
                var h3 = document.createElement('h3');
                var str = type + " "; // BUY/SELL
                if (type === 'BUY') {
                    str += " ";
                }
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
                h3.innerHTML = str;
                transactionElem.append(h3);
                
                // Build the date
                var date = new Date(transaction.timestamp);
                var p = document.createElement('p');
                p.innerHTML = date;
                transactionElem.append(p);
                
                content.append(transactionElem);
            }
            
            sumDepositsElem.innerHTML = 'Total USD deposits: ' + deposits['USD'];
            totalUsdDeposited += deposits['USD'];
            sumWithdrawalsElem.innerHTML = 'Total USD withdrawals: ' + withdrawals['USD'];
            totalUsdDeposited -= withdrawals['USD'];
            
            var titleElem = document.createElement('h2');
            titleElem.innerHTML = "Transactions";
            
            var holderElem = document.getElementById(id + 'transactions');
            dropChildren(holderElem);
            holderElem.append(buildAccordion(titleElem, content));
        }
        
        document.getElementById('totalUsdDeposited').innerHTML = totalUsdDeposited;
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

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('nicknameModal').style.display = 'none';
};

/*
 * Helper methods
 */
 
function buildAccordion(titleElem, contentElem) {
    var accordion = document.createElement('div');
    accordion.className = 'accordionWrapper';
    
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
    accordion.append(titleElem);
    
    var contentWrapper = document.createElement('div');
    contentWrapper.append(contentElem);
    contentWrapper.classList.toggle('panel');
    accordion.append(contentWrapper);
    
    return accordion;
};