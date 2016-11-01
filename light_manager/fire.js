/**
 * Created by n_andrade on 10/31/2016.
 */


function fire(){

	this.getValues = function(){
		r = Math.min(230, 200 + Math.random() * 35);
		g = Math.min(255, 20 + Math.random() * 27);
		b = Math.min(255,0 + Math.random() * 5);
		return [r, g, b];
	}
}

module.exports = fire;