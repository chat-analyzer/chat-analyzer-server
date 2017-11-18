"use strict";
var fs = require('fs');
var path = require('path');

var calc = require("./customCalculations.js");
// const CONVERSATION_START_THRESHOLD_HOURS = 3;

let input = JSON.parse(fs.readFileSync(path.join(__dirname, 'testData.json'), 'utf8'));

console.log(calc.calculateStaticValues(input));