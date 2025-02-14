import React, { useEffect, useState } from "react";
import * as Pitchfinder from 'pitchfinder';

const PitchDetector = ({ setCurrentMidi }) => {
  const [audioContext, setAudioContext] = useState(null);
  const [sourceStream, setSourceStream] = useState(null);
  const [pitchDetector, setPitchDetector] = useState(null);

  const scales = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];



  function midi_number_to_scale(number) {
      return scales[number % 12];
  }

  function midi_number_to_octave(number) {
      let octave = parseInt(number / 12) - 1;
      return octave;
  }

  function midi_number_to_string(number) {
    if (number) {
        return midi_number_to_scale(number) + midi_number_to_octave(number);
    }
    return "-";
  }

  function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
}

  

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      setSourceStream(stream);
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const sourceNode = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      sourceNode.connect(analyser);

      const detector = new Pitchfinder.YIN({ sampleRate: context.sampleRate });
      setPitchDetector(() => () => {
        let current_midi_number = 0;
        const array32 = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(array32);
        var freq = detector(array32);
        // console.log('freq:'+freq)
        current_midi_number = parseInt(noteFromPitch(freq));
        console.log(current_midi_number);
        if (isNaN(current_midi_number)) {
            current_midi_number = 0;
        }
        current_midi_number = midi_number_to_string(current_midi_number);
        setCurrentMidi(current_midi_number);
      });
    });
  }, []);

  useEffect(() => {
    if (!pitchDetector) return;

    const interval = setInterval(() => {
      pitchDetector();
    }, 100);

    return () => clearInterval(interval);
  }, [pitchDetector]);

  return null;
};

export default PitchDetector;
