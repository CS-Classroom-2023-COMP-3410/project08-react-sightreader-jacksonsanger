import React, { useState } from "react";
import ABCFileSelector from "./ABCFileSelector";
import MusicRenderer from "./MusicRenderer";
import PlaybackControls from "./PlaybackControls";
import PitchDetector from "./PitchDetector";
import ScoreDisplay from "./ScoreDisplay";

const Sightreader = () => {
  const [selectedABC, setSelectedABC] = useState(""); // Stores ABC content
  const [expectedMidi, setExpectedMidi] = useState(0);
  const [currentMidi, setCurrentMidi] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="container">
      <h3>ABC Sightreader</h3>
      <p>File loaded. Press start to play.</p>

      <ABCFileSelector setSelectedABC={setSelectedABC} />
      <PlaybackControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      <MusicRenderer abcString={selectedABC} isPlaying={isPlaying} />
      <PitchDetector setCurrentMidi={setCurrentMidi} />
      <ScoreDisplay expectedMidi={expectedMidi} currentMidi={currentMidi} score={score} />
    </div>
  );
};

export default Sightreader;
