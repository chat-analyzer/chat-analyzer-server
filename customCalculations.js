"use strict";

// var fs = require('fs');
// var path = require('path');

const CONVERSATION_START_THRESHOLD_HOURS = 3;

// let input = JSON.parse(fs.readFileSync(path.join(__dirname, 'testData.json'), 'utf8'));
exports.calculateStaticValues = function(input) {
    let names = [];
    // let processedNames = [];
    // this will be our final object
    let processed = {
        posts: 0,
        conversationStarts: 0,
        individualProperty:  []
    };
    input.forEach((msg, index) => {
        if(msg.author == "")
            return;
        if(names.indexOf(msg.author) == -1) {
            names.push(msg.author);
            processed.individualProperty[names.length-1] = {
                name: msg.author,
                posts: 0,
                conversationStarts: 0,
            };
        }
        let nameIndex =   names.indexOf(msg.author);  
        // get conversation starts
        if(index > 0 && ((input[index-1].timestamp + 1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS)  <= msg.timestamp)) {
            processed.individualProperty[nameIndex].conversationStarts++;
            processed.conversationStarts++;
        }

        processed.individualProperty[nameIndex].posts++;
        processed.posts++;
    });
    return processed;
};

// console.log(JSON.stringify(processed,null, 4));



/*let prototype = {"Sandesh":{
    numMsgs: 154,
    chatInits: 3
}};

console.log();*/