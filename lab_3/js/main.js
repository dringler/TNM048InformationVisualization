var area1;
var map1;

d3.csv("data/data_small.csv", function (data) {

    area1 = new area(data);
    map1 = new map(data);

});

