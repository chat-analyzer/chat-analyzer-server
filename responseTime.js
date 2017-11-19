messages = require('./convert_raw_data/txtConverter')
const CONVERSATION_START_THRESHOLD_HOURS = require('./customCalculations.js')
                                            .CONVERSATION_START_THRESHOLD_HOURS

exports = function(users) { 
    var convStartIndices = [0]

    messages.forEach( (msg, i) => {
        if (i > 0) {
            var currentMillis = msg.timestamp
            var lastMillis = messages[i-1].timestamp

            if ( (currentMillis - lastMillis) >=
                    1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS) {
                
                convStartIndices.push(i)
            }
        }
    });

    var result = []

    users.forEach(user => {   //put a default user object into result for all users
        result.push({
            'name': user.name,
            'responses': 0,
            'notResponded': 0,
            'started': 0,
            'responseTimes': 0  // sum of all the response times (in seconds)
        })
    });

    convStartIndices.forEach((startMsgIndex, convIndex) => {  // loop over conversations
        var convStartMillis = messages[startMsgIndex].timestamp
        var startUserName = messages[startMsgIndex].author

        // loop over messages of the conversation
        for (let i = startMsgIndex; i < convStartIndices[convIndex + 1] 
                || convIndex + 1 == convStartIndices.length; i++) {
            
            if (i >= messages.length) {
                break
            }
            let msg = messages[i]
            let uname = msg.author
            let msgMillis  = msg.timestamp
            
            let userResult = result.find(elem => elem.name == uname)
            if (userResult == undefined) {
                continue
            }
            if (convIndex + 1 > userResult.responses + userResult.started + userResult.notResponded) {
                if (uname == startUserName) {
                    userResult.started += 1
                    continue
                }
                userResult.responses += 1
                userResult.responseTimes += msgMillis - convStartMillis
            }    
        }
        result.forEach(userResult => {
            if (convIndex + 1 > userResult.responses + userResult.started + userResult.notResponded) {
                userResult.notResponded += 1
            }
        })
    })

    return result
}
