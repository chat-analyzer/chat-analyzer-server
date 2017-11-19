const rp = require("request-promise-native");
const _ = require("lodash");

var activityTime = require("./activityTime.js");

const responseTimes = require('./responseTime.js')


const CONVERSATION_START_THRESHOLD_HOURS = 3;
exports.CONVERSATION_START_THRESHOLD_HOURS = CONVERSATION_START_THRESHOLD_HOURS;

function getResponseTimes(users) {
    var convStartIndices = [0];

    messages.forEach( (msg, i) => {
        if (i > 0) {
            var currentMillis = msg.timestamp;
            var lastMillis = messages[i-1].timestamp;

            if ( (currentMillis - lastMillis) >=
                    1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS) {
                
                convStartIndices.push(i);
            }
        }
    });

    var result = [];

    users.forEach(user => {   //put a default user object into result for all users
        result.push({
            'name': user.name,
            'responses': 0,
            'notResponded': 0,
            'started': 0,
            'responseTimes': 0  // sum of all the response times (in seconds)
        });
    });

    convStartIndices.forEach((startMsgIndex, convIndex) => {  // loop over conversations
        var convStartMillis = messages[startMsgIndex].timestamp;
        var startUserName = messages[startMsgIndex].author;

        // loop over messages of the conversation
        for (let i = startMsgIndex; i < convStartIndices[convIndex + 1] 
                || convIndex + 1 == convStartIndices.length; i++) {
            
            if (i >= messages.length) {
                break;
            }
            let msg = messages[i];
            let uname = msg.author;
            let msgMillis  = msg.timestamp;
            
            let userResult = result.find(elem => elem.name == uname);
            if (userResult == undefined) {
                continue;
            }
            if (convIndex + 1 > userResult.responses + userResult.started + userResult.notResponded) {
                if (uname == startUserName) {
                    userResult.started += 1;
                    continue;
                }
                userResult.responses += 1;
                userResult.responseTimes += msgMillis - convStartMillis;
            }    
        }
        result.forEach(userResult => {
            if (convIndex + 1 > userResult.responses + userResult.started + userResult.notResponded) {
                userResult.notResponded += 1;
            }
        });
    });

    return result;
}

exports.calculateStaticValues = function(messages) {
    return new Promise((resolve, reject) => {
        // this will be our final object
        let processed = {
            posts: 0,
            conversationStarts: 0,
            users:  []
        };

        let names = [];
    

        let startOfConversationIndexArray = [];
        let isFirstElement = true; // the first element in the chat is always a start of conversation
        messages.forEach((msg, index) => {
            if(msg.author == "")  {
                return;
            }

            if(names.indexOf(msg.author) == -1) {
                names.push(msg.author);
                processed.users.push({
                    name: msg.author,
                    posts: 0,
                    conversationStarts: 0
                });
            }
            let nameIndex =   names.indexOf(msg.author);  
            let personResponseObject = processed.users[nameIndex].responseObject; // we'll use this object a lot 
            // if the new message is more than CONVERSATION_START_THRESHOLD_HOURS ahead of the old one
            // we'll define this message as a start of conversation
            if(isFirstElement === true || (messages[index-1].timestamp + 1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS)  <= msg.timestamp) {
                processed.users[nameIndex].conversationStarts++; // conversationStart per person
            
                startOfConversationIndexArray.push(index); // we need the timestamp of the conversions in another function
            
                processed.conversationStarts++;
                isFirstElement = false;
            }         

            processed.users[nameIndex].posts++;
            processed.posts++;
        });

        //console.log(JSON.stringify(startOfConversationIndexArray));
        //pseudo call
        // getResponseTimeDataFromMarvin(processed.users, startOfConversationIndexArray);
        
        processed.users.forEach((element, index) => {
            // userMessages.name = element.individualProperty[index].name;
            //console.log(JSON.stringify(element));
            let filteredArray = messages.filter(msgObject => {
                if (msgObject.author === element.name) {
                    return true;
                } else {
                    return false;
                } 
            });
            element.msgArray = filteredArray.map(msg => {
                return {timestamp: msg.timestamp};
            }); // we only need our timestamp
            
            element.msgArray = activityTime.getActivityOverTime(element.msgArray);
            // console.log(JSON.stringify(element, null, 2));
        });

        let responseTimes = getResponseTimes(processed.users);
        responseTimes.forEach(currRespTimes => {
            processed.users.find(iProp => iProp.name == currRespTimes.name).responseInfo = {
                responses: currRespTimes.responses,
                notResponded: currRespTimes.notResponded,
                started: currRespTimes.started,
                responseTimes: currRespTimes.responseTimes,
                averageResponseTime: Math.round(currRespTimes.responseTimes / (currRespTimes.responses+currRespTimes.notResponded+currRespTimes.started))
            };
        });

        resolve(processed);
    });
};

exports.calculateIntelligentValues = function(messages) {
    return new Promise((resolve, reject) => {
        //group messages into conversations with specified threshold in between
        let allUsers = [];
        let conversations = [];
        messages.forEach((m, i) => {
            if(allUsers.indexOf(m.author) == -1)
                allUsers.push(m.author);

            lastMsgTimestamp = i==0 ? 0 : messages[i-1].timestamp;
            if(m.timestamp-lastMsgTimestamp >= CONVERSATION_START_THRESHOLD_HOURS*1000*60*60)
                conversations.push([]);
            conversations[conversations.length - 1].push(m);
        });

        //generate documents from conversations
        let allDocuments = [];
        conversations.forEach((c, cIndex) => {
            let currUsers = [];
            let userMessages = [];
            c.forEach(msg => {				//get list of all users of current conversation and group messages by user
                if(currUsers.indexOf(msg.author) == -1) {
                    currUsers.push(msg.author);
                    userMessages.push([]);
                }
                userMessages[currUsers.indexOf(msg.author)].push(msg);
            });

            //concatenate user messages into chunks of maximum 500 characters and generate documents out of it
            userMessages.forEach((currUserMsgs, currUserMsgsIndex) => {
                let currUserMsgsStrs = currUserMsgs.map(msg => msg.text);
                let currDocumentText = "";
                let currUserDocumentIndex = 0;
                currUserMsgsStrs.forEach((currUserMsgStr, currUserMsgStrIndex) => {
                    currDocumentText += currUserMsgStr + "\n";
                    if(currDocumentText.length >= 500  ||  currUserMsgStrIndex == currUserMsgsStrs.length-1) {
                        allDocuments.push({
                            language: "de",
                            id: cIndex + "," + allUsers.indexOf(currUsers[currUserMsgsIndex]) + "," + currUserDocumentIndex,
                            text: currDocumentText
                        });
                        currDocumentText = "";
                        currUserDocumentIndex++;
                    }
                });
            });
        });


        //send documents in chunks to server
        let allSentiments = [];
        let promises = [];
        for(let chunk of _.chunk(allDocuments, 100)) {
            promises.push(rp.post({
                url: "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment",
                json: { documents: allDocuments },
                headers: {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": "840286916667468a900a9d9907cd6cd1"
                }
            }));
        }
        Promise.all(promises).then(allSentimentsChunks =>
            allSentimentsChunks.forEach(sentiments => allSentiments = allSentiments.concat(sentiments.documents.map(doc => ({ id: doc.id.split(","), score: doc.score }))))
        ).then(() => {
            //remerge split user conversations
            for(let i = 0; i < allSentiments.length; i++) {
                let sentimentId = allSentiments[i].id;
                let sentimentScore = allSentiments[i].score, sentimentScoreNum = 1;
                for(let j = i+1; j < allSentiments.length; j++) {
                    if(allSentiments[i].id.slice(0, 2) == allSentiments[j].id.slice(0, 2)) {
                        sentimentScore += allSentiments.splice(j, 1)[0].score;
                        sentimentNumScore++;
                        j--;
                    }
                }
                allSentiments[i].score = sentimentScore / sentimentScoreNum;
            }


            //get result, which includes scores for individual conversations and the averaged score of each user
            resolve(allUsers.map((username, userIdx) => {
                let thisUsersSentiments = allSentiments.filter(sentiment => sentiment.id[1] == userIdx);
                let sentimentConversations = thisUsersSentiments.map(sentiment => ({
                    conversationStart: conversations[sentiment.id[0]][0].timestamp,
                    score: sentiment.score
                }));
                let averagedSentiments = thisUsersSentiments.map(sentiment => sentiment.score).reduce((sum, value) => sum + value, 0) / thisUsersSentiments.length;
                return {
                    user: username,
                    conversations: sentimentConversations,
                    average: averagedSentiments
                };
            }));
        });
    });
};
