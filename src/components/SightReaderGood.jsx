import React, { useEffect } from "react";
import * as Pitchfinder from "pitchfinder"; // Import the npm-installed library

const Sightreader = () => {
  useEffect( () => {
    const ABC_EXT = '.abc';
    const PLS_EXT = '.pls';
    let detectPitch = null;
    // const detectPitch = new Pitchfinder.AMDF(); // .YIN() confuses B3 with B4?
    
    const NOTE_COLOR_DEFAULT = '#000000';
    const NOTE_COLOR_PLAYING = '#3D9AFC';
    const DEFAULT_SCALE = 1.5;
    const DEFAULT_TEMPO = 60;
    const SILENCE = '-';
    const MIN_VOLUME = 0.075;
    
    // Circle variables
    const scales = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Text variables
    let current_midi_number = 0;
    let expected_midi_number = 0;
    let current_score_stats = null;
    let scroll_offset = 0;
    let current_qpm = null;
    
    let audioContext = new AudioContext();
    let pitch_detector = null;
    let recording = false;
    let tunebook;
    let sum_width = 0;
    let original_loaded_abc = null;
    let loaded_abc = null; // ABC loaded into ABCjs
    let loaded_abc_raw = null;
    let timer = null;
    let synth = null;
    let current_event = null;
    let countdown = 3;
    let source_stream;
    
    // Playlist variables.
    let playlist_files = [];
    let playlist_index = 0;
    let note_checker_id = null;
    let new_note_checked = false;
    let new_note_checked_and_found = false;
    let notes_checked_count = 0;
    let notes_checked_correct_count = 0;
    let pitch_checker_id = null;
    let pitch_getter_id = null;
    let volume_meter = null;
    let loaded_abc_filename = null;
    
    const notation_display = document.querySelector('#notation');
    const abc_textarea = document.querySelector('#abc-textarea');
    const midi_player = document.querySelector('#midi');
    const start_button = document.querySelector('#start');
    const reset_button = document.querySelector('#reset');
    const devices_select = document.querySelector('#devices');
    const file_select = document.querySelector('#file');
    const tempo_select = document.querySelector('#tempo');
    const tune_button = document.querySelector('#tune');
    const current_note_display = document.querySelector('#current-note');
    const current_score_display = document.querySelector('#current-score');
    const countdown_display = document.querySelector('#count-down');
    const volume_display = document.querySelector('#current-volume');
    const playlist_display = document.querySelector('#playlist');
    const current_playlist_position_display = document.querySelector('#current-playlist-position');
    const score_stats_display = document.querySelector('#score-stats');
    const loaded_filename_display = document.querySelector('#loaded-filename');
    const qpm_display = document.querySelector('#qpm-display');
    const auto_continue = document.querySelector('#auto-continue');
    const ignore_duration = document.querySelector('#ignore-duration');
    
    window.start_button = start_button;
    
    function clamp(val, min, max) {
        return val > max ? max : val < min ? min : val;
    }
    
    function is_auto_continue() {
        return $('#' + auto_continue.id).is(':checked');
    }
    
    function is_ignore_duration() {
        return $('#' + ignore_duration.id).is(':checked');
    }
    
    // Compare the note expected to be played against the note currently detected on the mic and update score.
    function check_note() {
        if (isNaN(current_midi_number)) {
            current_midi_number = 0;
        }
        if (isNaN(expected_midi_number)) {
            expected_midi_number = 0;
        }
        if(is_ignore_duration()){
            // If we're ignoring duration, then only increase our correct note count if the note is met at least once.
            if(!new_note_checked){
                new_note_checked = true;
                notes_checked_count += 1;
            }
            if(!new_note_checked_and_found && expected_midi_number == current_midi_number){
                new_note_checked_and_found = true;
                notes_checked_correct_count += 1;
            }
        }else{
            // Otherwise, assume the note must be met throughout the entire duration.
            notes_checked_correct_count += expected_midi_number == current_midi_number;
            notes_checked_count += 1;
        }
        update_score_display();
    }
    
    function is_startable() {
        return source_stream && tunebook && tunebook[0].lines.length > 0;
    }
    
    function update_qpm_display() {
        qpm_display.textContent = '-';
        if (current_qpm) {
            qpm_display.textContent = current_qpm;
        }
    }
    
    function update_start_button() {
        if (is_startable()) {
            start_button.disabled = false;
            return;
        }
        start_button.disabled = true;
    }
    
    function color_note(event, color) {
        if (event == null || !event.elements) {
            return;
        }
        for (let e of event.elements) {
            for (let s of e) {
                s.setAttribute('fill', color);
            }
        }
    }
    
    function load_abc(abc_string) {
        var qpm = null;
        var qpm_override = false;
        var abc_string_raw = abc_string;
        stop();
        // Find final QPM.
        if (tempo_select.value) {
            // Use tempo override control.
            qpm = parseInt(tempo_select.value);
            qpm_override = true;
        } else {
            // Otherwise extract from ABC.
            var qpm_matches = abc_string.match(/Q:\s*(\d+)/i);
            if (qpm_matches) {
                qpm = parseInt(qpm_matches[1]);
                // Remove from ABC so it's not rendered with the sheet music.
                abc_string = abc_string.replace(/Q:\s*(\d+\n)/i, '');
            }
        }
        qpm = parseInt(qpm || DEFAULT_TEMPO);
    
        loaded_abc_raw = abc_string_raw;
        loaded_abc = abc_string;
        current_qpm = qpm;
        update_qpm_display();
    
        tunebook = ABCJS.renderAbc(notation_display.id, abc_string, {
            responsive: "resize",
            scale: DEFAULT_SCALE,
            add_classes: true
        });
    
        $('#notation').css('opacity', 0.5);
    
        if (!synth) {
            synth = new ABCJS.synth.CreateSynth();
        }
    
        start_button.disabled = true;
        synth
            .init({
                audioContext: audioContext,
                visualObj: tunebook[0],
                millisecondsPerMeasure: milliseconds_per_measure(current_qpm, tunebook[0]),
            })
            .then(() => {
                synth.prime().then(() => {
                    start_button.disabled = false;
                });
            });
    }
    
    function mark_start_button_as_started() {
        start_button.textContent = 'Stop';
    }
    
    function mark_start_button_as_stopped() {
        start_button.textContent = 'Start';
    }
    
    function begin_countdown() {
        mark_start_button_as_started();
        recording = true;
        countdown = tunebook[0].getBeatsPerMeasure() + 1;
        refresh_countdown();
    }
    
    function refresh_countdown() {
        countdown -= 1;
        if (countdown > 0) {
            countdown_display.textContent = tunebook[0].getBeatsPerMeasure() - countdown + 1;
            $('#count-down').css({'font-size': '15em', 'opacity' : 1.0}).show().animate({opacity: '0'}, milliseconds_per_beat(current_qpm), 'swing', refresh_countdown);
        } else {
            $('#count-down').hide();
            if (countdown == 0) {
                start();
            }
        }
    }
    
    function load_playlist_file(filename) {
        $.ajax({
            url: 'music/' + filename,
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {
                var playlist = $('#' + playlist_display.id);
                clear_playlist();
                playlist_files = data;
                playlist_index = 0;
                for (var i = 0; i < data.length; i += 1) {
                    playlist.append('<li class="list-group-item" data-playlist-index="' + i + '">' + data[i] + '</li>');
                }
                if (playlist_files) {
                    update_playlist();
                }
                $('#playlist li').click(function () {
                    var el = $(this);
                    var index = parseInt(el.data('playlist-index'));
                    // console.log('Loading index ' + index);
                    goto_playlist_index(index);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                report_status('Unable to load playlist file: ' + filename);
                update_start_button();
            },
        });
    }
    
    function load_abc_file(filename) {
        if (!filename) {
            return;
        }
        loaded_filename_display.textContent = '';
        $.ajax({
            url: "music/" + filename,
            dataType: 'text',
            success: function (data, textStatus, jqXHR) {
                original_loaded_abc = data;
                loaded_abc_filename = filename;
                loaded_filename_display.textContent = filename;
    
                // Preprocess the ABC file
                const preprocessedData = preprocess_abc(data);
    
                $('#abc-textarea').val(preprocessedData);
                load_abc(preprocessedData);
                $(file_select.id).removeAttr('disabled');
                report_status('File loaded. Press start to play.');
                update_start_button();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                report_status('Unable to load file.');
                update_start_button();
            },
        });
    }
    
    function preprocess_abc(data) {
        const lines = data.split('\n');
        const headers = [];
        const notes = [];
    
        const ignoredHeaders = new Set(['T', 'C', 'Z', 'S', 'N', 'G', 'O', 'H', 'I', 'P', 'W', 'F', 'B']);
    
        for (let line of lines) {
            line = line.trim();
    
            // Ignore empty lines and comments
            if (!line || line.startsWith('%')) {
                continue;
            }
    
            // Check if line is a metadata header
            if (line.length >= 2 && line[1] === ':' && /^[A-Za-z]$/.test(line[0])) {
                if (ignoredHeaders.has(line[0].toUpperCase())) {
                    continue; // Ignore specific headers
                }
                headers.push(line);
            } else {
                notes.push(line);
            }
        }
    
        return headers.join('\n') + '\n' + notes.join('\n');
    }
    
    
    function load_abc_textarea() {
        loaded_filename_display.textContent = '';
        data = $('#abc-textarea').val();
        original_loaded_abc = data;
        load_abc(data);
        $(file_select.id).removeAttr('disabled');
    
        if(tunebook && tunebook[0].lines.length > 0) {
            loaded_abc_filename = tunebook[0].metaText.title;
            report_status('File loaded. Press start to play.');
        } else {
            report_status('Invalid ABC text. Please try again.');
        }
    
        update_start_button();
    }
    
    function milliseconds_per_beat(qpm) {
        return 60000 / qpm;
    }
    
    function milliseconds_per_measure(qpm, tune) {
        return tune.getBeatsPerMeasure() * milliseconds_per_beat(qpm);
    }
    
    // https://newt.phys.unsw.edu.au/jw/notes.html
    function midi_number_to_octave(number) {
        let octave = parseInt(number / 12) - 1;
        return octave;
    }
    window.midi_number_to_octave = midi_number_to_octave;
    
    function midi_number_to_scale(number) {
        return scales[number % 12];
    }
    
    function midi_number_to_string(number) {
        if (number) {
            return midi_number_to_scale(number) + midi_number_to_octave(number);
        }
        return SILENCE;
    }
    window.midi_number_to_string = midi_number_to_string;
    
    function noteFromPitch(frequency) {
        var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }
    window.noteFromPitch = noteFromPitch;
    
    function start_pitch_detector() {
        audioContext.resume();
        let detectPitch = new Pitchfinder.YIN({sampleRate : audioContext.sampleRate});
        var sourceNode = audioContext.createMediaStreamSource(source_stream);
        var analyser = audioContext.createAnalyser();
        sourceNode.connect(analyser);
        const arrayUInt = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(arrayUInt);
    
        function get_pitch() {
                const array32 = new Float32Array(analyser.fftSize);
                analyser.getFloatTimeDomainData(array32);
                var freq = detectPitch(array32);
                console.log(freq);
                // console.log('freq:'+freq)
                current_midi_number = parseInt(noteFromPitch(freq));
                if (isNaN(current_midi_number)) {
                    current_midi_number = 0;
                }
            update_current_note_display();
            update_current_volume_display();
        }
        pitch_getter_id = setInterval(get_pitch, 10);
    }
    
    function stop_pitch_detector() {
        if (pitch_getter_id) {
            clearInterval(pitch_getter_id);
        }
        if (pitch_detector) {
            pitch_detector.destroy();
        }
        pitch_detector = null;
        current_midi_number = 0;
    }
    
    function start_volume_meter() {
        if (!volume_meter) {
            volume_meter = createAudioMeter(audioContext);
            var mediaStreamSource = audioContext.createMediaStreamSource(source_stream);
            mediaStreamSource.connect(volume_meter);
        }
    }
    
    function update_current_volume_display() {
        var volume;
        if (recording && volume_meter) {
            volume = parseInt(Math.round(volume_meter.volume * 100));
        } else {
            volume = '-';
        }
        volume_display.textContent = '' + volume;
    }
    
    function start_mic() {
        console.log('Starting mic...');
        recording = true;
        audioContext.resume().then(() => {
            console.log('Playback resumed successfully');
        });
        start_volume_meter();
        start_pitch_detector();
    }
    
    function stop_mic() {
        current_midi_number = 0;
        recording = false;
        stop_pitch_detector();
    }
    
    function start_note_checker() {
        note_checker_id = setInterval(check_note, 100);
    }
    
    function stop_note_checker() {
        if (note_checker_id) {
            clearInterval(note_checker_id);
        }
        if (pitch_checker_id) {
            clearInterval(pitch_checker_id);
        }
        note_checker_id = null;
        pitch_checker_id = null;
    }
    
    function event_callback(event) {
        if (current_event) {
            color_note(current_event, NOTE_COLOR_DEFAULT);
        }
        if (event) {
            new_note_checked = false;
            new_note_checked_and_found = false;
            color_note(event, NOTE_COLOR_PLAYING);
            current_event = event;
    
            // Sometimes the pitch array is empty if there's a rest.
            var midiPitch = event.midiPitches && event.midiPitches[0];
            if (!midiPitch) {
                expected_midi_number = 0;
                update_current_note_display();
                return;
            }
    
            expected_midi_number = midiPitch.pitch;
            update_current_note_display();
    
            var duration_ms = event.midiPitches[0].durationInMeasures * milliseconds_per_measure(current_qpm, tunebook[0]);
            // var offset = -current_event.left * DEFAULT_SCALE + 50;
            // $('#notation svg').animate({marginLeft: offset + 'px'}, 0); //duration_ms/2);
        } else {
            // Reached the end.
            stop_note_checker();
            var score = get_score_percent();
            report_status('Scored ' + score + '.');
            stop(false);
            setTimeout(reset, 100);
            // If auto-continue is enabled and our last score was greater or equall to the average, then immediately start playing next.
            if (is_auto_continue()) {
                if (current_score_stats.mean_score && get_score_percent() >= current_score_stats.mean_score) {
                    console.log('Auto-incrementing playlist.');
                    increment_playlist();
                }
                if (!at_playlist_end() || (current_score_stats.mean_score && get_score_percent() < current_score_stats.mean_score)) {
                    setTimeout(auto_start, 3000);
                }
            }
        }
    }
    
    function auto_start() {
        console.log('Auto-starting.');
        start_button.click();
    }
    window.auto_start = auto_start;
    
    function start() {
        console.log('Starting...');
    
        timer = new ABCJS.TimingCallbacks(tunebook[0], {
            qpm: current_qpm,
            extraMeasuresAtBeginning: 0,
            lineEndAnticipation: 0,
            beatSubdivisions: 4,
            beatCallback: function (beatNumber, totalBeats, totalTime) {
                // console.log("beatCallback: " + beatNumber + ", " + totalBeats + ", " + totalTime);
            },
            eventCallback: event_callback,
            lineEndCallback: function (info) {
                // console.log('lineEndCallback:');
                // console.log(info);
            },
        });
    
        notes_checked_count = 0;
        notes_checked_correct_count = 0;
        sum_width = 0;
        start_mic();
        mark_start_button_as_started();
        start_note_checker();
        timer.start();
        synth.start();
        report_status('Playing.');
        $('#notation').css('opacity', 1);
    }
    
    function get_score_percent() {
        return parseInt(Math.round((notes_checked_correct_count / notes_checked_count) * 100));
    }
    
    function reset_score_display_style() {
        var el = $('#' + current_score_display.id);
        el.removeClass('good');
        el.removeClass('bad');
    }
    
    function update_score_display() {
        var el = $('#' + current_score_display.id);
        reset_score_display_style();
        if (notes_checked_count) {
            let percent = get_score_percent();
            el.text('' + notes_checked_correct_count + '/' + notes_checked_count + ' = ' + percent + '%');
            if (current_score_stats && current_score_stats.mean_score) {
                if (percent >= current_score_stats.mean_score) {
                    el.addClass('good');
                } else {
                    el.addClass('bad');
                }
            }
        } else {
            el.text('-');
        }
    }
    
    function stop(verbose) {
        if (verbose == null) {
            verbose = true;
        }
        if (countdown >= 0) {
            countdown = -1;
            recording = true;
        }
        if (!recording) {
            return;
        }
        $('#notation').css('opacity', 0.5);
        stop_mic();
        expected_midi_number = 0;
        current_midi_number = 0;
        stop_note_checker();
        mark_start_button_as_stopped();
        ABCJS.midi.stopPlaying();
        if (timer) {
            timer.stop();
        }
        if (synth) {
            synth.stop();
        }
        if (verbose) {
            report_status('Stopped.');
        }
        if (current_event) {
            color_note(current_event, NOTE_COLOR_DEFAULT);
        }
    }
    window.stop = stop;
    
    function reset() {
        notes_checked_count = 0;
        scroll_offset = 0;
        update_scroll();
        stop();
        ABCJS.midi.restartPlaying();
        if (timer) {
            timer.reset();
        }
        $('#notation svg').css('marginLeft', '0px');
        update_playlist();
    }
    window.reset = reset;
    
    function report_status(message) {
        $('#status').html(message);
    }
    
    function reset_current_note_display_style() {
        var el = $('#' + current_note_display.id);
        el.removeClass('good');
        el.removeClass('bad');
    }
    
    function update_current_note_display() {
        var el = $('#' + current_note_display.id);
        reset_current_note_display_style();
        if (expected_midi_number) {
            if (expected_midi_number == current_midi_number) {
                el.addClass('good');
            } else {
                el.addClass('bad');
            }
        }
        console.log(current_midi_number);
        current_note_display.textContent = midi_number_to_string(expected_midi_number) + '/' + midi_number_to_string(current_midi_number);
    }
    window.update_current_note_display = update_current_note_display;
    
    function scroll_left() {
        scroll_offset -= 100;
        scroll_offset = Math.max(scroll_offset, 0);
        update_scroll();
    }
    
    function scroll_right() {
        scroll_offset += 100;
        update_scroll();
    }
    
    function update_scroll() {
        $('#' + notation_display.id + ' svg').css('transform-origin-x', scroll_offset);
    }
    
    function goto_playlist_index(i) {
        var _playlist_index = playlist_index;
        playlist_index = i;
        playlist_index = clamp(playlist_index, 0, playlist_files.length - 1);
        if (_playlist_index != playlist_index) {
            update_playlist();
        }
    }
    
    function at_playlist_end() {
        return !playlist_files.length || playlist_index == playlist_files.length - 1;
    }
    
    function increment_playlist() {
        var _playlist_index = playlist_index;
        playlist_index += 1;
        playlist_index = clamp(playlist_index, 0, playlist_files.length - 1);
        if (_playlist_index != playlist_index) {
            update_playlist();
        }
    }
    window.increment_playlist = increment_playlist;
    
    function decrement_playlist() {
        var _playlist_index = playlist_index;
        playlist_index -= 1;
        playlist_index = clamp(playlist_index, 0, playlist_files.length - 1);
        if (_playlist_index != playlist_index) {
            update_playlist();
        }
    }
    
    function clear_playlist() {
        playlist_files = [];
        playlist_index = 0;
        var playlist = $('#' + playlist_display.id);
        playlist.empty();
    }
    
    function update_playlist() {
        notes_checked_correct_count = 0;
        notes_checked_count = 0;
        reset_score_display_style();
        reset_current_note_display_style();
        update_score_display();
        $('li').removeClass('active');
        $('li[data-playlist-index=' + playlist_index + ']').addClass('active');
        var fn = playlist_files[playlist_index];
        load_abc_file(fn);
        if (playlist_files.length) {
            current_playlist_position_display.textContent = '' + (playlist_index + 1) + '/' + playlist_files.length;
        } else {
            current_playlist_position_display.textContent = '';
        }
    }
    window.update_playlist = update_playlist;
    
    auto_continue.addEventListener('click', async (e) => {
        Cookies.set(auto_continue.id, is_auto_continue() ? 1 : 0);
    });
    
    ignore_duration.addEventListener('click', async (e) => {
        Cookies.set(ignore_duration.id, is_ignore_duration() ? 1 : 0);
    });
    
    
    // Runs whenever a different audio input device is selected by the user.
    devices_select.addEventListener('change', async (e) => {
        if (e.target.value) {
            if (recording) {
                stop();
            }
    
            // Retrieve the MediaStream for the selected audio input device.
            source_stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: {
                        exact: e.target.value,
                    },
                },
            });
    
            update_start_button();
        }
    });
    
    navigator.getUserMedia = (navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                const fragment = document.createDocumentFragment();
                if (devices) {
                    devices.forEach((device) => {
                        if (device.kind === 'audioinput') {
                            const option = document.createElement('option');
                            option.textContent = device.label;
                            option.value = device.deviceId;
                            fragment.appendChild(option);
                        }
                    });
                }
                devices_select.appendChild(fragment);
    
                // Run the event listener on the `<select>` element after the input devices
                // have been populated. This way the record button won't remain disabled at
                // start.
                devices_select.dispatchEvent(new Event('change'));
            });
        });
    }else{
        $('#message-model .modal-body').html('This browser is not supported.');
        $('#message-model').modal('show');
    }
    
    function _file_select_change(){
        var filename = file_select.value;
        report_status('Loading file ' + filename + '.');
        clear_playlist();
        update_playlist();
        if (filename.endsWith(ABC_EXT)) {
            $('#abc-textarea-container').hide();
            load_abc_file(filename);
        } else if(filename.endsWith(PLS_EXT)) {
            $('#abc-textarea-container').hide();
            load_playlist_file(filename);
        } else {
            $('#abc-textarea-container').show();
            load_abc($('#abc-textarea').val());
        }
        file_select.blur();
        Cookies.set(file_select.id, filename);
    }
    
    file_select.addEventListener('change', () => {
        _file_select_change();
    });
    
    function abc_textarea_change(){
        load_abc_textarea();
    }
    
    abc_textarea.addEventListener('change', () => {
        abc_textarea_change();
    });
    
    tune_button.addEventListener('click', () => {
        if (recording) {
            stop_mic();
            $('#' + tune_button.id).removeClass('active');
            update_start_button();
        } else {
            start_button.disabled = true;
            start_mic();
            $('#' + tune_button.id).addClass('active');
        }
        update_current_volume_display();
    });
    
    tempo_select.addEventListener('change', () => {
        if (loaded_abc) {
            load_abc(original_loaded_abc);
        }
    });
    
    // Runs when the user clicks the record button.
    start_button.addEventListener('click', (event) => {
        if (event.target.disabled || !(tunebook && tunebook[0].lines.length > 0)) {
            report_status('Select a file before starting.');
            return;
        }
        if (recording) {
            stop();
        } else {
            begin_countdown();
        }
        update_current_volume_display();
    });
    
    reset_button.addEventListener('click', (event) => {
        if (event.target.disabled || !file_select.value) {
            report_status('Select a file before resetting.');
            return;
        } else {
            reset();
        }
        update_score_display();
    });
    
    $(document).keypress(function (e) {
        //console.log('Pressed:'+e.keyCode)
        switch (e.keyCode) {
            case 115:
                // s = start/stop
                start_button.click();
                break;
            case 114:
                // r = reset
                reset_button.click();
                break;
            case 116:
                // t = tune
                tune_button.click();
                break;
            case 110:
                // n = next playlist item
                increment_playlist();
                break;
            case 98:
                // b = back playlist item
                decrement_playlist();
                break;
            case 106:
                // j = scroll left
                scroll_left();
                break;
            case 107:
                // j = scroll right
                scroll_right();
                break;
        }
    });
    
    $(document).ready(function () {
        var cb;
        // Load saved auto continue state.
        cb = parseInt(Cookies.get(auto_continue.id));
        if (!isNaN(cb)) {
            $('#' + auto_continue.id).prop('checked', cb);
        }
        // Load saved ignore duration state.
        cb = parseInt(Cookies.get(ignore_duration.id));
        if (!isNaN(cb)) {
            $('#' + ignore_duration.id).prop('checked', cb);
        }
        // Load saved selected file.
        cb = Cookies.get(file_select.id);
        if (cb) {
            file_select.value = cb;
            _file_select_change();
        }
    });
  }, [])

  return (
    <div className="container">
      <h3>ABC Sightreader</h3>

      <div className="container">
        <div className="row-fluid">
          <div className="span12" id="status" title="Status">
            1. Select your mic 2. Select your ABC file 3. Press start
          </div>
        </div>

        <div className="row-fluid controls">
          <div className="span12">
            <label htmlFor="devices">Microphone:</label>
            <select id="devices"></select>

            <label htmlFor="file">File:</label>
            <select id="file">
                <option value="">---Custom ABC---</option>
                <option value="beginner.pls">Beginner</option>
                <option value="">---Custom ABC---</option>
                <option value="beginner.pls"> Beginner</option>
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

            <label htmlFor="tempo">Tempo:</label>
            <select id="tempo">
              <option value="">inherit</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="90">90</option>
              <option value="120">120</option>
              <option value="180">180</option>
              <option value="240">240</option>
            </select>

            <button id="start" disabled title="Enable mic and begin playing along to sheet music.">
              Start
            </button>
            <button id="reset">Reset</button>
            <button id="tune" title="Enable mic and show pitch but don't play a game.">
              Tune
            </button>
          </div>
        </div>

        <div className="row-fluid" id="abc-textarea-container">
          <div className="span-12">
            <textarea id="abc-textarea" />
          </div>
        </div>

        <div className="row-fluid main-display">
          <div className="row-fluid top-info">
            <div id="current-playlist-position" title="Playlist position." className="span4 left">
              -
            </div>
            <div id="qpm-display" title="QPM" className="span4 center">
              -
            </div>
            <div className="span4 right">
              <span id="current-score" title="Your current score.">-</span>
              <span id="score-stats" title="Score statistics."></span>
            </div>
          </div>

          <div className="span12" id="notation"></div>
          <span id="current-note" title="Expected and actual note detected on the microphone.">-</span>
          <span id="current-volume" title="Microphone volume.">-</span>
          <div id="midi" style={{ display: "none" }}></div>
          <span id="count-down"></span>
          <span id="loaded-filename">-</span>
        </div>

        <div className="row-fluid controls">
          <div className="span12 keyboard-legend">
            <span className="cb-field">
              <input id="auto-continue" type="checkbox" />
              <label htmlFor="auto-continue" title="Once score is above average, immediately move on to next playlist item.">
                Auto-Continue
              </label>
            </span>
            <span className="cb-field">
              <input id="ignore-duration" type="checkbox" />
              <label htmlFor="ignore-duration" title="If checked, will score a note if it's met and will not check duration.">
                Ignore Duration
              </label>
            </span>
          </div>
        </div>

        <div className="row-fluid">
          <div className="span12">
            <ol id="playlist" className="list-group"></ol>
          </div>
        </div>
      </div>

      <div className="modal fade" id="message-model" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-body" style={{ textAlign: "center" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sightreader;
