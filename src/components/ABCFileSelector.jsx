import React, { useState, useEffect } from "react";

const ABCFileSelector = ({ setSelectedABC }) => {
  const [selectedFile, setSelectedFile] = useState("cecilio-lesson1-open-strings.abc");
  const [fileLoadingMessage, setFileLoadingMessage] = useState("");
  const [customABC, setCustomABC] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (selectedFile === "custom") {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    setFileLoadingMessage("File Loading...");

    fetch(`/music/${selectedFile}`)
      .then((res) => res.text())
      .then((data) => {
        const preprocessedData = preprocessABC(data);
        setSelectedABC(preprocessedData);
        setCustomABC(preprocessedData); // Keep a copy for custom mode
        setFileLoadingMessage("File loaded. Press start to play.");
      })
      .catch((error) => {
        console.error("Error loading ABC file:", error);
        setFileLoadingMessage("Error loading file.");
      });
  }, [selectedFile]);

  const preprocessABC = (abcString) => {
    const lines = abcString.split("\n");
    const headers = [];
    const notes = [];

    const ignoredHeaders = new Set(["T", "C", "Z", "S", "N", "G", "O", "H", "I", "P", "W", "F", "B"]);

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("%")) continue;
      if (line.length >= 2 && line[1] === ":" && /^[A-Za-z]$/.test(line[0])) {
        if (ignoredHeaders.has(line[0].toUpperCase())) continue;
        headers.push(line);
      } else {
        notes.push(line);
      }
    }

    return headers.join("\n") + "\n" + notes.join("\n");
  };

  const handleABCBlur = () => {
    setSelectedABC(customABC);
  };

  return (
    <div>
      <p>{fileLoadingMessage}</p>
      <label htmlFor="file">File:</label>
      <select id="file" value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
        <option value="custom">Custom ABC</option>
        <option value="cecilio-lesson1-open-strings.abc">Cecilio Lesson 1 - Open String</option>
        <option value="cecilio-lesson2-first-position.abc">Cecilio Lesson 2 - First Position</option>
        <option value="cecilio-lesson2-twinkle-twinkle-little-star.abc">Cecilio Lesson 2 - Twinkle, Twinkle Little Star</option>
        <option value="cecilio-lesson3-exercise-1.abc">Cecilio Lesson 3 - Exercise 1</option>
        <option value="cecilio-lesson3-exercise-2.abc">Cecilio Lesson 3 - Exercise 2</option>
        <option value="cecilio-lesson3-exercise-3.abc">Cecilio Lesson 3 - Exercise 3</option>
        <option value="cecilio-lesson3-exercise-4.abc">Cecilio Lesson 3 - Exercise 4</option>
        <option value="cecilio-lesson3-jingle-bells.abc">Cecilio Lesson 3 - Jingle Bells</option>
        <option value="cecilio-lesson3-mary-had-a-little-lamb.abc">Cecilio Lesson 3 - Mary Had A Little Lamb</option>
        <option value="cecilio-lesson4-camptown-races.abc">Cecilio Lesson 4 - Camptown Races</option>
        <option value="cecilio-lesson4-lightly-row"> Cecilio Lesson 4 - Lightly Row</option>
        <option value="cecilio-lesson4-russian-dance-tune.abc">Cecilio Lesson 4 - Russian Dance Tune</option>
        <option value="cecilio-lesson5-eighth-notes.abc">Cecilio Lesson 5 - Eighth Notes</option>
        <option value="cecilio-lesson5-hungarian-folk-song-1.abc">Cecilio Lesson 5 - Hungarian Folk Song 1</option>
        <option value="cecilio-lesson5-the-old-gray-goose.abc">Cecilio Lesson 5 - The Old Gray Goose</option>
        <option value="cecilio-lesson6-first-position-d-string.abc">Cecilio Lesson 6 - First Position D String</option>
        <option value="cecilio-lesson6-ode-to-joy.abc">Cecilio Lesson 6 - Ode To Joy</option>
        <option value="cecilio-lesson6-scherzando.abc">Cecilio Lesson 6 - Scherzando</option>
        <option value="cecilio-lesson7-can-can.abc">Cecilio Lesson 7 - Can Can</option>
        <option value="cecilio-lesson7-country-gardens.abc">Cecilio Lesson 7 - Country Gardens</option>
        <option value="cecilio-lesson7-gavotte.abc">Cecilio Lesson 7 - Gavotte</option>
        <option value="cecilio-lesson8-dixie.abc">Cecilio Lesson 8 - Dixie</option>
        <option value="cecilio-lesson8-largo.abc">Cecilio Lesson 8 - Largo</option>
        <option value="hot-cross-buns.abc">Hot Cross Buns</option>
        <option value="lesson1-open-string-exercise-1.abc">Lesson 1 - Open String Exercise 1</option>
        <option value="lesson1-open-string-exercise-2.abc">Lesson 1 - Open String Exercise 2</option>
        <option value="lesson1-open-string-exercise-3.abc">Lesson 1 - Open String Exercise 3</option>
        <option value="lesson1-open-string-exercise-4.abc">Lesson 1 - Open String Exercise 4</option>
        <option value="lesson1-open-string-exercise-5.abc">Lesson 1 - Open String Exercise 5</option>
        <option value="lesson1-open-string-exercise-6.abc">Lesson 1 - Open String Exercise 6</option>
        <option value="lesson2-1st-finger-exercise-1.abc">Lesson 2 - 1st Finger Exercise 1</option>
        <option value="lesson2-1st-finger-exercise-2.abc">Lesson 2 - 1st Finger Exercise 2</option>
        <option value="lesson2-1st-finger-exercise-3.abc">Lesson 2 - 1st Finger Exercise 3</option>
        <option value="lesson2-1st-finger-exercise-4.abc">Lesson 2 - 1st Finger Exercise 4</option>
        <option value="lesson2-1st-finger-exercise-5.abc">Lesson 2 - 1st Finger Exercise 5</option>
        <option value="lesson2-1st-finger-exercise-6.abc">Lesson 2 - 1st Finger Exercise 6</option>
      </select>

      {isCustom && (
        <textarea
          value={customABC}
          onChange={(e) => setCustomABC(e.target.value)}
          onBlur={handleABCBlur}
          placeholder="Enter ABC notation here..."
          rows={10}
          cols={50}
          style={{ width: "100%", marginTop: "10px", fontFamily: "monospace" }}
        />
      )}
    </div>
  );
};

export default ABCFileSelector;
