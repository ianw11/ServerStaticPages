/*
https://community-development.makerdao.com/makerdao-mcd-faqs/faqs/liquidation
*/

const MINIMUM_DAI = 20;
const MINIMUM_COLLATERALIZATION_RATIO = 1.5;

const PRECISION = 6;

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

var outputDiv;

window.onload = () => {
    outputDiv = document.getElementById('output');

    initElement('inputStartingEth', (e) => startingEth = parseFloat(e.target.value));
    initElement('inputPrice', (e) => currentPrice = parseFloat(e.target.value));
    initElement('inputPercent', (e) => interestPercent = parseFloat(e.target.value));
    initElement('inputMonths', (e) => durationMonths = parseFloat(e.target.value));
    initElement('inputEndingPrice', (e) => targetPrice = parseFloat(e.target.value));

    initElement('showLockup', (e) => showLockup = e.target.checked);
    initElement('showUnlock', (e) => showUnlock = e.target.checked);

    const outputPercentage = document.getElementById('outputPercentage');
    initElement('inputLiquidationRatio', (e) => {
        liquidationRatio = parseFloat(e.target.value) / 100;
        outputPercentage.innerHTML = `${fixed2(1 / liquidationRatio) * 100}`;
    });

    initElement('inputPercentageCut', (e) => tradeFeePercentage = parseFloat(e.target.value) / 1000);

    notify();
};

const initElement = (tag, callback) => {
    const elem = document.getElementById(tag);
    callback({target: elem});
    elem.onchange = (e) => {
        callback(e);
        notify();
    }
};

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
    while (canReLeverage(ethAmount, currentPrice)) {
        const stageData = buildStage(ethAmount);
        ethAmount = stageData.eth;
        stages.push(stageData);

        ethSum += ethAmount;
    }

    insertHR(outputDiv);

    const midwayInformation = createH2();
    midwayInformation.innerHTML = `${fixed(ethSum)} ETH under control now || ${fixed(ethAmount)} ETH available to use<br/><br/>Next steps are to unlock ETH when target price is hit`;
    outputDiv.append(midwayInformation);

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
    const ethToLiquidate = repayment / targetPrice;
    if (ethToLiquidate > ethAmount) {
        throw new Exception('Unable to liquidate');
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

    const usdGained = ethGained * targetPrice;
    const usdPerMonth = usdGained / durationMonths;

    const finalDiv = createDiv();

    const finalHeader = createH2();
    finalHeader.innerHTML = `At the end of the day, ${fixed(startingEth)} ETH is turned into ${fixed(ethAmount)} ETH`;
    finalDiv.append(finalHeader);

    const gainDetails = createH3();
    gainDetails.innerHTML = `${fixed(ethGained)} ETH gained (${fixed2(ethPercent)}% in ${durationMonths} months) || $${fixed2(usdGained)} gained, or $${fixed2(usdPerMonth)} per month`;
    finalDiv.append(gainDetails);

    /*
    const finalDetails = createH3();
    finalDetails.innerHTML = `Assuming it took ${fixed2(durationYears)} years for ETH to reach ${targetPrice}, this means the total return is ${fixed2( (((ethAmount - startingEth)/startingEth)/durationYears)*100.0 )}%`;
    finalDiv.append(finalDetails);
    */

    outputDiv.append(finalDiv);
}

const insertHR = (parent) => parent.append(createHR());
const createHR = () => elem('hr');

const createDiv = (styleClass) => elem('div', styleClass);
const createH2 = (styleClass) => elem('h2', styleClass);
const createH3 = (styleClass) => elem('h3', styleClass);
const elem = (tag, styleClass = null) => {
    const e = document.createElement(tag);
    if (styleClass) {
        e.classList.add(styleClass);
    }
    return e;
}

const fixed = (num) => num.toFixed(PRECISION);
const fixed2 = (num) => num.toFixed(2);

const canReLeverage = (eth, price) => eth*price/liquidationRatio >= MINIMUM_DAI;
