const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
//const customCalculations = require("./customCalculations.js");



let app = express();

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname + "/public/index.html"));
});



let actionHandlers = {
	parseChat: reqBody => {
		var messagesRaw = reqBody.chats.split(/\n(?=\d\d\.\d\d\.\d\d, \d\d:\d\d - )/);
		
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
			return { timestamp: +timestamp, author: author, msg: msg };
		}).filter(Boolean);

		return JSON.stringify(messagesParsed, null, 4);
	}
};



app.use(bodyParser.urlencoded({ extended: true }));
app.post("/api", function(req, res) {
	let resStr;
	if(actionHandlers[req.body.action] != undefined)
		resStr = actionHandlers[req.body.action](req.body);
	res.send(resStr==undefined ? "" : resStr);
});

app.use(express.static(path.join(__dirname + "/public")));

app.listen(process.env.PORT || 8080, function() {
	console.log("chat-analyzer-server now listening");
});
