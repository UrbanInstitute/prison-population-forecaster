// Data is pulled in via .js files referenced in the index.html

// define lots of functions

Math.tanh = Math.tanh || function(x){
    var a = Math.exp(+x), b = Math.exp(-x);
    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (a + b);
}



function getProjEndYear(){
	return 2025;
}

// Main function
function StateProjections(ST,scenarios_list) {
	var racesums = {"white":0,
								"black":0,
								"hispanic":0,
								"native":0,
								"asian":0,
								"hawaiian":0,
								"other":0};
	var racePCT = {"white":0,
								"black":0,
								"hispanic":0,
								"native":0,
								"asian":0,
								"hawaiian":0,
								"other":0};
	var raceLYsums = {"white":0,
								"black":0,
								"hispanic":0,
								"native":0,
								"asian":0,
								"hawaiian":0,
								"other":0};
	var raceLYPCT = {"white":0,
								"black":0,
								"hispanic":0,
								"native":0,
								"asian":0,
								"hawaiian":0,
								"other":0};								
	var popThruYears = {};

	// -- Grab the historical counts data from the selected state!
	var stateData = counts[ST];
	// Data is organized by state, crime, and then each array is [nt, e, l]

	// -- Grab unique categories of crimes
	var categories = stateData.catList

	var all_scenarios = ExpandScenario(scenarios_list)
	var lastyr = stateData.endYear - 1;
	var firstyr = stateData.startYear;
	
	// Get scenario population projection counts in each category
	var population_totals = {};

	population_totals.years = {};
	population_totals.years.startYear = firstyr;
	population_totals.years.endYear = lastyr;
	population_totals.years.projYear = getProjEndYear();


	// IMPORTANT: This is where you go to the main part of the model...where you project the population for each category. 
	for (var i = 0; i < categories.length; i++) {
		// categories are the categories that are present in each individual state (might not be ALL possible categories)

		var details = 0; 
		//   #If details == 0, just returns year and N
  		//   #If details == 1, also returns e, p, l
		
		//All_scenarios is all scenarios that have been modified by the user in the input
		population_totals[categories[i]] = CatProjections(categories[i],stateData,all_scenarios,details)
	}
	// DW note: can make this more efficient and smaller...ignore "unknown" and ignore "hisp_f"
	var RE = racedata[ST]

	// multiply number of people by percent for each category, sum up by race
	for (cat in RE) {		
		if (cat !== "unknown") {
			if (population_totals[cat] != undefined) {
				for (race in racesums) {
					racesums[race] = racesums[race] + (RE[cat][race]*population_totals[cat][getProjEndYear()-firstyr])
					raceLYsums[race] = raceLYsums[race] + (RE[cat][race]*population_totals[cat][lastyr-firstyr])
				}
			}			
		}		
	}

	var popTotal = 0;
	var popLYTotal = 0;
	for (race in racesums) {
		popTotal += racesums[race];
		popLYTotal += raceLYsums[race];
	}
	
	// calculate ethnicity percents. 
	for (race in racesums) {
		racePCT[race] = racesums[race] / popTotal;
		raceLYPCT[race] = raceLYsums[race] / popLYTotal;
	}

	// sum up the populations overall
	for (cat in population_totals) {
		if (cat != "years") {
			for (var i = 0; i < population_totals[cat].length; i++) {
				var yearT = i + firstyr;
				if (popThruYears[yearT] === undefined) {					
					popThruYears[yearT] = population_totals[cat][i];
				}
				else {
					popThruYears[yearT] += population_totals[cat][i];
				}
			}
		}
	}
	// console.log(population_totals)		
	return [popThruYears, racePCT, raceLYPCT]
}

// projected cost savings/increase function
function CostProjections(projData,baseData,lastYear,costpercap) {
	var costData = {};
	var costCumulativeBaseline = 0;
	var costCumulativeLastYear = 0;
	for (var i = (lastYear + 1); i <= getProjEndYear(); i++) {		
		costData[i] = {};

		pctB = (baseData[i] - projData[i]) / baseData[i]
		pctLY = (baseData[lastYear] - projData[i]) / baseData[lastYear]
		if (Math.abs(pctB) <= 0.12) {			
			costData[i]["baselineDiff"] = ((projData[i] - baseData[i])*costpercap*(0.12));			
		} else if (Math.abs(pctB) > 0.12) {
			costData[i]["baselineDiff"] = ((projData[i] - baseData[i])*costpercap*Math.abs(pctB));
		}
		costCumulativeBaseline += costData[i]["baselineDiff"];
		
		if (Math.abs(pctLY) <= 0.12) {
			costData[i]["lastYearDiff"] = ((projData[i] - baseData[lastYear])*costpercap*(0.12));			
		} else if (Math.abs(pctLY) > 0.12) {
			costData[i]["lastYearDiff"] = ((projData[i] - baseData[lastYear])*costpercap*Math.abs(pctLY));
		}
		costCumulativeLastYear += costData[i]["lastYearDiff"];
	}
	costData["cumulative"] = {};
	costData["cumulative"]["baselineDiff"] = costCumulativeBaseline;
	costData["cumulative"]["lastYearDiff"] = costCumulativeLastYear;
	return costData;
}

function CatProjections(cat,stateData,all_scenarios,details) {
  // Category Projections
  // #Given offense category & scenario, produce category-specific population projection
  // #Inputs:
  //   #category = category string 
  //   #counts.st = dataframe of counts for state
  //   #scen.cat = scenario
  //   #details = 0 to just return population projections; 1 to return all variables including admissions, LOS


	var lastyr = stateData.endYear - 1;  //#last year of real data....DW
	var firstyr = stateData.startYear;   //#first year of real data
	// var firstyr_formean = lastyr-4   //#first year of data to be incorporated into projections

	// #get scenario-dependent multiplier for e (admissions/entrances) and l (length of stay)  
	// Baseline = 1, so these categories are uneffected by the scenarios defined by user; these are default
	var e_multiplier = 1;
	var l_multiplier = 1;

	for (var i = 0; i < all_scenarios.length; i++) {
		if (all_scenarios[i][0] === cat) {  		
			// Find multiplier for All scenarios that have been changed by the USER and that have categories/data in the selected state.
			if (all_scenarios[i][2] === 1) {
				var e_multiplier = 1 + all_scenarios[i][1];
			} else if (all_scenarios[i][2] === 2) {
				var l_multiplier = 1 + all_scenarios[i][1];
			}
		}
	}
  
  	// #calculate 2025 values for admissions (e) & LOS (l)
  			
		// #admissions calculations
	var yearIndex = stateData[cat].length - 1;
	

	//  if there are 5 or more years of historic data, do the following calculations. 
	if (lastyr-firstyr >= 4 ) {
		var last5e = [stateData[cat][yearIndex - 5][1],stateData[cat][yearIndex - 4][1],stateData[cat][yearIndex - 3][1],stateData[cat][yearIndex - 2][1],stateData[cat][yearIndex - 1][1]];

		var e_pc_1 = (last5e[1] - last5e[0])/last5e[0]; //#oldest year
		var e_pc_2 = (last5e[2] - last5e[1])/last5e[1];
		var e_pc_3 = (last5e[3] - last5e[2])/last5e[2];
		var e_pc_4 = (last5e[4] - last5e[3])/last5e[3]; //#most recent year

		// #calculate weighted mean of percent changes (x4, then adjusted by tanh to bound between -1 and 1)
		var e_pct_chg = Math.tanh((weightedMean([e_pc_1, e_pc_2, e_pc_3, e_pc_4],[1,2,2,3])*4))			
	  	// #apply e_pct_chg to weighted mean of values in recent years; apply multiplier to simulate change from policy scenario
		var e_final = e_multiplier*(weightedMean(last5e,[1,1,2,2,3])+ (e_pct_chg*weightedMean(last5e,[1,1,2,2,3])))

		// #length of stay calculations
		var last5l = [stateData[cat][yearIndex - 5][2],stateData[cat][yearIndex - 4][2],stateData[cat][yearIndex - 3][2],stateData[cat][yearIndex - 2][2],stateData[cat][yearIndex - 1][2]];
		var l_pc_1 = (last5l[1] - last5l[0])/last5l[0]; //#oldest year
		var l_pc_2 = (last5l[2] - last5l[1])/last5l[1];
		var l_pc_3 = (last5l[3] - last5l[2])/last5l[2];
		var l_pc_4 = (last5l[4] - last5l[3])/last5l[3]; //#most recent year
		var l_pct_chg = Math.tanh((weightedMean([l_pc_1, l_pc_2, l_pc_3, l_pc_4],[1,2,2,3])*4))			
		var l_final = l_multiplier*(weightedMean(last5l,[1,1,2,2,3])+ (l_pct_chg*weightedMean(last5l,[1,1,2,2,3])))			


			// #last year of real data      
		var e_lastval = stateData[cat][yearIndex - 1][1];  
		var l_lastval = stateData[cat][yearIndex - 1][2];

			// #calculate step for equal interval between years 
		var e_step = (e_final-e_lastval)/(getProjEndYear()-lastyr);
		var l_step = (l_final-l_lastval)/(getProjEndYear()-lastyr);
  	}

  	//  if there are 4 years of historic data, do the following calculations. 
  	else if (lastyr-firstyr === 3) {

		var last5e = [stateData[cat][yearIndex - 4][1],stateData[cat][yearIndex - 3][1],stateData[cat][yearIndex - 2][1],stateData[cat][yearIndex - 1][1]];

		var e_pc_1 = (last5e[1] - last5e[0])/last5e[0]; //#oldest year
		var e_pc_2 = (last5e[2] - last5e[1])/last5e[1];
		var e_pc_3 = (last5e[3] - last5e[2])/last5e[2]; //#most recent year

		// #calculate weighted mean of percent changes (x4, then adjusted by tanh to bound between -1 and 1)
		var e_pct_chg = Math.tanh((weightedMean([e_pc_1, e_pc_2, e_pc_3],[2,2,3])*4))			
	  	// #apply e_pct_chg to weighted mean of values in recent years; apply multiplier to simulate change from policy scenario
		var e_final = e_multiplier*(weightedMean(last5e,[1,2,2,3])+ (e_pct_chg*weightedMean(last5e,[1,2,2,3])))

		// #length of stay calculations
		var last5l = [stateData[cat][yearIndex - 4][2],stateData[cat][yearIndex - 3][2],stateData[cat][yearIndex - 2][2],stateData[cat][yearIndex - 1][2]];
		var l_pc_1 = (last5l[1] - last5l[0])/last5l[0]; //#oldest year
		var l_pc_2 = (last5l[2] - last5l[1])/last5l[1];
		var l_pc_3 = (last5l[3] - last5l[2])/last5l[2]; //#most recent year

		var l_pct_chg = Math.tanh((weightedMean([l_pc_1, l_pc_2, l_pc_3],[2,2,3])*4))			
		var l_final = l_multiplier*(weightedMean(last5l,[1,2,2,3])+ (l_pct_chg*weightedMean(last5l,[1,2,2,3])))			

			// #last year of real data      
		var e_lastval = stateData[cat][yearIndex - 1][1];  
		var l_lastval = stateData[cat][yearIndex - 1][2];

			// #calculate step for equal interval between years 
		var e_step = (e_final-e_lastval)/(getProjEndYear()-lastyr);
		var l_step = (l_final-l_lastval)/(getProjEndYear()-lastyr);
  	}

  	//  if there are 3 years of historic data, do the following calculations. 
  	else if (lastyr-firstyr === 2) {

		var last5e = [stateData[cat][yearIndex - 3][1],stateData[cat][yearIndex - 2][1],stateData[cat][yearIndex - 1][1]];

		var e_pc_1 = (last5e[1] - last5e[0])/last5e[0]; //#oldest year
		var e_pc_2 = (last5e[2] - last5e[1])/last5e[1];//#most recent year		

		// #calculate weighted mean of percent changes (x4, then adjusted by tanh to bound between -1 and 1)
		var e_pct_chg = Math.tanh((weightedMean([e_pc_1, e_pc_2],[2,3])*4))			
	  	// #apply e_pct_chg to weighted mean of values in recent years; apply multiplier to simulate change from policy scenario
		var e_final = e_multiplier*(weightedMean(last5e,[2,2,3])+ (e_pct_chg*weightedMean(last5e,[2,2,3])))

		// #length of stay calculations
		var last5l = [stateData[cat][yearIndex - 3][2],stateData[cat][yearIndex - 2][2],stateData[cat][yearIndex - 1][2]];
		var l_pc_1 = (last5l[1] - last5l[0])/last5l[0]; //#oldest year
		var l_pc_2 = (last5l[2] - last5l[1])/last5l[1]; //#most recent year
		
		var l_pct_chg = Math.tanh((weightedMean([l_pc_1, l_pc_2],[2,3])*4))			
		var l_final = l_multiplier*(weightedMean(last5l,[2,2,3])+ (l_pct_chg*weightedMean(last5l,[2,2,3])))			

			// #last year of real data      
		var e_lastval = stateData[cat][yearIndex - 1][1];  
		var l_lastval = stateData[cat][yearIndex - 1][2];

			// #calculate step for equal interval between years 
		var e_step = (e_final-e_lastval)/(getProjEndYear()-lastyr);
		var l_step = (l_final-l_lastval)/(getProjEndYear()-lastyr);
  	}


	// #calculate intervening years using step between last real year and 2025 target value
	// In the below, i set the first item in the array as the lastyr value (2014 for AZ), then added to it is 2015 through 2025

	var nt_values = [];
	var e_values = [];
	var l_values = [];
	var p_values = [];
	var n_values = [];
	// Add historical data to these places, from start year to current year
	for (var i = 0; i < yearIndex; i++) {      	
		nt_values.push(stateData[cat][i][0])
		e_values.push(stateData[cat][i][1])
		l_values.push(stateData[cat][i][2])
		p_values.push(1-(1/l_values[i]))
		n_values.push(stateData[cat][i+1][0])
	}

	// Add final n_value as the nt of the lastyr by appending to nt_values array
	nt_values.push(n_values[n_values.length-1])

	// Predict the FUTURE (lastyr to projected end year)
	for (var i = yearIndex; i <= (getProjEndYear() - firstyr); i++) {

		e_values.push(e_values[i-1]+e_step);       	
		l_values.push(l_values[i-1]+l_step);
		
		// Added text to avoid a floating point error. 
		if (l_values[i] < 0) {
			l_values[i] = 0;
		} 
      	//yields 
      		// l = 0
      		// p = -Infinity
      		// n = e*l = e*0 = 0

      	// else 
      		// l = 0.0001
      		// p = -9999
      		// n = e*0.0001 = small

      	// else
      		// l = -0.0001
      		// p = 10001
      		// n = nt*big + e = big

      	p_values.push(1-(1/l_values[i]));     

      	// #generate projected n's based on estimates for admissions and LOS
      	if (p_values[i] >= 0) {
      		// # (a) when p>=0 (corresponding to LOS >= 1 year):
        	//  # n = (nt*p) + e
      		n_values.push(nt_values[i]*p_values[i] + e_values[i]);
      	} else {
	      	// # (b) when p<0 (corresponding to LOS < 1 year):
	        // # n = e*l	
      		n_values.push(e_values[i]*l_values[i]);
      	}
      	
      	// If not the last iteration, take the ending n value and using it as next years nt value
      	if (i !== (getProjEndYear() - firstyr)) {
      		nt_values.push(n_values[i]);
      	}
    }

    return n_values;
}

function weightedMean(values, weights) {
	var valSum = 0;
	var weightSum = 0;
	for (var i = 0; i < values.length; i++) {
		valSum += values[i]*weights[i];
		weightSum += weights[i];
	}
	var mean = valSum / weightSum;
	return mean;
}

// See above in stateprojections for call
function ExpandScenario(scenarios_list) {
	// #create list of expanded lists (one list for each original scenario from input scen.to.expand)	
	// expanded.list <- lapply(scen.to.expand, ExpandOne)  
	var expanded_list = [];

	// loop through scenarios list and expand out grouped scenarios, add all possible scenarios to an unnested list
	for (var i = 0; i < scenarios_list.length; i++) {	
		ExpandOne(scenarios_list[i],expanded_list)						
	}	
	
	return(expanded_list)
}

function ExpandOne(one_scenario,expanded_list) {
	// if given scenario is a group, exand the group and add all to expanded_list, otherwise just add scenario directly to expanded_list
	if (one_scenario[0] === "violent") {
		var expanded = [["assault", one_scenario[1], one_scenario[2]], ["homicide", one_scenario[1], one_scenario[2]], ["kidnapping", one_scenario[1], one_scenario[2]], ["otherviol", one_scenario[1], one_scenario[2]], ["robbery", one_scenario[1], one_scenario[2]], ["sexassault", one_scenario[1], one_scenario[2]]];
	} else if (one_scenario[0] === "drug") {
		var expanded = [["drugposs", one_scenario[1], one_scenario[2]], ["drugtraff", one_scenario[1], one_scenario[2]], ["otherdrug", one_scenario[1], one_scenario[2]]];
	} else if (one_scenario[0] === "property") {
		var expanded = [["arson", one_scenario[1], one_scenario[2]], ["burglary", one_scenario[1], one_scenario[2]], ["fraud", one_scenario[1], one_scenario[2]], ["larceny", one_scenario[1], one_scenario[2]], ["mvtheft", one_scenario[1], one_scenario[2]], ["otherprop", one_scenario[1], one_scenario[2]]];
	} else if (one_scenario[0] === "other") {
		var expanded = [["dwi", one_scenario[1], one_scenario[2]], ["weapons", one_scenario[1], one_scenario[2]],["public_oth", one_scenario[1], one_scenario[2]]]
	} else if (one_scenario[0] === "nonviolent") {
		var expanded = [["arson", one_scenario[1], one_scenario[2]], ["burglary", one_scenario[1], one_scenario[2]], ["drugposs", one_scenario[1], one_scenario[2]], ["drugtraff", one_scenario[1], one_scenario[2]], ["dwi", one_scenario[1], one_scenario[2]], ["fraud", one_scenario[1], one_scenario[2]], ["larceny", one_scenario[1], one_scenario[2]], ["mvtheft", one_scenario[1], one_scenario[2]], ["otherdrug", one_scenario[1], one_scenario[2]], ["otherprop", one_scenario[1], one_scenario[2]], ["public_oth", one_scenario[1], one_scenario[2]], ["weapons", one_scenario[1], one_scenario[2]]]
	}
	else {
		//if it is NOT a group category, just push the current scenario
		var expanded = one_scenario;
	}	

	// If multidimensional array, break it down further...
	// #unlist nested lists to produce list where each element is a scenario (rather than a list of scenarios)
	if (expanded[0].constructor === Array) {
		for (var i = 0; i < expanded.length; i++) {
			expanded_list.push(expanded[i])
		}
	}
	else {
		expanded_list.push(expanded)
	}
}

var offenses = [ ["violent","All Violent"], ["drug", "All Drug"], ["property", "All Property"], ["nonviolent", "All Nonviolent"], ["other", "All Other"], ["arson", "Arson"],["assault", "Assault"],["burglary", "Burglary"],["drugposs", "Drug possession"],["drugtraff", "Drug trafficking"],["dwi", "DWI"],["fraud", "Fraud"],["homicide", "Homicide"],["kidnapping", "Kidnapping"],["larceny", "Larceny"],["otherdrug", "Other drug"],["otherprop", "Other property"],["otherviol", "Other violent"],["public_oth", "Public other"],["robbery", "Robbery"],["sexassault", "Sexual assault"],["weapons", "Weapons"],["mvtheft", "Motor vehicle theft"] ]

function runModel(chosenState, projectedParameters){

	//  if you want to do static testing, set the chosen state and parameters here. 
	// var chosenState = "DE";	
	// var projectedParameters = [["property",-0.2,2],["drug",-0.2,1],["drug",-0.4,2]];

	var costpercap = costs[chosenState].pcexpend;


	// Do not change baseline parameters from this. 
	var baselineParameters = [];
	var projectedFinalData = 	StateProjections(chosenState, projectedParameters);
	var baselineFinalData  = 	StateProjections(chosenState, baselineParameters);
	var costsFinalData = CostProjections(projectedFinalData[0],baselineFinalData[0],(counts[chosenState].endYear - 1),costpercap);
	

	var minYear = d3.min(Object.keys(baselineFinalData[0]))
	var maxYear = d3.max(Object.keys(baselineFinalData[0]))
	var projYear = d3.min(Object.keys(projectedFinalData[0]))


	return {"projected": projectedFinalData, "baseline": baselineFinalData, "costs": costsFinalData, "years": {"min": +minYear, "max": +maxYear, "diverge": +counts[chosenState].endYear}}


}


