/*
This file could help you collect the video data and
get some parameters about your peer connection
*/

var video1;
var video2;
var datacanvas = document.getElementById("data-canvas");
var hiddenctx = datacanvas.getContext("2d");

var messages = "";
var repeatInterval = 1000; // 2000 ms == 2 seconds
var repeatTagInterval = 5; // 2000 ms == 2 seconds
var videoRawData = new Array(); //store data
var videoTagData = new Array(); //store data

var tagWidth = 60;
var tagHeight = 20;

var vrdTimeID = 0;
var vtdTimeID = 0;

/*
 * doSave is a function 
 * which could help you download your file
 * so that you could save your data in an array
 * then automatically download it
 */
function doSave(value, type, name) {
    var blob;
    if (typeof window.Blob == "function") {
        blob = new Blob([value], {type: type});
    } else {
        var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
        var bb = new BlobBuilder();
        bb.append(value);
        blob = bb.getBlob(type);
    }
    var URL = window.URL || window.webkitURL;
    var bloburl = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    if ('download' in anchor) {
        anchor.style.visibility = "hidden";
        anchor.href = bloburl;
        anchor.download = name;
        document.body.appendChild(anchor);
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
        document.body.removeChild(anchor);
    } else if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, name);
    } else {
        location.href = bloburl;
    }
}


/*
 * Save is a function in which
 * you collect your data in canvas
 * then store in array and download
 */
function Save(){
	if(isCaller === true) {
		// do nothing
	}
	else if(isCaller === false){
		hiddenctx.drawImage(video1, 0, 0, datacanvas.width, datacanvas.height);
		var imageData = hiddenctx.getImageData(0, 0, datacanvas.width, datacanvas.height);
		var data = imageData.data;
		var length = data.length;
		for (var i=0;i<length;i = i+4)
		{
			videoRawData.push(data[i] + (data[i+1] << 8) + (data[i+2] << 16) );
		}
	}
	else {
		//do nothing
		alert("wrong branch");
	}
}


function SaveTag(){
	
	var mydate = new Date();
	var m = mydate.getTime();
	console.log("save video tag :" + m);
	videoTagData.push(m);

	if(isCaller === true) {
		hiddenctx.drawImage(video2, 0, 0, datacanvas.width, datacanvas.height);
		var imageData = hiddenctx.getImageData(0, 0, tagWidth, tagHeight);
		var data = imageData.data;
		var length = data.length;
		for (var i=0;i<length;i = i+4)
		{
			videoTagData.push(data[i] + (data[i+1] << 8) + (data[i+2] << 16) );
		}
	}
	else if(isCaller === false){
		hiddenctx.drawImage(video1, 0, 0, datacanvas.width, datacanvas.height);
		var imageData = hiddenctx.getImageData(0, 0, tagWidth, tagHeight);
		var data = imageData.data;
		var length = data.length;
		for (var i=0;i<length;i = i+4)
		{
			videoTagData.push(data[i] + (data[i+1] << 8) + (data[i+2] << 16) );
		}
	}
	else {
		//do nothing
		alert("wrong branch");
	}
}

function senderInitVideoQualityMeasure() {
	video1 = document.getElementById("remoteView0");
	video2 = document.getElementById("localView");

	if(video1 === null)
	{
		setTimeout(function () {
            senderInitVideoQualityMeasure();
        }, 5000);
	} else {
		SaveVideoTagData();
	}
}

function receiverInitVideoQualityMeasure() {
	video1 = document.getElementById("remoteView0");
	video2 = document.getElementById("localView");

	if(video1 === null || video2 === null)
	{
		setTimeout(function () {
            receiverInitVideoQualityMeasure();
        }, 2000);
	} else {
		SaveVideoData();
		SaveVideoTagData();
	}
}


/*
 * it's an API
 * User use this function to get video data
 */
function SaveVideoData() {
	Save();
	
	vrdTimeID = setTimeout(function () {
            SaveVideoData();
        }, repeatInterval);
}


/*
 * it's an API
 * User use this function to get video data
 */
function SaveVideoTagData() {
	SaveTag();
	
	vtdTimeID = setTimeout(function () {
            SaveVideoTagData();
        }, repeatTagInterval);
}


/*
 * It is a wrapper about the Chrome GetStats API
 */
function getStats(peer) {
    myGetStats(peer, function (results) {
        for (var i = 0; i < results.length; ++i) {
            var res = results[i];
			//console.log(res.type + " : " + res.timestamp.getTime());
            if(res.type == "ssrc" && "googFrameHeightInput" in res) {
				var t = res.timestamp;
				var encodeT = res.googAvgEncodeMs;
				var capturejitter = res.googCaptureJitterMs;
				var Rtt = res.googRtt;
				var message = (new Date()).getTime() + "      Timestamp:" + t.getTime();
				message += " googAvgEncodeMs:" + encodeT;
				message += " googCaptureJitterMs:" + capturejitter;
				message += " googRtt:" + Rtt;
				message += "\r\n";
				messages += message; 
				
				console.log( message);
				//messages.push(message);
				
			}
			else if(res.type == "ssrc" && "googFrameHeightReceived" in res) {
				var t = res.timestamp;
				var curDelayMs = res.googCurrentDelayMs;
				var tarDelayMs = res.googTargetDelayMs;
				var renDelayMs = res.googRenderDelayMs;
				var decodeT = res.googDecodeMs;
				var jBufferT = res.googJitterBufferMs;
				var playOutDelay = res.googMinPlayoutDelayMs;
				var message = (new Date()).getTime() + "      Timestamp:" + t.getTime();
				message += " googTargetDelayMs:" + tarDelayMs;
				message += " googCurrentDelayMs:" + curDelayMs;
				message += " googRenderDelayMs" + renDelayMs;
				message += " googDecodeMs" + decodeT;
				message += " googJitterBufferMs" + jBufferT;
				message += " googMinPlayoutDelayMs" + playOutDelay;
				message += "\r\n";
				messages += message;
				//messages.push(message);
			}
        }
		//doSave(results, "text/latex", "lala.txt");
		

        setTimeout(function () {
            getStats(peer);
        }, repeatInterval);
    });
}


/*
 * a wrapper
 */
function myGetStats(peer, callback) {
    if (!!navigator.mozGetUserMedia) {
        peer.getStats(
            function (res) {
                var items = [];
                res.forEach(function (result) {
                    items.push(result);
                });
                callback(items);
            },
            callback
        );
    } else {
        peer.getStats(function (res) {
            var items = [];
            res.result().forEach(function (result) {
                var item = {};
                result.names().forEach(function (name) {
                    item[name] = result.stat(name);
                });
                item.id = result.id;
                item.type = result.type;
                item.timestamp = result.timestamp;
                items.push(item);
            });
            callback(items);
        });
    }
 };
 

function downloadVideoQualityData() {
	clearTimeout(vrdTimeID);
	clearTimeout(vtdTimeID);
	if(isCaller === true) {
		var filename = "senderTagData.txt";
		doSave(videoTagData, "text/latex", filename); 
	} else {
		var filename1 = "receiverTagData.txt";
		var filename2 = "receiverVideoRawData.txt";
		doSave(videoRawData, "text/latex", filename2);
		setTimeout(function () {
            doSave(videoTagData, "text/latex", filename1);
        }, 1000);
	}
}


