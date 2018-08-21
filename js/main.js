



var ppf = function(){
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
    while (word = words.pop()) {
      line.push(word)
      tspan.text(line.join(" "))
      if (tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(" "))
        line = [word]
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
      }
    }
  })
}

	function parseQueryString(query) {
		var obj = {},
			qPos = query.indexOf("?"),
			tokens = query.substr(qPos + 1).split('&'),
			i = tokens.length - 1;

		if (qPos !== -1 || query.indexOf("=") !== -1) {
			for (; i >= 0; i--) {
				var s = tokens[i].split('=');
				obj[unescape(s[0])] = s.hasOwnProperty(1) ? unescape(s[1]) : null;
			};
		}
		return obj;
	}

	function widthIsUnder(size){
		return d3.select(".breakpoint.width" + size).style("display") == "block"
	}
	function heightIsUnder(size){
		return d3.select(".breakpoint.height" + size).style("display") == "block"
	}
	function getLayout(){
		if(heightIsUnder(800) && !heightIsUnder(565) && !widthIsUnder(1300)){
			return "toggle"
		}
		else if(heightIsUnder(900) && !widthIsUnder(1098) && widthIsUnder(1300)){
			//height cutoff will be more than 900
			return "toggleSqueeze"
		}
		else if(heightIsUnder(900) && !heightIsUnder(800) && !widthIsUnder(1098)){
			return "squeeze"
		}
		else if(!widthIsUnder(1300) && !heightIsUnder(900)){
			return "normal"
		}
		else if(widthIsUnder(1300) && !widthIsUnder(1098)){
			return "stack"
		}
		else if(widthIsUnder(1098) || heightIsUnder(565)){
			return "mobile"
		}
	}

	function moveToFront(selector){
		var node = d3.select(selector).node()
		node.parentNode.appendChild(node)
	}
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
		d3.selectAll(".line.saved:not(.state-" + state + ")").style("opacity",0)
		d3.selectAll(".line.saved.state-" + state ).style("opacity",1)
		$( "#stateSelect" ).val(state).selectmenu("refresh")
	}
	function getBase(){

	}
	function setBase(base){

	}
	function PRINT(){
		var parameters = parseQueryString(window.location.search);
		return (parameters.hasOwnProperty("print"))
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
	function getBaselineType(){
		return d3.select("#popMenu").node().value;
	}
	function getToggleState(){
		if(d3.select("#toggleButton").classed("line")){
			return "line"
		}else{
			return "bar"
		}
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
		if(eventType == "reset"){
			d3.selectAll(".parent.slider .sliderInput input").property("value","0%")
		}
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
		d3.selectAll(".mouseoverElem").remove()
		declickForecasts()
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


		buildPopulationChart(lineData, false)
		buildCostInfo(costsData)
		buildDemographicsChart(barData, getBaselineType())

		buildPopulationText(lineData, getBaselineType())



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

	function formatPP(val){
		if(+val == 0){
			return "+0"
		}
		else if(+val < 0){
			return val
		}else{
			return "+" + val
		}	
	}
	function formatCost(cost){
		var testString = d3.format(".4s")(Math.abs(cost))
		var sigFigs = testString.split(".")[0].length + 1

		var formatString = "$." + sigFigs + "s"

		return (cost == 0) ? "$0" : d3.format(formatString)(Math.abs(cost)).replace("k"," thousand").replace("M", " million").replace("G", " billion")
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


				var parameters = parseQueryString(window.location.search);
				l.append("div")
					.attr("class","selectionItem exceptionsLabel " + parent)
					.text("Exceptions")
				
				
				for(var i = 0; i < SUBCATEGORIES[parent].length; i++){
					var child = SUBCATEGORIES[parent][i]
					 	childAdmissions = +inputs[child]["admissions"]["value"],
					 	childLos = +inputs[child]["los"]["value"]
					if(childAdmissions != +admissions){
						l.select(".exceptionsLabel." + parent)
							.style("display", "block")

						l.append("div")
							.attr("class", "selectionItem selectionName child admissions " + child + " parent-" + parent)
							.text(OFFENSES.filter(function(c){ return c[0] == child})[0][1])
						buildSelection(l, childAdmissions, "child", "admissions")
					}else{
						d3.selectAll(".selectionValue.admissions." + child).remove()
					}

					if(childLos != +los){
						if(childAdmissions == admissions){
							l.select(".exceptionsLabel." + parent)
								.style("display", "block")

							l.append("div")
								.attr("class", "selectionItem selectionName child los " + child + " parent-" + parent)
								.text(OFFENSES.filter(function(c){ return c[0] == child})[0][1])
						}
						buildSelection(l, childLos, "child", "los")
					}else{
						d3.selectAll(".selectionValue.los" + child).remove()
					}

					if(childLos == los && childAdmissions == admissions){
						d3.selectAll(".selectionItem." + child).remove()
					}
					if(d3.selectAll(".selectionItem.parent-" +  parent).nodes().length == 0){
						l.select(".exceptionsLabel." + parent)
							.style("display", "none")
					}
				}

			}
		}
		$('#rightSideBar').jScrollPane();
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
				lineDatum["cost"] = (typeof(costs[year]) == "undefined") ? year : costs[year]["baselineDiff"]
				lineData.push(lineDatum)
			}
		}
		return [lineData, data.years];
	}
	function reshapeCostsData(data){
		return data.costs.cumulative.baselineDiff

	}
	function reshapeBarData(data){

		var fullRaces = {"white": "White", "black": "Black", "hispanic": "Hispanic", "native": "Native American","asian":"Asian","other":"Other","hawaiian":"Hawaiian"}

		var baseline = data["baseline"][1]
		var vsBaseline = data["projected"][1]
		var vsLastYr = data["projected"][2]

		// var races = data["baseline"][1].filter()
		var races = []
		for (race in baseline){
			if(baseline.hasOwnProperty(race) && baseline[race] != 0){ races.push(race) }
		}

		var barData = []

		for(var i = 0; i < races.length; i++){
			var group = {},
				race = races[i]
			group["race"] = fullRaces[race]
			group["baseline"] = baseline[race]
			group["last"] = vsLastYr[race]
			group["vsBaseline"] = vsBaseline[race]

			barData.push(group)
		}

		return barData;


	}

	function buildPopulationChart(allData, forecastCount){
		var w, h;
		var layout = getLayout();

		if(PRINT()){
			w = 800
			h = 350

		}
		else{
			if(layout == "normal" || layout == "squeeze"){
				w = window.innerWidth - 220 - 280 - 50 - 50;
				h = (window.innerHeight - 220 - 150) * .5
			}
			else if(layout == "stack"){
				w = window.innerWidth - 220 - 280 - 50 - 50;
				h = (window.innerHeight - 290 - 150) * .5			
			}
			else if(layout == "toggle" || layout == "toggleSqueeze"){
				w = window.innerWidth - 220 - 280 - 50 - 50;
				h = (window.innerHeight - 350) 
			}
			else if(layout == "mobile"){
				w = d3.select("#centerContainer").node().getBoundingClientRect().width
				h = 300 	
			}
		}

		var lineBaseline, lineProjected,
			margin = {top: 20, right: 60, bottom: 30, left: 20},
			width = w - margin.left - margin.right,
			height = h - margin.top - margin.bottom,
			saveForecast = (typeof(forecastCount) == "number" && !PRINT() ),
			data = (saveForecast) ? allData : allData[0],
			years = (saveForecast) ? null : allData[1]



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

			var yMin, yMax;
			if(saveForecast){
				var hist = d3.select(".line.baseline.historical").datum()
				yMin = d3.min([
						d3.min(hist, function(d){ return d.projected}),
						d3.min(hist, function(d){ return d.baseline}),
						d3.min(data, function(d){ return d.projected}),
						d3.min(data, function(d){ return d.baseline})
					])
				yMax = d3.max([
						d3.max(hist, function(d){ return d.projected}),
						d3.max(hist, function(d){ return d.baseline}),
						d3.max(data, function(d){ return d.projected}),
						d3.max(data, function(d){ return d.baseline})
					])

			}else{
				yMin = d3.min([
						d3.min(data, function(d){ return d.projected}),
						d3.min(data, function(d){ return d.baseline})
					])
				yMax = d3.max([
						d3.max(data, function(d){ return d.projected}),
						d3.max(data, function(d){ return d.baseline})
					])
			}


			x.domain([getMinYear(), MAX_YEAR]);
			y.domain([0, yMax]);

			if(! saveForecast){
				var historicalData = data.filter(function(o){ return o.year <= years.diverge-1 && o.year >= getMinYear()})
				var futureData = data.filter(function(o){ return o.year >= years.diverge-1 && o.year >= getMinYear()})
			}
			function updateLastYearMenu() {
				d3.select("#popMenuLast").text("population in " + (years.diverge-1))
				$( "#popMenu" ).selectmenu("refresh")
				if(getBaselineType() == "baseline"){
					d3.select("#popMenuContainer .ui-selectmenu-button.ui-button").style("width", "203px")
					d3.select("#popMenuContainer .ui-selectmenu-text").style("width", "201px")
					d3.select("#popMenuContainer").style("width", "203px")				
				}else{
					d3.select("#popMenuContainer .ui-selectmenu-button.ui-button").style("width", "157px")
					d3.select("#popMenuContainer .ui-selectmenu-text").style("width", "155px")
					d3.select("#popMenuContainer").style("width", "158px")
				}
			}	

			function mouseoverChart(event){
					if (getLayout() == "mobile"){ return false }
					var year = Math.round(x.invert(d3.mouse(this)[0] - margin.left))
					var future = d3.select(".line.projection.future").data()[0].filter(function(o){ return o.year == year})[0]
					var baseline = d3.select(".line.baseline.future").data()[0].filter(function(o){ return o.year == year})[0]
					var historical = d3.select(".line.baseline.historical").data()[0].filter(function(o){ return o.year == year})[0]

					if( ( typeof(historical) == "undefined" && typeof(baseline) == "undefined") || year > MAX_YEAR || d3.mouse(this)[0] < margin.left || d3.mouse(this)[1] < 10 || d3.mouse(this)[1] > height + margin.bottom){
						d3.selectAll(".mouseoverElem").remove()
					}
					else if(typeof(historical) != "undefined"){
						d3.selectAll(".mouseoverElem").remove()
						d3.select("#lineChart").select("svg").select("#lineChartG")
							.append("circle")
							.attr("class", "mouseoverDot mouseoverElem historical")
							.attr("r", 7)
							.attr("cx", x(year))
							.attr("cy", y(historical.baseline))

						d3.select("#lineChart")
							.append("div")
							.attr("class", "ttLabel historical mouseoverElem")
							.style("top", (y(historical.baseline) -10) + "px")
							.style("left", (x(year) + 20) + "px")
							.html("Population: <span>" + d3.format(",.0f")(historical.baseline) + "</span>")

					}else{
						d3.selectAll(".mouseoverElem").remove()

						var activeClass = (d3.selectAll(".line.saved.clickActive").nodes().length == 0) ? "" : " dotActive"

						d3.select("#lineChart").select("svg").select("#lineChartG")
							.append("circle")
							.attr("class", "mouseoverDot mouseoverElem baseline")
							.attr("r", 7)
							.attr("cx", x(year))
							.attr("cy", y(baseline.baseline))
							.attr("stroke-dasharray","2,2")
						d3.select("#lineChart").select("svg").select("#lineChartG")
							.append("circle")
							.attr("class", "mouseoverDot mouseoverElem future" + activeClass)
							.attr("r", 7)
							.attr("cx", x(year))
							.attr("cy", y(future.projected))

						var projectedAdjust = (future.projected <= future.baseline) ? 30 : -10;
						var baselineAdjust = (future.projected > future.baseline) ? 30 : -10;

						d3.select("#lineChart")
							.append("div")
							.attr("class", "ttLabel projection mouseoverElem")
							.style("top", (y(future.projected) + projectedAdjust) + "px")
							.style("left", (x(year) - 170) + "px")
							.html("Forecast population: <span>" + d3.format(",.0f")(future.projected) + "</span>")

						d3.select("#lineChart")
							.append("div")
							.attr("class", "ttLabel baseline mouseoverElem")
							.style("top", (y(future.baseline) + baselineAdjust) + "px")
							.style("left", (x(year) - 170) + "px")
							.html("Baseline population: <span>" + d3.format(",.0f")(future.baseline) + "</span>")

						var sign = (future.projected - future.baseline) < 0 ? "-" : "+";
						var ttBox = d3.select("#lineChart")
							.append("div")
							.attr("class", "mouseoverElem")
							.attr("id", "ttBox")
						ttBox.append("div")
							.attr("id","ttYear")
							.text(year)
						ttBox.append("div")
							.attr("id", "ttPop")
							.html("Population difference: <span>" + sign + d3.format(",.0f")(Math.abs(future.projected - future.baseline)) + "</span>")
						ttBox.append("div")
							.attr("id", "ttCost")
							.html("Cost difference: <span>" + sign + formatCost(future.cost) + "</span>")
					}
			}
		if(d3.select("#lineChart").select("svg").node() == null || PRINT() ){
			var container = (PRINT()) ? "#printLineChart" + forecastCount : "#lineChart"
			var svg = d3.select(container).append("svg").attr("width", w).attr("height", h),

			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "lineChartG");

			g.append("rect")
				.attr("id","bgRect")
				.attr("x",0)
				.attr("y",0)
				.attr("height",height)
				.attr("width",x(years.diverge-1) - x(getMinYear()))

			updateLastYearMenu()

			g.append("g")
			.attr("class","lineChart y axis")
			.call(d3.axisRight(y).ticks(5).tickSize(-width))
			.attr("transform", "translate(" + width + ",0)")
			.select(".domain")
			.remove();

			d3.selectAll(".lineChart.y.axis .tick line")
				.attr("class", function(d){
					return "t" + d
				})

			g.append("text")
				.attr("class", "y axisLabel")
				.attr("x", width )
				.attr("y", -7)
				.text("People")
				console.log(years)

			var axisFunk = (layout == "mobile") ? d3.axisBottom(x).tickFormat(d3.format(".0f")).ticks(5) : d3.axisBottom(x).tickFormat(d3.format(".0f"))

			g.append("g")
			.attr("class","lineChart x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(axisFunk)
			.select(".domain")
			.remove();

			g.append("path")
			.attr("id","lpf")
			.datum(futureData)
			.attr("class", "line projection future")
			.attr("d", lineProjected);

			// g.append("text")
		 //        .attr("dy", -4) //Move the text down
			//    .append("textPath") //append a textPath to the text element
			//     .attr("xlink:href", "#lpf") //place the ID of the path here
			//     .style("text-anchor","end") //place the text halfway on the arc
			//     .attr("startOffset", "100%")
			//     .style("font-size","13px")
   //  			.style("letter-spacing","2px")
			//     .text("Forecasted population");


			g.append("path")
			.attr("id", "lbh")
			.datum(historicalData)
			.attr("class", "line baseline historical")
			.attr("d", lineBaseline);


			// g.append("text")
		 //        .attr("dy", -4) //Move the text down
			//    .append("textPath") //append a textPath to the text element
			//     .attr("xlink:href", "#lbh") //place the ID of the path here
			//     .style("text-anchor","middle") //place the text halfway on the arc
			//     .attr("startOffset", "50%")
			//     .style("font-size","13px")
   //  			.style("letter-spacing","2px")
			//     .text("Historical population");

			g.append("path")
			.attr("id","lbf")
			.datum(futureData)
			.attr("class", "line baseline future")
			.attr("stroke-dasharray","1,5")
			.attr("d", lineBaseline);

			var legend;
			if(layout == "mobile"){
				legend = d3.select(container).insert("div", "#lineChart svg")
								.attr("id","lineLegend")
			}else{
				legend = d3.select(container).append("div")
					.attr("id","lineLegend")
			}
			var l1 = legend.append("div").attr("class","ll-row")
			l1.append("span").attr("class","ll-key historical")
			l1.append("div").attr("class","ll-text").text("Historical population")

			var l2 = legend.append("div").attr("class","ll-row")
			l2.append("span").attr("class","ll-key baseline")
			l2.append("div").attr("class","ll-text").text("Projected population")

			var l3 = legend.append("div").attr("class","ll-row")
			l3.append("span").attr("class","ll-key forecast")
			l3.append("div").attr("class","ll-text").text("Forecast population")

			// g.append("text")
		 //        .attr("dy", -4) //Move the text down
			//    .append("textPath") //append a textPath to the text element
			//     .attr("xlink:href", "#lbf") //place the ID of the path here
			//     .style("text-anchor","end") //place the text halfway on the arc
			//     .attr("startOffset", "100%")
			//     .style("font-size","13px")
   //  			.style("letter-spacing","2px")
			//     .text("Baseline projection");

		}
		else if(saveForecast){
			var g = d3.select("#lineChartG")
			g.append("path")
				.datum(allData)
				.attr("data-count", forecastCount)
				.attr("class", "line projection saved c" + forecastCount + " state-" + getState())
				.attr("d", lineProjected)
				.on("mouseover", function(d){
					var c = d3.select(this).attr("data-count")
					var datum = d3.select(".savedForecast.c" + c).datum()
					highlightForecast(datum)
					mouseoverChart()
				})
				.on("mouseout", function(d){
					var c = d3.select(this).attr("data-count")
					var datum = d3.select(".savedForecast.c" + c).datum()
					dehighlightForecasts(datum)
					mouseoverChart()
				})
				.on("click", function(d){
					var c = d3.select(this).attr("data-count")
					var datum = d3.select(".savedForecast.c" + c).datum()
					loadForecast(datum)
				})


			var future = d3.select(".line.projection.future").node()
			moveToFront(future)
			// future.parentNode.appendChild(future)

		}else{
//FUNCTIONS NEEDED FOR RESIZE
			d3.select("#lineChart").select("svg").attr("width", w).attr("height", h),

			d3.select("#lineChartG").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

			var axisFunk = (layout == "mobile") ? d3.axisBottom(x).tickFormat(d3.format(".0f")).ticks(5) : d3.axisBottom(x).tickFormat(d3.format(".0f"))


			d3.select(".lineChart.x.axis")
			.attr("transform", "translate(0," + height + ")")
			.call(axisFunk)
			.select(".domain")
			.remove();

			d3.select(".y.axisLabel")
				.attr("x", width )

//END RESIZE

			d3.select("#bgRect")
				.attr("height",height)
				.transition()
					.attr("width",x(years.diverge-1) - x(getMinYear()))
			
			updateLastYearMenu()	


			d3.select(".lineChart.y.axis")
			.attr("transform", "translate(" + width + ",0)")
			.transition()
			.call(d3.axisRight(y).ticks(5).tickSize(-width))
			.select(".domain")
			.remove();

			d3.selectAll(".lineChart.y.axis .tick line")
				.attr("class", function(d){
					return "t" + d
				})

			d3.select(".line.projection.future")
			.datum(futureData)
			.transition()
			.attr("d", lineProjected);

			d3.selectAll(".line.projection.saved")
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
		if(!PRINT()){
			d3.select("#lineChart").select("svg")
				.on("mousemove", mouseoverChart)
				.on("mouseout", function(){
					d3.selectAll(".mouseoverElem").remove()
				})
		}

	}
	function buildPopulationText(data, baselineType, forecastCount){


		d3.select("#popChangeText")
			.datum(data)
		var comparisonYear = (baselineType == "baseline") ? data[1]["max"] : data[1]["diverge"],
			popBase = data[0].filter(function(d){ return d.year == comparisonYear })[0]["baseline"],
			popProj = data[0].filter(function(d){ return d.year == data[1]["max"] })[0]["projected"],
			popDiff = popProj - popBase,
			popDiffPercent = 100*(popDiff / popBase),
			popDiffPercentInt = (String(popDiffPercent)).split(".")[0],
			popDiffZero = popDiff == 0,
			popDiffPositive = popDiff > 0,
			popDiffWord1 = (popDiffPositive) ? "increase" : "decrease",
			popDiffWord2 = (popDiffPositive) ? "more" : "fewer",
			text =  "<span>"


			// if(popDiffZero){
			// 	text = "Without any policy changes, the prison population in 2025 is estimated to be " + d3.format(".0f")(popProj) + " people."
			// }
			var popChangeLetter = (popDiffPercentInt[0] == "8" || popDiffPercentInt == "18" ) ? "n" : ""
			d3.select("#popChangeLetter").text(popChangeLetter)

			if(popDiffPercent == 0){
				text += " 0 percent change</span> in the prison population in "
			}else{
				text += " " + d3.format(".1f")(popDiffPercent) + " percent "
				text += popDiffWord1 + " ("
				text += d3.format(",.0f")(Math.abs(popDiff)) + " "
				text += popDiffWord2 + " people)</span> in the prison population in "
			}

			text += data[1]["max"] + "."

			d3.select("#popChangeFirst").text("Compared with the")
			

			var popChangeLetter = (popDiffPercentInt[0] == "8" || popDiffPercentInt == "18" ) ? "n" : ""
			d3.select("#popChangeSecond").text(", these changes would lead to a" + popChangeLetter)



			d3.select("#popChangeText")
				.html(text)

			if(PRINT()){
				var letter = 
				d3.select(".pt" + forecastCount)
					.html("Compared with the 2025 baseline projection, these changes would lead to a" + popChangeLetter + text)
			}

			


			



	}
	function buildDemographicsChart(data, baselineType, forecastCount){ 
	var container = (PRINT()) ? ".pbc" + forecastCount : "#barChart"
	var layout = getLayout();
	d3.select(container)
		.datum(data)
	var w, h;
	if(PRINT()){
		w = 600
		h = 300
	}else{
		if(layout == "normal" || layout == "squeeze"){
			w = window.innerWidth - 220 - 280 - 50 - 50 - 300;
			h = (window.innerHeight - 130 - 350) * .5
		}
		else if(layout == "stack"){
			w = window.innerWidth - 220 - 280 - 50 - 50 - 200;
			h = (window.innerHeight - 130 - 350 - 120) * .5
		}
		else if(layout == "toggle" || layout == "toggleSqueeze"){
			w = window.innerWidth - 120 - 280 - 50 - 50 - 300;
			h = (window.innerHeight - 100) * .5
		}
		else if(layout == "mobile"){
			w = window.innerWidth - 100;
			h = 300
		}
	}

	var margin = {top: 10, right: 20, bottom: 40, left: 38},
	    width = w - margin.left - margin.right,
	    height = h - margin.top - margin.bottom;


	var x0 = d3.scaleBand()
	    .rangeRound([0, width])
	    .paddingInner(0.5);

	var x1 = d3.scaleBand()
	    .padding(0.04);

	var y = d3.scaleLinear()
	    .rangeRound([height, 0])
	    .domain([0,1]);

	var z = (baselineType == "last") ?
		d3.scaleOrdinal()
	    	.range(["#000000", "#ec008b"])
	    :
	    d3.scaleOrdinal()
	    	.range(["#9d9d9d", "#ec008b"]);



	if(d3.select("#barChart").select("svg").node() == null || PRINT()){
		var svg = d3.select(container).append("svg").attr("width", w).attr("height", h),

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
		.attr("x", function(d) {
			if(d.key == "baseline"){
				return x1(d.key) + .5*(30 - x1.bandwidth()) + 1;
			}else{
				return x1(d.key) + .5*(30 - x1.bandwidth());
			}
		})
		.attr("y", function(d) {
			if(d.key == "baseline"){
				return y(d.value) + 1; 
			}else{
				return y(d.value); 
			}
		})
		.attr("width", function(d){
			if(d.key == "baseline"){
				return x1.bandwidth() - 2;
			}else{
				return x1.bandwidth()
			}
		})
		.attr("height", function(d) {
			if(d.key == "baseline"){
				return Math.max(0, height - y(d.value) -1);
			}else{
				return height - y(d.value);
			}
		})
		.attr("fill", function(d) { return z(d.key); })
		.attr("stroke", function(d){
			if(d.key == "baseline"){
				return "#000"
			}else{
				return "none"
			}
		})
		.attr("stroke-dasharray", function(d){
			if(d.key == "baseline"){
				return "2,2"
			}else{
				return "none"
			}
		})
		.attr("stroke-width","2px")


		bars.selectAll("text")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key], diff: (d[key] - d[baselineType])}; }); })
		.enter().append("text")
		.style("opacity", function(d){ return ((d.key) == "baseline") ? 0 : 1})
		.attr("x", function(d) { return x1(d.key) + .5*(30 - x1.bandwidth()); })
		.attr("y", function(d) { return y(d.value) -5; })
		.text(function(d){ return formatPP(d3.format(".2f")(d.diff *100)) })


		g.append("g")
		.attr("class", "x bar axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x0))
    	.selectAll(".tick text")
      		.call(wrap, 100)
      	var bl;
      	if(layout == "mobile"){
      		bl = d3.select(container)
      			.insert("div", "#barChart svg")
      			.attr("id","barLegend")
      	}else{
      		bl = d3.select(container)
      			.append("div")
      			.attr("id","barLegend")
      	}
      	var bl1 = bl.append("div")
      		.attr("class","bl-row")
      	bl1.append("span")
      		.attr("class","bl-key baseline change")
      	bl1.append("div")
      		.attr("class","bl-text baseline change")
      		.text("2025 baseline")

      	var bl2 = bl.append("div")
      		.attr("class","bl-row")
      	bl2.append("span")
      		.attr("class","bl-key forecast")
      	bl2.append("div")
      		.attr("class","bl-text forecast")
      		.text("2025 forecast")

      	bl.append("div")
      		.attr("class","bar-note")
      		.style("opacity",function(d){
      			return (d.filter(function(o){ return o.race == "Hispanic"}).length == 0) ? 1 : 0
      		})
      		.html(getStateName() + "<a href = \"http://apps.urban.org/features/latino-criminal-justice-data/\" target = \"_blank\"> does not report ethnicity</a> in its prison population data.")

	}else{
//FUNCTIONS NEEDED FOR RESIZE
		d3.select("#barChart svg").attr("width", w).attr("height", h),

		d3.select("#barsGroups").attr("transform", "translate(" + margin.left + "," + margin.top + ")")



//END RESIZE
		var keys = [baselineType, "vsBaseline"]

		x0.domain(data.map(function(d) { return d.race; }));
		x1.domain(keys).rangeRound([0, x0.bandwidth()]);
		// y.domain([0, d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();

		var bars = d3.select("#barsGroups").select("g.barsGroup")
		.selectAll("g")
		.data(data)

		var enter = bars.enter().append("g")
		bars = enter.merge(bars)
		.attr("transform", function(d) { return "translate(" + x0(d.race) + ",0)"; })

		

		var rects = bars.selectAll("rect")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })

		rects
		.enter()
		.append("rect")
		.merge(rects)
		.style("opacity",1)
		.transition()
		.attr("x", function(d) {
			if(d.key == "baseline"){
				return x1(d.key) + .5*(30 - x1.bandwidth()) + 1;
			}else{
				return x1(d.key) + .5*(30 - x1.bandwidth());
			}
		})
		.attr("y", function(d) {
			if(d.key == "baseline"){
				return y(d.value) + 1; 
			}else{
				return y(d.value); 
			}
		})
		.attr("width", function(d){
			if(d.key == "baseline"){
				return x1.bandwidth() - 2;
			}else{
				return x1.bandwidth()
			}
		})
		.attr("height", function(d) {
			if(d.key == "baseline"){
				return Math.max(0, height - y(d.value) -1);
			}else{
				return height - y(d.value);
			}
		})
		.attr("fill", function(d) { return z(d.key); })
		.attr("stroke", function(d){
			if(d.key == "baseline"){
				return "#000"
			}else{
				return "none"
			}
		})
		.attr("stroke-dasharray", function(d){
			if(d.key == "baseline"){
				return "2,2"
			}else{
				return "none"
			}
		})
		.attr("stroke-width","2px")

		// rects.exit().remove()

		d3.select("#barsGroups").select("g.barsGroup").selectAll("text").style("opacity",0)



		var texts = bars.selectAll("text")
		.data(function(d) { return keys.map(function(key) { return {key: key, value: d[key], diff: (d[key] - d[baselineType])}; }); })

		texts
		.enter()
		.append("text")
		.merge(texts)
		.style("opacity", function(d){ return ((d.key) == "baseline" || d.key == "last") ? 0 : 1})
		.transition()
		.attr("x", function(d) { return x1(d.key); })
		.attr("y", function(d) { return y(d.value) - 5; })
		.text(function(d){ return formatPP(d3.format(".2f")(d.diff *100)) })

		bars.exit().remove()
		rects.exit().remove()
		texts.exit().remove()



		d3.select(".y.bar.axis")
		.call(d3.axisLeft(y).ticks(5, "%").tickSize(-width))
		.select(".domain")
		.remove();

		d3.select(".x.bar.axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x0))
    	.selectAll(".tick text")
      		.call(wrap, 100)



	  	var blText = (baselineType == "baseline") ? "2025 baseline" : d3.select("#popMenuLast").text().replace("population in ","") + " population"
      	d3.selectAll(".bl-row .change")
      		.classed("baseline", baselineType == "baseline")
      		.classed("last", baselineType != "baseline")
      	d3.select(".bl-text.change")
      		.text(blText)
      		
      	d3.select(".bar-note")
      		.datum(data)
      		.html(getStateName() + "<a href = \"http://apps.urban.org/features/latino-criminal-justice-data/\" target = \"_blank\"> does not report ethnicity</a> in its prison population data.")
      		.transition()
      		.style("opacity",function(d){
      			var op = (d.filter(function(o){ return o.race == "Hispanic"}).length == 0) ? 1 : 0
      			return op
      		})


	}



	    // g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	}
	function buildCostInfo(cost, forecastCount){
		if(getState() == "DC"){
			d3.select("#costText").style("display","none")
			d3.select("#dcText").style("display","block")
		}else{
			d3.select("#costText").style("display","block")
			d3.select("#dcText").style("display","none")
		}

		var container = (PRINT()) ? ".ct" + forecastCount : "#costText"

		d3.select(container + " #costYear").text(MAX_YEAR)
		d3.select(container + " #costWord").text(function(){ return (cost <= 0 ) ? "savings" : "increase"})

		var textCost = formatCost(cost)

		d3.select(container + " #costDollars").text(textCost)

	}
	/*******************************************************/
	/********************* POP UPS *************************/
	/*******************************************************/
	function buildPopup(p, callback, datum){
		closePopUp()
		d3.select("body")
			.append("div")
			.attr("class","popUpCover")
		var pop = d3.select("body")
			.append("div")
			.attr("class", "popUp " + p)

		if(p != "share"){
			pop.append("div")
				.attr("class","popErrorContainer")
				.append("img")
					.attr("src","../img/error.png")

		}
		var popHeadText;
		if(p == "share") { popHeadText = "Share a link to your forecast"}
		else if(p == "unsaved") { popHeadText = "You have unsaved changes" }
		else if(p == "delete") { popHeadText = "Are you sure you want to delete this forecast?"}

		pop.append("div")
			.attr("class", "popHead")
			.text(popHeadText)

		if(p == "share"){
			var uc = pop.append("div")
				.attr("class", "urlContainer")
			uc.append("input")
				.property("value",datum)
		}

		var bc = pop.append("div")
			.attr("class","popButtonContainer")


		if(p == "unsaved"){
			bc.append("div")
				.attr("class","popButton grey")
				.html("Continue")
				.on("click", function(){
					callback(datum)
					closePopUp()
				})
			bc.append("div")
				.attr("class","popButton blue")
				.text("Save forecast")
				.on("click", function(){
					saveForecast()
					closePopUp()
				})
		}
		else if(p == "delete"){
			bc.append("div")
				.attr("class","popButton grey")
				.text("Cancel")
				.on("click", closePopUp)

			bc.append("div")
				.attr("class","popButton blue")
				.text("Delete")
				.on("click", function(){
					callback(datum)
					closePopUp()
				})
		}
		else if(p == "share"){
			bc.append("div")
				.attr("class","popButton grey")
				.text("Close")
				.on("click", closePopUp)
			bc.append("div")
				.attr("class","popButton blue")
				.text("Copy to clipboard")
				.on("click", function(){


  					$(".urlContainer input").select()
  					document.execCommand("copy");

  					d3.select(".copied")
  						.style("opacity",1)

				})

			bc.append("div")
				.attr("class","copied")
				.text("Copied!")
		}

		var checkSelector = (p == "delete") ? "#popDelete" : "#popUnsaved";

		if(p != "share"){
			var cc = pop.append("div")
				.attr("class", "checkContainer")

			var svg = cc.append("div")
				.attr("class","checkMarkContainer")
				.append("svg")
					.attr("width",22)
					.attr("height",22)

			svg.append("rect")
				.style("stroke","#9d9d9d")
				.style("fill", "#d2d2d2")
				.attr("width",15)
				.attr("height",15)
				.attr("left",0)
				.attr("top",10)

			var lineData = [
				{ "x": 4,   "y": 6},
				{ "x":7,  "y": 10},
				{ "x": 18,  "y": 1}
			];

			var lineFunction = d3.line()
				.x(function(d) { return d.x; })
				.y(function(d) { return d.y; })
		

			svg.selectAll("path").remove()

			var path = svg.append("path")
				.attr("class","unchecked")
				.attr("d", lineFunction(lineData))
				.attr("stroke", "#000")
				.attr("stroke-width", "3")
				.attr("fill", "none");

			var totalLength = path.node().getTotalLength();

			path
				.attr("stroke-dasharray", totalLength + " " + totalLength)
				.attr("stroke-dashoffset", totalLength)

			svg.on("click", function(){

				if(d3.select(this).select("path").classed("unchecked")){
					d3.select(this).select("path").classed("unchecked", false)

					d3.select(checkSelector).classed("checked", true)

					d3.select(this).select("path")
						.transition()
						.duration(500)
						.attr("stroke-dashoffset", 0);
				}else{
					d3.select(this).select("path").classed("unchecked", true)

					d3.select(checkSelector).classed("checked", true)

					d3.select(this).select("path")
						.transition()
						.duration(500)
						.attr("stroke-dashoffset", totalLength);

				}
			})


			cc.append("span")
			.html("Please don&rsquo;t show me this warning again")
		}

	}
	function closePopUp(){
		d3.selectAll(".mouseoverElem").remove()
		d3.select(".popUp")
			.transition()
			.style("opacity",0)
			.on("end", function(){
				d3.select(this).remove()
				d3.selectAll(".popUpCover").remove()
			})
	}
	// buildPopup("unsaved")

	/*******************************************************/
	/******************** FORECASTS ************************/
	/*******************************************************/
	var forecastCount = 1;
	function saveForecast(name){
		var forecast = {"inputs": getChildInputs(), "state": getState(), "parents": getParentInputs(), "forecastCount": forecastCount}
		d3.select("#saveForecast").classed("deactivated",true)

		var l = d3.select("#savedForecastsList")
		var name = (forecastCount == 1) ? name : "Forecast " + forecastCount;
		var row = l.append("div")
			.attr("class","savedForecast c" + forecastCount)
			// .text(name)
			.datum(forecast)

			// .on("click", function(d){
			// 	loadForecast(d)
			// })
		row.append("span")
			.attr("class","forecastState")
			.text(function(d){
				return d.state
			})
		row.append("input")
			.attr("value",name)
			.style("pointer-events","none")
			.on("blur", lockForecast)


		var share = row.append("div")
			.attr("class","shareForecast forecastButton")
			.on("click", shareForecast)
		
		var edit = row.append("div")
			.attr("class","editForecast forecastButton")
			.on("click", editForecast)

		var del = row.append("div")
			.attr("class","deleteForecast forecastButton")
			.on("click", function(d){
				if(d3.select("#popDelete").classed("checked")){
					deleteForecast(d)
				}else{
					buildPopup("delete",deleteForecast, d)
				}
			})

		var cover = row.append("div")
			.attr("class","valCover")
			.on("click", function(d){
				if(d3.select("#saveForecast").classed("deactivated") || d3.select("#popUnsaved").classed("checked")){
					loadForecast(d)
				}else{
					buildPopup("unsaved",loadForecast, d)
				}
			})
			.on("mouseover", highlightForecast)
			.on("mouseout", dehighlightForecasts)


		buildPopulationChart(d3.select(".line.projection.future").datum(), forecastCount)

		if(forecastCount != 1){
			clickForecast(forecastCount)
		}

		$('#rightSideBar').jScrollPane();


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

		clickForecast(d.forecastCount)

	}
	function clickForecast(forecastCount){
		d3.selectAll(".savedForecast").classed("clickActive", false)
		d3.select(".savedForecast.c" + forecastCount).classed("clickActive", true)
		d3.select(".line.projection.saved").classed("clickActive", false)
		d3.select(".line.projection.saved.c" + forecastCount).classed("clickActive", true)

		moveToFront(".line.projection.saved.c" + forecastCount)
	}
	function declickForecasts(){
		d3.selectAll(".savedForecast").classed("clickActive", false)
		d3.selectAll(".line.projection.saved").classed("clickActive", false)

		// moveToFront(".line.projection.future")
	}
	function highlightForecast(d){
		d3.select(".savedForecast.c" + d.forecastCount).classed("active", true)
		d3.select(".line.projection.saved.c" + d.forecastCount).classed("active", true)
		d3.select(".line.projection.saved.c" + d.forecastCount).node()

		moveToFront(".line.projection.saved.c" + d.forecastCount)


	}
	function dehighlightForecasts(d){
		d3.selectAll(".savedForecast.active").classed("active",false)
		d3.selectAll(".line.projection.saved").classed("active", false)

		if(d3.selectAll(".clickActive.line.saved").nodes().length == 0){
			moveToFront(".line.projection.future")
		}
		
	}
	function getQueryString(d, obj){
		var inputs = d.inputs,
			parents = d.parents,
			state = d.state,
			name = d3.select(obj.parentNode).select("input").node().value;

		for (var attr in parents) {
			if(parents.hasOwnProperty(attr)){
				inputs[attr] = parents[attr];
			}
		}

		var queryObj = {"inputs": inputs, "state": state, "name": name },
			queryString = encodeForecast(queryObj)

		return queryString

	}
	function shareForecast(d){
		var queryString = getQueryString(d, this)
		buildPopup("share",false,window.location.href.split('?')[0] + "?forecast=" + queryString)
	}
	function encodeForecast(d){

		var allOffenses = OFFENSES.concat(PARENTS).map(function(value,index) { return value[0]; }),
			inputs = Object.assign({}, d.inputs),
			output = Array.apply(null, {length: allOffenses.length}).map(Number.call, Number)
		for(var attr in inputs){
			if(inputs.hasOwnProperty(attr)){
				var ind = allOffenses.indexOf(attr)
				var los = inputs[attr]["los"]["value"]
				var admissions = inputs[attr]["admissions"]["value"]

				output.splice(ind, 1, [parseInt(los),parseInt(admissions)])
			}
		}

		output.push(d.state)
		output.push(d.name)
		var merged = [].concat.apply([], output);

		return encodeURIComponent(JSON.stringify(merged)).replace(/%2C/g,",")

	}
	function decodeForecast(d){
		var allOffenses = OFFENSES.concat(PARENTS).map(function(value,index) { return value[0]; }),
			input = JSON.parse(decodeURIComponent(d)),
			output = {"inputs":{}, "state": input[allOffenses.length*2], "name": input[allOffenses.length*2 + 1]}

		for(var i = 0; i < allOffenses.length*2; i += 2){
			var los = input[i],
				admissions = input[i+1],
				offense = allOffenses[i/2]

			output["inputs"][offense] = { "admissions": { "value": String(admissions), "locked": false }, "los": {"value": String(los), "locked": false } }

		}

		return output


	}

	function deleteForecast(d){
		d3.select(".savedForecast.c" + d.forecastCount).remove()
		d3.select(".line.saved.c" + d.forecastCount)
			.transition()
			.style("opacity",0)
			.on("end", function(){
				d3.select(this).remove()
			})
	}
	function editForecast(d){
		var row = d3.select(d3.select(this).node().parentNode)
		row.select(".valCover").style("width","0px")
		row.select("input").style("pointer-events","auto")
		row.select("input").node().focus()

	}
	function lockForecast(d){
		var row = d3.select(d3.select(this).node().parentNode)
		row.select(".valCover").style("width","106px")
		row.select("input").style("pointer-events","none")
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
				.on("end", function(){
					$('#leftSidebar').jScrollPane();
				})
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
					$('#leftSidebar').jScrollPane();
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
				.on("end", function(){
					$('#leftSidebar').jScrollPane();
				})
		}else{
			var height = (container.classed("tall")) ? "220px" : "205px"
			container.classed("open", true)
			container.select(".childArrow")
				.transition()
				.style("transform","rotate(180deg)")
			container.transition()
				.style("height", height)
				.on("end", function(){
					$('#leftSidebar').jScrollPane();
				})


		}
	}


	$( "#stateSelect" ).selectmenu({
	change: function(event, data){
		//state on change
		//get state
		setState(this.value)
		var inputs = getChildInputs()
		updateYourSelections(inputs)
		sendInputs(this.value, inputs)
	    var m = $(this);
	    if(m.val() == ""){
	      m.css("color", "#818385");
	    }else{ m.css("color", "#333")}

	}
	});

	$( "#popMenu" ).selectmenu({
	change: function(event, data){
		if(this.value == "baseline"){
			d3.select("#popMenuContainer .ui-selectmenu-button.ui-button").transition().style("width", "203px")
			d3.select("#popMenuContainer .ui-selectmenu-text").transition().style("width", "201px")
			d3.select("#popMenuContainer").transition().style("width", "203px")

			buildPopulationText(d3.select("#popChangeText").datum(), "baseline")
			buildDemographicsChart(d3.select("#barChart").datum(), "baseline")
		}else{
			d3.select("#popMenuContainer .ui-selectmenu-button.ui-button").transition().style("width", "157px")
			d3.select("#popMenuContainer .ui-selectmenu-text").transition().style("width", "155px")
			d3.select("#popMenuContainer").transition().style("width", "158px")

			buildPopulationText(d3.select("#popChangeText").datum(), "last")
			buildDemographicsChart(d3.select("#barChart").datum(), "last")

		}

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
	d3.select("#printIcon")
		.on("click", function(){
			window.open(buildPrintURL(), "_blank")
		})


	/*******************************************************/
	/****************** ABOUT SECTION **********************/
	/*******************************************************/

	d3.select("#aboutClose")
		.on("mouseover", function(){
			d3.select(this)
				.attr("src","img/closeHover.png")
		})
		.on("mouseout", function(){
			d3.select(this)
				.attr("src","img/close.png")
		})
		.on("click", function(){
			d3.select("#headerAboutLink").classed("closed", true)
			d3.select("#aboutContainer")
				.transition()
				.style("top", "-800px")
		})

	d3.select("#headerAboutLink")
		.on("click", function(){
			d3.select(this).classed("closed", function(){ return !d3.select(this).classed("closed") })
			d3.select("#aboutContainer")
				.transition()
				.style("top", function(){
					return (d3.select("#headerAboutLink").classed("closed") ? "-800px" : "50px")
				})

		})

	
						
	/*******************************************************/
	/*********************** PRINT *************************/
	/*******************************************************/
	function buildPrintHeader(h){
		h.append("img")
			.attr("class","printLogo")
			.attr("src","img/logo.png")
		h.append("div")
			.attr("class","printTitle")
			.html("Prison Population <span>Forecaster</span>")

	}

	function buildPrintView(forecasts){
		d3.select("body").classed("print",true).classed("hide",false)
		// d3.select("#printContainer")
		for(var i = 1; i <= forecasts.length; i++){

			var container = d3.select("#printContainer")

			var ph = container
				.append("div")
				.attr("class", "printHeader ph" + i)

			buildPrintHeader(ph)
			
			var pi = container
				.append("div")
				.attr("class", "printIntro pi" + i)
				.html(d3.select("#introText").html())

			var pfn = container
				.append("div")
				.attr("class", "printForecastName pfn" + i)
				

			var psn = container
				.append("div")
				.attr("class", "printStateName psn" + i)

			var oc = container
				.append("div")
				.attr("class", "offenseContainer oc" + i)

			container
				.append("div")
				.attr("class", "page-break")

			var ph2 = container
				.append("div")
				.attr("class", "printHeader ph2" + i)

			buildPrintHeader(ph2)

			container
				.append("div")
				.attr("class", "printSubhead pop")
				.text("Population")

			var pt = container
				.append("div")
				.attr("class", "popText pt" + i)
				.text("pop text")
				
			container
				.append("div")
				.attr("id", "printLineChart" + i)
				.attr("class","printLineChart")

			container
				.append("div")
				.attr("class", "printSubhead demo")
				.text("Demographics")

			var dc = container
				.append("div")
				.attr("class", "printBarChart pbc" + i)

			container
				.append("div")
				.attr("class", "printSubhead cost")
				.text("Cost")






			container
				.append("div")
				.attr("class", "page-break")

			// buildPopulationChart(forecast, i)
			var forecast = decodeForecast(forecasts[i-1]),
				inputs = forecast.inputs,
				state = forecast.state;
				name = forecast.name;
			
				// setInputs(inputs)

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
		pfn.text(name)
		psn.text(getStateName(state))


		if(state == "DC"){
			var ct = container
				.append("div")
				.attr("class", "printCostText ct" + i)
				.html("Corrections spending data are not available for Washington, DC.")

		}else{
			var ct = container
				.append("div")
				.attr("class", "printCostText ct" + i)
				.html("By <span id = \"costYear\"></span>, these changes would lead to a <span id = \"costHighlight\">cumulative <span id = \"costWord\"></span> of <span id = \"costDollars\"></span></span>.")
		}


		oc.selectAll("printColumn")
			.data(PARENTS)
			.enter()
			.append("div")
			.attr("class", function(d){ return "printColumn " + d[0] })
		for(var j = 0; j < PARENTS.length; j++){
			var parent = PARENTS[j][0],
				name = PARENTS[j][1].replace("All ",""),
				container = d3.select(".oc" + i + " .printColumn." +  parent),
				children = SUBCATEGORIES[parent]

			// buildOffense(container, name, inputs[parent]["admissions"]["value"], inputs[parent]["los"]["value"], true)
			var parentHeader = name.charAt(0).toUpperCase() + name.slice(1);

			container.append("div")
				.attr("class","printOffenseHead")
				.text(parentHeader)

			for(var k = 0; k<children.length;k++){
				var child = children[k],
				name = OFFENSES.filter(function(o){ return o[0] == child;})[0][1]

				buildOffense(container, name, inputs[child]["admissions"]["value"], inputs[child]["los"]["value"], false)
			}
		}

		buildPopulationText(lineData, "baseline", i)
		buildPopulationChart(lineData, i)
		buildCostInfo(costsData, i)
		buildDemographicsChart(barData, "baseline", i)
// 
		






		}
	}

	function buildOffense(container, name, admissions, los){
		var off = container.append("div")
			.attr("class", "printOffense")
		off.append("div")
			.attr("class","printOffenseName")
			.text(name)
		var r1 = off.append("div")
			.attr("class", "printOffenseStat")
			.html("Admissions<span>&hellip;</span>" + admissions + "%")
		var r2 = off.append("div")
			.attr("class", "printOffenseStat")
			.html("Length of prison term<span>&hellip;</span>" + los + "%")

			
	}

	function buildPrintURL(){
		var printURL = window.location.href.split('?')[0] + "?print=true"

		d3.selectAll(".savedForecast")
			.each(function(d,i){
				printURL += "&forecast" + (i+1) + "=" + getQueryString(d, d3.select(this).select(".shareForecast").node())
			})
		return printURL

	}


	/*******************************************************/
	/**************** RESPONSIVE LAYOUTS *******************/
	/*******************************************************/
	function toggleLayout(layout, animate){
		var buttonText = (layout == "line") ? "Show details" : "Hide details"
		d3.select("#toggleButton")
			.style("display","block")
			.text(buttonText)
		var duration = (animate) ? 500 : 0;
		if(layout == "bar"){
			d3.select("#centerContainer")
				.transition()
				.duration(duration)
				.style("top","-1000px")
			d3.select("#demographicSection")
				.transition()
				.duration(duration)
				.style("top", "70px")
			d3.select("#costSection")
				.transition()
				.duration(duration)
				.style("top", "70px")
			d3.select("#barChart")
				.transition()
				.duration(duration)
				.style("bottom","100px")
		}else{
			d3.select("#centerContainer")
				.transition()
				.duration(duration)
				.style("top","50px")
			d3.select("#demographicSection")
				.transition()
				.duration(duration)
				.style("top", (window.innerHeight + 100) + "px")
			d3.select("#costSection")
				.transition()
				.duration(duration)
				.style("top", (window.innerHeight + 100) + "px")
			d3.select("#barChart")
				.transition()
				.duration(duration)
				.style("bottom","-1000px")
		}
	}
	function normalLayout(){
		d3.select("#toggleButton")
			.style("display","none")
		d3.select("#centerContainer")
			.style("top","50px")
		d3.select("#demographicSection")
			.style("top", "calc(50% + 40px)")
		d3.select("#costSection")
			.style("top", "calc(50% + 40px)")
		d3.select("#barChart")
			.style("bottom","10px")
	}
	function stackLayout(){
		d3.select("#toggleButton")
			.style("display","none")
		d3.select("#centerContainer")
			.style("top","50px")
		d3.select("#demographicSection")
			.style("top", "calc(50% + 40px)")
		d3.select("#costSection")
			.style("top", "calc(50% + 40px)")
		d3.select("#barChart")
			.style("bottom","10px")
	}
	function mobileLayout(){
		d3.select("#toggleButton")
			.style("display","none")
		d3.select("#centerContainer")
			.style("top","auto")
		d3.select("#demographicSection")
			.style("top", "auto")
		d3.select("#costSection")
			.style("top", "auto")
		d3.select("#barChart")
			.style("bottom","auto")

		d3.select("#mobileDatePublished").html(d3.select("#datePublished").html())

		d3.select("#mn-menu").style("height",window.innerHeight + "px")
	}
	function resizeSidebars(){
		var ch = d3.select("#centerContainer").node().getBoundingClientRect().height,
			rh = d3.select("#rightSideBar").node().getBoundingClientRect().height, 
			lh = d3.select("#leftSidebar").node().getBoundingClientRect().height

		var max = d3.max([ch, rh, lh])

		 d3.select("#leftSidebar").style("padding-bottom", (max - lh + 100) + "px");
		 d3.select("#rightSideBar").style("padding-bottom", (max - rh + 100) + "px")
	}
	d3.select("#toggleButton")
		.on("click", function(){
			if(d3.select(this).classed("line")){
				d3.select(this).classed("line", false).classed("bar", true)
				toggleLayout("bar", true)
			}else{
				d3.select(this).classed("line", true).classed("bar", false)
				toggleLayout("line", true)
			}
		})
	d3.select("#leftSidebar")
		.on("mouseover", function(){
			d3.select(this).selectAll(".jspVerticalBar").style("opacity",.7)
		}) 
		.on("mouseout", function(){
			d3.select(this).selectAll(".jspVerticalBar").style("opacity",0)
		}) 
	d3.select("#rightSideBar")
		.on("mouseover", function(){
			d3.select(this).selectAll(".jspVerticalBar").style("opacity",.7)
		}) 
		.on("mouseout", function(){
			d3.select(this).selectAll(".jspVerticalBar").style("opacity",0)
		}) 
	d3.select("#mn-header")
		.on("click", function(){
			if(d3.select(this).classed("open")){
				d3.select(this).classed("open",false)

				d3.select("#mn-menu")
					.transition()
					.style("left","-300px")

				d3.select("#mn-start")
					.style("color","white")
					.text("Start here")

				d3.select("#mn-boorger")
					.transition()
					.style("left","24px")

				d3.select("#leftSidebar")
					.transition()
					.style("left","-300px")

			}
			else if(d3.select(this).classed("drawerOpen")){
				d3.select(this).classed("open", true)
				d3.select(this).classed("drawerOpen", false)

				d3.select("#mn-start")
					.style("color","#353535")
					.text("Return to global menu")

				d3.select("#leftSidebar")
					.transition()
					.style("left","-300px")
				d3.select("#rightSideBar")
					.transition()
					.style("left","-300px")
			}
			else{
				d3.select(this).classed("open",true)
				d3.select(this).classed("drawerOpen",false)


				d3.select("#mn-menu")
					.transition()
					.style("left","0px")

				d3.select("#mn-start")
					.style("color","#353535")
					.text("Return to global menu")

				d3.select("#mn-boorger")
					.transition()
					.style("left","150px")
			}
		})

		d3.select("#mn-left")
			.on("click", function(){
				if(d3.select("#mn-header").classed("drawerOpen")){ return false }
				d3.select("#mn-header").classed("drawerOpen",true)
				d3.select("#mn-header").classed("open",false)
				d3.select("#mn-start")
						.style("color","white")
				d3.select("#leftSidebar")
					.transition()
					.style("left","0px")
		})
		d3.select("#mn-right")
			.on("click", function(){
				if(d3.select("#mn-header").classed("drawerOpen")){ return false }
				d3.select("#mn-header").classed("drawerOpen",true)
				d3.select("#mn-header").classed("open",false)
				d3.select("#mn-start")
						.style("color","white")
				d3.select("#rightSideBar")
					.transition()
					.style("left","0px")


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
		x = {"arson": { "admissions": {"value": "40", "locked": true}, "los": {"value": "50", "locked": true} } }
		y = JSON.stringify(x)
		z = encodeURIComponent(y)

		q = JSON.parse(decodeURIComponent(z))

		var parameters = parseQueryString(window.location.search);
		var name = "Sample forecast"
		var state = ""
		if(parameters.hasOwnProperty("print")){
			var forecasts = []
			for(var i = 1; i < Infinity; i++){
				if(parameters.hasOwnProperty("forecast" + i)){
					forecasts.push(parameters["forecast" + i])
				}else{
					break;
				}
			}
			buildPrintView(forecasts)
			window.print()

		}
		else{
			d3.select("body").attr("class", getLayout())

			if(parameters.hasOwnProperty("state")){
				setState(parameters.state)
			}
			if(parameters.hasOwnProperty("forecast")){
				var forecastString = parameters["forecast"],
					forecast = decodeForecast(forecastString),
					inputs = forecast.inputs,
					state = forecast.state;
				name = forecast.name;
				if(! parameters.hasOwnProperty("state")){
					setState(state)
				}
				setInputs(inputs)
			}
			updateInputs(false, false, false, false, "init")
			d3.select("#saveForecast").classed("deactivated",true)
			saveForecast(name)
			handleResize()

		}


		// setState("KS")
		// setInputs({"violent": { "admissions": {"value": "-20", "locked": true}, "los": {"value": "-20", "locked": true} } })

	}
	function handleResize(){
		$('#leftSidebar').jScrollPane();
		$('#rightSideBar').jScrollPane();
		var layout = getLayout()
		if(layout != "mobile"){
			resizeSidebars();
		}
		if(layout == "toggle" || layout == "toggleSqueeze"){
			toggleLayout(getToggleState(), false)
		}
		else if(layout == "normal" || layout == "squeeze"){
			normalLayout();
		}
		else if(layout == "stack"){
			stackLayout();
		}
		else if(layout == "mobile"){
			mobileLayout();
		}
	}

	init();
	$(window).resize(function(){
		if(!PRINT()){
			d3.select("body").attr("class",getLayout())
			updateInputs(false, false, false, false, "init")
			handleResize()
		}
	})
}();
