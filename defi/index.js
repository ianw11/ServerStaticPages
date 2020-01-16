var ENDPOINT = '/defiService/';

/*
https://community-development.makerdao.com/makerdao-mcd-faqs/faqs/liquidation
*/

const MINIMUM_DAI = 20;
const MINIMUM_COLLATERALIZATION_RATIO = 1.5;

const PRECISION = 6;

var outputDiv;

// HTML ELEMENTS
var inputStartingEth;
var inputPrice;
var inputPercent;
var inputMonths;
var inputLiquidationRatio;
var inputPercentageCut;
var inputNickname;

// USER-INPUT VALUES
var startingEth;
var currentPrice;
var interestPercent;
var durationYears;
var durationMonths;
var targetPrice;

var showLockup;
var showUnlock;
var liquidationRatio = 2.5;

var tradeFeePercentage = .99;

var nickname;


window.onload = () => {
    outputDiv = document.getElementById('output');

    inputStartingEth = initElement('inputStartingEth', (e) => startingEth = parseFloat(e.target.value));
    inputPrice = initElement('inputPrice', (e) => currentPrice = parseFloat(e.target.value));
    inputPercent = initElement('inputPercent', (e) => interestPercent = parseFloat(e.target.value));
    inputMonths = initElement('inputMonths', (e) => durationMonths = parseFloat(e.target.value));
    initElement('inputEndingPrice', (e) => targetPrice = parseFloat(e.target.value));

    initElement('showLockup', (e) => showLockup = e.target.checked);
    initElement('showUnlock', (e) => showUnlock = e.target.checked);

    const outputPercentage = document.getElementById('outputPercentage');
    inputLiquidationRatio = initElement('inputLiquidationRatio', (e) => {
        liquidationRatio = parseFloat(e.target.value) / 100;
        outputPercentage.innerHTML = `${fixed2(1 / liquidationRatio) * 100}`;
    });

    inputPercentageCut = initElement('inputPercentageCut',
        (e) => tradeFeePercentage = parseFloat(e.target.value) / 1000);

    inputNickname = initElement('inputNickname', (e) => nickname = e.target.value);

    notify();

    initSession();
};

const initElement = (tag, callback) => {
    const elem = document.getElementById(tag);
    callback({target: elem});
    elem.onchange = (e) => {
        callback(e);
        notify();
    }
    return elem;
};

const initSession = () => {
    const credentials = () => {
        const email = document.getElementById('inputEmail').value;
        const passwordElement = document.getElementById('inputPassword');
        const password = passwordElement.value;
        passwordElement.innerHTML = '';
        return JSON.stringify({email: email, password: password});
    }

    const deleteVault = (id) => {
        sendRequest('DELETE', 'vault', JSON.stringify({schemeId: id}), refreshSavedVaults);
    };

    const applyScheme = (scheme) => {
        const dispatch = (elem, val) => {
            elem.value = val;
            elem.dispatchEvent(new Event('change'));
        };

        const {interestPercent, months, notes, initialQuantity, tradeFee,
            entryPrice, liquidationFee, nickname, liquidationRatio, id} = scheme;

        dispatch(inputStartingEth, initialQuantity);
        dispatch(inputPrice, entryPrice);
        dispatch(inputPercent, interestPercent);
        dispatch(inputMonths, months);
        dispatch(inputLiquidationRatio, Math.round(liquidationRatio * 100));
        dispatch(inputPercentageCut, tradeFee * 1000.0);
        dispatch(inputNickname, nickname);

        notify();
    };

    const refreshSavedVaults = () => {
        const outputDiv = document.getElementById('outputSavedVaults');

        sendRequest('GET', 'vault', '', (success) => {
            dropChildren(outputDiv);

            const {schemes} = success.data;
            schemes.forEach((scheme) => {
                const {interestPercent, months, notes, initialQuantity, tradeFee,
                    entryPrice, liquidationFee, nickname, liquidationRatio, id} = scheme;

                const userDisplayLiquidationRatio = liquidationRatio * 100.0;
                const userDisplayTradeFee = tradeFee * 1000.0;

                const item = elem('div')
                    .id(id)
                    .className('vault')
                    .child(elem('h1').innerHTML(nickname).elem)
                    .child(elem('h2').innerHTML(`${initialQuantity}@${entryPrice}`).elem)
                    .child(elem('h3').innerHTML(`${interestPercent}% over ${months} months || Liquidation Ratio: ${fixed2(userDisplayLiquidationRatio)}% Trade Cut: ${userDisplayTradeFee}`).elem)
                    .child(elem('button').innerHTML('Apply').onclick(()=>applyScheme(scheme)).elem)
                    .child(elem('button').innerHTML('Delete').onclick(()=>deleteVault(id)).elem)
                    .appendTo(outputDiv);
            });
        }, (err) => {
            console.error(err);
        });
    };

    const loginCallback = (success) => {
        console.log(success);
        toggle(document.getElementById('login'));
        toggle(document.getElementById('signedIn'));
        refreshSavedVaults();
    }

    const loginErrorCallback = (err) => { console.error(err); }

    document.getElementById('buttonRegister').onclick = (e) => {
        sendRequest('POST', 'register', credentials(), loginCallback, loginErrorCallback);
    };

    document.getElementById('buttonLogin').onclick = (e) => {
        sendRequest('POST', 'login', credentials(), loginCallback, loginErrorCallback);
    };

    document.getElementById('buttonRefresh').onclick = refreshSavedVaults;

    document.getElementById('buttonSave').onclick = (e) => {
        const param = { scheme: {
            nickname: nickname,
            initialQuantity: startingEth,
            entryPrice: currentPrice,
            interestPercent: interestPercent,
            months: durationMonths,
            liquidationRatio: liquidationRatio,
            tradeFee: tradeFeePercentage,
        }};
        sendRequest('POST', 'vault', JSON.stringify(param), (success) => {
            refreshSavedVaults();
        }, (err) => {
            console.error(err);
        });
    };
}

const notify = () => {
    if (!startingEth || !currentPrice || !interestPercent || !durationMonths || !targetPrice || !liquidationRatio) {
        return;
    }

    while (outputDiv.firstChild) {
        outputDiv.removeChild(outputDiv.firstChild);
    }

    durationYears = durationMonths / 12;

    let ethAmount = startingEth;
    const stages = [];
    let ethSum = ethAmount;
    let totalDaiRepayment = 0;
    while (canReLeverage(ethAmount, currentPrice)) {
        const stageData = buildStage(ethAmount);
        ethAmount = stageData.eth;
        stages.push(stageData);

        ethSum += ethAmount;
        totalDaiRepayment += stageData.repayment;
    }

    insertHR(outputDiv);

    const midwayInformation = createH2();
    midwayInformation.innerHTML = `${fixed(ethSum)} ETH under control now || ${fixed(ethAmount)} ETH available to use`;
    outputDiv.append(midwayInformation);

    const midwayCloser = createH3();
    midwayCloser.innerHTML = `Total DAI repayment: ${fixed(totalDaiRepayment)}`;
    outputDiv.append(midwayCloser);

    insertHR(outputDiv);

    for (let i = stages.length - 1; i >= 0; --i) {
        const stageData = stages[i];
        ethAmount = unrollStage(stageData, ethAmount);
    }

    insertHR(outputDiv);

    buildResults(ethAmount);
}

const buildStage = (inputEth) => {
    const lockedEth = inputEth;

    const dai = Math.floor(inputEth * currentPrice / liquidationRatio);
    const outputEth = (dai / currentPrice) * tradeFeePercentage;

    const effectivePercentage = (interestPercent / 100.0) * durationYears;
    const interest = dai * effectivePercentage;

    const repayment = dai + interest;

    const liquidationPrice = ((1.0*dai) * MINIMUM_COLLATERALIZATION_RATIO)/lockedEth;

    if (showLockup) {
        const div = createDiv();
        
        const header = createH2();
        header.innerHTML = `${fixed(lockedEth)} ETH generates ${dai} DAI (${fixed(outputEth)} ETH)`
        div.append(header);

        const details = createH3();
        details.innerHTML = `Total repayment of ${fixed2(repayment)} DAI || Total interest: ${fixed2(interest)} DAI (${fixed2(effectivePercentage * 100.0)}% over ${fixed2(durationYears)} years) || Liquidation Price: $${fixed2(liquidationPrice)}`
        div.append(details);

        outputDiv.append(div);
    }

    return {
        lockedEth: lockedEth,
        eth: outputEth,
        dai: dai,
        effectivePercentage: effectivePercentage,
        interest: interest,
        repayment: repayment,
    };
}

const unrollStage = (stageData, ethAmount) => {
    const startingEthAmount = ethAmount;
    const {repayment, lockedEth} = stageData;
    const ethToLiquidate = (repayment / targetPrice) * (2 - tradeFeePercentage);
    if (ethToLiquidate > ethAmount) {
        throw Exception('Unable to liquidate');
    }
    ethAmount -= ethToLiquidate;
    ethAmount += lockedEth;

    if (showUnlock) {
        const div = createDiv();

        const header = createH2();
        header.innerHTML = `${fixed(ethToLiquidate)} ETH unlocks ${fixed(lockedEth)} ETH`;
        div.append(header);

        const details = createH3();
        details.innerHTML = `Equivalent to ${fixed2(repayment)} DAI to unlock || Starting ETH: ${fixed(startingEthAmount)} || Ending ETH: ${fixed(ethAmount)}`;
        div.append(details);

        outputDiv.append(div);
    }

    return ethAmount;
}

const buildResults = (ethAmount) => {
    const ethGained = ethAmount - startingEth;
    const ethPercent = (ethGained / startingEth) * 100.0;
    const annualizedPercent = ethPercent / durationYears;

    const usdGained = ethGained * targetPrice;
    const usdPerMonth = usdGained / durationMonths;

    const finalDiv = createDiv();

    const finalHeader = createH2();
    finalHeader.innerHTML = `At the end of the day, ${fixed(startingEth)} ETH is turned into ${fixed(ethAmount)} ETH`;
    finalDiv.append(finalHeader);

    const gainDetails = createH3();
    gainDetails.innerHTML = `${fixed(ethGained)} ETH gained (${fixed2(ethPercent)}% in ${durationMonths} months or ${fixed2(annualizedPercent)}% annualized) || $${fixed2(usdGained)} gained, or $${fixed2(usdPerMonth)} per month`;
    finalDiv.append(gainDetails);

    /*
    const finalDetails = createH3();
    finalDetails.innerHTML = `Assuming it took ${fixed2(durationYears)} years for ETH to reach ${targetPrice}, this means the total return is ${fixed2( (((ethAmount - startingEth)/startingEth)/durationYears)*100.0 )}%`;
    finalDiv.append(finalDetails);
    */

    outputDiv.append(finalDiv);
}

const insertHR = (parent) => parent.append(createHR());
const createHR = () => elem('hr').elem;

const createDiv = () => elem('div').elem;
const createH2 = () => elem('h2').elem;
const createH3 = () => elem('h3').elem;

const fixed = (num) => num.toFixed(PRECISION);
const fixed2 = (num) => num.toFixed(2);

const canReLeverage = (eth, price) => eth*price/liquidationRatio >= MINIMUM_DAI;
