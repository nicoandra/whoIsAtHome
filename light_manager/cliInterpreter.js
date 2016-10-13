LightPrograms = require("./lightPrograms.js")

/**
 Command line interpreter (?) This is not really a CLI, but a terminal mode. You can type program names in the running server
 as a console. try typing "all lights off" or "all lights 255 0 0"
 **/
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
            programs.runProgram(programName);
        });
    }
}
module.exports = CommandLineInterpreter;