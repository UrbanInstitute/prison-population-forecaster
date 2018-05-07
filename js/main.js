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
	//{"offense": offense, "los": los, "admissions": admissions, "locked": locked}
}
function setInputs(inputs){

}
function updateInputs(offense, indicator, amount){
	var inputs = getInputs();
	var newInputs = {};
	//if changing umbrella category, loop through inputs for each child and if it's not locked, update val
	//if changing for all, loop through each umbrella category and check if locked, then do as above
	
	setInputs(newInputs)
	sendInputs(newInputs)
}
function sendInputs(state, inputs){
	//reshape array of objects to format:
}
function lockInput(input){

}
function unlockInput(input){

}

/*******************************************************/
/**************** GRAPHING FUNCTIONS *******************/
/*******************************************************/

function buildPopulationChart(runData){

}
function buildDemographicsChart(runData){

}
function buildCostInfo(runData){

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
d3.select(".clearAll")
	.on("click", function(){
		loadForecast({})
	})




/*******************************************************/
/******************** LEFT SIDE BAR ********************/
/*******************************************************/
function toggleParentDrawer(offense){
	//make sure to open children drawers that were already open
}
function toggleChildDrawer(offense){

}
function isOpen(offense){
	//check if a child is open, for used when toggling open/closed parent, and for getting correct height of parent (N *openHeight + M*closedHeight)
}
function setOpen(offense){

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


//input on change
updateInputs(offense, indicator, amount)

d3.selectAll(".lock")
	.on("click", function(){
		if(d3.select(this).classed("locked")){
			d3.select(this).classed("unlocked")
			lockInput(d3.select(this).attr("data-offense"))
		}else{
			d3.select(this).classed("unlocked")
			unlockInput(d3.select(this).attr("data-offense"))
		}
	})



