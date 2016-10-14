function LightStatus(){

    this.onOff = null;
    this.color = null;
    this.brightness = null;

    this.getObject = function(){
        result = new Object;

        Object.keys(this).forEach(function(attribute, index){
            // Remove functions of the current object
            if(typeof this[attribute] == "Function" || typeof this[attribute] == "function") {
                return false;
            }

            // Remove nulled attributes
            if (this[attribute] == null){
                return false;
            }

            // Return the new built object
            result[attribute] = this[attribute];

        }.bind(this))

        return result;
    }
}

module.exports = LightStatus;