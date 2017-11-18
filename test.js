"use strict";
var fs = require('fs');
var path = require('path');

var calc = require("./customCalculations.js");
var activityTime = require("./activityTime.js");
// const CONVERSATION_START_THRESHOLD_HOURS = 3;

let input = JSON.parse(fs.readFileSync(path.join(__dirname, 'testData.json'), 'utf8'));

// console.log(calc.calculateStaticValues(input));
/*prototype: [
    {
        name: String,
        msgArray: [{
            timestamp: 
            author: String      //optional
            msg: String         //optional
        }]
    }
]
*/
let userObject = calc.calculateStaticValues(input);
// let userMessages = [];
// userObject.individualProperty.forEach((element, index) => {
//     // userMessages.name = element.individualProperty[index].name;
//     // console.log(JSON.stringify(element));
//     let filteredArray = input.filter(msgObject => {
//         if (msgObject.author === element.name) {
//             return true;
//         } else {
//             return false;
//         } 
//     });
//     element.msgArray = filteredArray.map(msg => {
//         return {timestamp: msg.timestamp};
//     }); // we only need our timestamp
    
//     element.msgArray = activityTime.getActivityOverTime(element.msgArray);
//     // console.log(JSON.stringify(element, null, 2));
    
    
// });


// console.log(JSON.stringify(activityTime.getActivityOverTime(userObject.individualProperty[0].msgArray), null, 2));

console.log(JSON.stringify(userObject, null, 2));