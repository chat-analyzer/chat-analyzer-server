messages = require('./convert_raw_data/txtConverter')
const CONVERSATION_START_THRESHOLD_HOURS = require('./customCalculations.js')
                                            .CONVERSATION_START_THRESHOLD_HOURS

var convStartIndices = [0]
var users = []
messages.forEach( (msg, i) => {
    if (i > 0) {
        var currentMillis = msg.timestamp
        var lastMillis = messages[i-1].timestamp

        let diff = currentMillis - lastMillis;

        if ( (currentMillis - lastMillis) >=
                1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS) {
            
            convStartIndices.push(i)
        }
    }
});

users = [{'name': 'Sandesh'}, {'name': 'Marvin Heinzelmann'},
            {'name': 'Daniel'}, {'name': 'Alina Weber'}]
let result = []
users.forEach(user => {   //put a default user object into result for all users
    result.push({
        'name': user.name,
        'responses': 0,
        'notResponded': 0,
        'started': 0,
        'responseTimes': 0  // sum of all the response times (in seconds)
    })
})

convStartIndices.forEach((conversationStartMsgIndex, convIndex) => {  // loop over conversations
    let responsesHappened = []    
    var convStartMillis = messages[conversationStartMsgIndex].timestamp
    var startUserName = messages[conversationStartMsgIndex].author
    // author has participated
    responsesHappened.push(startUserName)
    let userResult = result.find(element => {
        return element.name == startUserName;
    });  
    userResult.started++;

    // loop over messages of the conversation
    for (let currentMsgIndex = conversationStartMsgIndex + 1; currentMsgIndex < convStartIndices[convIndex + 1]; currentMsgIndex++) {
        let msg = messages[currentMsgIndex]
        let uname = msg.author
        let msgMillis  = msg.timestamp
        // if the user hasn't replied yet, we'll increment it's values and push it to our responseArray
        if (responsesHappened.indexOf(uname) == -1) {
            let userResult = result.find(element => {
                return element.name == uname;
            });  
            responsesHappened.push(uname);
            userResult.responses++;
            userResult.responseTimes += messages[currentMsgIndex].timestamp - convStartMillis;
        }
        
    }
    users.forEach(user => {
        if (responsesHappened.indexOf(user.name) == -1) {
            let userResult = result.find(element => {
                return element.name == user.name;
            });            
            userResult.notResponded++;
        }

    });          

})



console.log(JSON.stringify(result, null, 2));