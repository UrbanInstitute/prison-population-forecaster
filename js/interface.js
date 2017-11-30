var offenses = [
{
	"name": "All Violent",
	"id": "violent",
	"subcategories":[
		{
			"id": "assault",
			"name": "Assault"
		},
		{
			"id": "homicide",
			"name": "Homicide"
		},
		{
			"id": "kidnapping",
			"name": "Kidnapping"
		},
		{
			"id": "robbery",
			"name": "Robbery"
		},
		{
			"id": "sexassault",
			"name": "Sexual assault"
		},
		{
			"id": "otherviol",
			"name": "Other violent"
		}

	]
},
{
	"name": "All Drug",
	"id": "drug",
	"subcategories":[
		{
			"id": "drugposs",
			"name": "Drug possession"
		},
		{
			"id": "drugtraff",
			"name": "Drug trafficking"
		},
		{
			"id": "otherdrug",
			"name": "Other drug"
		}

	]
},
{
	"name": "All Property",
	"id": "property",
	"subcategories":[
		{
			"id": "arson",
			"name": "Arson"
		},
		{
			"id": "burglary",
			"name": "Burglary"
		},
		{
			"id": "fraud",
			"name": "Fraud"
		},
		{
			"id": "larceny",
			"name": "Larceny"
		},
		{
			"id": "mvtheft",
			"name": "Motor vehicle theft"
		},
		{
			"id": "otherprop",
			"name": "Other property"
		}

	]
},
{
	"name": "All Other",
	"id": "other",
	"subcategories":[
		{
			"id": "dwi",
			"name": "DWI"
		},
		{
			"id": "weapons",
			"name": "Weapons"
		},
		{
			"id": "public_oth",
			"name": "Public other"
		}
	]
},
{
	"name": "All Nonviolent",
	"id": "nonviolent",
	"subcategories":[
		{
			"id": "arson",
			"name": "Arson"
		},
		{
			"id": "burglary",
			"name": "Burglary"
		},
		{
			"id": "drugposs",
			"name": "Drug possession"
		},
		{
			"id": "drugtraff",
			"name": "Drug trafficking"
		},
		{
			"id": "dwi",
			"name": "DWI"
		},
		{
			"id": "fraud",
			"name": "Fraud"
		},
		{
			"id": "larceny",
			"name": "Larceny"
		},
		{
			"id": "mvtheft",
			"name": "Motor vehicle theft"
		},
		{
			"id": "weapons",
			"name": "Weapons"
		},
		{
			"id": "otherdrug",
			"name": "Other drug"
		},
		{
			"id": "public_oth",
			"name": "Public other"
		}

	]
}


]


 // ["violent","All Violent"], ["drug", "All Drug"], ["property", "All Property"], ["nonviolent", "All Nonviolent"], ["other", "All Other"], ["arson", "Arson"],["assault", "Assault"],["burglary", "Burglary"],["drugposs", "Drug possession"],["drugtraff", "Drug trafficking"],["dwi", "DWI"],["fraud", "Fraud"],["homicide", "Homicide"],["kidnapping", "Kidnapping"],["larceny", "Larceny"],["otherdrug", "Other drug"],["otherprop", "Other property"],["otherviol", "Other violent"],["public_oth", "Public other"],["robbery", "Robbery"],["sexassault", "Sexual assault"],["weapons", "Weapons"],["mvtheft", "Motor vehicle theft"]
 // ]


var sidebar = d3.select("#sidebar")

sidebar.append("div")
	.attr("class", "stateSelect container")
	.text("Placeholder: select a state")

var allOffenses = sidebar.append("div")
	.datum({"name": "All Offenses","id": "all"})
	.attr("class", "allOffenses container inputContainer")
	.each(function(d){ buildControls(this) })


var subOffenses = sidebar.append("div")
	.attr("class", "subOffenses container")

subOffenses.append("div")
	.attr("id", "offensesLabel")
	.attr("class", "inputSmallLabel")
	.text("Categories")

for (var i = 0; i < offenses.length; i++){
	var offense = offenses[i];
	var offenseCategory = subOffenses.append("div")
		.attr("class", "offenseCategory container closed c-" + i)
	offenseCategory.append("div")
		.attr("class","expandArrowContainer")
		.on("click", function(){
			if(d3.select(this.parentNode).classed("closed")){
				var h = 0;
				d3.select(this.parentNode).selectAll(".inputContainer")
					.each(function(){
						h += this.getBoundingClientRect().height
					})
				d3.select(this.parentNode)
					.classed("closed", false)
					.classed("open", true)
					.transition()
					.style("height", h + "px")
				d3.select(this).select(".expandArrow")
					.transition()
					.style("transform","rotate(180deg)")
			}else{
				d3.select(this.parentNode)
					.classed("closed", true)
					.classed("open", false)
					.transition()
					.style("height", 46 + "px")
				d3.select(this).select(".expandArrow")
					.transition()
					.style("transform","rotate(0deg)")
			}
		})
		.append("img")
			.attr("class", "expandArrow")
			.attr("src", "img/expandArrow.png")


	var parentCategory = offenseCategory
		.append("div")
		.datum(offense)
		.attr("class", function(d){ return "parentCategory inputContainer " + d.id })
		.each(function(d){ buildControls(this) })


	var category = offenseCategory
		.selectAll(".category")
		.data(offense["subcategories"])
		.enter()
		.append("div")
		.attr("class", function(d){ return "category inputContainer " + d.id })
		// .text(function(d){ return d.name })
		.each(function(d){
			buildControls(this)
		})

}
subOffenses.append("div")
	.attr("id", "resetButton")
	.text("Reset all filters")
	.on("click", resetAll)


function resetAll(){
	d3.selectAll(".input")
		.each(function(){
			this.value = 0
		})
	d3.selectAll(".range")
		.each(function(){
			this.value = 0
		})
	d3.selectAll(".checkbox")
		.each(function(){
			this.checked = false
		})
}

function buildControls(o){
	var obj = d3.select(o)

	obj.append("div")
		.attr("class", "categoryName")
		.text(function(d){ return d.name })
	var los = obj.append("div")
		.attr("class", function(d){ return "losContainer " + d.id })

	los.append("input")
		.attr("type","checkbox")
		.attr("class", "los checkbox")
		.on("change", function(d){
			updateCheckboxes("los", this, d)
		})

	los.append("div")
		.text("Length of stay")
		.attr("class", "los label")


	los.append("input")
		.attr("class", "los input")
		.attr("value", 0)
		.on("input", function(d){
			updateInputs("los", this, d)
		})

	var losRangeContainer = los.append("div")
		.attr("class", "los rangeContainer")
		.style("opacity",0)
		.on("mouseover", function(){
			d3.select(this)
				.transition()
				.style("opacity",1)
		})
		.on("mouseout", function(){
			d3.select(this)
				.transition()
				.style("opacity",0)
		})


	losRangeContainer.append("input")
		.attr("class", "los range")
		.attr("type", "range")
		.attr("value", 0)
		.attr("min", -100)
		.attr("max", 100)
		.attr("step", 1)
		.on("input", function(d){
			updateInputs("los", this, d)
		})


	var admissions = obj.append("div")
		.attr("class", function(d){ return "admissionsContainer " + d.id })

	admissions.append("input")
		.attr("type","checkbox")
		.attr("class", "admissions checkbox")
		.on("change", function(d){
			updateCheckboxes("admissions", this, d)
		})
		

	admissions.append("div")
		.text("New admissions")
		.attr("class", "admissions label")

	admissions.append("input")
		.attr("class", "admissions input")
		.attr("value", 0)
		.on("input", function(d){
			updateInputs("admissions", this, d)
		})

	var admissionsRangeContainer = admissions.append("div")
		.attr("class", "admissions rangeContainer")
		.style("opacity",0)
		.on("mouseover", function(){
			d3.select(this)
				.transition()
				.style("opacity",1)
		})
		.on("mouseout", function(){
			d3.select(this)
				.transition()
				.style("opacity",0)
		})


		
	admissionsRangeContainer.append("input")
		.attr("class", "admissions range")
		.attr("type", "range")
		.attr("value", 0)
		.attr("min", -100)
		.attr("max", 100)
		.attr("step", 1)
		.on("input", function(d){
			updateInputs("admissions", this, d)
		})

	function updateInputs(inputType, obj, d){
			if(d.id == "all"){
				d3.selectAll("." + inputType + ".input")
					.each(function(){ this.value =  obj.value; })
				d3.selectAll("." + inputType + ".range")
					.each(function(){ this.value =  obj.value; })
			}
			else if(d.hasOwnProperty("subcategories")){
				d.subcategories.forEach(function(category){
					var id = category.id
					d3.selectAll("." + inputType + "Container." + id)
						.each(function(){
							d3.select(this).select("." + inputType + ".input").node().value =  obj.value;
						})
					d3.selectAll("." + inputType + "Container." + id)
						.each(function(){
							d3.select(this).select("." + inputType + ".range").node().value =  obj.value;
						})
				})
			}
			
			d3.select(obj.parentNode.parentNode).select("." + inputType + ".input").node().value =  obj.value;
			d3.select(obj.parentNode).select("." + inputType + ".range").node().value =  obj.value;
			updateCheckboxes(inputType, obj, d, true)
			
	}

	function updateCheckboxes(inputType, obj, d, checked){
			if(typeof(checked) == "undefined"){
				checked = obj.checked;
			}
			if(d.id == "all"){
				d3.selectAll("." + inputType + ".checkbox")
					.each(function(){ this.checked =  checked; })
			}
			else if(d.hasOwnProperty("subcategories")){
				d.subcategories.forEach(function(category){
					var id = category.id
					d3.selectAll("." + inputType + "Container." + id)
						.each(function(){
							d3.select(this).select("." + inputType + ".checkbox").node().checked =  checked;
						})
				})
			}
			
			d3.select(obj.parentNode.parentNode).select("." + inputType + ".checkbox").node().checked =  checked;

	}
		

}



	// } else if (one_scenario[0] === "other") {
	// 	var expanded = [["dwi", one_scenario[1], one_scenario[2]], ["weapons", one_scenario[1], one_scenario[2]],["public_oth", one_scenario[1], one_scenario[2]]]
	// } else if (one_scenario[0] === "nonviolent") {
	// 	var expanded = [["arson", one_scenario[1], one_scenario[2]], ["burglary", one_scenario[1], one_scenario[2]], ["drugposs", one_scenario[1], one_scenario[2]], ["drugtraff", one_scenario[1], one_scenario[2]], ["dwi", one_scenario[1], one_scenario[2]], ["fraud", one_scenario[1], one_scenario[2]], ["larceny", one_scenario[1], one_scenario[2]], ["mvtheft", one_scenario[1], one_scenario[2]], ["otherdrug", one_scenario[1], one_scenario[2]], ["otherprop", one_scenario[1], one_scenario[2]], ["public_oth", one_scenario[1], one_scenario[2]], ["weapons", one_scenario[1], one_scenario[2]]]
	// }