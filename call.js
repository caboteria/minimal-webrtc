/* MIT License: https://webrtc-experiment.appspot.com/licence/ */

var call = function (config) {
    var
    peerConnection = PeerConnection(makePeerConfig()),
    webSocket = new WebSocket('ws://' + document.location.host + '/');

    // configure the signalling WebSocket
    webSocket.onmessage = function (event) {
        console.log("received a message: " + event.data);
        onIncomingMessage(JSON.parse(event.data));
    };
    webSocket.push = webSocket.send;
    webSocket.send = function (data) {
        webSocket.push(JSON.stringify(data));
    };

    function onIncomingMessage(response) {
        // the other client has sent me an offer SDP
        if (response.offerSDP) {
            console.log("received offerSDP " + response.offerSDP + ", will answer");
            peerConnection.addStream(config.localStream);
            peerConnection.createAnswer(response.offerSDP, function (sdp) {
                console.log("sending answer SDP");
                webSocket.send({
                    answerSDP: sdp
                });
            });
        }

        // the other client has sent me an answer SDP
        if (response.answerSDP) {
            peerConnection.setRemoteDescription(response.answerSDP);
        }

        // the other client has sent me an ICE candidate
        if (response.candidate) {
            console.log("got a candidate message, passing to RTCPeerConnection");
            peerConnection.addICECandidate({
                sdpMLineIndex: response.candidate.sdpMLineIndex,
                candidate: response.candidate.candidate
            });
        }
    }

    // PeerConnection.js's options structure
    function makePeerConfig() {
        return {
            onicecandidate: function (candidate) {
                console.log("onICE");
                webSocket.send({
                    candidate: {
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: candidate.candidate
                    }
                });
            },
            onaddstream: function (stream) {
                console.log("onRemoteStream");
                config.video.srcObject = stream;
            }
        };
    }

    return {
        initiateCall: function(localStream) {
            // attach the stream to the peer connection
            peerConnection.addStream(localStream);
            // create the offer SDP and send it when it's ready
            peerConnection.createOffer(function (sdp) {
                console.log("sending offer SDP");
                webSocket.send({
                    offerSDP: sdp
                })
            });
        }
    };
};
