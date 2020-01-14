const MINIMUM_DAI = 20;

const PRECISION = 6;

var startingEth;
var currentPrice;
var interestPercent;
var durationYears;
var durationMonths;
var targetPrice;

var showLockup;
var showUnlock;
var productionRatio = .44;

var outputDiv;

window.onload = () => {
    outputDiv = document.getElementById('output');

    const inputStartingEth = document.getElementById('inputStartingEth');
    startingEth = parseFloat(inputStartingEth.value);
    inputStartingEth.onchange = (e) => {
        startingEth = parseFloat(e.target.value);
        notify();
    }

    const inputPrice = document.getElementById('inputPrice');
    currentPrice = parseFloat(inputPrice.value);
    inputPrice.onchange = (e) => {
        currentPrice = parseFloat(e.target.value);
        notify();
    }

    const inputPercent = document.getElementById('inputPercent');
    interestPercent = parseFloat(inputPercent.value);
    inputPercent.onchange = (e) => {
        interestPercent = parseFloat(e.target.value);
        notify();
    }

    const inputMonths = document.getElementById('inputMonths');
    durationMonths = parseFloat(inputMonths.value);
    inputMonths.onchange = (e) => {
        durationMonths = parseFloat(e.target.value);
        notify();
    }

    const inputEndingPrice = document.getElementById('inputEndingPrice');
    targetPrice = parseFloat(inputEndingPrice.value);
    inputEndingPrice.onchange = (e) => {
        targetPrice = parseFloat(e.target.value);
        notify();
    }

    document.getElementById('showLockup').onchange = (e) => {
        showLockup = e.target.checked;
        notify();
    }

    document.getElementById('showUnlock').onchange = (e) => {
        showUnlock = e.target.checked;
        notify();
    }

    const inputProductionRatio = document.getElementById('inputProductionRatio');
    inputProductionRatio.onchange = (e) => {
        productionRatio = parseFloat(e.target.value) / 100;
        notify();
    }

    notify();
};

const notify = () => {
    if (!startingEth || !currentPrice || !interestPercent || !durationMonths || !targetPrice || !productionRatio) {
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
    const dai = Math.floor(inputEth * currentPrice * productionRatio);
    const outputEth = dai / currentPrice;

    const effectivePercentage = (interestPercent / 100.0) * durationYears;
    const interest = dai * effectivePercentage;

    const repayment = dai + interest;


    if (showLockup) {
        const div = createDiv();
        
        const header = createH2();
        header.innerHTML = `${fixed(inputEth)} ETH generates ${dai} DAI (${fixed(outputEth)} ETH)`
        div.append(header);

        const details = createH3();
        details.innerHTML = `Total repayment of ${fixed(repayment)} DAI || Total interest: ${fixed(interest)} DAI (${fixed(effectivePercentage * 100.0)}% over ${fixed(durationYears)} years)`
        div.append(details);

        outputDiv.append(div);
    }

    return {
        lockedEth: inputEth,
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
        details.innerHTML = `Equivalent to ${fixed(repayment)} DAI to unlock || Starting ETH: ${fixed(startingEthAmount)} || Ending ETH: ${fixed(ethAmount)}`;
        div.append(details);

        outputDiv.append(div);
    }

    return ethAmount;
}

const buildResults = (ethAmount) => {
    const ethGained = ethAmount - startingEth;
    const usdGained = ethGained * targetPrice;
    const usdPerMonth = usdGained / durationMonths;

    const finalDiv = createDiv();

    const finalHeader = createH2();
    finalHeader.innerHTML = `At the end of the day, ${fixed(startingEth)} ETH is turned into ${fixed(ethAmount)} ETH`;
    finalDiv.append(finalHeader);

    const gainDetails = createH3();
    gainDetails.innerHTML = `${fixed(ethGained)} ETH gained || ${fixed(usdGained)} USD gained or ${fixed(usdPerMonth)} per month`;
    finalDiv.append(gainDetails);

    const finalDetails = createH3();
    finalDetails.innerHTML = `Assuming it took ${fixed(durationYears)} years for ETH to reach ${targetPrice}, this means the total return is ${fixed( (((ethAmount - startingEth)/startingEth)/durationYears)*100.0 )}%`;
    finalDiv.append(finalDetails);

    outputDiv.append(finalDiv);
}

const insertHR = (parent) => parent.append(createHR());

const createHR = () => document.createElement('hr');

const createDiv = () => document.createElement('div');

const createH2 = () => document.createElement('h2');

const createH3 = () => document.createElement('h3');

const fixed = (num) => num.toFixed(PRECISION);

const canReLeverage = (eth, price) => eth*price*productionRatio >= MINIMUM_DAI;
