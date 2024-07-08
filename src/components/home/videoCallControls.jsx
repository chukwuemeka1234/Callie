import React, { useState } from 'react';

const VideoCallControls = ({ localStream, setLocalStream, endCallHandler }) => {
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);

    const toggleCamera = () => {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsCameraOn(track.enabled);
        });
    };

    const toggleMicrophone = () => {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsMicrophoneOn(track.enabled);
        });
    };

    const endCall = () => {
        // Stop all tracks in the local stream
        localStream.getTracks().forEach(track => track.stop());
        // Set local stream to null to indicate call end
        setLocalStream(null);
        // Callback to handle ending call in Home component
        endCallHandler();
    };

    return (
        <div className="flex items-center space-x-4">
            <button
                onClick={toggleCamera}
                className={`p-2 rounded-full ${isCameraOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
                {isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            </button>
            <button
                onClick={toggleMicrophone}
                className={`p-2 rounded-full ${isMicrophoneOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
                {isMicrophoneOn ? 'Mute Microphone' : 'Unmute Microphone'}
            </button>
            <button
                onClick={endCall}
                className="p-2 rounded-full bg-red-500 text-white"
            >
                End Call
            </button>
        </div>
    );
};

export default VideoCallControls;
