import React, { useState, useEffect } from "react";
import ABCFileSelector from "./ABCFileSelector";
import MusicRenderer from "./MusicRenderer";
import PitchDetector from "./PitchDetector";
import ScoreDisplay from "./DisplayMidi";

const Sightreader = () => {
  const [selectedABC, setSelectedABC] = useState(""); // Stores ABC content
  const [currentMidi, setCurrentMidi] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false); // Tracks mic state

  // Request microphone permission on load
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasMicPermission(true))
      .catch(() => setHasMicPermission(false));
  }, []);

  return (
    <div className="container">
      <h3>ABC Sightreader</h3>
      
      <ABCFileSelector setSelectedABC={setSelectedABC} />
      <MusicRenderer abcString={selectedABC} />

      {hasMicPermission ? (
        <button onClick={() => setIsMicActive((prev) => !prev)}>
          {isMicActive ? "Stop Tuning" : "Tune"}
        </button>
      ) : (
        <p>Microphone permission denied. Please allow microphone access.</p>
      )}

      <PitchDetector setCurrentMidi={setCurrentMidi} isMicActive={isMicActive} />
      <ScoreDisplay currentMidi={currentMidi} />
    </div>
  );
};

export default Sightreader;
