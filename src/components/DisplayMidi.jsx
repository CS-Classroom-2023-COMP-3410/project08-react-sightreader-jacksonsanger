import React from "react";

const DisplayMidi = ({ expectedMidi, currentMidi, score }) => {
  return (
    <div>
      <h4>Current Note: {currentMidi}</h4>
    </div>
  );
};

export default DisplayMidi;
