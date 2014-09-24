(function(exports){
    // Events that will occur in typical WebRTC connections
    exports.Events = {
		CREATING_PC : "Creating RTCPeerConnection object",
		PC_CREATED : "RTCPeerConnection object created",
        GETTING_MEDIA: "Getting user media",
        LOCAL_MEDIA_CAPTURED: "Local media captured",
        LOCAL_PLAYBACK_STARTED:"Local media playback started",
        REMOTE_STREAM_ARRIVED: "Remote stream arrived",
        REMOTE_PLAYBACK_STARTED: "Remote playback started",
        CREATING_DATA_CHANNEL: "Creating Datachannel object",
        DATA_CHANNEL_OPENED: "Datachannel opened",
		CALLEE_ARRIVED : "Callee arrived",
		CREATING_OFFER : "Creating offer",
		OFFER_CREATED : "Offer created" ,
        CREATING_ANSWER: "Creating answer",
        ANSWER_CREATED: "Answer created",
        SETTING_REMOTE_DESCRIPTION: "Setting remote description",
        REMOTE_DESCRIPTION_SET : "Remote description set",
        NEW_ICE_CANDIDATE: "On new ICE Candidate",
        CONNECTING_TO_SIGNALLING_SERVER: "Connecting to signaling server",
        CONNECTED_TO_SIGNALLING_SERVER : "Connected to signalling server",
        ICE_CONNECTED : "ICE Connected"
	};
})(typeof exports === 'undefined'? this['events']={}: exports);


