var DEBUG = false;

function eightDecimalPlaces(flt) {
    return decimalPlaces(flt, 8);
};

function decimalPlaces(flt, numPlaces) {
    return parseFloat(flt).toFixed(numPlaces);
};

function dropChildren(elem) {
	while (elem.firstChild) {
		elem.removeChild(elem.firstChild);
	}
};

function sendRequest(method, url, body, successCallback, failCallback) {
    updateStatus("Sending request...");
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (DEBUG) {
                console.log("Response status: " + this.status);
                console.log(this.responseText);
            }
            if (this.status == 200) {
                var obj = JSON.parse(this.responseText);
                accessToken = obj.access_token;
                if (successCallback != undefined) {
                    successCallback(obj);
                }
                updateStatus("SUCCESS");
            } else {
                accessToken = '';
                updateStatus("ERROR: " + this.responseText);
                if (failCallback != undefined) {
                    try {
                        failCallback(JSON.parse(this.responseText));
                    } catch (e) {
                        failCallback();
                    }
                }
            }
        }
    }
    if (DEBUG) {
        console.log("Making " + method +" request to: " + ENDPOINT + url);
        console.log(body);
        //console.log('access token: ' + accessToken);
    }
    xmlhttp.open(method, ENDPOINT + url, true);
    //xmlhttp.setRequestHeader("access_token", accessToken);
    xmlhttp.send(body !== undefined ? body : "");
};

function updateStatus(message) {
    var statusElem = document.getElementById('status');
    if (statusElem !== undefined && statusElem !== null) {
        statusElem.innerHTML = message;
    }
    /*
    var sessionStatus = document.getElementById('sessionStatus');
    if (accessToken === '') {
        sessionStatus.innerHTML = "Not logged in";
        sessionStatus.className = "red";
    } else {
        sessionStatus.innerHTML = "Logged in";
        sessionStatus.className = "green";
    }
    */
};

function show(elem) {
    elem.style.display = 'block';
};

function hide(elem) {
    elem.style.display = 'none';
};
