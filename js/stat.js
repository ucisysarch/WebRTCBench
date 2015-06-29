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
var TestTime = 20000;
var videoRawData = new Array(); //store data
var videoTagData = new Array(); //store data

var tagWidth = 60;
var tagHeight = 20;

var vrdTimeID = 0;
var vtdTimeID = 0;

var jChart = null;
var lChart = null;
var qChart = null;
var qChart2 = null;
var qChart3 = null;

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

	if(video1 === null || video2 == null)
	{
		setTimeout(function () {
            senderInitVideoQualityMeasure();
        }, 2000);
	} else {
		SaveVideoTagData();
		setTimeout(function () {
            downloadVideoQualityData();
        }, TestTime);
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
	if(peerConnection != null)
	{
		peerConnection.getLocalStreams()[0].stop();
		peerConnection.close();
		peerConnection = null;
	}
	if(isCaller === true) {
		var filename = "senderTagData.txt";
		//doSave(videoTagData, "text/latex", filename);
		var vtd = videoTagData.join(",");
		$.ajax({
			data: {"vtd" : vtd},
			url: '/sender',
			type: 'post',
			cache: false,
			timeout: 10000,
			success: function(data){
				console.log("data transmit success");
			},
			error: function(jqXHR, textStatus, errorThrown){
				alert('error : ' + textStatus + " " + errorThrown);
			}
		});
	} else {
		var filename1 = "receiverTagData.txt";
		var filename2 = "receiverVideoRawData.txt";
		
		/*doSave(videoRawData, "text/latex", filename2);
		setTimeout(function () {
			doSave(videoTagData, "text/latex", filename1);
		}, 1000); */
		var vtd = videoTagData.join(",");
		var vrd = videoRawData.join(",");
		$.ajax({
			data: {"vtd" : vtd, "vrd" : vrd},
			url: '/receiver',
			type: 'post',
			cache: false,
			timeout: 10000,
			success: function(data){
				console.log("data transmit success");
			},
			error: function(jqXHR, textStatus, errorThrown){
				alert('error : ' + textStatus + " " + errorThrown);
			}
		});
	}
}

function getJitter() {
	$.ajax({
		data: {"blank" : " "},
		url: '/jitter',
		type: 'post',
		cache: false,
		timeout: 20000,
		success: function(data){
			var jitter = data.jitter;
			var ctx = document.getElementById("chartJitter").getContext("2d");
			var jitterData = { labels: [], datasets: [ {
            	label: "My First dataset",
            	fillColor: "rgba(220,220,220,0.2)",
            	strokeColor: "rgba(220,220,220,1)",
            	pointColor: "rgba(220,220,220,1)",
            	pointStrokeColor: "#fff",
            	pointHighlightFill: "#fff",
            	pointHighlightStroke: "rgba(220,220,220,1)",
            	data: []
        	}]};
			jitter = jitter.split("\n");
			var fnum = $("#jnum").val();
			fnum = parseInt(fnum);
			var threshold = $("#jthreshold").val();
			threshold = parseFloat(threshold);
			for(var i = 0;i < jitter.length && i < fnum;i++) {
				if(jitter[i] > threshold) continue;
				jitterData.labels.push(i);
				jitterData.datasets[0].data.push(jitter[i]);
			}
			if(jChart != null) jChart.destroy();
            jChart = new Chart(ctx).Line(jitterData, {responsive: true, maintainAspectRatio: false, scaleShowLabels: true});
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('error : ' + textStatus + " " + errorThrown);
		}
	});
}


function getLatency() {
	$.ajax({
		data: {"blank" : " "},
		url: '/latency',
		type: 'post',
		cache: false,
		timeout: 20000,
		success: function(data){
			var latency = data.latency;
			var ctx = document.getElementById("chartLatency").getContext("2d");
			var latencyData = { labels: [], datasets: [ {
            	label: "My First dataset",
            	fillColor: "rgba(220,220,220,0.2)",
            	strokeColor: "rgba(220,220,220,1)",
            	pointColor: "rgba(220,220,220,1)",
            	pointStrokeColor: "#fff",
            	pointHighlightFill: "#fff",
            	pointHighlightStroke: "rgba(220,220,220,1)",
            	data: []
        	}]};
			latency = latency.split("\n");
			var fnum = $("#lnum").val();
			fnum = parseInt(fnum);
			var threshold = $("#lthreshold").val();
			threshold = parseFloat(threshold);
			for(var i = 0;i < latency.length && i < fnum;i++) {
				if(latency[i] > threshold) continue;
				latencyData.labels.push(i);
				latencyData.datasets[0].data.push(latency[i]);
			}
			if(lChart != null) lChart.destroy();
            lChart = new Chart(ctx).Line(latencyData, {responsive: true, maintainAspectRatio: false, scaleShowLabels: true});
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('error : ' + textStatus + " " + errorThrown);
		}
	});
}

function getQuality() {
	$.ajax({
		data: {"blank" : " "},
		url: '/quality',
		type: 'post',
		cache: false,
		timeout: 20000,
		success: function(data){
			var quality = data.quality;
			var ctx = document.getElementById("chartQuality").getContext("2d");
			var ctx2 = document.getElementById("chartQuality2").getContext("2d");
			var ctx3 = document.getElementById("chartQuality3").getContext("2d");
			var psnrData = { labels: [], datasets: [ {
            		label: "PSNR",
            		fillColor: "rgba(220,220,220,0.2)",
            		strokeColor: "rgba(220,220,220,1)",
            		pointColor: "rgba(220,220,220,1)",
            		pointStrokeColor: "#fff",
            		pointHighlightFill: "#fff",
            		pointHighlightStroke: "rgba(220,220,220,1)",
            		data: []
				}]};

			var ssimData = { labels: [], datasets: [ {
            		label: "SSIM",
            		fillColor: "rgba(220,220,220,0.2)",
            		strokeColor: "rgba(220,220,220,1)",
            		pointColor: "rgba(220,220,220,1)",
            		pointStrokeColor: "#fff",
            		pointHighlightFill: "#fff",
            		pointHighlightStroke: "rgba(220,220,220,1)",
            		data: []
				}]};

			var psData = { labels: [], datasets: [ {
            		label: "SSIM&PSNR",
            		fillColor: "rgba(220,220,220,0.2)",
            		strokeColor: "rgba(220,220,220,1)",
            		pointColor: "rgba(220,220,220,1)",
            		pointStrokeColor: "#fff",
            		pointHighlightFill: "#fff",
            		pointHighlightStroke: "rgba(220,220,220,1)",
            		data: []
				}]};
			quality = quality.split("\n");
			console.log(quality);
			var fnum = $("#qnum").val();
			fnum = parseInt(fnum);
			for(var i = 0;i < quality.length-1 && i < 2*fnum;i += 2) {
				psnrData.labels.push(i/2);
				ssimData.labels.push(i/2);
				psnrData.datasets[0].data.push(quality[i]);
				ssimData.datasets[0].data.push(quality[i+1]);
				psData.labels.push(quality[i+1]);
				psData.datasets[0].data.push(quality[i]);
			}
			if(qChart != null) qChart.destroy();
			if(qChart2 != null) qChart2.destroy();
			if(qChart3 != null) qChart3.destroy();
            qChart = new Chart(ctx).Line(psnrData, {responsive: true, maintainAspectRatio: false, scaleShowLabels: true});
            qChart2 = new Chart(ctx2).Line(ssimData, {responsive: true, maintainAspectRatio: false, scaleShowLabels: true});
            qChart3 = new Chart(ctx3).Line(psData, {responsive: true, maintainAspectRatio: false, scaleShowLabels: true});
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('error : ' + textStatus + " " + errorThrown);
		}
	});
}

