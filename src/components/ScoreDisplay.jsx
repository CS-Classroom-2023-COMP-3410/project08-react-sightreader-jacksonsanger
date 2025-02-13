import React from "react";

const ScoreDisplay = ({ expectedMidi, currentMidi, score }) => {
  return (
    <div className="score-display">
      <div>Expected Note: {expectedMidi}</div>
      <div>Current Note: {currentMidi}</div>
      <div>Score: {score.correct}/{score.total}</div>
    </div>
  );
};

export default ScoreDisplay;
