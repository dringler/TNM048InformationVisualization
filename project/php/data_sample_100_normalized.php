<?php
    // MAMP: change document root of web server to project folder

    $username = "InfoVis"; 
    $password = "infovis";   
    $host = "localhost";
    $port = 8889; //MySQL port
    $database="infovis";
    
    $server = mysql_connect("$host:$port", $username, $password);
    $connection = mysql_select_db($database, $server);

    $myquery = "
        SELECT  d.TIMESTAMP, d.DS_REFERENCE, r.DETECTOR_NUMBER, r.X_COORD, r.Y_COORD, d.FLOW_IN, d.AVERAGE_SPEED, d.STATUS  
        FROM  sample_100_normalized AS d 
        INNER JOIN RadarLocations AS r 
        ON r.DS_REFERENCE = d.DS_REFERENCE AND r.DETECTOR_NUMBER+48 = d.DETECTOR_NUMBER_ORIGINAL
        ORDER BY d.TIMESTAMP ASC
        ";
    $query = mysql_query($myquery);
    
    if ( ! $query ) {
        echo mysql_error();
        die;
    }
    
    $data = array();
    
    for ($x = 0; $x < mysql_num_rows($query); $x++) {
        $data[] = mysql_fetch_assoc($query);
    }
    
    echo json_encode($data);     
     
    mysql_close($server);
?>
