import React, { useEffect, useRef } from "react";

const MusicRenderer = ({ abcString }) => {
  const notationRef = useRef(null);

  useEffect(() => {
    if (abcString && window.ABCJS) {
      window.ABCJS.renderAbc(notationRef.current, abcString, { responsive: "resize" });
    }
  }, [abcString]);

  return <div id="notation" ref={notationRef}></div>;
};

export default MusicRenderer;
