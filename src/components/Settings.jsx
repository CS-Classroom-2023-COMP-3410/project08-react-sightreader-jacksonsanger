import React, { useState } from "react";

const Settings = () => {
  const [autoContinue, setAutoContinue] = useState(false);
  const [ignoreDuration, setIgnoreDuration] = useState(false);

  return (
    <div className="settings">
      <input type="checkbox" checked={autoContinue} onChange={() => setAutoContinue(!autoContinue)} />
      <label>Auto-Continue</label>

      <input type="checkbox" checked={ignoreDuration} onChange={() => setIgnoreDuration(!ignoreDuration)} />
      <label>Ignore Duration</label>
    </div>
  );
};

export default Settings;
