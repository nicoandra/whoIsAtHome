var stmModule = function(){};

var request = require('request');
var cheerio = require('cheerio');

stmModule.prototype.getMetroStatus = function(callback) {
	request.get("http://www.stm.info/en/info/networks/metro", function (a, b, c) {

		var metroStatus = {};

		// console.log(b);
		parser = cheerio.load(b.body, {normalizeWhitespace: true});
		delete b;
		nodes = parser("aside#aside-sidebar div#status-services div.line div.block");

		// console.log(nodes);

		nodes.each(function (a, el) {
			line = parser(this).find('h2').text().replace(" line", "").toLowerCase();
			status = parser(this).find('p').text();

			if (/^Normal/i.test(status)) {
				status = "OK";
			}

			metroStatus[line] = status;
			callback(status);
		})

		callback(metroStatus)
	})
}

module.exports = new stmModule();

