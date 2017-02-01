var LightPrograms = require(__dirname + '/light_programs.js');

function CommandLineInterpreter(){
	this.start = function(){
		console.log('Command Line Interpreter: up and running!');
		var stdin = process.openStdin();
		var programs = new LightPrograms();

		stdin.addListener("data", function(d) {
			var programName = d.toString().trim();

			if(!programName){
				return ;
			}
			// console.log("running program ", programName);
			programs.runProgram(programName);
		});
	}
}
module.exports = CommandLineInterpreter;
