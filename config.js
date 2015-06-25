// Server Configuration File

// Web-Server
var ws = {};
module.exports.ws = ws;
ws.port = 4444;
ws.securePort = 443;
ws.secured = false; //HTTPS support

//Database
var db = {};
module.exports.db = db;
db.present = true;  // DB presence
db.host = 'localhost';
db.user     = 'root' ;
db.password = 'webrtc' ;
db.database = 'webrtcdb' ;
