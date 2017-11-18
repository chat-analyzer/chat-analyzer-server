const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");



let app = express();

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname, "/public/index.html"));
});



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + "/public")));

app.listen(process.env.PORT, function() {
	console.log("chat-analyzer-server now listening");
});
