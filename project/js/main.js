var dataset;
var map1;
var pc1;

function init() {
	loadDataSet();
	d3.csv(dataset, function (data) {
		map1 = new map(data);
		pc1 = new pc();
	});
}

function loadDataSet() {
	var sampleDSchecked = document.getElementById('datasetSampleID').checked;
	if (sampleDSchecked == true) {
		dataset = "data/sample.csv";
	} else {
		dataset = "data/full.csv";
	}
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