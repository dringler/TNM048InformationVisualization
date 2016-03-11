/**
 * open http://127.0.0.1:8888/index.html for accessing the web application
 */

var map1;
var pc1;
var area1;
var birchRoot;
var clusterRes;
//global user input parameters
var previousUserSelection;

var data;
var gData;
var gID = 0;

/**
 * initial page load
 */
function init() {
	//save standard selection
	currentUserSelection = getUserSelection();

	//time parsing 2013-03-25 17:59:00;
	//var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S");
	
	//load sample data
	d3.json("php/data_sample_1000.php", function (data) {
		data.forEach(function(d) {
			d["id"] = +gID;
			d["TIMESTAMP"] = new Date(d.TIMESTAMP.replace("-", " ", "g"));
			d["DS_REFERENCE"] = d.DS_REFERENCE;
			d["DETECTOR_NUMBER"] = +d.DETECTOR_NUMBER;
			d["X_COORD"] = +d.X_COORD;
			d["Y_COORD"] = +d.Y_COORD;
			d["FLOW_IN"] = +d.FLOW_IN;
			d["AVERAGE_SPEED"] = +d.AVERAGE_SPEED;
			d["STATUS"] = +d.STATUS;
			//increment global ID
			gID += 1;
		})
		pc1 = new pc(data);
		area1 = new area(data);
		map1 = new map(data);
	});
	previousUserSelection = currentUserSelection;
}
/**
 * run the clustering algorithm
 */
function runClustering() {
	var reloadChartsRequired = false;
	//check if user selection changed for dataset or preprocessing
	var currentUserSelection = getUserSelection();

	//select php script to get dataset based on user selection
	var phpscript = "";
	
	if (currentUserSelection.datasetSize == 100) { //100 entries
		if ( currentUserSelection.normalizeDataset == true) {
			phpscript = "php/data_sample_100_normalized.php";
		} else {
			phpscript = "php/data_sample_100.php";
		}
	} else if (currentUserSelection.datasetSize == 1000) { //1000 entries
		if (currentUserSelection.normalizeDataset == true) {
			phpscript = "php/data_sample_1000_normalized.php";
		} else {
			phpscript = "php/data_sample_1000.php";
		}
	} else { //10000 entries
		if (currentUserSelection.normalizeDataset == true) {
			phpscript = "php/data_sample_10000_normalized.php";
		} else {
			phpscript = "php/data_sample_10000.php";
		}
	}

	//get dataset
	d3.json(phpscript, function (data) {
		//reset global ID
		gID = 0;
		data.forEach(function(d) {
			d["id"] = +gID;
			d["TIMESTAMP"] = new Date(d.TIMESTAMP.replace("-", " ", "g"));
			d["DS_REFERENCE"] = d.DS_REFERENCE;
			d["DETECTOR_NUMBER"] = +d.DETECTOR_NUMBER;
			d["X_COORD"] = +d.X_COORD;
			d["Y_COORD"] = +d.Y_COORD;
			d["FLOW_IN"] = +d.FLOW_IN;
			d["AVERAGE_SPEED"] = +d.AVERAGE_SPEED;
			d["STATUS"] = +d.STATUS;
			//increment global ID
			gID += 1;
		}) 
		gData = data;
		//update data in charts
		//add here the visualization of charts as this is executed when gData is loadedd completely
		//run clustering algorithm
		if (currentUserSelection.DMa == 0) {
			//apply BIRCH
			map1.updateData(gData);
			var startTime = new Date().getTime();
			clusterRes = map1.cluster(currentUserSelection);
			console.log(new Date().getTime() - startTime);
			console.log("BIRCH performance in ms with " + currentUserSelection.datasetSize + " entries.");
			pc1.updateData(gData, clusterRes);
			area1.updateData(gData, clusterRes, currentUserSelection.areaYparameter);
		} else {
			//apply Kmeans
			map1.updateData(gData);
			// kmeansRes = map1.clusterKmeans();
			var startTime = new Date().getTime();
			clusterRes = map1.cluster(currentUserSelection);
			console.log(new Date().getTime() - startTime);
			console.log("Kmeans performance in ms with " + currentUserSelection.datasetSize + " entries.");
			pc1.updateData(gData, clusterRes);
			area1.updateData(gData, clusterRes, currentUserSelection.areaYparameter);
		}



	});	

	//save user selection
	previousUserSelection = currentUserSelection;

}
/**
 * get the current user selection parameters
 * 
 * @return returnObject user selection
 */
function getUserSelection() {
	//create return object
	var userSelection = {};
	//create variables for return object
	var DMa; //data mining algorithm, 0:BIRCH, 1:kMeans
	var DMp = []; //data mining parameters
	//get user selection
	var dataset100 = document.getElementById('dataset100ID').checked;
	var dataset1000 = document.getElementById('dataset1000ID').checked;
	var dataset10000 = document.getElementById('dataset10000ID').checked;
	if (dataset100 == true) {
		datasetSize = 100;
	} else if (dataset1000 == true) {
		datasetSize = 1000;
	} else {
		datasetSize = 10000;
	}
	var normalizeDataset = document.getElementById('ppNormID').checked;
	var applyBirch = document.getElementById('birchID').checked;
	var areaYparameter = document.getElementById('areaYvalueID').value;

	//get specific parameters of the DM algorithm
	//BIRCH
	if (applyBirch) {
		DMa = 0;
		var threshold = document.getElementById('birchThID').value;
		var branching_factor = document.getElementById('birchBfID').value;
		var n_clusters = ""; //document.getElementById('birchNcID').value;
		DMp.push(threshold, branching_factor, n_clusters);
	} else { //KMeans
		DMa = 1;
		var k = document.getElementById('kInputID').value;
		DMp.push(k);
	}
	
	//save user selection in return object
	userSelection.datasetSize = datasetSize;
	userSelection.normalizeDataset = normalizeDataset;
	userSelection.areaYparameter = areaYparameter;
	userSelection.DMa = DMa;
	userSelection.DMp = DMp;

	return userSelection;
}

/**
 * shows or hides input fields based on selected DM algorithm
 */
function dmAclick() {
	var kMeansChecked = document.getElementById('kMeansID').checked;
	if (kMeansChecked == true) {
		//show k input
		document.getElementById('k').style.display = "block";
		document.getElementById('birch').style.display = "none";
	} else {
		//hide k input
		document.getElementById('k').style.display = "none";
		document.getElementById('birch').style.display = "block";
	}
}

/**
 * resets the attribute & time selection
 */
function resetSelection() {
	//reset the selected attributes from the PC
	pc1.resetSelections();
	//reset the selected time range in the area chart
	area1.resetTimeSelection();
}

