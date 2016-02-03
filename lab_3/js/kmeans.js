    /**
    * k means algorithm
    * @param data
    * @param k
    * @return {Object}
    */
   
    function kmeans(data, k) {
        
        var points = convert(data);
        
        // select k of the points as initial means
        var means = [];
          for (var i=0; i<k; i++) {
              var index = Math.floor(Math.random() * points.length);
              var point = points[index];
              means.push(point.slice(0));
          }

        var oldAssignments, assignments = assignPointsToMeans(points, means);

        var n = 0, changeCount;

        do {

          moveMeansToCenters(points, assignments, means);

          oldAssignments = assignments;

          assignments = assignPointsToMeans(points, means);

          changeCount = countChangedAssignments(assignments, oldAssignments);

          n++;
          
          
        } while (changeCount > 0);

        return {
            means: means,
            assignments: assignments,
            steps: n,
            k: k
        };
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
//            values.push(parseFloat(data[row]["lat"]));
//            values.push(parseFloat(data[row]["lon"]));
            values.push(parseFloat(data[row]["mag"]));
            values.push(parseFloat(data[row]["depth"]));
            points.push(values);
        }    
        return points;
    };
    
    /**
    * Return an array of closest mean index for each point.
    * @param points
    * @param means
    * @return {Array}
    */  
    function assignPointsToMeans(points, means) {
        var assignments = [];

        for (var i=0, l=points.length; i<l; i++) {
          assignments.push(findClosestMean(points[i], means));
        }

        return assignments;
    };     


    /**
     * Move each mean to the average position of its assigned points.
     *
     * @param points
     * @param assignments
     * @param means
     * @return {Array}
     */
    function moveMeansToCenters(points, assignments, means) {

      if (points.length != assignments.length) {
        throw("points and assignments arrays must be of same dimension");
      }

      for (var i=0, l=means.length; i<l; i++) {

        // find assigned points for this mean
        var assignedPoints = [];
        for (var j= 0, m=assignments.length; j<m; j++) {
          if (assignments[j] == i) {
            assignedPoints.push(points[j]);
          }
        }

        if (assignedPoints.length > 0)
            means[i] = averagePosition(assignedPoints);
      }

      return means;
    };
    
    /**
    * Find the average location of a given set of points.
    *
    * @param points
    * @return {Array}
    */
    function averagePosition(points) {

      var sums = points[0].slice(0);

      var pointCount = points.length;

      for (var i= 1; i<pointCount; i++) {
        var point = points[i];
        for (var j= 0, m=point.length; j<m; j++) {
          sums[j] += point[j];
        }
      }

      for (var k=0, n=sums.length; k<n; k++) {
        sums[k] /= pointCount;
      }

      return sums;
    };

    /**
     * Count how many of the assignments have changed during the cycle.
     *
     * @param oldAssignments
     * @param newAssignments
     * @return {Number}
     */
    function countChangedAssignments(oldAssignments, newAssignments) {

      if (oldAssignments.length != newAssignments.length) {
        throw("old and new assignment arrays must be of same dimension");
      }

      var count = 0;
      for (var i= 0, l=oldAssignments.length; i<l; i++) {
        if (oldAssignments[i] != newAssignments[i]) {
          count++;
        }
      }

      return count;
    };
    
    /**
    * Calculate the distance to each mean, then return the index of the closest.
    *
    * @param point
    * @param means
    * @return {Number}
    */
   function findClosestMean(point, means) {
     var distances = [];
     for (var i=0, l=means.length; i<l; i++) {
       distances.push(distance(point, means[i]));
     }
     return findIndexOfMinimum(distances);
   };
   
   /**
    * Return the index of the smallest value in the array.
    *
    * @param array
    * @return {Number}
    */
   function findIndexOfMinimum(array) {

     var min = array[0], index = 0;

     for (i=1, l=array.length; i<l; i++) {
       if(array[i] < min) {
         index = i;
         min = array[i];
       }
     }

     return index;
   };
   
   /**
    * Euclidean distance between two points in arbitrary dimension
    * @return {Number}
    */
   function distance(point1, point2) {
     return Math.sqrt(squaredError(point1, point2));
   };
   
   /**
    * Useful for analyzing resulting clusters
    *
    * @param point1
    * @param point2
    * @return {Number}
    */
    function squaredError(point1, point2) {
      if (point1.length != point2.length) {
        throw("point1 and point2 must be of same dimension");
      }

      var dim = point1.length;
      var sum = 0;
      for (var i=0; i<dim; i++) {
        sum += (point1[i] - point2[i]) * (point1[i] - point2[i]);
      }

      return sum;
    };
