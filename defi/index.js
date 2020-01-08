const DAI_PRODUCTION_RATIO = .44;
const MINIMUM_DAI = 20;

const PRECISION = 6;

var startingEth;
var currentPrice;
var interestPercent;
var durationYears;
var targetPrice;

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
    durationYears = parseFloat(inputMonths.value) / 12;
    inputMonths.onchange = (e) => {
        durationYears = parseFloat(e.target.value) / 12;
        notify();
    }

    const inputEndingPrice = document.getElementById('inputEndingPrice');
    targetPrice = parseFloat(inputEndingPrice.value);
    inputEndingPrice.onchange = (e) => {
        targetPrice = parseFloat(e.target.value);
        notify();
    }

    notify();
};

const notify = () => {
    if (!startingEth || !currentPrice || !interestPercent || !durationYears || ! targetPrice) {
        return;
    }

    while (outputDiv.firstChild) {
        outputDiv.removeChild(outputDiv.firstChild);
    }

    let ethAmount = startingEth;
    const stages = [];
    while (canReLeverage(ethAmount, currentPrice)) {
        const stageData = buildStage(ethAmount);
        ethAmount = stageData.eth;
        stages.push(stageData);
    }

    outputDiv.append(document.createElement('hr'));

    for (let i = stages.length - 1; i >= 0; --i) {
        const stageData = stages[i];
        ethAmount = unrollStage(stageData, ethAmount);
    }

    outputDiv.append(document.createElement('hr'));

    const finalDiv = document.createElement('div');
    const finalHeader = document.createElement('h2');
    finalHeader.innerHTML = `At the end of the day, ${fixed(startingEth)} ETH is turned into ${fixed(ethAmount)} ETH`;
    finalDiv.append(finalHeader);
    const finalDetails = document.createElement('h3');
    finalDetails.innerHTML = `Assuming it took ${durationYears} years for ETH to reach ${targetPrice}, this means the total return is ${fixed( (((ethAmount - startingEth)/startingEth)/durationYears)*100.0 )}%`;
    finalDiv.append(finalDetails);
    outputDiv.append(finalDiv);
}

const buildStage = (inputEth) => {
    const dai = inputEth * currentPrice * DAI_PRODUCTION_RATIO;
    const outputEth = dai / currentPrice;

    const effectivePercentage = (interestPercent / 100.0) * durationYears;
    const interest = dai * effectivePercentage;

    const repayment = dai + interest;


    const div = document.createElement('div');
    
    const header = document.createElement('h2');
    header.innerHTML = `${inputEth} ETH generates ${dai} DAI aka ${outputEth} ETH`
    div.append(header);

    const details = document.createElement('h3');
    details.innerHTML = `At ${effectivePercentage * 100.0}% over ${durationYears} years, total interest is: ${interest} for a repayment of ${repayment} DAI`
    div.append(details);

    outputDiv.append(div);

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

    const div = document.createElement('div');

    const header = document.createElement('h2');
    header.innerHTML = `${fixed(ethToLiquidate)} ETH (${fixed(repayment)} DAI) is taken from ${fixed(startingEthAmount)} to UNLOCK ${fixed(lockedEth)} bringing the TOTAL TO ${fixed(ethAmount)} ETH`;
    div.append(header);

    outputDiv.append(div);

    return ethAmount;
}

const fixed = (num) => num.toFixed(PRECISION);

const canReLeverage = (eth, price) => eth*price*DAI_PRODUCTION_RATIO >= MINIMUM_DAI;
