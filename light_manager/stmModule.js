var stmModule = function(howOftenToUpdate){
	var metroStatus = {};
	var lastUpdate = new Date();
};

var request = require('request');
var cheerio = require('cheerio');


stmModule.prototype.pullMetroStatus = function(){
	request.get("http://www.stm.info/en/info/networks/metro", function (a, b, c) {
		var metroStatus = {};
		// console.log(b);
		var parser = cheerio.load(b.body, {normalizeWhitespace: true});
		var nodes = parser("aside#aside-sidebar div#status-services div.line div.block");

		// console.log(nodes);

		nodes.each(function (a, el) {
			line = parser(this).find('h2').text().replace(" line", "").toLowerCase();
			status = parser(this).find('p').text();

			if (/^Normal/i.test(status)) {
				status = "OK";
			}

			metroStatus[line] = status;
		})

		this.metroStatus = metroStatus;
		this.lastUpdate = new Date();
}

stmModule.prototype.getMetroStatus = function() {

}

module.exports = new stmModule();

