/*  MIT License: https://webrtc-experiment.appspot.com/licence/ 
 2013, Muaz Khan<muazkh>--[github.com/muaz-khan]

 Demo & Documentation: http://bit.ly/RTCPeerConnection-Documentation */
window.moz = !! navigator.mozGetUserMedia;
var PeerConnection = function (options) {
    var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
        SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription,
        IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

    // See https://gist.github.com/zziuni/3741933 for a list of public STUN servers
    var iceServers = {
        iceServers: [{ url: 'stun:stunserver.org' }]
    };

    var optional = {
        optional: []
    };
    if (!moz) {
        // See http://www.webrtc.org/interop under "Constraints / configurations issues."
        optional.optional = [{
                DtlsSrtpKeyAgreement: true
            }
        ];
    }

    var peerConnection = new PeerConnection(iceServers, optional);
    peerConnection.onicecandidate = function(event) {
        if (!event.candidate) return;
        options.onicecandidate(event.candidate);
    }
    peerConnection.onaddstream = function(event) {
        console.log('------------onaddstream');
        options.onaddstream(event.stream);
    }

    var constraints = options.constraints || {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };
    if (moz) constraints.mandatory.MozDontOfferDataChannel = true;

    return {
        createOffer: function (callback) {
            peerConnection.createOffer(function (sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                callback(sessionDescription);
            }, null, constraints);
        },

        createAnswer: function (offerSDP, callback) {
            peerConnection.setRemoteDescription(new SessionDescription(offerSDP));
            peerConnection.createAnswer(function (sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                callback(sessionDescription);
            }, null, constraints);
        },

        setRemoteDescription: function (sdp) {
            console.log('--------adding answer sdp:');
            console.log(sdp.sdp);

            sdp = new SessionDescription(sdp);
            peerConnection.setRemoteDescription(sdp);
        },

        addICECandidate: function (candidate) {
            console.log("addICE: got candidate: " + candidate.candidate);
            peerConnection.addIceCandidate(new IceCandidate({
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: candidate.candidate
                    }));
        },

        addStream: function(stream) {
            console.log("stream provided, attaching...");
            peerConnection.addStream(stream);
        }
    };
};
