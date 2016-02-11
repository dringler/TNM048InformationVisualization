var gMag = 0;
var gStartTime = 0;
var gEndTime = 0;
var gData = [];

function map(data) {
    gData = data;

    var zoom = d3.behavior.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", move);

    var mapDiv = $("#map");

    var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = mapDiv.width() - margin.right - margin.left,
            height = mapDiv.height() - margin.top - margin.bottom;

    var curr_mag = 4;

    var format = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");

    var timeExt = d3.extent(data.map(function (d) {
        return format.parse(d.time);
    }));

    var filterdData = data;

    //Sets the colormap
    var colors = colorbrewer.Set3[10];

    //Assings the svg canvas to the map div
    var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom);

    var g = svg.append("g");

    //Sets the map projection
    var projection = d3.geo.mercator()
            .center([8.25, 56.8])
            .scale(700);

    //Creates a new geographic path generator and assing the projection        
    var path = d3.geo.path().projection(projection);

    //Formats the data in a feature collection trougth geoFormat()
    var geoData = {type: "FeatureCollection", features: geoFormat(data)};

    //Loads geo data
    d3.json("data/world-topo.json", function (error, world) {
        var countries = topojson.feature(world, world.objects.countries).features;
        draw(countries);
    });

    //Calls the filtering function 
    d3.select("#slider").on("input", function () {
        filterMag(this.value, data);
    });

    //Formats the data in a feature collection
    function geoFormat(array) {
        //array containing feature objects
        var data = [];
        array.map(function (d, i) {
            //Complete the code
            var feature = {
                "type" : "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [parseFloat(array[i].lon), parseFloat(array[i].lat)]
                },
                "properties": {
                    "id" : array[i].id,
                    "time" : array[i].time,
                    "depth" : array[i].depth,
                    "mag" : array[i].mag,
                    "place": array[i].place
                }
            }
            data.push(feature);
        });

        return data;
    }

    //Draws the map and the points
    function draw(countries)
    {
        //draw map
        var country = g.selectAll(".country").data(countries);
        country.enter().insert("path")
                .attr("class", "country")
                .attr("d", path)
                .style('stroke-width', 1)
                .style("fill", "lightgray")
                .style("stroke", "white");

        //draw point        
        var point = g.selectAll("circle")
            .data(geoData.features)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return projection(d.geometry.coordinates)[0];})
            .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; })
            .attr("r", 5)
            .style("fill", "red")
            .classed("pin", true);
    };

    //Filters data points according to the specified magnitude
    function filterMag(value) {
        gMag = value;
        svg.selectAll("circle")
            .style("opacity", function(d){
                if (value > d.properties.mag) {return 0}
                else {return 1};
            })
    }
    
    //Filters data points according to the specified time window
    this.filterTime = function (value) {
        gStartTime = value[0].getTime();
        gEndTime = value[1].getTime();
        svg.selectAll("circle").style("opacity", function(d){
        var date = new Date(d.properties.time)    
            if (value[0].getTime() <= date.getTime() && date.getTime() <= value[1].getTime()) {return 1}
            else {return 0};
        })
    };

    //Calls k-means function and changes the color of the points  
    this.cluster = function () {
        var color = d3.scale.category10();
        var cValue = function(d) {
            return d.properties.assignment;
        };
        //reset global data array with filtered data
        gData = [];
        //add all data to the global data array which is not filtered out 
        for (j=0; j < data.length; j++) {
            var dTime = new Date(data[j].time);
            var dMag = data[j].mag;
            //make data array with selected values
            if ((gStartTime == 0 || dTime.getTime() >= gStartTime) && 
                    (gEndTime == 0 || dTime.getTime() <= gEndTime) && 
                    (dMag >= gMag || gMag == 0) ) {
                gData.push(data[j]);
            }
        }

        //get k value
        var k = document.getElementById('k').value;
        var kmeansRes = kmeans(gData,k);

        for (j=0; j<geoData.features.length; j++) {
            for (m=0; m<kmeansRes.points.length; m++) {
                if (geoData.features[j].properties.id == kmeansRes.points[m][2]) {
                    geoData.features[j].properties.assignment = kmeansRes.assignments[m];
                }
            }
        }




        svg.selectAll("circle").style("fill", function(d) {
            return color(cValue(d));
        })   
    };

    //Zoom and panning method
    function move() {

        var t = d3.event.translate;
        var s = d3.event.scale;

        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
    }

    //Prints features attributes
    function printInfo(value) {
        var elem = document.getElementById('info');
        elem.innerHTML = "Place: " + value["place"] + " / Depth: " + value["depth"] + " / Magnitude: " + value["mag"] + "&nbsp;";
    }

}
