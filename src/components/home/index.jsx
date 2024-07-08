import React, { useState, useEffect } from 'react';
import Peer from 'peerjs';
import { useAuth } from '../../contexts/authContext';
import { firestore } from '../../firebase/firebase';
import { collection, getDocs, doc, getDoc, runTransaction } from 'firebase/firestore';
import VideoCallControls from './videoCallControls'; // Adjust the import path as per your project structure

const Home = () => {
    const { currentUser } = useAuth();
    const [peerId, setPeerId] = useState("");
    const [callId, setCallId] = useState("");
    const [isCalling, setIsCalling] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peer, setPeer] = useState(null);
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        const peerInstance = new Peer(currentUser.uid, {
            host: 'localhost',
            port: 9000,
            path: '/peerjs'
        });

        setPeer(peerInstance);

        peerInstance.on("open", (id) => {
            setPeerId(id);
        });

        peerInstance.on("call", (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    setLocalStream(stream);
                    setIncomingCall(call);
                    setIsReceivingCall(true);

                    call.answer(stream);
                    call.on("stream", (remoteStream) => {
                        const remoteVideo = document.getElementById('remoteVideo');
                        if (remoteVideo) {
                            remoteVideo.srcObject = remoteStream;
                        }
                        setRemoteStream(remoteStream);
                    });

                    call.on("close", () => {
                        endCallHandler();
                    });
                })
                .catch((error) => {
                    console.error('Error accessing media devices.', error);
                });
        });

        return () => {
            localStream?.getTracks().forEach(track => track.stop());
            peerInstance.destroy();
        };
    }, [currentUser.uid, localStream]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersCollection = collection(firestore, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
        };

        const fetchUserData = async () => {
            const userRef = doc(firestore, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        };

        fetchUsers();
        fetchUserData();
    }, [currentUser.uid]);

    const initiateCall = (peerId) => {
        if (!peer) return;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setLocalStream(stream);
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = stream;
                }

                const call = peer.call(peerId, stream);
                setIsCalling(true);
                setCallId(call.peer);

                call.on("stream", (remoteStream) => {
                    const remoteVideo = document.getElementById('remoteVideo');
                    if (remoteVideo) {
                        remoteVideo.srcObject = remoteStream;
                    }
                    setRemoteStream(remoteStream);
                });

                call.on("close", () => {
                    endCallHandler();
                });
            })
            .catch((error) => {
                console.error('Error accessing media devices.', error);
            });
    };

    const calculateCharge = async () => {
        const chargeRate = 0.5; // Example rate
        const charge = chargeRate * callDuration;

        const userRef = doc(firestore, 'users', currentUser.uid);
        const agentRef = doc(firestore, 'users', callId);

        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const agentDoc = await transaction.get(agentRef);

            if (!userDoc.exists() || !agentDoc.exists()) {
                throw new Error("User does not exist!");
            }

            const newUserBalance = userDoc.data().balance - charge;
            const newAgentBalance = agentDoc.data().balance + charge;

            transaction.update(userRef, { balance: newUserBalance });
            transaction.update(agentRef, { balance: newAgentBalance });
        });
    };

    const handleUserSelect = (userId) => {
        setSelectedUserId(userId);
        setCallId(userId); // Optionally set the callId to initiate a call with this user
    };

    const endCallHandler = () => {
        setIsCalling(false);
        setIsReceivingCall(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallId("");
        setCallDuration(0);
        if (peer) {
            peer.destroy();
        }
    };

    return (
        <>
            <div className='text-2xl font-bold pt-14'>
                Hello {userData?.name || currentUser.displayName || currentUser.email}, you are now logged in.
            </div>
            {userData && (
                <div className="mt-4">
                    <h2 className="text-lg">Your Info</h2>
                    <p><strong>Name:</strong> {userData.name}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Balance:</strong> ${userData.balance}</p>
                    <p><strong>ID:</strong> {userData.userId}</p>
                </div>
            )}
            <div className="mt-4">
                <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="">Select User to Call</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name || user.email} - {user.id}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => initiateCall(callId)}
                    disabled={!callId}
                    className="ml-2 bg-blue-500 text-white p-2 rounded"
                >
                    Call
                </button>
            </div>
            <div className="mt-4">
                <video id="localVideo" autoPlay muted className="w-1/2" />
                <video id="remoteVideo" autoPlay className="w-1/2" />
            </div>
            <div className="mt-4">
                {localStream && (
                    <VideoCallControls
                        localStream={localStream}
                        setLocalStream={setLocalStream}
                        endCallHandler={endCallHandler}
                    />
                )}
            </div>
            <div className="mt-4">
                <p>Call Duration: {callDuration} seconds</p>
            </div>
            <div className="mt-4">
                <h3 className="text-xl">Registered Users</h3>
                <ul>
                    {users.map(user => (
                        <li key={user.id} className="p-2 border-b">
                            <strong>Name:</strong> {user.name} - {user.id} <br />
                            <strong>Email:</strong> {user.email} <br />
                            <strong>Balance:</strong> ${user.balance} <br />
                            <strong>ID:</strong> {user.userId}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Home;
