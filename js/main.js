// Polyfill from https://developer.mozilla.org/en-US/docs/Web/Events/wheel
// creates a global "addWheelListener" method
// example: addWheelListener( elem, function( e ) { console.log( e.deltaY ); e.preventDefault(); } );
(function(window,document) {

    var prefix = "", _addEventListener, support;

    // detect event model
    if ( window.addEventListener ) {
        _addEventListener = "addEventListener";
    } else {
        _addEventListener = "attachEvent";
        prefix = "on";
    }

    // detect available wheel event
    support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
              document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
              "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

    window.addWheelListener = function( elem, callback, useCapture ) {
        _addWheelListener( elem, support, callback, useCapture );

        // handle MozMousePixelScroll in older Firefox
        if( support == "DOMMouseScroll" ) {
            _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
        }
    };

    function _addWheelListener( elem, eventName, callback, useCapture ) {
        elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
            !originalEvent && ( originalEvent = window.event );

            // create a normalized event object
            var event = {
                // keep a ref to the original event object
                originalEvent: originalEvent,
                target: originalEvent.target || originalEvent.srcElement,
                type: "wheel",
                deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                deltaX: 0,
                deltaY: 0,
                deltaZ: 0,
                preventDefault: function() {
                    originalEvent.preventDefault ?
                        originalEvent.preventDefault() :
                        originalEvent.returnValue = false;
                }
            };
            
            // calculate deltaY (and deltaX) according to the event
            if ( support == "mousewheel" ) {
                event.deltaY = - 1/40 * originalEvent.wheelDelta;
                // Webkit also support wheelDeltaX
                originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
            } else {
                event.deltaY = originalEvent.deltaY || originalEvent.detail;
            }

            // it's time to fire the callback
            return callback( event );

        }, useCapture || false );
    }

})(window,document);



var ppf = function(){
	var MIN_YEAR = 2008;
	var MAX_YEAR  = 2025

	var SUBCATEGORIES = {
		"violent": ["assault","homicide","kidnapping","robbery","sexassault","otherviol"],
		"drug": ["drugposs","drugtraff","otherdrug"],
		"property": ["arson","burglary","fraud","larceny","mvtheft","otherprop"],
		"other": ["dwi","weapons","public_oth"]
	}
	// 
	// var OFFENSES = 	[["assault","foo"],["homicide","foo"],["kidnapping","foo"],["robbery","foo"],["sexassault","foo"],["otherviol","foo"], ["drugposs","foo"],["drugtraff","foo"],["otherdrug","foo"], ["arson","foo"],["burglary","foo"],["fraud","foo"],["larceny","foo"],["mvtheft","foo"],["otherprop","foo"],["dwi","foo"],["weapons","foo"],["public_oth","foo"]]
	var OFFENSES = [
		["assault","Assault"],["homicide","Homicide"],["kidnapping","Kidnapping"],["robbery","Robbery"],["sexassault","Sexual assault"],["otherviol","Other violent offenses"],["drugposs","Drug possession"],["drugtraff","Drug trafficking"],["otherdrug","Other drug offenses"],["arson","Arson"],["burglary","Burglary"],["fraud","Fraud"],["larceny","Theft"],["mvtheft","Motor vehicle theft"],["otherprop","Other property offenses"],["dwi","DWI"],["weapons","Weapons offenses"],["public_oth","Public order and other offenses"]
		]
	var PARENTS = [
		["violent","All violent offenses"],["drug","All drug offenses"],["property","All property offenses"],["other","All other offenses"]
	]

	/*******************************************************/
	/**************** GETTERS AND SETTERS ******************/
	/*******************************************************/
	function getState(){
		return d3.select("#stateSelect").node().value
	}
	function getStateName(){
		var state = getState();
		return d3.select("#stateSelect option[value=" + state + "]").text()

	}
	function setState(state){
		 $( "#stateSelect" ).val(state).selectmenu("refresh")
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
	function getMinYear(){
		return MIN_YEAR;
	}


	/*******************************************************/
	/****************** INPUT MANAGERS *********************/
	/*******************************************************/
	function getParentInputs(){
		return getInputs(PARENTS)

	}
	function getChildInputs(){
		return getInputs(OFFENSES)

	}

	function getInputs(offenses){
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
	function updateInputs(offense, indicator, tier, amount, eventType){
		var inputs = getChildInputs();
		// var newInputs = {};
		if(tier == "parent"){
			setTextInput(offense, indicator, amount)
			d3.select(".slider[data-offense=\"" + offense + "\"][data-indicator=\"" + indicator + "\"]").select(".controlSlider").property("value", amount)
			SUBCATEGORIES[offense].map(function(c){
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
		if(eventType != "slideInput" && eventType != "forecast"){
			updateYourSelections(inputs)
		}
		setInputs(inputs)
		if(eventType != "forecast"){
			sendInputs(getState(), inputs)
		}
	}
	function sendInputs(state, inputs){
		d3.select("#saveForecast").classed("deactivated",false)
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
		var costsData = reshapeCostsData(rawData)
		var barData = reshapeBarData(rawData)

		// console.log(rawData)

		buildPopulationChart(lineData)
		buildCostInfo(costsData)
		buildDemographicsChart(barData)


	}


	function formatPercent(val){
		if(+val == 0){
			return "0%"
		}
		else if(+val < 0){
			return val + "%"
		}else{
			return "+" + val + "%"
		}
	}

	function buildSelection(container, number, tier, indicator){

		var text = (indicator == "los") ? "Length of prison term" : "Admissions";
		var widthClass;
		if(Math.abs(number) == 100){
			widthClass = "digit3"
		}
		else if(Math.abs(number) < 10){
			widthClass = "digit1" 
		}else{
			widthClass = "digit2"
		}

		var sv = container.append("div")
			.attr("class", "selectionItem selectionValue " + tier + " " + indicator)
		var svL = sv.append("div").attr("class","selectionValue left " + tier + " " + widthClass)
			svL.append("div").attr("class","selectionText").text(text)
			svL.append("div").attr("class","selectionDots").html("&nbsp;")
		var svR = sv.append("div").attr("class","selectionNum " + tier + " " + widthClass).text(formatPercent(number))

	}

	function updateYourSelections(inputs){
		d3.selectAll(".selectionItem").remove()
		var l = d3.select("#selectionsList")

		var state = l.append("div")
			.attr("class", "selectionItem selectionValue state")
		var stateL = state.append("div").attr("class","selectionValue left state")
			stateL.append("div").attr("class","selectionStateLabel selectionText").text("State")
			stateL.append("div").attr("class","selectionDots").html("&nbsp;")
		var stateR = state.append("div").attr("class","selectionState").text(getStateName())
		var nameWidth = stateR.node().getBoundingClientRect().width
		stateL.style("width",(180 - nameWidth) + "px")

		l.append("div")
			.attr("class","selectionItem selectionHeader")
			.text("Adjusted Offenses")

		for (var parent in SUBCATEGORIES) {
			if (SUBCATEGORIES.hasOwnProperty(parent)){
				// getUniqueChildren(parent, SUBCATEGORIES[parent], inputs)
				var	admissionsContainer = d3.select(".slider[data-offense=\"" + parent + "\"][data-indicator=admissions]"),
					losContainer = d3.select(".slider[data-offense=\"" + parent + "\"][data-indicator=los]")

				var los = +losContainer.select(".controlSlider").node().value
				var admissions = +admissionsContainer.select(".controlSlider").node().value
				
				l.append("div")
					.attr("class", "selectionItem selectionName parent")
					.text(PARENTS.filter(function(p){ return p[0] == parent})[0][1])
				buildSelection(l, admissions, "parent", "admissions")
				buildSelection(l, los, "parent", "los")


				
				for(var i = 0; i < SUBCATEGORIES[parent].length; i++){
					var child = SUBCATEGORIES[parent][i]
					 	childAdmissions = +inputs[child]["admissions"]["value"],
					 	childLos = +inputs[child]["los"]["value"]
					if(childAdmissions != +admissions){
						l.append("div")
							.attr("class", "selectionItem selectionName child admissions " + child)
							.text(OFFENSES.filter(function(c){ return c[0] == child})[0][1])
						buildSelection(l, childAdmissions, "child", "admissions")
					}else{
						d3.selectAll(".selectionValue.admissions." + child).remove()
					}

					if(childLos != +los){
						if(childAdmissions == admissions){
							l.append("div")
								.attr("class", "selectionItem selectionName child los " + child)
								.text(OFFENSES.filter(function(c){ return c[0] == child})[0][1])
						}
						buildSelection(l, childLos, "child", "los")
					}else{
						d3.selectAll(".selectionValue.los" + child).remove()
					}

					if(childLos == los && childAdmissions == admissions){
						d3.selectAll(".selectionItem." + child).remove()	
					}
				}

			}
		}
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
		return [lineData, data.years];
	}
	function reshapeCostsData(data){
		return data.costs.cumulative.baselineDiff

	}
	function reshapeBarData(data){
		//baseline[1][race] = baseline proportion, 2025
		//projected[1][race] = Projected vs baseline
		//projected[2][race] = Projected vs last yr
		var baseline = data["baseline"][1]
		var vsBaseline = data["projected"][1]
		var vsLastYr = data["projected"][2]

		// var races = data["baseline"][1].filter()
		var races = []
		for (race in baseline){
			if(baseline.hasOwnProperty(race) && baseline[race] != 0){ races.push(race) }
		}
		// console.log(races)

		var barData = []

		for(var i = 0; i < races.length; i++){
			var group = {},
				race = races[i]
			group["race"] = race
			group["baseline"] = baseline[race]
			group["vsBaseline"] = vsBaseline[race]
			group["vsLastYr"] = vsLastYr[race]

			barData.push(group)
		}

		return barData;


	}

	function buildPopulationChart(allData){
		var lineBaseline, lineProjected,
			margin = {top: 20, right: 50, bottom: 30, left: 20},
			width = 700 - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom,
			data = allData[0],
			years = allData[1];

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

			var yMin = d3.min([
					d3.min(data, function(d){ return d.projected}),
					d3.min(data, function(d){ return d.baseline}),
				])
			var yMax = d3.max([
					d3.max(data, function(d){ return d.projected}),
					d3.max(data, function(d){ return d.baseline}),
				])

			x.domain([getMinYear(), years.max]);
			y.domain([0, yMax]);

			var historicalData = data.filter(function(o){ return o.year <= years.diverge-1 && o.year >= getMinYear()})
			var futureData = data.filter(function(o){ return o.year >= years.diverge-1 && o.year >= getMinYear()})


		if(d3.select("#lineChart").select("svg").node() == null){
			var svg = d3.select("#lineChart").append("svg").attr("width", 900).attr("height", 500),

			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			g.append("rect")
				.attr("id","bgRect")
				.attr("x",0)
				.attr("y",0)
				.attr("height",height)
				.attr("width",x(years.diverge-1) - x(getMinYear()))
				


			g.append("g")
			.attr("class","lineChart y axis")
			.call(d3.axisRight(y).ticks(5).tickSize(-width))
			.attr("transform", "translate(" + width + ",0)")
			.select(".domain")
			.remove();

			g.append("g")
			.attr("class","lineChart x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickFormat(d3.format(".0f")))
			.select(".domain")
			.remove();

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
			d3.select("#bgRect")
				.transition()
					.attr("width",x(years.diverge-1) - x(getMinYear()))
				


			d3.select(".lineChart.y.axis")
			.transition()
			.call(d3.axisRight(y).ticks(5).tickSize(-width))
			.select(".domain")
			.remove();


			// d3.select(".lineChart.x.axis")
			// .transition()
			// .call(d3.axisBottom(x))

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
		// console.log(data)
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    width = 600 - margin.left - margin.right,
	    height = 300 - margin.top - margin.bottom;
	    

	var x0 = d3.scaleBand()
	    .rangeRound([0, width])
	    .paddingInner(0.1);

	var x1 = d3.scaleBand()
	    .padding(0.05);

	var y = d3.scaleLinear()
	    .rangeRound([height, 0])
	    .domain([0,1]);

	var z = d3.scaleOrdinal()
	    .range(["#000000", "#ec008b"]);

	if(d3.select("#barChart").select("svg").node() == null){
		var svg = d3.select("#barChart").append("svg").attr("width", 600).attr("height", 300),

		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id","barsGroups");

		var keys = ["baseline","vsBaseline"]

		x0.domain(data.map(function(d) { return d.race; }));
		x1.domain(keys).rangeRound([0, x0.bandwidth()]);
		// y.domain([0, d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();
		// y.domain([0,1])

		g.append("g")
		.attr("class", "y bar axis")
		.call(d3.axisLeft(y).ticks(5, "%").tickSize(-width))
		.select(".domain")
		.remove();

		var bars = g.append("g")
		.attr("class","barsGroup")
		.selectAll("g")
		.data(data)
		.enter().append("g")
		.attr("transform", function(d) { return "translate(" + x0(d.race) + ",0)"; })
		
		bars.selectAll("rect")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
		.enter().append("rect")
		.attr("x", function(d) { return x1(d.key); })
		.attr("y", function(d) { return y(d.value); })
		.attr("width", x1.bandwidth())
		.attr("height", function(d) { return height - y(d.value); })
		.attr("fill", function(d) { return z(d.key); });

		bars.selectAll("text")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key], diff: (d[key] - d["baseline"])/d["baseline"]}; }); })
		.enter().append("text")
		.style("opacity", function(d){ return ((d.key) == "baseline") ? 0 : 1})
		.attr("x", function(d) { return x1(d.key) + .5*(30 - x1.bandwidth()); })
		.attr("y", function(d) { return y(d.value) -5; })
		.text(function(d){ return formatPercent(d3.format(".1f")(d.diff *100)) })


		g.append("g")
		.attr("class", "x bar axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x0))

	}else{

		var keys = ["baseline","vsBaseline"]

		x0.domain(data.map(function(d) { return d.race; }));
		x1.domain(keys).rangeRound([0, x0.bandwidth()]);
		// y.domain([0, d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();

		var bars = d3.select("#barsGroups").select("g.barsGroup")
		.selectAll("g")
		.data(data)
		// .select("g")
		.attr("transform", function(d) { return "translate(" + x0(d.race) + ",0)"; })

		d3.select("#barsGroups").select("g.barsGroup").selectAll("rect").style("opacity",0)

		bars.selectAll("rect")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
		.style("opacity",1)
		.transition()
		.attr("x", function(d) { return x1(d.key) + .5*(30 - x1.bandwidth()); })
		.attr("y", function(d) { return y(d.value); })
		.attr("width", x1.bandwidth())
		.attr("height", function(d) { return height - y(d.value); })
		.attr("fill", function(d) { return z(d.key); });

		d3.select("#barsGroups").select("g.barsGroup").selectAll("text").style("opacity",0)

		bars.selectAll("text")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key], diff: (d[key] - d["baseline"])/d["baseline"]}; }); })
		// .selectAll("text")
		.style("opacity", function(d){ return ((d.key) == "baseline") ? 0 : 1})
		.transition()
		.attr("x", function(d) { return x1(d.key); })
		.attr("y", function(d) { return y(d.value) - 5; })
		.text(function(d){ return formatPercent(d3.format(".1f")(d.diff *100)) })


		d3.select(".x.bar.axis")
		.attr("transform", "translate(0," + height + ")")
		.transition()
		.call(d3.axisBottom(x0))


	}



	    // g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	}
	function buildCostInfo(cost){
		d3.select("#costText #costYear").text(MAX_YEAR)
		d3.select("#costText #costWord").text(function(){ return (cost <= 0 ) ? "savings" : "increase"})

		var testString = d3.format(".4s")(Math.abs(cost))
		var sigFigs = testString.split(".")[0].length + 1

		var formatString = "$." + sigFigs + "s"

		var textCost = (cost == 0) ? "$0" : d3.format(formatString)(Math.abs(cost)).replace("k"," thousand").replace("M", " million").replace("G", " billion")

		d3.select("#costText #costDollars").text(textCost)

	}
	/*******************************************************/
	/******************** FORECASTS ************************/
	/*******************************************************/
	var forecastCount = 1;
	function saveForecast(){
		var forecast = {"inputs": getChildInputs(), "state": getState(), "parents": getParentInputs()}
		d3.select("#saveForecast").classed("deactivated",true)

		var l = d3.select("#savedForecastsList")
		var name = (forecastCount == 1) ? "Sample forecast" : "Forecast " + forecastCount;
		var row = l.append("div")
			.attr("class","savedForecast")
			// .text(name)
			.datum(forecast)
			.on("click", function(d){
				loadForecast(d)
			})
		row.append("input")
			.attr("value",name)


		var share = row.append("div")
			.attr("class","shareForecast forecastButton")
			.on("click", shareForecast)
		
		var edit = row.append("div")
			.attr("class","editForecast forecastButton")
			.on("click", editForecast)

		var del = row.append("div")
			.attr("class","deleteForecast forecastButton")
			.on("click", deleteForecast)


    // background-image: url(../img/unlocked.png);

		forecastCount += 1;
	}
	function loadForecast(d){
		setState(d.state)
		for(o in d.parents){
			if(d.parents.hasOwnProperty(o)){
				updateInputs(o, "admissions", "parent", +d["parents"][o]["admissions"]["value"], "forecast")
				updateInputs(o, "los", "parent", +d["parents"][o]["los"]["value"], "forecast")
			}
		}
		for(o in d.inputs){
			if(d.inputs.hasOwnProperty(o)){
				updateInputs(o, "admissions", "child", +d["inputs"][o]["admissions"]["value"], "forecast")
				updateInputs(o, "los", "child", +d["inputs"][o]["los"]["value"], "forecast")
			}
		}
		updateInputs(false, false, false, false, "runForecast")
		d3.select("#saveForecast").classed("deactivated",true)
	}
	function shareForecast(d){
		// console.log(d)

	}
	function deleteForecast(d){
		// console.log(this)

	}
	function editForecast(d){

	}
	// function disableSaveForecast(){

	// }
	// function enableSaveForecast(){

	// }
	//refreshButton
	d3.select("#clearAll")
		.on("click", function(){
			$(".controlSlider.control").val(0)
			d3.selectAll(".slideLock")
			.each(function(d){
				unlockInput(d.offense, d.indicator)
			})
			updateInputs(false, false, false, false, "reset")
			
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
		var inputs = getChildInputs()
		updateYourSelections(inputs)
		sendInputs(this.value, inputs)
	    var m = $(this);
	    if(m.val() == ""){
	      m.css("color", "#818385");
	    }else{ m.css("color", "#333")}

	}
	});

	d3.selectAll(".lneg").on("click", function(d){
		updateInputs(d.offense, d.indicator, d.tier, -100, "slideClick")
	})
	d3.selectAll(".lpos").on("click", function(d){
		updateInputs(d.offense, d.indicator, d.tier, 100, "slideClick")
	})
	d3.selectAll(".l0").on("click", function(d){
		updateInputs(d.offense, d.indicator, d.tier, 0, "slideClick")
	})
	d3.selectAll(".controlSlider")
		.on("input", function(d){
			updateInputs(d.offense, d.indicator, d.tier, this.value, "slideInput")
		})
		.on("change", function(d){
			updateInputs(d.offense, d.indicator, d.tier, this.value, "slideChange")
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

			updateInputs(d.offense, d.indicator, d.tier, value, "textBox")
		})

	//input on change
	// updateInputs(offense, indicator, amount)

	d3.selectAll(".slideLock")
		.on("click", function(d){
			var locked = d3.select(this).classed("locked")
			if(d.tier == "parent"){
				if(locked){
					SUBCATEGORIES[d.offense].map(function(o){
						unlockInput(o, d.indicator)
					})
				}
				else{
					SUBCATEGORIES[d.offense].map(function(o){
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

	d3.select("#saveForecast")
		.on("click", function(){
			if(d3.select(this).classed("deactivated")){ return false}
			else{ saveForecast() }
		})

	var mouseX = 0,
		leftTop = 48,
		rightTop = 48;
	$(window).on("mousemove", function(event){
		mouseX = event.pageX;
	})


	addWheelListener(window, function(event){
		var left = d3.select("#leftSidebar")
		var right = d3.select("#rightSideBar")
		var leftWidth = left.node().getBoundingClientRect().width;
		var rightWidth = right.node().getBoundingClientRect().width;
		if(mouseX < leftWidth){
			if(left.style("position") == "fixed"){
				left.style("position", "absolute")
					.style("margin-top",  "48px")
				window.scrollTo(0, leftTop*-1 + 48);
			}
			right.style("position", "fixed")
				.style("margin-top", rightTop + "px")
			leftTop = left.node().getBoundingClientRect().top
		}
		else if(mouseX > window.innerWidth - rightWidth){
			if(right.style("position") == "fixed"){
				right.style("position", "absolute")
					.style("margin-top", "48px")
				window.scrollTo(0, rightTop*-1 + 48);
			}
			left.style("position", "fixed")
				.style("margin-top", leftTop + "px")
			rightTop = right.node().getBoundingClientRect().top
		}
		else{
			right.style("position", "fixed")
				.style("margin-top", rightTop + "px")
			leftTop = left.node().getBoundingClientRect().top
			left.style("position", "fixed")
				.style("margin-top", leftTop + "px")
			rightTop = right.node().getBoundingClientRect().top

		}
	})

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
		updateInputs(false, false, false, false, "init")
		d3.select("#saveForecast").classed("deactivated",true)
		saveForecast()
	}
	init();
}();
