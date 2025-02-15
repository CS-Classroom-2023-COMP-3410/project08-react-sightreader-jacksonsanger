import React, { useState, useEffect, useRef } from "react";
import ABCFileSelector from "./ABCFileSelector";
import PitchDetector from "./PitchDetector";
import StartButton from "./StartButton";
import Tempo from "./Tempo";

const Sightreader = () => {
  const [selectedABC, setSelectedABC] = useState(""); // Stores ABC content
  const [currentMidi, setCurrentMidi] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const pitchDetectorRef = useRef(null); // Ref to control mic
  const [tempo, setTempo] = useState(30);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasMicPermission(true))
      .catch(() => setHasMicPermission(false));
  }, []);

  return (
    <div className="container">
      <h3>ABC Sightreader</h3>

      <PitchDetector ref={pitchDetectorRef} setCurrentMidi={setCurrentMidi} isMicActive={isMicActive} />
      <ABCFileSelector setSelectedABC={setSelectedABC} />
      <Tempo tempo={tempo} setTempo={setTempo} />
      {hasMicPermission ? (
        <button onClick={() => setIsMicActive((prev) => !prev)}>
          {isMicActive ? "Stop Tuning" : "Tune"}
        </button>
      ) : (
        <p>Microphone permission denied. Please allow microphone access.</p>
      )}
      <StartButton 
        selectedABC={selectedABC} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying} 
        pitchDetectorRef={pitchDetectorRef}
        tempo={tempo}
      />
    </div>
  );
};

export default Sightreader;
