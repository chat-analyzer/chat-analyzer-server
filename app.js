const fs = require("fs");
const path = require("path");
const express = require("express");



let app = express();

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.use(express.static(path.join(__dirname + "/public")));

app.listen(80, function() {
	fs.writeFileSync("test.txt", "listening successful");
	console.log("chat-analyzer-server listening on port 80");
});
