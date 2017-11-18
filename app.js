const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const customCalculations = require("./customCalculations.js");



let app = express();

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname, "/public/index.html"));
});



function guidGenerator() {		//from https://stackoverflow.com/a/6860916
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+S4()+S4());
}

function reqBodyDebug(reqBody) {
	if(reqBody.debug  &&  reqBody.chat == undefined)
		reqBody.chat = fs.readFileSync(path.join(__dirname, "./public/unit_tests/test.txt"), "utf8");
}

let actionHandlers = {};
actionHandlers.parseChat = (reqBody, dontJSONStringify) => {
	return new Promise((resolve, reject) => {
		reqBodyDebug(reqBody);
		var messagesRaw = reqBody.chat.split(/\n(?=\d\d\.\d\d\.\d\d, \d\d:\d\d - )/);
		
		let messagesParsed = messagesRaw.map(m => {
			if(m == "") return;
			
			let idx = m.indexOf(" - ");
			if(idx == -1) return;
			let msgAll = m.substr(idx + 3);
			let totalDate = m.substr(0, idx);
			let msgIdx = msgAll.indexOf(": ");
			if(msgIdx == -1) return;
			let author = msgAll.substr(0, msgIdx);
			let msg = msgAll.substr(msgIdx + 2);
			
			if(totalDate == undefined) return;
			let [date, time] = totalDate.split(", ");
			if(date == undefined  ||  time == undefined) return;
			let [day, month, year] = date.split(".").map(a => parseInt(a));
			let [hour, minute] = time.split(":").map(a => parseInt(a));
			let timestamp = new Date(year+2000, month-1, day, hour, minute, 0, 0);
			return { timestamp: +timestamp, author: author, text: msg };
		}).filter(Boolean);
	
		if(dontJSONStringify)
			resolve(messagesParsed);
		resolve(JSON.stringify(messagesParsed, null, 4));
	});
};

actionHandlers.calculateStaticValues = reqBody => {
	return new Promise((resolve, reject) => {
		actionHandlers.parseChat(reqBody, true).then(parsedChat => {
			return customCalculations.calculateStaticValues(parsedChat);
		}).then(staticValues => {
			resolve(JSON.stringify(staticValues, null, 4));
		});
	});
};

actionHandlers.calculateIntelligentValues = reqBody => {
	return new Promise((resolve, reject) => {
		actionHandlers.parseChat(reqBody, true).then(parsedChat => {
			return customCalculations.calculateIntelligentValues(parsedChat);
		}).then(intelligentValues => {
			resolve(JSON.stringify(intelligentValues, null, 4));
		});
	});
};

actionHandlers.registerChat = reqBody => {
	return new Promise((resolve, reject) => {
		let allChats = [];
		try {
			allChats = JSON.parse(fs.readFileSync(path.join(__dirname, "/public/chats.json"), "utf8"));
		}
		catch(e) {}
		let chatIds = allChats.map(c => c.id);
		let newChatId;
		while(chatIds.indexOf(newChatId = guidGenerator()) != -1) {}
		allChats.push({ id: newChatId, chat: reqBody.chat });
		fs.writeFileSync(path.join(__dirname, "/public/chats.json"), JSON.stringify(allChats), "utf8");
		resolve(`http://chat-analyzer-server.azurewebsites.net/chat.html?id=${newChatId}`);
	});
};



app.use(bodyParser.urlencoded({ extended: true }));
app.post("/api", async function(req, res) {
	if(actionHandlers[req.body.action] != undefined)
		actionHandlers[req.body.action](req.body).then(resStr => res.send(resStr==undefined ? "" : resStr));
});

app.use(express.static(path.join(__dirname + "/public")));

app.listen(process.env.PORT || 8080, function() {
	console.log("chat-analyzer-server now listening");
});
