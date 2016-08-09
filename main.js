rh = 48;   //Row height
rs = 10;   //Row Separation
cw = 100;  //Col Width
cs = 10;   //Col Separation
ys = rh/40 //y scaling factor (for scaling the hexagons)
xs = cw/40 //x scaling factor (for scaling the hexagons)

var slices;

function main() {
  var svg = d3.select("#vis").append("svg")
    .attr("width", 800)
    .attr("height", 600);
      
  d3.json("rawdata.json", function (json1) {
  	var rawdata = json1.rawdata;
  
    d3.json("slicedefinitions.json", function (json2) {
      var slicedefinitions = json2.slicedefinitions;
      addbuttons(slicedefinitions);
      pack(rawdata, slicedefinitions);
      render(0);
    });
  });
}

function pack(rawdata, slicedefinitions){

    // The following for loop builds an array which stores
    // a possition index for each value, of each dimention, such that:
    //    positions[dimention].valuepositions[value]
    // indicates the possition order the value will be drawn in, when 
    // used as row or colum heading.
	var positions = new Object();
	for(i in rawdata){ //For each row of raw data
	   dataitem = rawdata[i];
	   for(dimention in dataitem){  //For each dimention (the "columns" if you imagine the raw data as a table)
		 var value = dataitem[dimention];
		 if(positions[dimention]==null){
		   positions[dimention]={};
		   positions[dimention]['count']=0;
		   positions[dimention]['valuepositions']=new Object();
		 }
		 if(positions[dimention]['valuepositions'][value]==null){
		   positions[dimention]['count']+=1;
		   positions[dimention]['valuepositions'][value] = positions[dimention]['count'];
		 }
	   }
	}
	
	//Invert the col, row and data information in the slicedefinations array
	for(j in slicedefinitions){
	  slicedefinition = slicedefinitions[j];
	  slicedefinitions[j].bydimention={};
	  slicedefinitions[j].bydimention[slicedefinition.col]='col';
	  slicedefinitions[j].bydimention[slicedefinition.row]='row';
	  slicedefinitions[j].bydimention[slicedefinition.data]='data';
	}
	
	// Finally build the data slices. One for each slice defination such that:
	//    slices[slicenumber].dimentions[dimention].valuepositions[value]
	// gives and x, y coordinate for the value, when rended in that slice.	
	slices = [];
	for(j in slicedefinitions){
	  slicesdefination = slicedefinitions[j];
	  var dimentions={};
	  for(i in rawdata){
		dataitem = rawdata[i];
		
		var row = positions[slicesdefination.row].valuepositions[dataitem[slicesdefination.row]];
		var col = positions[slicesdefination.col].valuepositions[dataitem[slicesdefination.col]];
		for(dimention in dataitem){
		  var value = dataitem[dimention];
		  if(dimentions[dimention]==null){
			 dimentions[dimention]=[];
		  }
		  var position;
		  switch(slicesdefination.bydimention[dimention]){
			case 'row':  position={x:0, y:row}; break;
			case 'col':  position={x:col, y:0}; break;
			case 'data': position={x:col, y:row}; break;
			default:     position={x:-1, y:-1};          
		  }
		  dimentions[dimention].push({
			rawdatarow:i,
			value:value,
			position:position
		  });
		}
	  }
	  slices[j]={dimentions:dimentions};
	}
}

function addbuttons(slicedefinitions){
   d3.select("#but").selectAll("button")
     .data(slicedefinitions)
   .enter()
    .append("button")
    .text(function(d){ return d.name })
    .on("click", function(d, i){ render(i) });
}

function wordwrap(str, width, cut ) {
    width = width || 75;
    cut = cut || false;
    if (!str) { return [str]; } 
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)'); 
    return str.match( RegExp(regex, 'g') ) 
}

function render(sliceno){
    var svg = d3.select("#vis").select("svg");
    slice=slices[sliceno]
    for(dimentionname in slice.dimentions){
      dimention = slice.dimentions[dimentionname];
      var s = svg.selectAll("." + dimentionname)
        .data(dimention);

      var g = s.enter().append("g")
        .attr("class", dimentionname)

	  if(dimentionname=="Capability"){
	    g.append("polygon")
         .attr("class", "a")
         .attr("stroke", "darkgrey")
         .attr("fill", "lightblue")
         .attr("stroke-width", "3")
         .attr("points", 10*xs + ",0 " + 30*xs + ",0 " + 40*xs + "," + 20*ys + " " + 30*xs + "," + 40*ys + " " + 10*xs + "," + 40*ys + " " + "0," + 20*ys);  //40*40
	  }else{
        g.append("rect")
        .attr("class", "b")
        .attr("fill", "lightyellow")
         .attr("stroke", "darkgrey")
         .attr("stroke-width", "3")
        .attr("height", rh)
        .attr("width", cw);
      }
      
      g.each(function(d,i){
        var g2 = d3.select(this);
        var lines = wordwrap(d.value,5);
         for(i in lines){
           var line = lines[i]; 
           g2.append("text")
             .attr("dx",10*xs)
             .attr("dy", parseInt(i)*15+15)
             .attr("text-anchor", 'left')
             .text(line)
         }
      });
      
       s.exit().remove();
      
       s.transition()
        .duration(1500)
        .ease("elastic",1,1)
        .attr("transform", function(d){
           return "translate(" + d.position.x * (cw+cs) + "," + d.position.y * (rh+rs) +")";
         });
        
        //.attr("x", function(d) {return d.position.x * 50})
        //.attr("y", function(d) {return d.position.y * 30});
        
     }    
}