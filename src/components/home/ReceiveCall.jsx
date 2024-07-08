import React, { useState, useEffect } from 'react';
import Peer from 'peerjs';
import { firestore } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ReceiveCall = ({ currentUser }) => {
    const [peer, setPeer] = useState(null);
    const [call, setCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callerData, setCallerData] = useState(null);

    useEffect(() => {
        const peerInstance = new Peer(currentUser.uid, {
            host: 'localhost',
            port: 9000, // Adjust to the receiving PeerJS server port
            path: '/peerjs'
        });

        setPeer(peerInstance);

        peerInstance.on("open", (id) => {
            console.log("Receiver Peer ID:", id);
        });

        peerInstance.on("call", async (incomingCall) => {
            const callerId = incomingCall.peer; // Get caller's Peer ID
            setCall(incomingCall);

            try {
                // Fetch caller's data from Firestore
                const callerRef = doc(firestore, 'users', callerId);
                const callerDoc = await getDoc(callerRef);

                if (callerDoc.exists()) {
                    setCallerData(callerDoc.data());
                }

                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then((stream) => {
                        setLocalStream(stream);
                        incomingCall.answer(stream); // Answer the incoming call with local stream

                        incomingCall.on("stream", (remoteStream) => {
                            setRemoteStream(remoteStream); // Set remote stream to state
                        });

                        incomingCall.on("close", () => {
                            endCall(); // Handle call termination
                        });
                    })
                    .catch((error) => {
                        console.error('Error accessing media devices.', error);
                    });
            } catch (error) {
                console.error('Error fetching caller data:', error);
            }
        });

        // Clean up on unmount
        return () => {
            if (call) {
                call.close();
            }
            peerInstance.destroy();
            setLocalStream(null);
            setRemoteStream(null);
        };
    }, [currentUser.uid]);

    const endCall = () => {
        if (call) {
            call.close();
            setCall(null);
        }
        setLocalStream(null);
        setRemoteStream(null);
        setCallerData(null);
    };

    return (
        <div>
            <h2>Video Call</h2>
            <div>
                {remoteStream && (
                    <video id="remoteVideo" autoPlay className="w-1/2" />
                )}
                {localStream && (
                    <video id="localVideo" autoPlay muted className="w-1/2" />
                )}
            </div>
            {callerData && (
                <div>
                    <p>Calling from: {callerData.name || callerData.email}</p>
                    {/* Display additional caller information as needed */}
                </div>
            )}
            <div>
                <button onClick={endCall}>End Call</button>
            </div>
        </div>
    );
};

export default ReceiveCall;
