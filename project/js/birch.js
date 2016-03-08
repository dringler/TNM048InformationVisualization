    var keys = [];     //data attributes array
    var distanceFct;
    var threshold;
    var branching_factor;
    var max_nodes_per_cluster;
    var applyMergingRefinement = false; //apply BIRCH phase 4
    var root;

    /**
    * birch algorithm
    * @param data
    * @param threshold
    * @param branching factor
    * @param n clusters
    // ...
    * @return {Object}
    */
    function birch(dataset, t, bf, max_nodes, n_clusters) {
        //BIRCH algorithm based on:
        //https://github.com/scikit-learn/scikit-learn/blob/51a765a/sklearn/cluster/birch.py#L323
        //https://github.com/janoberst/BIRCH/blob/master/birch.py
        //https://github.com/perdisci/jbirch/tree/master/src/edu/gatech/gtisc/jbirch

        //convert the dataset into the structure for the returnObject
        var points = convert(dataset);

        var data = dataset;
        // console.log(data);
        if (data == null || data.length == 0) {
            return;
        }
        //dimension variables
        keys = d3.keys(data[0]);
        // console.log(keys);

    	//parameters
    	threshold = t; //float, default 0.5 , max size of a cluster
    	branching_factor = bf; //int, default 50, max number of children
        max_nodes_per_cluster = max_nodes;
    	var nc = n_clusters; //int, default None
        var compute_labels = false; //bool, default True
        var copy = false; //bool, default True
        distanceFct = new DistanceCalculator(1); // the distance function to be used

        //attributes
        var dummy_leaf; //start pointer ot all leaves
        var subcluster_centers; //centroids of all subclusters read diretly from the leaves
        var subcluster_labels; //labels assigned to the centroids of the subclusters
        var labels; //array of labels assigned to the input data

    	//Phase 1: Load data into memory by bulding a CF tree
        //start with initial threshold value, scans the data and inserts points into the tree
        root = new CFNode(true);

        data.forEach(function(datapoint) {
            // console.log(datapoint);
            //convert datapoint into vector
            var datapointVector = datapointToVector(datapoint);
            //insert datapoint vector into the tree
            root.insertDatapoint(datapointVector);
        })

        //Phase 2: Condense into desirable range by building a smaller CF tree (optional)
        //...

        //Phase 3: Global Clustering

        //get center of the subclusters in the tree
        subcluster_centers = getCentroids(root);

        //get the assignments of the points to the subclusters
        var assignments = assignPointsToCentroid(points, subcluster_centers);

        var returnObject = {};
        returnObject.root = root;
        returnObject.points = points;
        returnObject.subcluster_centers = subcluster_centers;
        returnObject.assignments = assignments;

    	//Phase 4: Cluster Refining (optional and off line)
        //...

        return returnObject;

    };
    /**
    * Return an array of array
    * @param data
    * @return {Array}
    */
    function convert(data) {
        
        var points = [];
        var i = 0;
        for(var row in data)
        {   
            var values = [];
            values.push(parseInt(data[row]["id"]));
            values.push(parseInt(data[row]["DETECTOR_NUMBER"]));
            values.push(parseInt(data[row]["FLOW_IN"]));
            values.push(parseInt(data[row]["AVERAGE_SPEED"]));
            values.push(parseInt(data[row]["STATUS"]));
            points.push(values);
        }    
        return points;
    };
    /**
    * Return an array with the centroids of the subclusters of the root
    * @param root
    * @return {Array}
    */
    function getCentroids(root) {
        var returnArray = [];
        //go through all subclusters in the root
        for (var i = 0; i<root.subclusters.length; i++) {
            var mean = {};
            mean.linear_sum = root.subclusters[i].linear_sum;
            mean.squared_sum = root.subclusters[i].squared_sum;
            mean.n_samples = root.subclusters[i].n_samples;
            returnArray.push(mean);
        }
        return returnArray;
    }
    /**
    * Return an array of closest root element index for each point.
    * @param points
    * @param root
    * @return {Array}
    */  
    function assignPointsToCentroid(points, centroids) {
        var assignments = [];

        for (var i=0, l=points.length; i<l; i++) {
          assignments.push(findClosestCentroid(points[i], centroids));
        }

        return assignments;
    };     
    /**
    * Return an array of closest root element index for each point.
    * @param point
    * @param centroid
    * @return closestCentroid
    */  
    function findClosestCentroid(point, centroids) {
        var minDist;
        var newDist;
        var closestCentroid;
        for (var c=0; c<centroids.length; c++) {
            newDist = calculateCentroidDistance(point, centroids[c]);
            if (minDist == undefined || minDist > newDist) {
                minDist = newDist;
                closestCentroid = c;
            }
        }
        return closestCentroid;
    }
    /**
    * Calculate the distance of a single point to a single centroid
    * @param point
    * @param centroid
    * @return distance
    */ 
    function calculateCentroidDistance(point, centroid) {
        //euclidian distance function
        var point_linear_sum = [];
        var centroid_linear_sum = calculateCentroid(centroid.linear_sum, centroid.n_samples)
        for (var p = 1; p<point.length; p++) { //id is first attribute in array
            point_linear_sum.push(point[p]);
        }
        var d = 0;
        for (var i = 0; i < point_linear_sum.length; i++){
            d += Math.abs(point_linear_sum[i] - centroid_linear_sum[i]);
        }
        return Math.sqrt(d);
    }

    /**
    * Split a node if there is no place for a new subcluster in the node
    * @param node
    * @param threshold
    * @param branching_factor
    */ 
    function split_node(node, threshold, branching_factor) {
        //initialize two new empty nodes and two empty subclusters
        var is_leaf = node.is_leaf;
        var n_features = node.n_features;
        var new_node1 = new CFNode(is_leaf);
        var new_node2 = new CFNode(is_leaf);
        var new_subcluster1 = new CFSubcluster();
        var new_subcluster2 = new CFSubcluster();
        //assign new nodes to new suclusters
        new_subcluster1.child = new_node1;
        new_subcluster2.child = new_node2;
    };
    /**
    * Create CFNode
    * @param il: is_leaf (boolean)
    */ 
    function CFNode(il){
        //parameter
        this.is_leaf = il;
        //this.n_features = nf;
        //attributes
        this.subclusters = [];
        this.prev_leaf = null;
        this.next_leaf = null;
        this.init_centroids = [];
        this.init_sq_norm = [];
        // this.centroids = [];
        // this squared_norm = [];

        /**
        * Insert datapoint vector into node
        * @param datapointVector
        */ 
        this.insertDatapoint = function(datapointVector){
            if (this == root){
                //recursive funtion
                var splitNecessary = this.insertDatapointHelper(datapointVector);
                if (splitNecessary){
                    // console.log("splitting root");
                    this.splitEntry(this, true);
                }        
            } else {
                this.insertDatapointHelper(datapointVector);
            }
        }

        /**
        * Insert datapoint vector into clostest subcluster
        * @param datapointVector
        */ 
        this.insertDatapointHelper = function(datapointVector){
            var subclusterToInsert = new CFSubcluster(datapointVector);
            //insert first data point
            if (this.subclusters.length == 0) {
                // console.log("1");
                this.subclusters.push(subclusterToInsert);
                return false;
            }

            // 1. find the closest subcluster leaf
            var closestSubcluster = this.getClosestSubcluster(subclusterToInsert);
            var splitNecessary = true;
            //recursively get the leaf node
            if (closestSubcluster.child != null){
                // console.log("2");
                splitNecessary = closestSubcluster.child.insertDatapointHelper(datapointVector);
                //no split necessary
                if (!splitNecessary){
                    //update all CFNodes
                    closestSubcluster.update(subclusterToInsert);
                    return false;
                } else {
                    // console.log("splitting");
                    // split necessary
                    var splitPair = this.splitEntry(closestSubcluster, false);
                    //check if CFNode is full
                    if(this.subclusters.length > branching_factor) {
                        //CFNode is full
                        return true;
                    } else {
                        //step 4: refinement
                        if(applyMergingRefinement) {
                            mergingRefinement(splitPair);
                            return false;
                        }
                    }
                    //CFNode is not full
                    return false;
                }
            //when in leaf node: closestSubcluster.child == null
                //datapoint fits into closest cluster
            } else if (distanceFct.getDistance(closestSubcluster, subclusterToInsert) <= threshold){
                // console.log("3");
                closestSubcluster.update(subclusterToInsert);
                return false;
                //add datapoint in new cluster
            } else if (this.subclusters.length < branching_factor){
                // console.log("4");
                this.subclusters.push(subclusterToInsert);
                return false;
                //datapoint does not fit
            } else {
                // console.log("5");
                this.subclusters.push(subclusterToInsert);
                return true;
            }
        }

        /**
        * Find closest subcluster
        * @param subcluster
        * @return closestSubcluster
        */ 
        this.getClosestSubcluster = function(subcluster){
            var minDist = Number.MAX_VALUE;
            var closestSubcluster = null;

            for(var i = 0; i < this.subclusters.length; i++) {
                var d = distanceFct.getDistance(this.subclusters[i], subcluster);
                if(d < minDist || !isFinite(d)) {
                    minDist = d;
                    closestSubcluster = this.subclusters[i];
                }
            }
            return closestSubcluster;
        }
 
        /**
        * Split entry
        * @param subcluster
        * @param isRoot (boolean)
        * @return [newSubcluster1, newSubcluster2];
        */ 
        this.splitEntry = function(subcluster, isRoot){
            var oldNode;
            
            if (isRoot){
                // subcluster = root;
                oldNode = root;
            }  else {
                oldNode = subcluster.child;    
            }

            //save old subclusters
            var oldSubclusters = oldNode.subclusters;

            //get two farthest subclusters
            var farthestSubclusters = this.findFarestSubclusters(oldSubclusters);

            //create two new subclusters & nodes
            var newSubcluster1 = new CFSubcluster();
            var newNode1 = new CFNode(oldNode.is_leaf);
            newSubcluster1.child = newNode1;

            var newSubcluster2 = new CFSubcluster();
            var newNode2 = new CFNode(oldNode.is_leaf);
            newSubcluster2.child = newNode2;

            if (oldNode.is_leaf){
                // update the leaf links
                var previousLeaf = oldNode.prev_leaf;
                var nextLeaf = oldNode.next_leaf;

                if (previousLeaf != null){
                    previousLeaf.next_leaf = newNode1;
                }

                if (nextLeaf != null){
                    nextLeaf.prev_leaf = newNode2;
                }

                newNode1.prev_leaf = previousLeaf;
                newNode1.next_leaf = newNode2;
                newNode2.prev_leaf = newNode1;
                newNode2.next_leaf = nextLeaf;
            }
            // update the new nodes with the existing subclusters
            this.redistributeEntries(oldSubclusters,farthestSubclusters,newSubcluster1,newSubcluster2);

           // update the subclusters by inserting the new subclusters and removing the old (splitted) one
           if (!isRoot){
                // console.log("before del "+ this.subclusters.length);
                var indexOldSubcluster = this.subclusters.indexOf(subcluster);
                if (indexOldSubcluster > -1) {
                   this.subclusters.splice(indexOldSubcluster, 1);
                }
                // console.log("after del " + this.subclusters.length + " " + indexOldSubcluster);
                this.subclusters.push(newSubcluster1);
                this.subclusters.push(newSubcluster2);
            } else {
                root = new CFNode(false);
                root.subclusters.push(newSubcluster1);
                root.subclusters.push(newSubcluster2);
                // console.log(root);
            }
            //update array pair
            return [newSubcluster1, newSubcluster2];
        }
        /**
        * Redistribute entries of old subcluster to the two new subclusters
        * @param oldSubclusters
        * @param farthestSubclusters in node
        * @param newSubcluster1
        * @param newSubcluster2
        */ 
        this.redistributeEntries = function(oldSubclusters,farthestSubclusters,newSubcluster1,newSubcluster2){
            // calculate the distance between the existing subclusters and the subclusters which are farthest away from each other
            // add the subclusters to the nearest subcluster of these farthest subclusters
            for(var i = 0; i < oldSubclusters.length; i++) {
                var s = oldSubclusters[i];
                var dist1 = distanceFct.getDistance(farthestSubclusters[0], s);
                var dist2 = distanceFct.getDistance(farthestSubclusters[1], s);
            
                if(dist1<=dist2) {  
                    newSubcluster1.addToChild(s);
                    newSubcluster1.update(s);
                } else {
                    newSubcluster2.addToChild(s);
                    newSubcluster2.update(s);
              }
            }
        }

        /**
        * Find the two farest subclusters
        * @param subclusters
        * @return [subcluster1, subcluster2];
        */ 
        this.findFarestSubclusters = function(subclusters){
            //only one subcluster
            if (subclusters.length < 2){
                return null;
            //two subclusters
            } else if (subclusters.length == 2){
                return subclusters;
            }

            //more than two subclusters
            var maxDistance = -1;

            var result = [null, null];
            //go pairwise through all subclusters
            for (var i = 0; i < subclusters.length-1; i++){
                for (var j = i+1; j < subclusters.length; j++){
                    var d = distanceFct.getDistance(subclusters[i], subclusters[j])
                    if (d > maxDistance){
                        result[0] = subclusters[i];
                        result[1] = subclusters[j];
                        maxDistance = d;
                    }
                }
            }
            return result;
        }

        //BIRCH Phase 4 
        this.mergingRefinement = function(splitPair) {
            //...
        }
    };

    /**
    * Calculate the distance
    * @param df: the distance function to be used: 1: euclidian 2: ...
    * @return distance
    */ 
    function DistanceCalculator(df){
        this.distanceFct = df;

        /**
        * calculates the distance between two subclusters
        * @param subcluster1
        * @param subcluster2
        * @return distance
        */
        this.getDistance = function(s1, s2){
            //euclidian distance function
            if (this.distanceFct == 1){
                var d = 0;
                for (var i = 0; i < s1.linear_sum.length; i++){
                    d += Math.abs(s1.linear_sum[i]/s1.n_samples-s2.linear_sum[i]/s2.n_samples);
                }
                return Math.sqrt(d);
            }
        }
    }
    
    /**
    * get feature vector from single datapoint
    * @param datapoint
    * @return vector
    */ 
    function datapointToVector(datapoint){
        var result = [];
        // result.push(new Date(datapoint["TIMESTAMP"]));
        result.push(parseInt(datapoint["DETECTOR_NUMBER"]));
        result.push(parseInt(datapoint["FLOW_IN"]));
        result.push(parseInt(datapoint["AVERAGE_SPEED"]));
        result.push(parseInt(datapoint["STATUS"]));
        result.push(parseInt(datapoint["id"]));
        return result;
    };

    /**
    * create CFSubcluster from datapoint vector
    * @param datapointVector
    */ 
    function CFSubcluster(datapointVector){
        //attributes
        this.n_samples = 0;
        this.linear_sum = null;
        this.squared_sum = null;
        if (datapointVector != undefined) {
            this.id = datapointVector[5];
        }

        if (datapointVector != null){
            this.n_samples = 1;
            this.linear_sum = datapointVector.slice();
            this.squared_sum = datapointVector.slice();
            //length-1 because of id value
            for (var i = 0; i < this.linear_sum.length-1; i++){
                this.squared_sum[i] = this.squared_sum[i]*this.squared_sum[i];
            }
        }
        this.child = null; 
        /**
        * adds a child subcuster
        * @param sucluster
        */ 
        this.addToChild = function(subcluster){
            this.child.subclusters.push(subcluster);
        }
        /**
        * adds a datapoint vector
        * @param datapointVector
        */
        this.addDatapointVector = function(datapointVector){
            this.linear_sum = datapointVector.slice();
            this.squared_sum = datapointVector.slice();
            for (var i = 0; i < this.linear_sum.length; i++){
                this.squared_sum = this.squared_sum[i]*this.squared_sum[i];
            }
        }

        /**
        * updates the subcluster
        * @param sucluster
        */
        this.update = function(subcluster){
            //update number of samples
            this.n_samples += subcluster.n_samples;
            //update linear sum & squared sum
            if (this.linear_sum == null){
                //make deep copy of first subcluster values!
                this.linear_sum = subcluster.linear_sum.slice();
                this.squared_sum = subcluster.squared_sum.slice();
            } else {
                //length-1 because of id value
                for (var i = 0; i < this.linear_sum.length-1; i++){
                    this.linear_sum[i] += subcluster.linear_sum[i];
                    this.squared_sum[i] += subcluster.squared_sum[i];
                }    
            } 
            if(this.child == null) {
            //INDEX LIST: not required?
            /*if(this.indexList!=null && e.indexList!=null)
                this.indexList.addAll(e.indexList);
            else if(this.indexList==null && e.indexList!=null)
                this.indexList = (ArrayList<Integer>)e.indexList.clone();*/
            }
        }

};

/**
* calculate the centroid of a subcluster
* @param linear_sum
* @param n_samples
* @return centroid
*/
calculateCentroid = function(linear_sum, n_samples){
    var centroid = [];
    //length-1 because of id value
    for (var i = 0; i < linear_sum.length-1; i++){
        centroid[i] = linear_sum[i] / n_samples;
    }
    return centroid;
}
