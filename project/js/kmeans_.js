    /**
    * k means algorithm
    * @param data
    * @param k
    * @return {Object}
    */
   var keys = [];

    function kmeans(data, k) {
        
        //dimension variables
        // keys = d3.keys(data[0]);
        // ["TIMESTAMP", "DS_REFERENCE", "DETECTOR_NUMBER", "X_COORD", "Y_COORD", "FLOW_IN", "AVERAGE_SPEED", "STATUS"]
        keys = ["id", "DETECTOR_NUMBER","FLOW_IN", "AVERAGE_SPEED", "STATUS"]
    	//initial variables
    	var threshold = 0;
    	var currentClusterSSE = []; //current sum of squared errors for centroids
    	var improvingCentroids = true;
    	var notFirstRound = false;

    	//1. chose initial centroids
    	//array for the centroids
    	// console.log("initial centroid data points");
    	var centroids = [];
    	for (i = 0; i < k; i++) {
    		//get random centroids out of the data values
    		centroids[i] = data[(Math.floor(Math.random() * data.length))];
    		// console.log(centroids[i]);

    	}

    	//2. assign each point in the data to the nearest centroid
    	//array containing all data points assigned to a centroid
    	while(improvingCentroids) {
    		//for all clusters
	    	for (i = 0; i < k; i++) {
	    		//for all data items
	    		for (j = 0; j < data.length; j++) {
					//calculate distance
					//initial distances for first centroid
					if (i == 0 && !notFirstRound) {
						data[j].distance = euclideanDistance(data[j], centroids[i]);
						data[j].centroid = i;
					//check if distance to centroid i is closer
					} else {
						var iDistance = euclideanDistance(data[j], centroids[i]);
						//assign new centroid i if distance is closer
						//if the distance is the same the old centroid is kept
						if (iDistance < data[j].distance) {
							data[j].distance = iDistance;
							data[j].centroid = i;
						}
						//else do not update centroid
					}
	    			
	    		}
	    	}

	    	//3. recalculate the centroids
	    	var centroidDataPoints = [];
	    	for (i = 0; i < k; i++) {
	    		//empty array for each new centroid
	    		centroidDataPoints = [];
	    		//for all data points
	    		for (j = 0; j < data.length; j++) {
	    			//for all data points assigned to cluster i
	    			if (data[j].centroid == i) {
	    				//add data point to array
	    				centroidDataPoints.push(data[j]);
	    			}
	    		}
	    		//sum of the data points
	    		var sumArray = [];
	    		//for each dimension
	    		for (q = 0; q < keys.length; q++) {
	    		var dim = keys[q];
	    		var dimSum = 0;
		    		//for all data points assigned to cluster i
		    		for (p = 0; p < centroidDataPoints.length; p++) {
		    			//calculate the sum of all data points assigned to cluster i
		    			var dp = centroidDataPoints[p];
	    				var dimValue = dp[dim];
	    				if(dimValue != null) {
	    					dimSum += parseFloat(dimValue);
	    				}	    					    			
	    			}
	    			//add sum for each dimension to the sumArray
	    			sumArray.push(dimSum);

	    			//calculate new centroid position
	    			var currentC = centroids[i];
	    			currentC[dim] = dimSum / centroidDataPoints.length;

	    		}
	    		// console.log("new centroid data points");
	    		// console.log(i);
	    		// console.log(centroids[i]);
	    	}

	    	//4. check quality of the clusters
	    	var newClusterSSE = [];
	    	var voteAbort = []; //abort = 1, continue= 0
	    	for (i = 0; i < k; i++) {
	    		newClusterSSE.push(sse(data, centroids, i));
	    	}

	    	// console.log("currentClusterSSE");
	    	// console.log(currentClusterSSE);
	    	// console.log("newClusterSSE");
	    	// console.log(newClusterSSE);
	    	//check quality compared to previous clusters
	    	if (notFirstRound) {
		    	for (i = 0; i < k; i++) {
		    		//include threshold
		    		if(newClusterSSE[i] + threshold < currentClusterSSE[i]) {
		    			// still improving
		    			//update currentClusterSSE
		    			currentClusterSSE[i] = newClusterSSE[i];
		    			voteAbort.push(0); //vote continue
		    		} else {
		    			voteAbort.push(1);
		    		}
		    	}
		    } else {
		    	notFirstRound = true;
		    	currentClusterSSE = newClusterSSE;
		    }
	    	// console.log("voteAbort");
	    	// console.log(voteAbort);
	    	//check if all centroids voted abort
	    	if(voteAbort.indexOf(0) == -1 && voteAbort.length != 0) {
	    		//break while loop for improving the centroids
	    		improvingCentroids = false;
	    	}
	    }
	    // console.log("FINAL DATA");
	    // console.log(data);
	    return data;
    };


    function euclideanDistance(dataitem, centroid) {
    	var distance = 0;
    	var sqrtDistance = 0;

		//for each dimension
    	for (q = 0; q < keys.length; q++) {
	    		var dim = keys[q];
	    		//sum quadric distance of all dimensions
	    		distance += Math.pow(dataitem[dim] - centroid[dim],2);
		}
		//square sum of quadric distance 
    	sqrtDistance = Math.sqrt(distance);
    	return sqrtDistance;

    };

    function sse(data, centroids, i) {
    	var result = 0;
    	//for all data items
    	for (j=0; j < data.length; j++) {
    		//for all data items that have the cluster i
    		if (data[j].centroid == i) {
    			//for all dimensions of the dataitem
    			for (q = 0; q < keys.length; q++) {
    				//get dimension
		    		var dim = keys[q];
		    		var eDatapoint = data[j];
		    		var eCentroids = centroids[i];
		    		//add error to result
			    	result += Math.pow(Math.abs(eDatapoint[dim] - eCentroids[dim]), 2);
			    }
			}
		}
    	return result;
    };
    
    