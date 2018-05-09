var CURRENT_YEAR = 2014;

var subcategories = {
	"violent": ["assault","homicide","kidnapping","robbery","sexassault","otherviol"],
	"drug": ["drugposs","drugtraff","otherdrug"],
	"property": ["arson","burglary","fraud","larceny","mvtheft","otherprop"],
	"other": ["dwi","weapons","public_oth"]
}
// 
// var offenses = 	[["assault","foo"],["homicide","foo"],["kidnapping","foo"],["robbery","foo"],["sexassault","foo"],["otherviol","foo"], ["drugposs","foo"],["drugtraff","foo"],["otherdrug","foo"], ["arson","foo"],["burglary","foo"],["fraud","foo"],["larceny","foo"],["mvtheft","foo"],["otherprop","foo"],["dwi","foo"],["weapons","foo"],["public_oth","foo"]]
var offenses = [["assault","foo"],["homicide","foo"],["kidnapping","foo"],["robbery","foo"],["sexassault","foo"],["otherviol","foo"],["drugposs","foo"],["drugtraff","foo"],["otherdrug","foo"],["arson","foo"],["burglary","foo"],["fraud","foo"],["larceny","foo"],["mvtheft","foo"],["otherprop","foo"],["dwi","foo"],["weapons","foo"],["public_oth","foo"]]

/*******************************************************/
/**************** GETTERS AND SETTERS ******************/
/*******************************************************/
function getState(state){

}
function setState(state){

}
function getBase(){

}
function setBase(base){

}
function getForecastID(){
//for unique id's, used to delete forecasts or refer to them (e.g. for print view organization)
//internal id that autoincrements w/ each new click of the "save" button
}
function setForecastID(){

}


/*******************************************************/
/****************** INPUT MANAGERS *********************/
/*******************************************************/

function getInputs(){
	//return an array of all inputs
	var inputs = {}
	offenses.map(function(o){
		var offense = o[0],
			admissionsContainer = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=admissions]"),
			losContainer = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=los]")

		var los = losContainer.select(".controlSlider").node().value
		var losLocked = losContainer.select(".slideLock").classed("locked")
		var admissions = admissionsContainer.select(".controlSlider").node().value
		var admissionsLocked = admissionsContainer.select(".slideLock").classed("locked")
		inputs[offense] = {}
		inputs[offense]["los"] = {
			"value": los,
			"locked": losLocked
		}
		inputs[offense]["admissions"] = {
			"value": admissions,
			"locked": admissionsLocked
		}
	})
	return inputs
}
function setTextInput(offense, indicator, amount){
	var input = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=\"" + indicator + "\"]").select(".sliderInput input")
	var cleanAmount = ""
	if(amount == 0){
		cleanAmount = "0%"
	}
	else if(amount > 0){
		cleanAmount = "+" + amount + "%"
	}else{
		cleanAmount = amount + "%"
	}
	input.property("value", cleanAmount)

}
function setInputs(inputs){
	for (var offense in inputs) {
		if (inputs.hasOwnProperty(offense)) {
			var admissionsContainer = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=admissions]"),
			losContainer = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=los]")
			admissionsContainer.select(".controlSlider").property("value", inputs[offense]["admissions"]["value"])
			losContainer.select(".controlSlider").property("value", inputs[offense]["los"]["value"])
			setTextInput(offense, "admissions", inputs[offense]["admissions"]["value"])
			setTextInput(offense, "los", inputs[offense]["los"]["value"])

		}
	}
}
function updateInputs(offense, indicator, tier, amount){
	var inputs = getInputs();
	// var newInputs = {};
	if(tier == "parent"){
		setTextInput(offense, indicator, amount)
		d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=\"" + indicator + "\"]").select(".controlSlider").property("value", amount)
		subcategories[offense].map(function(c){
			if(! inputs[c][indicator]["locked"]){
				inputs[c][indicator]["value"] = amount
			}
		})
	}
	else if(offense != false){
		inputs[offense][indicator]["value"] = amount
	}
	//if changing umbrella category, loop through inputs for each child and if it's not locked, update val
	//if changing for all, loop through each umbrella category and check if locked, then do as above
	
	setInputs(inputs)
	sendInputs("CA", inputs)
}
function sendInputs(state, inputs){
	var reshaped = []
	for (var offense in inputs) {
		if (inputs.hasOwnProperty(offense)) {
			var reshapedAdmissions = [offense, +inputs[offense]["admissions"]["value"]/100, 1]
			var reshapedLos = [offense, +inputs[offense]["los"]["value"]/100, 2]
			reshaped.push(reshapedAdmissions)
			reshaped.push(reshapedLos)
		}
	}
	var rawData = runModel(state, reshaped)
	var lineData = reshapeLineData(rawData)
	buildPopulationChart(lineData)


}
function lockInput(offense, indicator){
	var parent = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=\"" + indicator + "\"]")
	parent.select(".slideLock").classed("unlocked",false)
	parent.select(".slideLock").classed("locked",true)
	parent.selectAll(".control:not(.slideLock)").style("opacity",.4)
	parent.append("div").attr("class","lockMask")

}
function unlockInput(offense, indicator){
	var parent = d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=\"" + indicator + "\"]")
	parent.select(".slideLock").classed("unlocked",true)
	parent.select(".slideLock").classed("locked",false)
	parent.selectAll(".control:not(.slideLock)").style("opacity",1)
	parent.selectAll(".lockMask").remove()
}


/*******************************************************/
/**************** GRAPHING FUNCTIONS *******************/
/*******************************************************/
function reshapeLineData(data){
	var projected = data.projected[0],
		baseline = data.baseline[0],
		costs = data.costs,
		lineData = [];
	for (var year in projected) {
		if (projected.hasOwnProperty(year)) {
			var lineDatum = {"year": +year}
			lineDatum["baseline"] = baseline[year]
			lineDatum["projected"] = projected[year]
			// lineDatum["cost"] = costs[year]["baselineDiff"]
			lineData.push(lineDatum)
		}
	}
	return lineData;
}

function buildPopulationChart(data){
	var lineBaseline, lineProjected,
		margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = 900 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

		var x = d3.scaleLinear()
		.rangeRound([0, width]);

		var y = d3.scaleLinear()
		.rangeRound([height, 0]);

		lineBaseline = d3.line()
		.x(function(d) { return x(d.year); })
		.y(function(d) { return y(d.baseline); });

		lineProjected = d3.line()
		.x(function(d) { return x(d.year); })
		.y(function(d) { return y(d.projected); });

		x.domain(d3.extent(data, function(d) { return d.year; }));
		y.domain(d3.extent(data, function(d) { return d.projected; }));


		var historicalData = data.filter(function(o){ return o.year <= CURRENT_YEAR })
		var futureData = data.filter(function(o){ return o.year >= CURRENT_YEAR })


	if(d3.select("#lineChart").select("svg").node() == null){
		var svg = d3.select("#lineChart").append("svg").attr("width", 900).attr("height", 500),

		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		console.log(data)

		g.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))
		.select(".domain")
		.remove();

		g.append("g")
		.attr("class","lineChart y axis")
		.call(d3.axisLeft(y))

		g.append("path")
		.datum(futureData)
		.attr("class", "line projection future")
		.attr("d", lineProjected);

		g.append("path")
		.datum(historicalData)
		.attr("class", "line baseline historical")
		.attr("d", lineBaseline);

		g.append("path")
		.datum(futureData)
		.attr("class", "line baseline future")
		.attr("stroke-dasharray","1,5")
		.attr("d", lineBaseline);

	}else{

		d3.select(".lineChart.y.axis")
		.transition()
		.call(d3.axisLeft(y))

		d3.select(".line.projection.future")
		.datum(futureData)
		.transition()
		.attr("d", lineProjected);
		
		d3.select(".line.baseline.historical")
		.datum(historicalData)
		.transition()
		.attr("d", lineBaseline);	

		d3.select(".line.baseline.future")
		.datum(futureData)
		.transition()
		.attr("d", lineBaseline);	

	}

}
function buildDemographicsChart(data){

}
function buildCostInfo(data){

}
/*******************************************************/
/******************** FORECASTS ************************/
/*******************************************************/
function saveForecast(){

}
function loadForecast(forecastData){

}
function deleteForecast(forecastID){

}
function disableSaveForecast(){

}
function enableSaveForecast(){

}
//refreshButton
d3.select("#clearAll")
	.on("click", function(){
		loadForecast({})
	})
	.on("mouseover", function(){ 
		d3.select(this).select("img").attr("src", "img/refreshHover.png")
	})
	.on("mouseout", function(){
		d3.select(this).select("img").attr("src", "img/refresh.png")
	})



/*******************************************************/
/******************** LEFT SIDE BAR ********************/
/*******************************************************/
function toggleParentDrawer(header){
	var container = d3.select(header.parentNode),
		open = container.classed("open")
	if(open){
		container.classed("open", false)
		container.select(".parentArrow")
			.transition()
			.style("transform","rotate(0deg)")
		container.datum(container.node().getBoundingClientRect().height)
		container.transition()
			.style("height", "40px")
	}else{
		container.classed("open", true)
		container.select(".parentArrow")
			.transition()
			.style("transform","rotate(180deg)")
		container.transition()
			.style("height", function(d){
				return d + "px"
			})
			.on("end", function(){
				d3.select(this).style("height", "auto")
			})

	}

}
function toggleChildDrawer(header){
	var container = d3.select(header.parentNode),
		open = container.classed("open")
	if(open){
		var height = (container.classed("tall")) ? "45px" : "30px";
		container.classed("open", false)
		container.select(".childArrow")
			.transition()
			.style("transform","rotate(0deg)")
		container.transition()
			.style("height", height)
	}else{
		var height = (container.classed("tall")) ? "220px" : "205px"
		container.classed("open", true)
		container.select(".childArrow")
			.transition()
			.style("transform","rotate(180deg)")
		container.transition()
			.style("height", height)


	}
}


$( "#stateSelect" ).selectmenu({
change: function(event, data){
	//state on change
	//get state
	var inputs = getInputs()
	sendInputs(state, inputs)
    var m = $(this);
    if(m.val() == ""){
      m.css("color", "#818385");
    }else{ m.css("color", "#333")}

}
});

d3.selectAll(".lneg").on("click", function(d){
	updateInputs(d.offense, d.indicator, d.tier, -100)
})
d3.selectAll(".lpos").on("click", function(d){
	updateInputs(d.offense, d.indicator, d.tier, 100)
})
d3.selectAll(".l0").on("click", function(d){
	updateInputs(d.offense, d.indicator, d.tier, 0)
})
d3.selectAll(".controlSlider")
	.on("input", function(d){
		updateInputs(d.offense, d.indicator, d.tier, this.value)
	})

d3.selectAll(".sliderInput input")
	.on("change", function(d){
		var neg = (this.value.search("-") != -1) ? -1 : 1;
		var raw = +this.value.replace(/[^0-9.]/g, ''),
			value;
		raw *= neg;
		if(raw > 100){ value = 100}
		else if(raw < -100){ value = -100 }
		else if(raw == "-"){ value = 0}
		else{ value = +raw}

		updateInputs(d.offense, d.indicator, d.tier, value)
	})

//input on change
// updateInputs(offense, indicator, amount)

d3.selectAll(".slideLock")
	.on("click", function(d){
		var locked = d3.select(this).classed("locked")
		if(d.tier == "parent"){
			if(locked){
				subcategories[d.offense].map(function(o){
					unlockInput(o, d.indicator)
				})
			}
			else{
				subcategories[d.offense].map(function(o){
					lockInput(o, d.indicator)
				})
			}
		}
		if(locked){ unlockInput(d.offense, d.indicator) }
		else{ lockInput(d.offense, d.indicator) }
	})

var heights = [529, 376, 526, 400]
d3.selectAll(".parentContainer")
	.data(heights)
d3.selectAll(".parentHeader").on("click", function(){ toggleParentDrawer(this) })
// d3.selectAll(".parentHeader")
// 	.on("click", function(){

// 	})
d3.selectAll(".childHeader")
	.on("click", function(){ toggleChildDrawer(this) })

/*******************************************************/
/********************* INITIALIZE **********************/
/*******************************************************/
function bindControlData(){
	d3.selectAll(".slider")
		.each(function(){
			var offense = d3.select(this).attr("data-offense"),
				indicator = d3.select(this).attr("data-indicator"),
				tier = d3.select(this).attr("data-tier")
			var datum = {"offense": offense, "indicator": indicator, "tier": tier}
			d3.select(this).selectAll(".control")
				.datum(datum)

		})
}


function init(){
	bindControlData()
	updateInputs(false, false, false, false)
}

init()