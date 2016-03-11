var gStatus = 0;
var gStartTime = 0;
var gEndTime = 0;
var gData = [];
var visiblePointsAtt = [];
var visiblePointsTime = [];
var firstFilter = true;

/**
 * map function to draw the data points
 * @param data
 */
function map(data) {
    gData = data;

    var zoom = d3.behavior.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", move);

    var mapDiv = $("#map");

    var margin = {top: 20, right: 20, bottom: 20, left: 20};

    var width = mapDiv.width() - margin.left - margin.right,
    height = mapDiv.height() - margin.top - margin.bottom;

    //initialize tooltip
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    var format = d3.time.format.utc("%Y-%m-%d %H:%M:%S");

    //Sets the colormap
    var colors = colorbrewer.Set3[10];

    //Assings the svg canvas to the map div
    var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom);

    //fill water blue
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'lightblue');

    var buildings = svg.append("g");
    var roads = svg.append("g");

    var g = svg.append("g");

    //Sets the map projection
    var projection = d3.geo.mercator()
            .translate([width/2, height/2])
            .center([18.0658, 59.39])
            .scale(55000);
            // .center([8.25, 56.8])
            // .scale(700);

    //Creates a new geographic path generator and assing the projection        
    var path = d3.geo.path().projection(projection);

    //Formats the data in a feature collection trougth geoFormat()
    var geoData = {type: "FeatureCollection", features: geoFormat(data)};

     d3.json("data/swe_mun.topojson", function(error, sweden) {
        var mun = topojson.feature(sweden, sweden.objects.swe_mun).features;
        drawMap(mun);
        drawPoints();
    });

    /**
    * formats the data in a feature collection
    * @param data array
    */
    function geoFormat(array) {
        //array containing feature objects
        var data = [];
        array.map(function (d, i) {
            //Complete the code
            var feature = {
                "type" : "Feature",
                "geometry": {
                    "type": "Point",
                    //coordinates: lon, lat
                    "coordinates": [parseFloat(array[i].X_COORD), parseFloat(array[i].Y_COORD)]
                },
                "properties": {
                    "id" : array[i].id,
                    "timestamp" : array[i].TIMESTAMP,
                    "ds_reference" : array[i].DS_REFERENCE,
                    "detector_number" : array[i].DETECTOR_NUMBER,
                    "flow_in" : array[i].FLOW_IN,
                    "average_speed": array[i].AVERAGE_SPEED,
                    "status": array[i].STATUS
                }
            }
            data.push(feature);
        });

        return data;
    }

    /**
    * draws the map
    * @param data topojson object
    */
    function drawMap(mun)
    {
        //draw map
        var sweden = g.selectAll(".country").data(mun);
        sweden.enter().insert("path")
                .attr("class", "country")
                .attr("d", path)
                .style('stroke-width', 1)
                .style("fill", "grey")
                .style("stroke", "black");
    };

    /**
    * draws the data points in the map
    */
    function drawPoints(){

        //draw point        
        var point = g.selectAll("circle")
            .data(geoData.features)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return projection(d.geometry.coordinates)[0];})
            .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; })
            .attr("r", 2)
            .style("fill", "steelblue")
            //tooltip
            .on("mousemove", function(d) {
                div.transition()        
                    .duration(1)      
                    .style("opacity", .9);      
            div.html("id:" + d.properties.id + "<br> average speed: " + d.properties.average_speed + "<br> detector number: " + d.properties.detector_number + "<br> flow in: " + d.properties.flow_in + "<br>status: " + d.properties.status )
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");    
            })        
            .on("mouseout", function(d) {
                div.transition()        
                .duration(500)      
                .style("opacity", 0);    
            })
            .classed("pin", true);

        //add all points to the visible points arrays
            for (var i=0; i<gData.length; i++) {
                var id = gData[i].id;
                visiblePointsAtt.push(id);
                visiblePointsTime.push(id);
            }
    };


    /**
    * filter data points based on selected values in PC
    * @param actives: array of active attribute selections
    * @param extents: attribute values (min and max) for active attribute
    */
    this.filterAttributes = function(actives, extents) {
        for (var a=0; a<actives.length; a++) {
            var lowest = extents[a][0];
            var highest = extents[a][1];
            svg.selectAll("circle").style("opacity", function(d) {
                var dotvalue = d.properties[actives[a].toLowerCase()];
                if ((dotvalue < lowest) || (dotvalue > highest)) {
                    //delete id from visiblePointsAtt-array if exists
                    var index = visiblePointsAtt.indexOf(d.properties.id);
                    if (index > -1) {
                        visiblePointsAtt.splice(index,1);
                    }
                    return 0;
                } else {
                    //dot should be displayed based on attribute selection
                    if (visiblePointsAtt.indexOf(d.properties.id) == -1) {
                        // add dot to visiblePointsAtt-array if not exists
                        visiblePointsAtt.push(d.properties.id);
                    }
                    //check if also time selection is valid
                    if (visiblePointsTime.indexOf(d.properties.id) > -1) {
                        return 1;
                    } else {
                        return 0;
                    }

                } 
            })
            
        }
    }
    
    /**
    * filters data points according to the specified time window
    * @param value: array of time window (min, max)
    */
    this.filterTime = function (value) {
        gStartTime = value[0].getTime();
        gEndTime = value[1].getTime();
        //show/hide data points
        svg.selectAll("circle").style("opacity", function(d){
            var date = new Date(d.properties.timestamp);
                if (value[0].getTime() <= date.getTime() && date.getTime() <= value[1].getTime()) {
                    //dot should be displayed based on time selection
                    if(visiblePointsTime.indexOf(d.properties.id) == -1) {
                        //dot to array if not exists
                        visiblePointsTime.push(d.properties.id);
                    }
                    //check if also attribute selection is sufficient
                    if (visiblePointsAtt.indexOf(d.properties.id) > -1) {
                        return 1;
                    } else {
                        //dot should not be displayed based on attribute selection
                        return 0;
                    }
                } else {
                    //point should not be displayed based on time selection
                    //delete dot it from visiblePoinrtsTime-array if exists
                    var index = visiblePointsTime.indexOf(d.properties.id);
                    if (index > -1) {
                        visiblePointsTime.splice(index,1);
                    }
                    return 0;
                }
        })
    };

    /**
    * update the data in the map
    * @param newData
    */
    this.updateData = function(newData) {
        data = newData;
        var geoData = {type: "FeatureCollection", features: geoFormat(newData)};
        //redraw points
        svg.selectAll("circle").remove();
        drawPoints();

    }

    /**
    * Calls k-means or BIRCH clustering function and changes the color of the data points in the map
    * @param userSelection
    */
    this.cluster = function (userSelection) {
        var clusterRes;
        var color = d3.scale.category10();
        var cValue = function(d) {
            for (var i = 0; i < clusterRes.points.length; i++) {
                if (d.properties.id == clusterRes.points[i][0]) { //check id
                    return clusterRes.assignments[i];
                }
            }
        };
        //reset global data array with filtered data
        gData = [];
        //add all data to the global data array which is not filtered out 
        for (j=0; j < data.length; j++) {
            var dTime = new Date(data[j].TIMESTAMP);
                gData.push(data[j]);
        }
        if (userSelection.DMa == 0) { //BIRCH
            //input: data, threshold, branching_factor, max_nodes, n_clusters
            var birchRes = birch(gData, userSelection.DMp[0], userSelection.DMp[1], 0, userSelection.DMp[2]);
            clusterRes = birchRes;
        } else { //kmeans
            //get k value
            var k = document.getElementById('kInputID').value;
            var kmeansRes = kmeans(gData,k);
            clusterRes = kmeansRes;
        }  
        //add cluster assignments to the geoData object
        for (j=0; j<geoData.features.length; j++) {
            for (m=0; m<clusterRes.points.length; m++) {
                //check if ID property is the same kmeansRes.points[m][ID POSITION in kmeansRes])
                if (geoData.features[j].properties.id == clusterRes.points[m][0]) {
                    geoData.features[j].properties.assignment = clusterRes.assignments[m];
                }
            }
        }
        //color the data points in the map depending on the cluster
        svg.selectAll("circle").style("fill", function(d) {
            return color(cValue(d));
        })                    
    return clusterRes;
    };

    /**
    * zoom and panning method
    */
    function move() {
        var t = d3.event.translate;
        var s = d3.event.scale;
        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
    }
}