const rp = require("request-promise-native");
const _ = require("lodash");



const CONVERSATION_START_THRESHOLD_HOURS = 3;

exports.calculateStaticValues = function(messages) {
    // this will be our final object
    let processed = {
        posts: 0,
        conversationStarts: 0,
        individualProperty:  []
    };
    let names = [];

    messages.forEach((msg, index) => {
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
        if(index > 0 && ((messages[index-1].timestamp + 1000 * 60 * 60 * CONVERSATION_START_THRESHOLD_HOURS)  <= msg.timestamp)) {
            processed.individualProperty[nameIndex].conversationStarts++;
            processed.conversationStarts++;
        }

        processed.individualProperty[nameIndex].posts++;
        processed.posts++;
    });
    return processed;
};

exports.calculateIntelligentValues = async function(messages) {
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
    for(let chunk of _.chunk(allDocuments, 100)) {
        let sentiments = await rp.post({
            url: "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment",
            json: { documents: allDocuments },
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "840286916667468a900a9d9907cd6cd1"
            }
        });
        allSentiments = allSentiments.concat(sentiments.documents.map(doc => ({ id: doc.id.split(","), score: doc.score })));
    }


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
    return allUsers.map((username, userIdx) => {
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
    });
};
