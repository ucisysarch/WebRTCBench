var dumpBlob ="";
var WAITING_STEPS= 1;
var COLLECTION_STEPS = 180 ;
var HD = false ;
var h264 = false ;
var vp9 = false ;


var googVidSize = "VGA" ; // QVGA, HD
var dcOrdered = true;
var mozFakeVideo = false ;
// Dictionary that will contains experiment settings and WebRTC related events
var eventLogs = {};
eventLogs["events"] = {};
//Socket used for communication to signalling server
var signallingSocket;
var dataChannel;
/**
* This class collects events and store them into eventLogs dictionary
* This class collects events and store them into eventLogs dictionary
*/
var sendBlob = new Blob;


var eventLogger = {
    isVerbose : false ,
    addEvent: function(event, timestamp){
        eventLogs["events"][event] = timestamp;
        var t1 = 0 ;
        switch (event)
        {
            case events.Events.PC_CREATED :
                if( eventLogs["events"][events.Events.CREATING_PC] !== null ) {
                    t1 = eventLogs["events"][events.Events.CREATING_PC];
                    log("Peer Connection Object created in " + (timestamp - t1).toString() + " ms"  );
                }
                break;
            case events.Events.LOCAL_MEDIA_CAPTURED:
                if( eventLogs["events"][events.Events.GETTING_MEDIA] !== null ) {
                    t1 = eventLogs["events"][events.Events.GETTING_MEDIA];
                    log("Got Stream from Device in " + (timestamp - t1).toString()  + " ms" );
                }
                break;
            case events.Events.LOCAL_PLAYBACK_STARTED:
                if( eventLogs["events"][events.Events.CREATING_PC] !== null ) {
                    t1 = eventLogs["events"][events.Events.CREATING_PC];
                    log("Local media playback started in " + (timestamp - t1).toString() + " ms" );
                }
                break;
            case events.Events.DATA_CHANNEL_OPENED:
                if( eventLogs["events"][events.Events.CREATING_DATA_CHANNEL] !== null ) {
                    t1 = eventLogs["events"][events.Events.CREATING_DATA_CHANNEL];
                    log("Datachannel opened in " + (timestamp - t1).toString() + " ms" );
                }
                break;
            case events.Events.ANSWER_CREATED:
                if( eventLogs["events"][events.Events.CREATING_ANSWER] !== null ) {
                    t1 = eventLogs["events"][events.Events.CREATING_ANSWER];
                    log("Answer created in " + (timestamp - t1).toString() + " ms" );
                }
                break;
        }
    },
    info :  function(event, timestamp){
        log(event + " at " + timestamp.toString());
        this.addEvent(event,timestamp);
    } ,
    verbose :  function(event, timestamp) {
        if( this.isVerbose ){
            log(event + " at " + timestamp.toString());
        }
        this.addEvent(event,timestamp);
    }
};



function DataStats()
{
    this.channelId = "";
    this.bytesSent = 0 ;
    this.bytesReceived = 0 ; // Current rate (over a second timestamp )
    this.packetsSent = 0 ;
}




function VideoStats()
{
    this.timestamp =0 ;
    this.decodedFrames = 0 ;
    this.decodeRate = 0 ; // Current rate (over a second timestamp )
    this.dropRate = 0 ;
    this.renderedFrames = 0 ;
    this.renderRate = 0 ; // Rendered in the last second
}

/*
 * Represents RTP stat (Mozilla)
 */
function MozStat()
{
    // Encoder
    this.encoderStats = {

        bitRateMean :0 ,
        bitRateSTDDev:0,
        frameRateMean:0,
        frameRateSTDDev:0,
        droppedFrames:0,
        bytesSent:0
    };
    // Decoder
    this.decoderStats = {
        bitRateMean :0 ,
        bitRateSTDDev:0,
        frameRateMean:0,
        frameRateSTDDev:0,
        bytesReceived:0
    }
    ;


    videoStats = {};
    // Network stuff

    this.videoInputJitter = 0 ;
    this.rtt = 0 ;
    this.sendBitRate =0 ;
    this.packetReceiveRate = 0 ;
    this.packetSendRate =0;
    this.packetsLost = 0 ;


}



function ChromeStats()
{
    this.availableSentBandwidth = 0 ;
    this.bitRate = 0 ;
    this.availableReceiveBandwidth = 0 ;
    this.jitter = 0 ;
    this.targetEncodingBitRate = 0 ;
    this.actualEncodingBitRate = 0 ;
    this.transmitBitrate = 0 ;
    this.sendBitRate = 0 ;
    this.rtt = 0 ;
    this.captureFrameRate = 0 ;
    this.sendFrameRate = 0 ;
    this.recieveFrameRate = 0 ;
    this.decodeFramRate = 0 ;
    this.sendFrameSize = {
        width : 0 ,
        height : 0
    };
    this.sendBitRate =0 ;
    this.packetReceiveRate = 0 ;
    this.packetSendRate =0;
    this.packetsLost = 0 ;
    this.videoStats = {};
}



var bytesPrev = 0;
var timestampPrev = 0;
var SentbytesPrev = 0;
var SenttimestampPrev = 0;
var PacketsSentPrev = 0;
var PacketsReceivedPrev =0;
var peerresult = 0;
var workloadcounter = 0;

//FPS workload
var decodedFrames = 0;
var decodedPerSec = 0;
var renderFrames = 0;
var renderPerSec = 0;
var droppedFrames = 0;
var droppedFramesPerSec = 0;
var tempDecodedFrames = 0;

var RmtdecodedFrames = 0;
var RmtdecodedPerSec = 0;
var RmtrenderFrames = 0;
var RmtrenderPerSec = 0;
var RmtdroppedFrames = 0;
var RmtdroppedFramesPerSec = 0;
var tempRmtDecodedFrames = 0;


dataStatsCounter = new DataStats();

function Mean() {
    this.count = 0;
    this.sum = 0;

    this.record = function(val) {
        this.count++;
        this.sum += val;
    };

    this.mean = function() {
        return this.count ? (this.sum / this.count).toFixed(3) : 0;
    };
}


var decodedMean = new Mean();
var dropMean = new Mean();

var RmtdecodedMean = new Mean();
var RmtdropMean = new Mean();


// Dumping a stats variable as a string.
function dumpStats(obj) {
    var statsString = 'Timestamp:';
    statsString += obj.timestamp;
    if (obj.id) {
        statsString += "<br>id ";
        statsString += obj.id;
    }
    if (obj.type) {
        statsString += " type ";
        statsString += obj.type;
    }
    if (obj.names) {
        names = obj.names();
        for (var i = 0; i < names.length; ++i) {
            statsString += '<br>';
            statsString += names[i];
            statsString += ':';
            statsString += obj.stat(names[i]);
        }
    } else {
        if (obj.stat('audioOutputLevel')) {
            statsString += "audioOutputLevel: ";
            statsString += obj.stat('audioOutputLevel');
            statsString += "<br>";
        }
    }
    return statsString;
}




var bytesSent = 0 ;
var bytesReceived = 0 ;
var packetsSent = 0 ;
var packetsReceived = 0 ;
var packetsLost = 0 ;


function googmakeVp9Default(sdp) {
    console.log("Offer sdp vp8:" + sdp);
    updated_sdp = sdp.replace("a=rtpmap:100 VP8/90000\r\n","");
    updated_sdp = updated_sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 100 ([0-9 ]*)/g, "m=video $1 RTP\/SAVPF $2 $3");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:100 nack\r\n","");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:100 nack pli\r\n","");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:100 ccm fir\r\n","");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:100 goog-remb\r\n","");
    updated_sdp = updated_sdp.replace("a=fmtp:96 apt=100","a=fmtp:96 apt=101");

    console.log("Offer sdp vp9:" + updated_sdp);
    return updated_sdp;
}

function mozRemoveVP8(sdp) {
    console.log("Offer sdp vp8:" + sdp);
    updated_sdp = sdp.replace("a=rtpmap:120 VP8/90000\r\n","");
    updated_sdp = updated_sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 120/g, "m=video $1 RTP\/SAVPF $2");
    updated_sdp = updated_sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 120([0-9 ]*)/g, "m=video $1 RTP\/SAVPF$2");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:120 nack\r\n","");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:120 nack pli\r\n","");
    updated_sdp = updated_sdp.replace("a=rtcp-fb:120 ccm fir\r\n","");
    console.log("Offer sdp h264:" + updated_sdp);
    return updated_sdp;
}
var bytesSent = 0;
var bytesReceived = 0;
var timer = 0 ;
var olddbrmean = 0 ;
var oldebrmean = 0 ;
if( detectedBrowser == "Firefox" ) {

    function x(stats) {
        var y = stats;
       // var results = stats.result();
        //for (var i = 0; i < results.length; ++i) {
        //    var res = results[i];
       // }
    }

    function collectDataChannelStats(doReport)
    {
        if (peerConnection ) {
            if (peerConnection.getStats) {
                peerConnection.getStats(null,x,x);
            }
        }
    }



    function recalcRates() {


        var localVideoStats = new VideoStats();
        var remoteVideoStats = new VideoStats();



        var v = this.get("localView");
        if( v  ){
            if (v.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || v.paused) {
                return {
                    local:localVideoStats,
                    remote:remoteVideoStats
                };
            }
            decodedPerSec = (v.mozDecodedFrames - decodedFrames);
            decodedFrames = v.mozDecodedFrames;

            renderPerSec = v.mozPaintedFrames - renderFrames;
            renderFrames = v.mozPaintedFrames;

            droppedFramesPerSec = v.mozDecodedFrames - v.mozPresentedFrames - droppedFrames;
            droppedFrames = v.mozDecodedFrames - v.mozPresentedFrames ;


            decodedMean.record(renderPerSec);
            dropMean.record(droppedFramesPerSec);

            if((tempDecodedFrames - decodedFrames) != 0){
                tempDecodedFrames = decodedFrames;
            }

            localVideoStats.decodedFrames = decodedFrames ;
            localVideoStats.decodeRate = decodedPerSec ;
            localVideoStats.renderedFrames = renderFrames ;
            localVideoStats.renderRate = renderPerSec ;
            localVideoStats.droppedFrames = droppedFrames ;
            localVideoStats.dropRate = droppedFramesPerSec ;


        }


        var vRmt = get("remoteView0");

        if( vRmt ) {
            if (vRmt.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || vRmt.paused) {
                return {
                    local: localVideoStats,
                    remote: remoteVideoStats
                };
            }

            RmtdecodedPerSec = (vRmt.mozDecodedFrames - RmtdecodedFrames);
            RmtdecodedFrames = vRmt.mozDecodedFrames;

            RmtrenderPerSec = vRmt.mozPaintedFrames - RmtrenderFrames;
            RmtrenderFrames = vRmt.mozPaintedFrames;

            RmtdroppedFramesPerSec = vRmt.mozDecodedFrames - vRmt.mozPresentedFrames - RmtdroppedFrames;
            RmtdroppedFrames = vRmt.mozDecodedFrames - vRmt.mozPresentedFrames;


            RmtdecodedMean.record(RmtrenderPerSec);
            RmtdropMean.record(RmtdroppedFramesPerSec);

            if ((RmtdecodedFrames - tempRmtDecodedFrames) != 0) {
                tempRmtDecodedFrames = RmtdecodedFrames;
            }

            remoteVideoStats.decodedFrames = RmtdecodedFrames;
            remoteVideoStats.decodeRate = RmtdecodedPerSec;
            remoteVideoStats.renderedFrames = RmtrenderFrames;
            remoteVideoStats.renderRate = RmtrenderPerSec;
            remoteVideoStats.droppedFrames = RmtdroppedFrames;
            remoteVideoStats.dropRate = RmtdroppedFramesPerSec;
        }

        return {
            local:localVideoStats,
            remote:remoteVideoStats
        };

    }
    function collectStats(doReport){
        if (peerConnection && ( peerConnection.getRemoteStreams()[0]  || peerConnection.getLocalStreams()[0]  ) ) {
            if (peerConnection.getStats) {
                peerConnection.getStats(null, function(stats) {
                    var mozStats = new MozStat;
                    var videoStats = recalcRates();
                    mozStats.videoStats = videoStats ;

                    var statsString = '';
                    var bitrateText = 'No bitrate stats';
                    var i = 0;

                    stats.forEach(function(res) {
                        statsString += '<h3>Report ';
                        statsString += i;
                        statsString += '</h3>';
                        //statsString += dumpStats(res);
                        // Find the bandwidth info for video
                        if (res.type === "inboundrtp") {
                            //audio & video

                            if( res.mediaType === "audio")
                            {
                                var audioBytesNow = res.bytesReceived;
                                var audioJitter = res.jitter ;
                                var audiortt = res.mozRTT ;
                                var audioPacketsLost = res.packetsLost;
                                var audioPacketsReceived = res.packetsReceived;
                            }
                            if ( res.mediaType === "video" && !res.isRemote)
                            {

                                mozStats.decoderStats.bitRateMean = res.bitrateMean ;
                                mozStats.decoderStats.bitRateSTDDev = res.bitratStdDev ;
                                mozStats.decoderStats.frameRateMean = res.framerateMean;
                                mozStats.decoderStats.frameRateSTDDev = res.framerateStdDev;

                                mozStats.decoderStats.bytesReceived = res.bytesReceived -  bytesReceived ;
                                bytesReceived = res.bytesReceived;

                                mozStats.videoInputJitter = res.jitter;

                            }

                        } else if( res.type === "outboundrtp" ){
                            var id = res.id ; // Which channel
                            if ( res.mediaType === "video" && ! res.isRemote)
                            {
                                mozStats.encoderStats.bitRateMean = res.bitrateMean ;
                                mozStats.encoderStats.bitRateSTDDev = res.bitratStdDev ;
                                mozStats.encoderStats.frameRateMean = res.framerateMean;
                                mozStats.encoderStats.frameRateSTDDev = res.framerateStdDev;
                                mozStats.encoderStats.droppedFrames = res.droppedFrames ;
                                mozStats.encoderStats.bytesSent = res.bytesSent - bytesSent;
                                bytesSent = res.bytesSent;
                            }
                            if ( res.mediaType === "audio"){

                            }
                            timestampPrev = res.timestamp;
                        }else if( res.type === "track"){
                            var id = res.id ; // Which channel
                        }
                    });
                    if( doReport )
                    {
                       // var result = [  "VInpJitter" , mozStats.videoInputJitter,  " Decode bytesR,br,fr " , mozStats.decoderStats.bytesReceived, mozStats.decoderStats.bitRateMean , mozStats.decoderStats.frameRateMean
                       //         , "Encode: bytesS,br,fr,df " , mozStats.encoderStats.bytesSent, mozStats.encoderStats.bitRateMean, mozStats.encoderStats.frameRateMean,
                       //     mozStats.encoderStats.droppedFrames
                       //    ,"l.render ", videoStats.local.renderRate , "r.render " , videoStats.remote.renderRate
                       // ];



                        var result = [ timer ,  " VInpJit" , mozStats.videoInputJitter,  " Decode brm,frm " ,  mozStats.decoderStats.bitRateMean , mozStats.decoderStats.frameRateMean
                            , "Encode: br,fr,df " , mozStats.encoderStats.bitRateMean, mozStats.encoderStats.frameRateMean,
                            mozStats.encoderStats.droppedFrames
                            ,"l.render ", videoStats.local.renderRate , "r.render " , videoStats.remote.renderRate
                        ];

                        oldebrmean = mozStats.encoderStats.bitRateMean ;
                        olddbrmean = mozStats.decoderStats.bitRateMean ;

                        log(result.join(","));
                        dumpBlob += result.join("\0") + "\n";
                        timer = timer + 1 ;
                        // statsArray.push(mozStats);

                    }
                }, log);


                
            } else {
                log('No stats function. Use at least Firefox 26');
            }
        }
        else {
            //display("No stream");
            //log('Not connected yet');
        }
    }
}
else if ( detectedBrowser == "Chrome"){
    var d1 = 0;
    var d2  = 0;

    function collectDataChannelStats(doReport)
    {
        if (peerConnection ) {
            chromeStats = new ChromeStats();
            if (peerConnection.getStats) {
                peerConnection.getStats(function(stats) {
                    var results = stats.result();
                    for (var i = 0; i < results.length; ++i) {
                        var res = results[i];
                        if (res.type == 'googCandidatePair' && res.stat('googActiveConnection') == 'true'  ){
                            var dchannelId = res.stat('googChannelId');
                            var dbytesSent = res.stat('bytesSent') | 0;
                            var dbytesReceived = res.stat('bytesReceived') | 0;
                            var dpacketsSent = res.stat('packetsSent') | 0 ;
                            var dpacketsDiscardedOnSend =  res.stat('packetsDiscardedOnSend') | 0 ;
                            var rtt = res.stat('googRtt') | 0;

                            var result = [  "channel: " + dchannelId,  "bytesSent" + dbytesSent ,  "bytesReceived" + dbytesReceived ,
                                "packetsSent" + dpacketsSent  , "packetsDiscardedOnSend", dpacketsDiscardedOnSend  , "rtt" , rtt
                            ];
                            log(result.join(","));
                        }
                    }
                });
            }
        }
    }


    function recalcRates() {
        var localVideoStats = new VideoStats();
        var remoteVideoStats = new VideoStats();



        var v = this.get("localView");


        if (v ) {
            if( v.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || v.paused ) {
                return {
                    local: localVideoStats,
                    remote: remoteVideoStats
                };
            }

            decodedPerSec = (v.webkitDecodedFrameCount - decodedFrames);
            decodedFrames = v.webkitDecodedFrameCount;
            droppedFramesPerSec = v.webkitDroppedFrameCount - droppedFrames;
            droppedFrames = v.webkitDroppedFrameCount;

            renderFrames = decodedFrames - droppedFrames;
            renderPerSec = decodedPerSec - droppedFramesPerSec;

            decodedMean.record(renderPerSec);
            dropMean.record(droppedFramesPerSec);

            if ((tempDecodedFrames - decodedFrames) != 0) {
                tempDecodedFrames = decodedFrames;
            }
            localVideoStats.decodedFrames = decodedFrames;
            localVideoStats.decodeRate = decodedPerSec;
            localVideoStats.renderedFrames = renderFrames;
            localVideoStats.renderRate = renderPerSec;
            localVideoStats.droppedFrames = droppedFrames;
            localVideoStats.dropRate = droppedFramesPerSec;
        }
        var vRmt = get("remoteView0");
         if( vRmt ) {
            if( vRmt.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || vRmt.paused) {
                return {
                    local:localVideoStats,
                    remote:remoteVideoStats
            };
            }

            RmtdecodedPerSec = (vRmt.webkitDecodedFrameCount - RmtdecodedFrames);
            RmtdecodedFrames = vRmt.webkitDecodedFrameCount;

            RmtdroppedFramesPerSec = vRmt.webkitDroppedFrameCount - RmtdroppedFrames;
            RmtdroppedFrames = vRmt.webkitDroppedFrameCount;

            RmtrenderFrames = RmtdecodedFrames - RmtdroppedFrames;
            RmtrenderPerSec = RmtdecodedPerSec - RmtdroppedFramesPerSec;

            RmtdecodedMean.record(RmtrenderPerSec);
            d1 = RmtdecodedMean.mean();

            RmtdropMean.record(RmtdroppedFramesPerSec);

            remoteVideoStats.decodedFrames = RmtdecodedFrames;
            remoteVideoStats.decodeRate = RmtdecodedPerSec;
            remoteVideoStats.renderedFrames = RmtrenderFrames;
            remoteVideoStats.renderRate = RmtrenderPerSec;
            remoteVideoStats.droppedFrames = RmtdroppedFrames;
            remoteVideoStats.dropRate = RmtdroppedFramesPerSec;


            if ((RmtdecodedFrames - tempRmtDecodedFrames) != 0) {
                tempRmtDecodedFrames = RmtdecodedFrames;
            }
        }
        return {
            local:localVideoStats,
            remote:remoteVideoStats
        }
    }
    // Statistics
    function collectStats(doReport)
    {
        if (peerConnection ) { //TODO } && peerConnection.getRemoteStreams()[0]) {
            chromeStats = new ChromeStats();
            if (peerConnection.getStats) {
                peerConnection.getStats(function(stats) {


                    var videoStats = recalcRates();
                    chromeStats.videoStats = videoStats ;
                    var statsString = '';
                    var results = stats.result();
                    var bitrateText = 'No bitrate stats';
                    for (var i = 0; i < results.length; ++i) {
                        var res = results[i];
                        statsString += '<h3>Item ';
                        statsString += i;
                        statsString += '</h3>';
                        if (!res.local || res.local === res) {
                            statsString += dumpStats(res);
                            if (res.type == 'ssrc' && res.stat('googFrameHeightReceived')) {
                                var receiverFPS = res.stat('googFrameRateReceived');
                                chromeStats.recieveFrameRate = receiverFPS ;
                                var DecodedFPS = res.stat('googFrameRateDecoded');
                                chromeStats.decodeFramRate = DecodedFPS ;
                                d2 = DecodedFPS ;
                                var packetsReceived = res.stat('packetsReceived');

                                var packetsLost = res.stat('packetsLost');
                                chromeStats.packetsLost = packetsLost ;
                                var bytesNow = res.stat('bytesReceived');
                                if (timestampPrev > 0) {
                                    var bitRate = Math.round((bytesNow - bytesPrev) * 8 /
                                        (res.timestamp - timestampPrev));
                                    chromeStats.bitRate = bitRate ;
                                    bitrateText = bitRate + ' kbits/sec';
                                    var PacketsReceivedPerSec = Math.round((packetsReceived - PacketsReceivedPrev) * 1000 /
                                        (res.timestamp - timestampPrev));
                                    chromeStats.packetReceiveRate = PacketsReceivedPerSec ;
                                }
                                timestampPrev = res.timestamp;
                                bytesPrev = bytesNow;
                                PacketsReceivedPrev = packetsReceived;
                            } else if (res.type == 'ssrc' && res.stat('googFrameHeightSent')) {
                                var codecName = res.stat('googCodecName');
                                var frameHeightSent = res.stat('googFrameHeightSent');
                                chromeStats.sendFrameSize.height = frameHeightSent ;
                                var frameWidthSent = res.stat('googFrameWidthSent');
                                chromeStats.sendFrameSize.width = frameWidthSent ;
                                var captureFPS = res.stat('googFrameRateInput');
                                chromeStats.captureFrameRate = captureFPS ;
                                var senderFPS = res.stat('googFrameRateSent');
                                chromeStats.sendFrameRate = senderFPS ;
                                var packetsSent = res.stat('packetsSent');

                                var bytesSent = res.stat('bytesSent');
                                var Rtt = res.stat('googRtt');
                                if (SenttimestampPrev > 0) {
                                    var SentbitRate = Math.round((bytesSent - SentbytesPrev) * 8 /
                                        (res.timestamp - SenttimestampPrev));
                                    chromeStats.sendBitRate = SentbitRate ;
                                    var PacketsSentPerSec = Math.round((packetsSent - PacketsSentPrev) * 1000 /
                                        (res.timestamp - SenttimestampPrev));
                                    chromeStats.packetSendRate = PacketsSentPerSec ;
                                }
                                SenttimestampPrev = res.timestamp;
                                SentbytesPrev = bytesSent;
                                PacketsSentPrev = packetsSent;
                            } else if (res.type == 'VideoBwe') {
                                var ActualEncBitrate = res.stat('googActualEncBitrate');
                                var TargetEncBitrate = res.stat('googTargetEncBitrate');
                                chromeStats.actualEncodingBitRate = ActualEncBitrate ;
                                chromeStats.targetEncodingBitRate = TargetEncBitrate ;


                                var AvailableSendBandwidth = res.stat('googAvailableSendBandwidth');
                                chromeStats.availableSentBandwidth = AvailableSendBandwidth ;
                                var RetransmitBitrate = res.stat('googRetransmitBitrate');
                                var AvailableReceiveBandwidth = res.stat('googAvailableReceiveBandwidth');
                                chromeStats.availableReceiveBandwidth = AvailableReceiveBandwidth ;
                                var BucketDelay = res.stat('googBucketDelay');
                                var TransmitBitrate = res.stat('googTransmitBitrate');
                                chromeStats.transmitBitrate = TransmitBitrate ;
                            } else if (res.type == 'ssrc' && res.stat('audioOutputLevel')) {  //audio
                                var audiopacketsReceived = res.stat('packetsReceived');
                                var audiopacketsLost = res.stat('packetsLost');
                                var audiobyteReceived = res.stat('bytesReceived');
                                var audioOutputLevel = res.stat('audioOutputLevel');
                                var audioJitterReceived = res.stat('googJitterReceived');
                            } else if (res.type == 'ssrc' && res.stat('audioInputLevel')) {
                                var audioInputLevel = res.stat('audioInputLevel');
                                var audioRtt = res.stat('googRtt');
                                var EchoCancellationReturnLoss = res.stat('googEchoCancellationReturnLoss');
                                var audioCodecName = res.stat('googCodecName');
                                var EchoCancellationEchoDelayMedian = res.stat('googEchoCancellationEchoDelayMedian');
                                var EchoCancellationQualityMin = res.stat('googEchoCancellationQualityMin');
                                var EchoCancellationReturnLossEnhancement = res.stat('googEchoCancellationReturnLossEnhancement');
                                var EchoCancellationEchoDelayStdDev = res.stat('googEchoCancellationEchoDelayMedian');
                                var audiopacketsSent = res.stat('packetsSent');
                                var audiobytesSent = res.stat('bytesSent');
                            }
                        } else {
                            // Pre-227.0.1445 (188719) browser
                            if (res.local) {
                                statsString += "<p>Local ";
                                statsString += dumpStats(res.local);
                            }
                            if (res.remote) {
                                statsString += "<p>Remote ";
                                statsString += dumpStats(res.remote);
                            }
                        }
                    }

//Capturer/Sender/Receiver/Decoder/Render/RenderDroppedFrames/TragetEncoderBitrate/ActualEncoderBitrate/PacketLoss/Txbitrate/RxBitrate/SenderBandwidth/ReceiverBandwidth

                    timer = timer + 1 ;
                    if( doReport )
                    {
                        var result = [timer, chromeStats.sendFrameSize.width + "*" + chromeStats.sendFrameSize.height , chromeStats.captureFrameRate  , chromeStats.sendFrameRate , chromeStats.videoStats.local.renderRate , chromeStats.videoStats.local.dropRate, chromeStats.recieveFrameRate  , chromeStats.decodeFramRate , chromeStats.videoStats.remote.renderRate , chromeStats.videoStats.remote.dropRate , chromeStats.targetEncodingBitRate  , chromeStats.actualEncodingBitRate , chromeStats.packetSendRate  , chromeStats.packetReceiveRate , chromeStats.packetsLost , chromeStats.sendBitRate, chromeStats.bitRate ,chromeStats.availableSentBandwidth  , chromeStats.availableReceiveBandwidth , chromeStats.transmitBitrate ];
                        log(result.join(","));
                        dumpBlob += result.join("\0") + "\n";
                        statsArray.push(chromeStats);

                    }

                    //if($('workload-done').innerHTML != "<font color=#FF0000>" + "Data collection started!" + "</font>") {
                    //    $('workload-done').innerHTML = "<font color=#FF0000>" + "Data collection started!" + "</font>";
                    //}
                    //}
                    //else if (workloadcounter == 180 ) {
                    //    $('workload-output').innerHTML += TextBlob;
                    //    $('workload-done').innerHTML = "<font color=#FF0000>" + "Data collection done!" + "</font>";
                    //    var tempBlob = new Blob([dumpBlob], { type: 'octet/stream'});
                    //    tempUrl = window.webkitURL.createObjectURL(tempBlob);
                    //    alert("Collection Done!");
                    // }

                    //}
                });

            } else {
                //log('No stats function. Use at least Chrome 24.0.1285');
            }
        } else {
            //log('Not connected yet');
        }
    }
}



function logError(error){
    console.log(error);
}


// This method initiate input fields (OS,Device,...) based on experiment settings or from previous experiment
function initInputFields(){
    var OSType = "Unknown";
    var OSVersion = "";
    var index = -1 ;
    var ua = navigator.userAgent;
    // Find OS
    if ( ua.match(/iPad/i) || ua.match(/iPhone/i) )
    {
        OSType = "iOS";
        index  = ua.indexOf( "OS " );
    }
    else if ( ua.match(/Android/i) )
    {
        OSType = "Android";
        index  = ua.indexOf( "Android " );
    }
    else
    {
        if (ua.indexOf("Windows NT 6.3") != -1) OSType="Windows 8.1";
        if (ua.indexOf("Windows NT 6.2") != -1) OSType="Windows 8";
        if (ua.indexOf("Windows NT 6.1") != -1) OSType="Windows 7";
        if (ua.indexOf("Windows NT 6.0") != -1) OSType="Windows Vista";
        if (ua.indexOf("Windows NT 5.1") != -1) OSType="Windows XP";
        if (ua.indexOf("Windows NT 5.0") != -1) OSType="Windows 2000";
        if (ua.indexOf("Mac")!=-1) OSType="Mac/iOS";
        if (ua.indexOf("X11")!=-1) OSType="UNIX";
        if (ua.indexOf("Linux")!=-1) OSType="Linux";
    }
    // Find OS version
    if ( OSType === 'iOS'  &&  index > -1 )
    {
        OSVersion = ua.substr( index + 3, 3 ).replace( '_', '.' );
    }
    else if ( OSType === 'Android'  &&  index > -1 )
    {
        OSVersion = ua.substr( index + 8, 3 );
    }

    if( localStorage.getItem('operating-system') == null)
    {
        window.get('operating-system').value = OSType + " " + OSVersion;
    }
    else
    {
        window.get('operating-system').value = localStorage.getItem('operating-system');
    }
    window.get('processor').value = localStorage.getItem('processor');
    // Find browser type
    if( localStorage.getItem('browser')  == null )
    {
        window.get('browser').value= (function(){
            var ua= navigator.userAgent||navigator.vendor||window.opera, tem,
                M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
            if(/trident/i.test(M[1])){
                tem=  /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
                return 'IE '+(tem[1] || '');
            }
            M= M[2]? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
            if((tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
            return M.join(' ');
        })();
    }
    else
    {
        window.get('browser').value = localStorage.getItem('browser');
    }
    if( localStorage.getItem('device') != null )
    {
        window.get('device').selectedIndex = localStorage.getItem('device');
    }
    if( localStorage.getItem('verbose') != null ){
        if( localStorage.getItem('verbose') == "true" ) {
            window.get('verboseButton').className = "on";
            window.get('verboseButton').value = "Yes";
            eventLogger.isVerbose = true;
        }
        else {
            window.get('verboseButton').className = "off";
            window.get('verboseButton').value = "No";
            eventLogger.isVerbose = false;
        }
    }
    if( localStorage.getItem('sendEvents') != null ){
        if( localStorage.getItem('sendEvents') == "true" ) {
            window.get('sendButton').className = "on";
            window.get('sendButton').value = "Yes";
            sendEvents = true;
        }
        else {
            window.get('sendButton').className = "off";
            window.get('sendButton').value = "No";
            sendEvents = false ;
        }
    }
    if( localStorage.getItem('videoStats') != null ){
        if( localStorage.getItem('videoStats') == "true" ) {
            window.get('vStatsButton').className = "on";
            window.get('vStatsButton').value = "Yes";
            videoStats = true;
        }
        else {
            window.get('vStatsButton').className = "off";
            window.get('vStatsButton').value = "No";
            videoStats = false ;
        }
    }
    if( localStorage.getItem('dataStats') != null ){
        if( localStorage.getItem('dataStats') == "true" ) {
            window.get('dStatsButton').className = "on";
            window.get('dStatsButton').value = "Yes";
            dataStats = true;
        }
        else {
            window.get('dStatsButton').className = "off";
            window.get('dStatsButton').value = "No";
            dataStats = false ;
        }
    }

    //



}

//This function gets current time in milliseconds
function time(){
	return Date.now();
}

//This method send events to server
function sendEventLogs(){
	if (!signallingSocket) return;
	log("Sending event Logs To Server");
	eventLogs["device"]= window.get("device").value+ " " + window.get("processor").value;
	eventLogs["network-type"]= window.get("network-type").value;
	eventLogs["operating-system"]= window.get("operating-system").value;
	eventLogs["browser"]= window.get("browser").value;
	eventLogs["channel"]= window.get("channel").value;
	eventLogs["isCaller"]= isCaller;
	eventLogs["timestamp"]= window.get("timestamp").value;
	eventLogs["session-type"]= window.get("session-type").value;
    if( videoStats ){
        eventLogs["videoStats"] = statsArray ;
    }
	var update = JSON.stringify(eventLogs);
	signallingSocket.emit('events',update);
}


function addFiles(files) {

    var f = files[0];
    if (f) {
        var reader = new FileReader();
        var blob = new Blob;
        // Closure to capture the file information.
        reader.onload = function (file) {
            if( reader.readyState == FileReader.DONE ) {
                sendBlob = file.target.result;
            }
        };
        //reader.readAsDataURL(f);
        reader.readAsArrayBuffer(f);
    }
}

//This method will be called by caller side, and initiate a WebRTC connection
function initConnection(caller) {
    var userName = get("username");
    localName = userName.value || ("AnonUser" + Math.round(Math.random() * 1000 + Math.random() * 65));
    get("welcome").innerHTML = "Welcome " + localName;
    userName.disabled = true;
    userName.style.display = "none";
    eventLogger.verbose(events.Events.CREATING_PC, time());
    // create the WebRTC peer connection object
    var options = {
        "optional": [
            {DtlsSrtpKeyAgreement: true}//,
            //{RtpDataChannels: getData}
        ]
    };
    options = undefined; // For interoperability between Chrome and FF32+
    peerConnection = new RTCPeerConnection(null,null);//server, options);
    eventLogger.verbose(events.Events.PC_CREATED, time());
    peerConnection.oniceconnectionstatechange = function (ice_state) {
        log( peerConnection.iceGatheringState + " " + peerConnection.iceConnectionState );
        if (peerConnection.iceConnectionState == "connected") {
            eventLogger.info(events.Events.ICE_CONNECTED, time());
        }
    };

    // this handler sends ice candidates to other peer
    peerConnection.onicecandidate = function (iceEvent) {
        eventLogger.verbose(events.Events.NEW_ICE_CANDIDATE, time());
        if (iceEvent.candidate) {
            signallingSocket.emit("message",
                JSON.stringify({
                    channel: channel,
                    type: "new_ice_candidate",
                    candidate: iceEvent.candidate
                })
            );
            if (detectedBrowser == "Firefox") {
                //peerConnection.onicecandidate = null ;
            }
        }
    };
    if (getVideo || getAudio || receiveAudio || receiveVideo ) {
        peerConnection.onaddstream = function (event) {
            eventLogger.info(events.Events.REMOTE_STREAM_ARRIVED, time());
            remoteStreamArrived = true;
            var media = document.createElement(receiveAudio && !receiveVideo ? 'audio' : 'video');
            media.id = "remoteView0";
            if( receiveVideo ){
                //media.setAttribute("width", "320");
                //media.setAttribute("height", "240");
            }
            var status = document.createElement('div');
            status.id = "rmtStatus";

            if (detectedBrowser == "Chrome") {
                media.src = webkitURL.createObjectURL(event.stream);
                media.autoplay = true;
            } else {
                if (window.URL) {
                    media.src = window.URL.createObjectURL(event.stream);
                } else {
                    media.src = stream;
                }
                media.play();
            }

            var interval_r;
            media.addEventListener('play', function () {
                interval_r = setInterval(function () {
                    if (media.videoWidth != 0) {
                        clearInterval(interval_r);
                        eventLogger.info(events.Events.REMOTE_PLAYBACK_STARTED, time());
                        log("W:" + media.videoWidth + " H:" + media.videoHeight);
                        if ( sendEvents && ( !getData || (getData && dataChannelOpened) ) && !videoStats ) {
                            sendEventLogs();
                        }
                    }
                }, 50);

            }, false);
            window.get("remote-streams").appendChild(media);
            window.get("remote-streams").appendChild(status);



            if( videoStats ) {
                var stepsRemained = WAITING_STEPS;
                var statCollector = setInterval(function () {


                    remoteVideo = get('remoteView0');
                    if (remoteVideo  ) {
                        if (stepsRemained === 0) {
                            if( detectedBrowser == "Chrome")
                                log("Capturer/Sender/LocalRender/LocalRenderDropped/Receiver/Decoder/Render/RenderDroppedFrames/TragetEncoderBitrate/ActualEncoderBitrate/PacketsSent/PacketsReceived/PacketLoss/Txbitrate/RxBitrate/AvbSent/AvbReceived/TransmitBitrate");
                            else if ( detectedBrowser == "Firefox")
                                log("PacketsSent/PacketsReceived/PacketLoss/Txbitrate/RxBitrate");
                        } else if (stepsRemained == -1 * COLLECTION_STEPS) {
                            get("rmtStatus").innerHTML = remoteVideo.videoWidth + "x" + remoteVideo.videoHeight + "<br>" +
                                "Stats finished ";
                            sendEventLogs();
                        }
                        else if (stepsRemained < 0) {
                            get("rmtStatus").innerHTML = remoteVideo.videoWidth + "x" + remoteVideo.videoHeight;
                        } else {
                            get("rmtStatus").innerHTML = remoteVideo.videoWidth + "x" + remoteVideo.videoHeight + "<br>" +
                                "Stats begin in " + stepsRemained + " seconds";
                        }
                        if (stepsRemained <= 0 && stepsRemained > -1*COLLECTION_STEPS)
                            collectStats(true);
                        else
                            collectStats(false);
                    }

                    --stepsRemained;
                }, 1000);
            }
        };
        peerConnection.onremovestream = function (event) {
            log('Remote stream removed.');
        };
        if( getAudio || getVideo )
            getMedia();
    }
    if (getData) {
       // var onMessage = function (event) {
       //     var t_msg = time();
       //     appendDIV(event.data);
       //     log("Text message received at " + t_msg.toString());
       // };

        var onMessage = function (event) {
            var t_msg = time() ;
            var blob = event.data; // Firefox allows sending blobs directly
            //saveToDisk(blob, 'fake');
            if( typeof blob === "object" )
            {
                var blob = new Blob([event.data], {type:"image/png"});
                var reader = new FileReader();
                reader.onload = function(file) {
                    if (reader.readyState == FileReader.DONE) {
                        log("File received at " + time().toString() );
                        //document.getElementById("dataChannelReceive").src = file.target.result;
                        console.log("File gotten");
                        saveToDisk(file.target.result, 'fake');
                    }
                }
                reader.readAsDataURL(blob);
            }
            else
            {
               if( blob.toString() == "ping"){
                   dataChannel.send("pong");
                   //log("ping received at " + t_msg.toString() ) ;
               }
               else if( blob.toString() == "pong"){
                    log("pong received at " + t_msg.toString() ) ;
               } else {
                   log("text received at " + t_msg.toString() ) ;
                   appendDIV(event.data);
               }

            }
        };

        if (caller) {
            var dataChannelOptions = dcOrdered ? {
                ordered: true
            } : {
                ordered: false, // do not guarantee order
                maxRetransmitTime: 3000 // in milliseconds
            } ;
            dataChannel = peerConnection.createDataChannel("dc1", dataChannelOptions);
            eventLogger.verbose(events.Events.CREATING_DATA_CHANNEL, time());
            dataChannel.onerror = function (error) {
                log("Data Channel Error:" + error);
            };
            dataChannel.onmessage = onMessage;
            dataChannel.onopen = function () {
                eventLogger.verbose(events.Events.DATA_CHANNEL_OPENED, time());
                get('chat-input').disabled = false;
                dataChannelOpened = true;
                if (sendEvents && ! videoStats && ( (!getAudio && !getVideo) || (remoteStreamArrived) ) ) {
                    sendEventLogs();
                }
                var sendButton = get('sendbtn');
                sendButton.onclick =  function(){
                    log("Started Sending file at " + time().toString() );
                    dataChannel.send(sendBlob);
                };
            };
            dataChannel.onclose = function () {
                log("The Data Channel is closed");
            };
        }
        else {
            peerConnection.ondatachannel = function (e) {
                get('chat-input').disabled = false;
                dataChannel = e.channel;
                eventLogger.verbose(events.Events.CREATING_DATA_CHANNEL, time());
                dataChannel.onerror = function (error) {
                    log("Data Channel Error:", error);
                };
                dataChannel.onmessage = onMessage;
                dataChannel.onopen = function () {
                    eventLogger.info(events.Events.DATA_CHANNEL_OPENED, time());
                    get('chat-input').disabled = false;
                    dataChannelOpened = true;
                    if (sendEvents && !videoStats && (  (!getAudio && !getVideo) || remoteStreamArrived )) {
                        sendEventLogs();
                    }
                    var sendButton = get('sendbtn');
                    sendButton.onclick =  function(){
                        log("Started Sending file at " + time().toString() );
                        dataChannel.send(sendBlob);
                    };
                };
                dataChannel.onclose = function () {
                    log("The Data Channel is closed");
                };
            }
        }

        if( dataStats ){
            var statCollector = setInterval(function () {
                if (dataChannelOpened) {
                    //if (detectedBrowser == "Chrome") {
                        collectDataChannelStats();
                    //}
                }
            }, 1000);
        }

    }
    // Open Connection to Signalling Server
    var signallingServer = '/';
    var channel = window.get("channel").value;
    var sender = Math.round(Math.random() * 60535) + 5000;
    eventLogger.verbose(events.Events.CONNECTING_TO_SIGNALLING_SERVER, time());
    signallingSocket = io.connect(signallingServer);
    signallingSocket.on('connect', function () {
        eventLogger.verbose(events.Events.CONNECTED_TO_SIGNALLING_SERVER, time());
        signallingSocket.emit("channel", channel);
    });
    if (caller) {
        signallingSocket.on('message', function (event) {
            callerSignalHandler(event);
        });
    }
    else {
        signallingSocket.on('message', function (data) {
            calleeSignalHandler(data);
        });
    }
}

function onNewDescriptionCreatedAnswer(description) {
    if (caller) {
        eventLogger.info(events.Events.OFFER_CREATED, time().toString());
    }
    else {
        eventLogger.info(events.Events.ANSWER_CREATED, time().toString());
    }

    if ( h264 && (!description.sdp.match(/a=rtpmap:[0-9]+ H264/g))) {
        log("No H264 found in the answer!!!");
    } else{
        log("welldone");
    }

    peerConnection.setLocalDescription(description, function () {
            signallingSocket.emit("message",
                JSON.stringify({
                    channel: channel,
                    type: "new_description",
                    sdp: description
                })
            );
        },
        logError
    );
}

function onNewDescriptionCreatedOffer(description) {
    if (caller) {
        eventLogger.info(events.Events.OFFER_CREATED, time().toString());
    }
    else {
        eventLogger.info(events.Events.ANSWER_CREATED, time().toString());
    }


    if( h264 ){
        description.sdp = mozRemoveVP8(description.sdp)
    }
    if( vp9 ){
        description.sdp = googmakeVp9Default(description.sdp);
    }

    peerConnection.setLocalDescription(description, function () {
            signallingSocket.emit("message",
                JSON.stringify({
                    channel: channel,
                    type: "new_description",
                    sdp: description
                })
            );
        },
        logError
    );
}



function onAddIceCandidateSuccess() {
    log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    log('Failed to add Ice Candidate: ' + error.toString());
}


// handle signals received by caller
function callerSignalHandler(event) {
    var signal = JSON.parse(event);
    if (signal.type === "callee_arrived") {
        eventLogger.info(events.Events.CALLEE_ARRIVED, time());
        eventLogger.info(events.Events.CREATING_OFFER, time());
        peerConnection.createOffer(
            onNewDescriptionCreatedOffer,
            logError
        );
    } else if (signal.type === "new_ice_candidate") {
        peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate),
            onAddIceCandidateSuccess, onAddIceCandidateError
        );
    } else if (signal.type === "new_description") {
        log("caller");
        eventLogger.verbose(events.Events.SETTING_REMOTE_DESCRIPTION, time());
        console.log(signal.sdp);
        peerConnection.setRemoteDescription(

            new RTCSessionDescription(signal.sdp),
            function () {
                eventLogger.verbose(events.Events.REMOTE_DESCRIPTION_SET, time());
            },
            logError
        );
    }
}

// handle signals received by callee
function calleeSignalHandler(event) {
    var signal = JSON.parse(event);
    if (signal.type === "new_ice_candidate") {
        peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate),
            onAddIceCandidateSuccess, onAddIceCandidateError
        );
    } else if (signal.type === "new_description") {
        log("callee");
        eventLogger.verbose(events.Events.SETTING_REMOTE_DESCRIPTION, time());
        peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.sdp),
            function () {
                eventLogger.verbose(events.Events.REMOTE_DESCRIPTION_SET, time());
                if (peerConnection.remoteDescription.type == "offer") {
                    eventLogger.verbose(events.Events.CREATING_ANSWER, time());
                    peerConnection.createAnswer(onNewDescriptionCreatedAnswer, logError);
                }
            }, logError);
    }
}

// Get User Media
function getMedia() {
    eventLogger.verbose(events.Events.GETTING_MEDIA, time());
    var video_constraints = HD? {optional: [], mandatory: {minHeight: 720, minWidth: 1280}} : {optional: [], mandatory: { minFrameRate: 30, maxHeight: 480, maxWidth: 640,minHeight: 480, minWidth: 640}};
    getUserMedia(
        ( detectedBrowser == "Firefox" && mozFakeVideo ) ?
        {
            audio: getAudio? true : false,
            video: getVideo  ? true : false,
            fake:true}
            :
        {
            audio: getAudio? true : false,
            video: getVideo ? true : false
}
              , streaming, function (e) {
            console.error(e);
            log(e);
        });
    function streaming(stream) {
        eventLogger.verbose(events.Events.LOCAL_MEDIA_CAPTURED, time());
        var localMedia = document.createElement((getAudio && !getVideo) ? 'audio' : 'video');
        if( getVideo ){
           // localMedia.setAttribute("width", "640");
          //  localMedia.setAttribute("height", "480");
        }
        localMedia.id = "localView";
        if (detectedBrowser == "Chrome") {
            localMedia.src = webkitURL.createObjectURL(stream);
            localMedia.autoplay = true;
        } else {
            if (window.URL) {
                localMedia.src = window.URL.createObjectURL(stream);
            } else {
                localMedia.src = stream;
            }
        }

        var status = document.createElement('div');
        status.id = "localStatus";

        localMedia.addEventListener('play', function () {
            log("onplay @" + time() );
        }, false);


        localMedia.addEventListener('play', function () {
            log("onplaying @" + time() );
        }, false);


        localMedia.addEventListener('canplay', function () {
            log("oncanplay @" + time() );
        }, false);


        localMedia.addEventListener('canplaythrough', function () {
            log("canplaythrough @" + time() );
        }, false);





        localMedia.play();
        peerConnection.addStream(stream);
        if (receiveVideo == false) {
            var stepsRemained = WAITING_STEPS;
            var statCollector = setInterval(function () {


                if (stepsRemained === 0) {
                    if (detectedBrowser == "Chrome")
                        log("Capturer/Sender/LocalRender/LocalRenderDropped/Receiver/Decoder/Render/RenderDroppedFrames/TragetEncoderBitrate/ActualEncoderBitrate/PacketsSent/PacketsReceived/PacketLoss/Txbitrate/RxBitrate/AvbSent/AvbReceived/TransmitBitrate");
                    else if (detectedBrowser == "Firefox")
                        log("PacketsSent/PacketsReceived/PacketLoss/Txbitrate/RxBitrate");
                } else if (stepsRemained == -1 * COLLECTION_STEPS) {
                    get("localStatus").innerHTML = localMedia.videoWidth + "x" + localMedia.videoHeight + "<br>" +
                        "Stats finished ";
                    sendEventLogs();
                }
                else if (stepsRemained < 0) {
                    get("localStatus").innerHTML = localMedia.videoWidth + "x" + localMedia.videoHeight;
                } else {
                    get("localStatus").innerHTML = localMedia.videoWidth + "x" + localMedia.videoHeight + "<br>" +
                        "Stats begin in " + stepsRemained + " seconds";
                }
                if (stepsRemained <= 0 && stepsRemained > -1 * COLLECTION_STEPS)
                    collectStats(true);
                else
                    collectStats(false);

                --stepsRemained;
            }, 1000);
        }
        window.get("local-streams").appendChild(localMedia);
        window.get("local-streams").appendChild(status);
    }
}



