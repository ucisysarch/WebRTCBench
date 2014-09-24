var mysql = require('mysql');
var async = require('async') ;
//This function adds an experiment into database
module.exports.addExperiment = function addExperiment(connection,caller,callee,streamType,taskSetup)
{
	var peer1Id, peer2Id,experimentId ;
    //Async execution - waterfall pattern
    async.waterfall([
    // Locate first peer in database if exists
    function(callback){
		var query = "SELECT * FROM peer WHERE device= ? AND os = ? AND browser = ? AND network = ? " ;
		var inserts = [caller.device,caller.os,caller.browser,caller.network];
		query = mysql.format(query, inserts);	
		connection.query(query, function(err, rows, fields) {
			if (err) throw err;
			if( rows.length > 0 )
			{
				peer1Id = rows[0].peer_id;
			} 
			else
			{
				peer1Id = -1;
			}
			callback(null, peer1Id );
		});
    },
    // Insert first peer in database if does not exist
    function(arg1, callback){
		console.log("2");
		if( arg1 == -1 )
		{
            // If peer1 was not found in DB then add it
			query = "INSERT INTO peer (device, os, browser, network) VALUES (?, ?, ?,?)" ;
			inserts = [caller.device,caller.os,caller.browser,caller.network];
			query = mysql.format(query, inserts);
			connection.query(query, function (err, results) {
				if (err) throw err;
				else {
					peer1Id = results.insertId;
					callback(null, peer1Id);
				}
			});
		}
		else
		{
            // Otherwise proceed to next step
			callback(null, arg1 );
		}
    },
    // Find second peer in the database
    function(arg1, callback){
		var query = "SELECT * FROM peer WHERE device= ? AND os = ? AND browser = ? AND network = ? " ;
		var inserts = [callee.device,callee.os,callee.browser,callee.network];
		query = mysql.format(query, inserts);	
		connection.query(query, function(err, rows, fields) {
			if (err) throw err;
			if( rows.length > 0 )
			{
				peer2Id = rows[0].peer_id;
			}
			else
			{
				peer2Id = -1;
			}
			callback(null, arg1 , peer2Id );
		});
    },
    // Insert second peer in database if does not exist
	function(arg1,arg2, callback){
		if( arg2 == -1 )
		{
            // If second peer wasnot found then add it
			query = "INSERT INTO peer (device, os, browser, network) VALUES (?, ?, ?,?)" ;
			inserts = [callee.device,callee.os,callee.browser,callee.network];
			query = mysql.format(query, inserts);
			connection.query(query, function (err, results) {
				if (err) throw err;
				else {
					peer2Id = results.insertId;
				}
			});
		}
		else
		{
            // otherwise proceed to next step
			callback(null, arg1, arg2 );
		}
    },
    // Find the same experiment in the database
	function(peer1Id,peer2Id, callback){
		var query = "SELECT * FROM experiment WHERE sender_id = ? AND receiver_id = ? AND stream_type = ? AND task_setup = ? " ;
		var inserts = [peer1Id,peer2Id,streamType,taskSetup];query = mysql.format(query, inserts);	
		query = mysql.format(query, inserts);	
		connection.query(query, function(err, rows, fields) {
			if (err) throw err;
			if( rows.length > 0 )
			{
				expId = rows[0].experiment_id;
			}
			else
			{
				expId = -1;
			}
			callback(null, expId , peer1Id , peer2Id );
		});
    },
    // Create and add to database if no such experiment exists
	function(expId, peer1Id,peer2Id, callback){
		console.log( 'exp id = ' + expId + ' peer1Id ' + peer1Id + 'peer2Id ' + peer2Id) ;
		if( expId == -1 )
		{
			var query = "INSERT INTO experiment (sender_id, receiver_id, stream_type,task_setup) VALUES (?,?,?,?)" ;
			var inserts = [peer1Id,peer2Id,streamType,taskSetup];
			query = mysql.format(query, inserts);	
			connection.query(query,function (err, results) {
				if (err) throw err;
				else 
				{
					experimentId = results.insertId;
					callback(null, experimentId );
				}
			});
		}
		else
		{
			callback(null, expId );
		}
	},
    // Add sender(caller) timings into sender_timings table
	function(experimentId, callback){
		var query = "INSERT INTO sender_timings (experiment_id, exp_timestamp, init_peer_connection,get_stream_from_device, open_data_channel) VALUES (?,?,?,?,?)";
		var inserts = [experimentId,caller.timestamp, caller.timings['init_peer_connection'] ,caller.timings['get_stream_from_device'],caller.timings['open_data_channel'] ] ;
		query = mysql.format(query, inserts);	
		//console.log(query);
		connection.query(query,function(err, results) {
			if (err) throw err;
			callback(null, experimentId );
		});
	},
    // Add receiver(callee) timings into receiver_timings table
	function(experimentId, callback){	
		var query = "INSERT INTO receiver_timings (experiment_id, exp_timestamp, init_peer_connection, get_stream_from_device, open_data_channel) VALUES (?,?,?,?,?)";
		var inserts = [experimentId,callee.timestamp, callee.timings['init_peer_connection'] , callee.timings['get_stream_from_device'],callee.timings['open_data_channel']] ;
		query = mysql.format(query, inserts);
		connection.query(query,function(err, results) {
			if (err) throw err;
		});
		
    }], function (err, result) {
	   // result now equals 'done'    
	   if (err)
	        console.log(err);
	    else
		    console.log(result);
	});
	
	
}