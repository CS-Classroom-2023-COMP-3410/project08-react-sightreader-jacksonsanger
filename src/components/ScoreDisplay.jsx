import React from "react";

const ScoreDisplay = ({ expectedMidi, currentMidi, score }) => {
  return (
    <div>
      <h4>Expected Note: {expectedMidi}</h4>
      <h4>Current Note: {currentMidi}</h4>
      <h4>Score: {score.correct}/{score.total}</h4>
    </div>
  );
};

export default ScoreDisplay;
