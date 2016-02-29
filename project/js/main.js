var dataset;
var map1;
var pc1;
var area1;
var birchRoot;

function init() {
	var dataset = loadDataSet();
	d3.csv(dataset, function (data) {
		// map1 = new map(data);
		pc1 = new pc(data);
		area1 = new area(data);
		
		// birchRoot = new birch(data,0.5,50,10,10);
		// console.log(birchRoot);
	});
}

function loadDataSet() {
	var sampleDSchecked = document.getElementById('datasetSampleID').checked;
	var dataset = "";
	if (sampleDSchecked == true) {
		dataset = "data/sample.csv";
	} else {
		dataset = "data/full.csv";
	}
	return dataset;
}

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

function resetMap() {
	map1.resetZoom();
}