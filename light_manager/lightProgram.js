
var crypto = require("crypto");

function LightProgram(name, id){
    // A program has the following properties

    this.hash = function(string){
        return crypto.createHash("md5").update(string.toLowerCase().trim()).digest("hex");
    }

    this.displayName = name.trim();
    this.id = this.hash(this.displayName);

    // A program can have either subprograms or status to apply.
    this.childPrograms = [];
    this.statusToApply = [];


    this.addChildProgram = function(lightProgram){
        lightProgram.id = this.hash([this.id, lightProgram.id].join('-'));
        this.childPrograms.push(lightProgram);
        this.statusToApply = [];
    }

    this.addStatus = function(status){
        this.childPrograms = [];

        if(typeof status == "Array"){
            // If an array is passed, add them individually
            status.forEach(function(statusToAdd){
                this.addStatus(statusToAdd);
            }.bind(this))

        } else {
            // If it's an object, add it straight
            this.statusToApply.push(status);
        }
    }


}
module.exports = LightProgram;