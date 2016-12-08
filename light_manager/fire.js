/**
 * Created by n_andrade on 10/31/2016.
 */


function fire(){

	this.getIndependentValues = function(){
		r = Math.min(230, 200 + Math.random() * 35);
		g = Math.min(255, 20 + Math.random() * 27);
		b = Math.min(255,0 + Math.random() * 5);
		return [r, g, b];
	}


	this.getGroupedValues = function(){

		data = new Array(31).fill([0,0,0]);

		[	0,2,
			8,10, 
			15,17,
			19,21,
			24,26 ].forEach(function(val){
			data[val] = [190 + Math.round(Math.random() * 15), 70 + Math.round(Math.random() * 20), 0];
		});

		[1,9,16,20, 25].forEach(function(val){
			data[val] = [230 + Math.round(Math.random() * 5) ,0,0];
		})

		console.log(data);

		return data;
	}

	this.lavaStrip = function(strip){
		var strip = strip;
		r = 255;
		g = r - 90;
		b = 40;

		for(i = 0; i < 30; i++){

			/*
			r1 = 250;
			g1 = 0;
			b1 = 0;
			console.log(r1,g1,b1);
			strip.setColor(i, i+1, r1, g1, b1);
			*/
			
			flicker = Math.round(Math.random() * 120);
			r1 = Math.max(0, Math.round(r - flicker * .1));

			g1 = g-flicker;

			g1 = g1 < 0 ? 0 : g1;

			b1 = Math.max(0, b-flicker);
			
			// r1 = g1 = b1 = 0;
			strip.setColor(i, i+1, r1, g1, b1);



		}

		setTimeout(function(){
			this.lavaStrip(strip)
		}.bind(this), 600 + Math.round(Math.random() * 25))

	}	
}

module.exports = fire;