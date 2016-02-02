function sp(){

    var self = this; // for internal d3 functions

    var spDiv = $("#sp");

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = spDiv.width() - margin.right - margin.left,
        height = spDiv.height() - margin.top - margin.bottom;

    //initialize color scale
    var color = d3.scale.category20();

    
    //initialize tooltip
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#sp").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Load data
    d3.csv("data/OECD-better-life-index-hi.csv", function(error, data) {
        self.data = data;
        
        //define the domain of the scatter plot axes
        x.domain([0,d3.max(data, function(d) { return d.LifeSatisfaction; })])
        y.domain([0,d3.max(data, function(d) { return d.HouseholdIncome; })])
        
        draw();

    });

    function draw() {
        var cc = {};
        self.data.forEach(function(d){
            cc[d["Country"]] = color(d["Country"]);
        })


        // Add x axis and title.
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width - 10)
            .attr("y", -6)
            .style("text-anchor", "middle")
            .text("Life Satisfaction");
            
        // Add y axis and title.
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("x", -20)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .text("Household Income");
            
        // Add the scatter dots.
        svg.selectAll(".dot")
            .data(self.data)
            .enter().append("circle")
            .attr("class", "dot")
            //Define the x and y coordinate data values for the dots
            .attr("r", function(d) { return d.PersonalEarnings/5; })
            .attr("cx", function(d) { return x(d.LifeSatisfaction); })
            .attr("cy", function(d) { return y(d.HouseholdIncome); })
            .style("fill", function(d) {return cc[d.Country]; })


            //tooltip
            .on("mousemove", function(d) {
                div.transition()        
                    .duration(200)      
                    .style("opacity", .9);      
                div .html(d.Country + "<br/>Personal Earnings: " + d.PersonalEarnings +"<br/>Life Satisfaction: " + d.LifeSatisfaction + "<br/>Household Income: "  + d.HouseholdIncome)  
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");    
            })        
            .on("mouseout", function(d) {
                div.transition()        
                .duration(500)      
                .style("opacity", 0);    
            })
            .on("click",  function(d) {
                var countryArray = [];
                countryArray.push(d.Country);
                sp1.selectDot(countryArray);
                pc1.selectLine(d.Country);  
                map.selectCountry(countryArray);
            });
    }



    //method for selecting the dot from other components
    this.selectDot = function(value){
        svg.selectAll(".dot").style("opacity", function(d) {
            if (value.indexOf(d.Country) == -1) {return 0.2} 
             else {return 1};
        })
    };
    
    //method for selecting features of other components
    function selFeature(value){
        //...
    }

}




