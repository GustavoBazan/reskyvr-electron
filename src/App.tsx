import { useState } from "react";

import SetupContainer from "./components/SetupContainer";
import GenerateScreenButton from "./components/GenerateScreenButton";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9-_DCbnTxi5I0rRMdugPcr5e82qoHbrk",
  authDomain: "multiple-screen-sharing.firebaseapp.com",
  databaseURL: "https://multiple-screen-sharing-default-rtdb.firebaseio.com",
  projectId: "multiple-screen-sharing",
  storageBucket: "multiple-screen-sharing.appspot.com",
  messagingSenderId: "969240722920",
  appId: "1:969240722920:web:d16bd869c3fa246a9eb85d"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();

// Initialize WebRTC

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.1.google.com:19302",
        "stun:stun2.1.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);

function App() {

  const [currentPage, setCurrentPage] = useState("Home");
  const [streams, setStreams] = useState([]);

  return (

    <div id="app" className="bg-slate-100 w-screen h-screen text-slate-900">

      {
        currentPage === "Screen" ?
        <Screen setPage={setCurrentPage} streams={streams} setStreams={setStreams}/> :
        currentPage === "Connection" ?
        <Connection setPage={setCurrentPage} streams={streams} setStreams={setStreams}/> :
        <Home setPage={setCurrentPage}  />
      }

    </div>

  );
};

// - - - HOME PAGE - - - 

interface HomeProps {
  setPage: React.Dispatch<React.SetStateAction<string>>;
};

const Home: React.FC<HomeProps> = ({setPage}) => {
  return (
    <div id="Home">
      <h1>Home</h1>
      <button onClick={() => setPage("Screen")}>Next</button>
    </div>
  );
};


// - - - SCREEN PAGE - - -

interface ScreenProps {
  setPage: React.Dispatch<React.SetStateAction<string>>;
  streams: never[];
  setStreams: React.Dispatch<React.SetStateAction<never[]>>;
};

const Screen: React.FC<ScreenProps> = ({setPage, streams, setStreams}) => {
  return (
    <div id="Screen" className="flex flex-col justify-between h-screen w-screen">
      <h1 className="text-7xl self-center mt-3">Setup Screens</h1>
      <SetupContainer streams={streams} setStreams={setStreams}/>
      <div className="flex justify-between">
        <GenerateScreenButton/>
        <button className="bg-sky-600 w-1/12 text-slate-200 self-end mb-3 mr-4 rounded-md text-xl" onClick={() => {setPage("Connection")}}>Next</button>
      </div>  
    </div>
  );
};

/*

*/


// - - - CONNECTION PAGE - - -

interface ConnectionProps {
  setPage: React.Dispatch<React.SetStateAction<string>>;
  streams: never[];
  setStreams: React.Dispatch<React.SetStateAction<never[]>>;
};

const Connection: React.FC<ConnectionProps> = ({setPage, streams, setStreams}) => {

  const [userReady, setUserReady] = useState(false);
  const [roomID, setRoomID] = useState("");



  function cancel() {
    setStreams([]);
    setPage('Home');
  }

  const setupSources = async () => {

    console.log(streams);

    const videor: HTMLVideoElement = document.createElement("video");
    document.getElementById("videos")?.appendChild(videor);

    videor.className = "bg-black h-36";
    videor.srcObject = streams[0];
    videor.play();

    for (let n = 0; n < streams.length; n++) {

      (streams[n] as any).getTracks().forEach((track: any) => {
        pc.addTrack(track, streams[n]);
        console.log('SENT!');
      });
    }

    /*
    pc.ontrack = (event) => {

      const video: HTMLVideoElement = document.createElement("video");
      document.getElementById("remoteVideos")?.appendChild(video);
      const stream = new MediaStream();

      event.streams[0].getTracks().forEach((track) => {
        stream.addTrack(track);
      });

      video.srcObject = stream;
      video.className = "bg-black h-52 mt-6 mr-6 ml-6";
      video.play();

    };
    */

    setUserReady(true);

    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    setRoomID(callDoc.id);

    pc.onicecandidate = (event) => {
      event.candidate &&
        offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(
          data.answer
        );
        pc.setRemoteDescription(answerDescription);
      };
    });

    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        };
      });
    });
  }

  return (
    <div className="flex w-screen h-screen">
    <div id="Connection">
      <h1>Code: {roomID}</h1>
      <div id="videos" className=" h-36 w-36">
      </div>
      <button onClick={() => setPage("Home")}>Disconnect</button>
      
    </div>
    {!userReady && (
        <div className="flex justify-center items-center bg-slate-900 bg-opacity-80 w-screen h-screen fixed">
            <div className="flex flex-col items-center justify-center bg-white w-1/3 h-1/3">
              <p>Connecting with {streams.length} Screens...</p>
              <div className="mt-2">
                <button onClick={() => cancel()} className="bg-red-500 text-white p-2 mr-2 mb-2">Cancel</button>
                <button onClick={() => setupSources()} className="bg-indigo-800 text-white p-2 mr-2 mb-2">Start</button>
              </div>
              
            </div>
        </div>
      )}
    </div>
  );
};


export default App;
