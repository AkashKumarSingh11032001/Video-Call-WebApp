import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// const socket = io('http://localhost:8080');
const socket = io('http://localhost:8080');

const ContextProvider = ({ children }) => {
    // declaring universal variable
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

    // all code initiator and permission acceptance
  useEffect(() => {
    //   asking permisiion for camera and microphone
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        //setting video ifram
        myVideo.current.srcObject = currentStream;
      });

    socket.on('me', (id) => setMe(id)); //getting id which we set on server side file

    // caller will recive -> from name callername signal
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

    //  answer Call
  const answerCall = () => {
    setCallAccepted(true); //setcallacepeted to true

        // using stram from 
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

        // seeting useer video stram from userstate
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

    // Call User
  const callUser = (id) => {
        //   initiating the call
    const peer = new Peer({ initiator: true, trickle: false, stream });

        //sending signal to 2nd person 
    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

        // setrem the signal to current video frmam
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

        // its upto me whether i want to accept of not 
    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

    // leave call
  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };