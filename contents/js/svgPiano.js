// ピアノのSVG。クリック/タッチで音を出す機能付き。
class SvgPiano {
  constructor(container, options={}) {
    if (container instanceof HTMLElement) {
      this.container = container;
      this.containerId = container.id;
    } else {
      this.containerId = container;
      this.container = document.getElementById(container);
    }
    this.options = {
      min_key_number: 41,
      max_key_number: null,
      number_of_white_keys: 22,
      white_key_width: 30,
      white_key_height: 120,
      black_key_width: 24,
      black_key_height: 70,
      volume: 0.25,
      ...options //引数で渡された値でデフォルト値を上書き
    }
    this.white_keys = [];
    this.black_keys = [];
    this.svg = null;
    this.init();
  }

  init() {
    this.getKeyNumberArray();
    this.createSvg();
    this.createWhiteKeys();
    this.createBlackKeys();
    this.setupContainer()
    this.addPianoInteractions();
    this.addPianoClickEvents();
    this.setupEventListeners();
  }

  getKeyNumberArray() {
    const remainderArray = [1, 3, 6, 8, 10];
    const startNum = this.options.min_key_number ;
    const whiteKeys = this.options.number_of_white_keys;
    const maxNum = startNum + whiteKeys * 2 ;
    for (let midiNum = startNum; midiNum < maxNum ; midiNum++) {
      if (this.white_keys.length == whiteKeys) {
        if (remainderArray.includes(midiNum % 12)) {
          this.black_keys.push(midiNum);
          this.options.max_key_number = midiNum;
        }
        break;
      }
      if (remainderArray.includes(midiNum % 12)) {
        this.black_keys.push(midiNum);
      } else {
        this.white_keys.push(midiNum);
      }
      this.options.max_key_number = midiNum;
    }
    console.log(this.white_keys);
    console.log(this.black_keys);
  }

  createSvg() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svg_width = this.options.white_key_width * this.options.number_of_white_keys;
    const svg_height = this.options.white_key_height;
    this.svg.setAttribute('xml:space', 'preserve');
    this.svg.setAttribute('id', 'piano-svg');
    this.svg.setAttribute('viewBox', '0 0 ' + svg_width + ' ' + svg_height);
    this.svg.style.width = '100%'
    this.svg.style.height = 'auto';
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.container.appendChild(this.svg);
  }

  createWhiteKeys() {
    const frag = document.createDocumentFragment();
    for (let key = 1; key <= this.white_keys.length; key++) {
      const midi_num = this.white_keys[key - 1];
      console.log(`white, midi_num:${midi_num}`);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', `piano-key-${midi_num}`);
      rect.setAttribute('x', ( key - 1 ) * this.options.white_key_width);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', this.options.white_key_width);
      rect.setAttribute('height', this.options.white_key_height);
      rect.setAttribute('style', 'fill:white;stroke:black;cursor:pointer;');
      frag.appendChild(rect);
    }
    this.svg.appendChild(frag);
  }

  createBlackKeys() {
    const frag = document.createDocumentFragment();
    for (let key = 1; key <= this.black_keys.length; key++) {
      const midi_num = this.black_keys[key - 1];
      console.log(`black, midi_num:${midi_num}`);
      let x;
      if (midi_num == this.options.min_key_number) {
        x = 0;
      } else {
        const targetElement = this.svg.querySelector(`#piano-key-${midi_num-1}`);
        if (targetElement) {
          const base_key_elm = this.svg.querySelector(`#piano-key-${midi_num-1}`);
          const base_key_x = parseFloat(base_key_elm.getAttribute('x'));
          const white_key_width = this.options.white_key_width;
          const black_key_width = this.options.black_key_width;
          x = base_key_x + (white_key_width - black_key_width / 2) ;
        }
      }
      let key_width = this.options.black_key_width;
      if (midi_num == this.options.min_key_number || 
          midi_num == this.options.max_key_number) 
      {
        key_width = key_width / 2;
      }
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', `piano-key-${midi_num}`);
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', key_width);
      rect.setAttribute('height', this.options.black_key_height);
      rect.setAttribute('style', 'fill:black;stroke:black;cursor:pointer;');
      frag.appendChild(rect);
    }
    this.svg.appendChild(frag);
  }
  setupContainer() {
    this.container.setAttribute('style', `max-width:${this.options.white_key_width * this.white_keys.length}px`);
  }
  // 白鍵と黒鍵のマウスオーバー効果を追加
  addPianoInteractions() {
    //console.log(this.white_keys);
    // 白鍵のマウスオーバー効果
    this.white_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            //console.log(key.id);
            key.addEventListener('mouseover', () => {
                key.style.fill = '#e0e0e0';
            });
            key.addEventListener('mouseleave', () => {
                key.style.fill = 'white';
            });
        }
    });
  
    // 黒鍵のマウスオーバー効果
    this.black_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            key.addEventListener('mouseover', () => {
                key.style.fill = '#222';
            });
            key.addEventListener('mouseleave', () => {
                key.style.fill = 'black';
            });
        }
    });
  }
  // クリック/タッチで音を出す機能を追加
  addPianoClickEvents() {
    // 白鍵のクリック/タッチ効果
    this.white_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            // クリックイベント
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (e.button !== 0) return;
                key.style.fill = '#ccc';
                console.log(`audioCtx.state(before): ${audioCtx.state}`);
                stopNote(midi);
                playNote(midi, this.options.volume, 2, 'triangle', 440);
                console.log(`audioCtx.state(after): ${audioCtx.state}`);
            });
            
            // タッチイベント
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                key.style.fill = '#ccc';
                stopNote(midi);
                playNote(midi, this.options.volume, 2, 'triangle', 440);
            });
            
            // マウスアップ
            key.addEventListener('mouseup', () => {
                key.style.fill = '#e0e0e0';
            });

            // タッチエンド
            key.addEventListener('touchend', () => {
                key.style.fill = 'white';
                key.style.stroke = 'black';
            });
        }
    });
  
    // 黒鍵のクリック/タッチ効果
    this.black_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            // クリックイベント
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (e.button !== 0) return;
                key.style.fill = '#3b3b3b';
                stopNote(midi);
                playNote(midi, this.options.volume, 2, 'triangle', 440);
            });
            
            // タッチイベント
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                key.style.fill = '#ccc';
                stopNote(midi);
                playNote(midi, this.options.volume, 2, 'triangle', 440);
            });
            
            // マウスアップ
            key.addEventListener('mouseup', () => {
                key.style.fill = '#222';
            });
            
            // タッチエンド
            key.addEventListener('touchend', () => {
                key.style.fill = 'black';
                key.style.stroke = 'black';
            });
        }
    });
  }
  // AudioContextのアクティブ化
  setupEventListeners() {
    document.addEventListener('click', () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    }, { once: true });
  }
}

// AudioContextと再生中リストをグローバルに定義
const audioCtx =  new (window.AudioContext || window.webkitAudioContext)();
const activeNotes = new Map();

// SVGのピアノ鍵盤で音を出す関数
function playNote(midi, volume = 0.25, duration = 2, oscType = "triangle", tuning = 440) {
    // 同じ番号の既存の音を止める
    stopNote(midi);
  
    // volumeを対数スケールにする
    volume = Math.pow(10, (-40 + 40 * volume) / 20);
  
    // 基本設定
    const freq = tuning * Math.pow(2, (midi - 69) / 12);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
  
    // 正弦波
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
    // 音量を0に近い値から
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    // 滑らかに目標音量volumeへ
    gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
    // 音量を時間durationをかけて減少させる
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  
    // 基本設定 開始、終了
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  
    // 強制停止時の処理の為にgainを渡す
    osc.gainNode = gain;
  
    // 再生中リストへ追加
    activeNotes.set(midi, osc);
}
  
// ピアノ鍵盤の音を止める関数
function stopNote(midi) {
    const osc = activeNotes.get(midi);
    if (osc) {
        try {
            // 強制停止時のノイズ処理(滑らかに位相を0にする)
            const now = audioCtx.currentTime;
            const gainNode = osc.gainNode;
            if (gainNode) {
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            }
            osc.stop(now + 0.04);
        } catch (e) { }
        // 再生中リストから削除
        activeNotes.delete(midi);
    }
}

function setTempoDisplay(){
  document.querySelectorAll(".tempo-display").forEach(container => {
    const name = container.getAttribute("name");
    if (name) {
      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("class", "tempoDisplay");
      input.setAttribute("value", "♩=120");
      container.appendChild(input);
      
      const downBtn = document.createElement("div");
      downBtn.setAttribute("class", "down");
      downBtn.innerHTML = "ー";
      container.appendChild(downBtn);
      
      const upBtn = document.createElement("div");
      upBtn.setAttribute("class", "up");
      upBtn.innerHTML = "＋";
      container.appendChild(upBtn);
    }
  });
  document.querySelectorAll('.tempo-display div').forEach(div => {
    div.addEventListener('click', () => {
      const name =div.parentNode.getAttribute("name");
      const tempoDisplay = div.parentNode.querySelector('input');
      const currentTempo = Number(tempoDisplay.value.replace('♩=',''));
      let newTempo ;
      if (div.className === 'down') {
        newTempo = currentTempo - 1;
      } else {
        newTempo = currentTempo + 1;
      }
      const audioControl = audioControls.find(control => control.options.name === name );
      audioControl.updateTempo(newTempo);
    });
  });
}

function setAudioControls(containerClassName){
  const audioControls = [];
  document.querySelectorAll(containerClassName).forEach(container => {
    const partName = container.getAttribute("name");
    if (partName) {
      createPlayBtn(container, partName);
      createPauseBtn(container, partName);
      createStopBtn(container, partName);
      createSeekBar(container, partName);
      createTimeDisplay(container, partName);
      createAudioControlInstance(audioControls, partName);
    }
  });
  
  function createPlayBtn(container, partName){
    const playBtn = document.createElement("button");
    playBtn.setAttribute("id", `playBtn-${partName}`);
    playBtn.innerHTML = "Play";
    container.appendChild(playBtn);
  }
  function createPauseBtn(container, partName){
    const pauseBtn = document.createElement("button");
    pauseBtn.setAttribute("id", `pauseBtn-${partName}`);
    pauseBtn.innerHTML = "Pause";
    container.appendChild(pauseBtn);
  }
  function createStopBtn(container, partName){
    const stopBtn = document.createElement("button");
    stopBtn.setAttribute("id", `stopBtn-${partName}`);
    stopBtn.innerHTML = "Stop";
    container.appendChild(stopBtn);
  }
  function createSeekBar(container, partName){
    const seekBar = document.createElement("input");
    seekBar.setAttribute("id", `seekBar-${partName}`);
    seekBar.setAttribute("type", "range");
    seekBar.setAttribute("min", "0");
    seekBar.setAttribute("max", "100");
    seekBar.setAttribute("step", "0.1");
    seekBar.setAttribute("value", "0");
    seekBar.style.width = "200px";
    container.appendChild(seekBar);
  }
  function createTimeDisplay(container, partName){
    const timeDisplay = document.createElement("span");
    timeDisplay.setAttribute("id", `timeDisplay-${partName}`);
    timeDisplay.setAttribute("class", "timeDisplay");
    timeDisplay.innerHTML = "0:00 / 0:00";
    container.appendChild(timeDisplay);
  }
  function createAudioControlInstance(audioControls,partName){
    audioControls.push(new AudioControl({
      name: partName,
      playBtn: `playBtn-${partName}`,
      pauseBtn: `pauseBtn-${partName}`,
      stopBtn: `stopBtn-${partName}`,
      seekBar: `seekBar-${partName}`,
      timeDisplay: `timeDisplay-${partName}`,
      loop: true
    }));
    return audioControls;
  }
  return audioControls;
}

class MidiPlayer {
    constructor(svgPiano, midiFile, OFFSET = 0, midiSegment = null, trackIndex = null){
      this.piano = svgPiano;
      this.loadingPromise = this.loadMidi(midiFile);
      this.OFFSET = OFFSET; // mp3冒頭の無音時間(秒)
      this.midiSegment = midiSegment; // MIDIセグメント
      this.trackIndex = trackIndex;
      this.scheduledTimeouts = [];
      this.isLoaded = false;
      this.midi = null;
      this.baseBpm = null;
      this.rate = 1;
    }
    
    async loadMidi(midiFile) {
      const midiResponse = await fetch(midiFile);
      const midiArrayBuffer = await midiResponse.arrayBuffer();
      this.midi = new Midi(midiArrayBuffer);
      console.log(this.midi.tracks.length);
      console.dir(this.midi.tracks);
      const bpm = this.midi.header.tempos[0]?.bpm || 120;
      this.baseBpm = Math.round(bpm);
      this.isLoaded = true;
    }

    // ========= MIDIハイライトのスケジューリングメソッド =========
    //引数pianoはSvgPianoクラスのインスタンス
    //引数seekPositionは秒単位の再生位置(tempo変更時は換算後の体感時間の秒)
    async scheduleMidHighlight(seekPosition) {
      //console.log(`seekPosition:${seekPosition} @scheduleMidHighlight`);
      //console.trace();
      await this.loadingPromise; // MIDIファイルが読み込まれるのを待つ
      
      this.scheduledTimeouts.forEach(clearTimeout);
      this.scheduledTimeouts = [];
      this.resetAllKeys();
      
      const start = this.midiSegment[0] / this.rate;
      const duration = this.midiSegment[1] / this.rate;
      const end = start + duration;
      const offset = this.OFFSET / this.rate;

      const trackIndices = this.convertedTrackIndex();
      const tracksToProcess =
        this.trackIndex === null
          ? this.midi.tracks
          : this.midi.tracks.filter((_, i) => trackIndices.includes(i));

      tracksToProcess.forEach(track => {
        track.notes.forEach(note => {
          console.log(`note.time < start: ${note.time} < ${start}`);
          // MIDIセグメント外のノートはスキップ
          if ((note.time / this.rate)  < start || (note.time / this.rate) > end) return;

          const relStart = note.time / this.rate - start + offset;
          const relEnd = relStart + note.duration / this.rate;
          
          const highlightDelay = (relStart - seekPosition ) * 1000;
          const resetDelay = (relEnd - seekPosition ) * 1000;  
          
          console.log(`note.midi:${note.midi}、highlightDelay:${highlightDelay}`);

          if (relStart >= seekPosition) {

            const startTimer = setTimeout(() => this.highlightKey(note.midi),highlightDelay);
            const endTimer = setTimeout(() => this.resetKey(note.midi),resetDelay);
            this.scheduledTimeouts.push(startTimer,endTimer);

          } else if ( relStart < seekPosition && relEnd > seekPosition) {
            const remaining = (relEnd - seekPosition) *1000;             
            this.highlightKey(note.midi);
            const endTimer2 = setTimeout(() => this.resetKey(note.midi),remaining);
            this.scheduledTimeouts.push(endTimer2);
          }
        });
      });
    }

    clearScheduledTimeouts() {
      if (this.scheduledTimeouts) {
        this.scheduledTimeouts.forEach(t => clearTimeout(t));
      }
      this.scheduledTimeouts = [];
    }
    
    highlightKey(midiNote, color = '#F98BE6') {
      const key = document.getElementById('piano-key-' + midiNote);
      // velocity(0～1)で色味調整
      console.log(`${midiNote}:highlight`);
      key.style.fill = color; // 例: 赤系で濃淡
    }
    
    resetKey(midiNote) {
      const key = document.getElementById('piano-key-' + midiNote);
      if (this.piano.white_keys.includes(midiNote)) {
        console.log(`${midiNote}:white`);
        key.style.fill = "white";
      } else {
        console.log(`${midiNote}:black`);
        key.style.fill = "black";
      }
    }
    
    resetAllKeys() {
      this.piano.white_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        key.style.fill = "white";
      });
      this.piano.black_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        key.style.fill = "black";
      });
    }

    // MIDIファイルのトラック換算(空トラックを除外)
    convertedTrackIndex() {
      if (this.trackIndex === null) return null;
      const trackIndex = Array.isArray(this.trackIndex) ? this.trackIndex : [this.trackIndex];
      const tracktable = [];
      const converted = [];
      console.log(`397:midi.tracks: ${this.midi.tracks}`);
      console.dir(this.midi.tracks);
      for (let i = 0; i < this.midi.tracks.length; i++) {
        if (this.midi.tracks[i].hasOwnProperty('notes') && this.midi.tracks[i].notes.length > 0) {
          tracktable.push(i);
        }
      }
      console.warn(tracktable);
      for (let i = 0; i < trackIndex.length; i++) {
        converted.push(tracktable[trackIndex[i]]);
      }
      console.warn(`${this.trackIndex} ⇒ convertedTrackIndex: ${converted}`);
      return converted;
    }
  }

  class AudioControl {
    constructor(controls={}) {
      this.options = {
        name: null,
        svgPiano: null,
        playBtn: 'playBtn',
        pauseBtn: 'pauseBtn',
        stopBtn: 'stopBtn',
        seekBar: 'seekBar',
        timeDisplay: 'timeDisplay',
        mp3File: null,
        midiFile: null,
        trackIndex: null,
        OFFSET: 0, // mp3冒頭の無音時間(秒)
        midiStart: 0, // mp3に対応するMIDIの開始時間(秒)
        segment: null,
        loop: false,
        // 複数ファイルセット用の拡張機能
        fileSets: [],
        currentFileSetIndex: 0,
        preloadedSets: [],
        ...controls,
      }

      // 初期化時に初期セットをfileSets[0]に格納
      this.initializeInitialFileSet();

      console.log(`this.options.midiStart:${this.options.midiStart}`);
      this.playBtn = document.getElementById(this.options.playBtn);
      this.pauseBtn = document.getElementById(this.options.pauseBtn);
      this.stopBtn = document.getElementById(this.options.stopBtn);
      this.seekBar = document.getElementById(this.options.seekBar);
      this.timeDisplay = document.getElementById(this.options.timeDisplay);
      
      this.howl = null;
      this.sound = null;
      this.midiPlayer = null;
      this.seekTimer = null;
      this.isDragging = false;
      this.isPlaying = false;
      this.loopTimer = null;

      this.midi = null;
      this.midiSegment = null;
      this.rate = 1;

      // 拡張用プロパティ
      this.additionalSounds = [];
      this.additionalMidiPlayers = [];

      this.init();
    }

    // 初期セットをfileSets[0]に格納
    initializeInitialFileSet() {
      const initialFileSet = {
        mp3File: this.options.mp3File,
        midiFile: this.options.midiFile,
        trackIndex: this.options.trackIndex,
        OFFSET: this.options.OFFSET,
        midiStart: this.options.midiStart,
        segment: this.options.segment,
        name: 'Original'
      };
      
      this.options.fileSets.push(initialFileSet);
      
      // 初期セット用のプリロード情報も作成
      const initialPreloadedSet = {
        index: 0,
        sound: null,
        midiPlayer: null,
        isLoaded: false
      };
      
      this.options.preloadedSets.push(initialPreloadedSet);
    }

    async init() {
      if (this.options.mp3File) {
        this.setupMp3();
      }
      if (this.playBtn) this.playBtn.addEventListener('click', () => {
        if (this.seekBar.value == 0 && this.options.currentFileSetIndex !== 0) {
          this.switchFileSet('Original');
          this.seekBar.max = this.sound.duration();
          this.updateTimeDisplay();
        }
        this.play()
      });
      if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.pause());
      if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stop());
      if (this.seekBar) this.seekBar.addEventListener('input', () => this.seek());
      if (this.seekBar) this.seekBar.addEventListener('change', () => this.endSeek());

      // seekBarのイベントリスナーに時間表示更新を追加
      if (this.seekBar) {
        this.seekBar.addEventListener('input', () => {
          this.seek();
          this.updateTimeDisplay(); // シーク中に時間表示を更新
        });
        this.seekBar.addEventListener('change', () => this.endSeek());
      }
    }

    //　追加のファイルセットを動的に追加
    async addFileSet(fileSet) {
      console.warn(`addFileSet開始:${fileSet.name}`);
      const index = this.options.fileSets.length;
      this.options.fileSets.push(fileSet);
      const preloadedSet = {
        index: index,
        name: fileSet.name,
        sound: null,
        midiPlayer: null,
        isLoaded: false
      };

      if (fileSet.mp3File) {
        preloadedSet.sound = new Howl({
          src: [fileSet.mp3File],
          html5: false,
          preload: true,
          onload: () => {
            console.log(`File set:${preloadedSet.name}:${fileSet.mp3File} MP3 loaded`);
            preloadedSet.isLoaded = true;
          },
          onplay: () => {
            this.seekTimer = setInterval(() => {
              if (!this.isDragging) this.seekBar.value = preloadedSet.sound.seek() / this.rate;
              this.updateTimeDisplay();
            }, 100);
          },
          onpause: () => { 
            clearInterval(this.seekTimer); 
          },
          onstop: () => { 
            clearInterval(this.seekTimer);  
            this.seekBar.value = 0;
            this.updateTimeDisplay();
          },
          onloaderror: () => {
            console.error(`File set:${index} MP3 loading failed`);
          },
        });
        this.additionalSounds.push(preloadedSet.sound);
      }

      if (fileSet.midiFile && this.options.svgPiano) {
        preloadedSet.midiPlayer = new MidiPlayer(
          this.options.svgPiano, 
          fileSet.midiFile,
          fileSet.OFFSET,
          null,
          fileSet.trackIndex,
        );
        this.additionalMidiPlayers.push(preloadedSet.midiPlayer);
      }

      this.options.preloadedSets.push(preloadedSet);

      return index ;  // 追加したファイルセットのインデックスを返す
    }

    // ファイルセットを切り替える
    switchFileSet(name) {
      let index;
      if (name === 'Original'){
        index = 0;
        this.currentSound = this.sound;
        this.currentMidiPlayer = this.midiPlayer;
        this.seekBar.max = this.sound.duration();
      } else {
        index = this.options.fileSets.findIndex(set => set.name === name);
        const preloadedSet = this.options.preloadedSets.find(set => set.index === index);
        if (preloadedSet && preloadedSet.isLoaded) {
          this.currentSound = preloadedSet.sound;
          this.currentMidiPlayer = preloadedSet.midiPlayer;
          this.seekBar.max = this.currentSound.duration();

          if (this.currentMidiPlayer && this.currentSound) {
            const fileSet = this.options.fileSets[index];
            this.currentMidiPlayer.midiSegment = [
              fileSet.midiStart || 0,
              this.currentSound.duration() ,
            ];
          }
        } else {
          console.warn(`File set:${name} is not loaded yet`);
          return;
        }
      }
      const [start, duration] = this.currentMidiPlayer.midiSegment;
      console.warn(`switchFileSet:${name} midi.Start:${start}, duration:${duration}`);
      this.options.currentFileSetIndex = index;
      this.stop();

      // シークバーの最大値を更新
      if (this.currentSound) {
        this.seekBar.max = this.currentSound.duration();
        this.updateTimeDisplay();
      }
    }

    // 現在のファイルセット情報を取得
    getCurrentFileSet() {
      if (this.options.currentFileSetIndex === 0) {
        return {
          mp3File: this.options.mp3File,
          midiFile: this.options.midiFile,
          trackIndex: this.options.trackIndex,
          OFFSET: this.options.OFFSET,
          midiStart: this.options.midiStart,
          segment: this.options.segment
        };
      } else {
        return this.options.fileSets[this.options.currentFileSetIndex];
      }
    }

    // ファイルセットの総数を取得
    getFileSetCount() {
      return this.options.fileSets.length;
    }

    // MP3ファイルをセットアップ
    async setupMp3() {
      console.warn("setupMp3開始");
      console.warn(`this.options.mp3File:${this.options.mp3File}`);
      this.sound = new Howl({
        src: [this.options.mp3File],
        html5: false,
        onload: () => { 
          this.seekBar.max = this.sound.duration(); 
          this.updateTimeDisplay();

          this.options.preloadedSets[0].sound = this.sound;
          this.options.preloadedSets[0].isLoaded = true;

          if (this.options.midiFile) {
            this.setupMidiPlayer();
          }
        },
        onplay: () => {
          this.seekTimer = setInterval(() => {
            if (!this.isDragging) this.seekBar.value = this.sound.seek() / this.rate;
            this.updateTimeDisplay();
          }, 100);
        },
        onpause: () => { 
          clearInterval(this.seekTimer); 
        },
        onstop: () => { 
          clearInterval(this.seekTimer);  
          this.seekBar.value = 0;
          this.updateTimeDisplay();
        }
      });
      this.currentSound = this.sound;
    }

    setupMidiPlayer() {
      console.warn(`setupMidiPlayer開始: from setupMp3:${this.options.mp3File}`);
      this.midiSegment = [this.options.midiStart, this.sound.duration()];
      console.log(`this.midiSegment[0]:${this.midiSegment[0]} @setupMidiPlayer`);
      console.log(`this.midiSegment[1]:${this.midiSegment[1]} @setupMidiPlayer`);
      this.midiPlayer = new MidiPlayer(
        this.options.svgPiano, 
        this.options.midiFile, 
        this.options.OFFSET,
        this.midiSegment,
        this.options.trackIndex,
      );
      this.options.preloadedSets[0].midiPlayer = this.midiPlayer;
      this.currentMidiPlayer = this.midiPlayer;

      this.midiPlayer.loadingPromise.then(() => {
        const tempo = this.midiPlayer.baseBpm;
        this.updateTempoDisplay(tempo);
      });
    }

    update(newOptions){
      console.warn("update開始");
      this.options = {
        ...this.options,
        ...newOptions
      }
      console.log(`this.options.midiStart:${this.options.midiStart} @update`);
      if (Object.keys(newOptions).includes('mp3File')) {
        this.setupMp3();
      }else if (Object.keys(newOptions).includes('midiFile')) {
        this.setupMidiPlayer();
      } else if (Object.keys(newOptions).includes('midiStart')) {
        this.midiSegment = [this.options.midiStart, this.sound.duration()];
        this.setupMidiPlayer();
      }
    }
    play() {
      if (this.isPlaying) {
        this.stop();
        setTimeout(() => {
          if (this.currentSound) {
            this.currentSound.seek(0);
            this.play();
          }
        }, 1000);
        return;
      }
      
      if (!this.currentSound) {
        console.warn("No sound loaded");
        return;
      }
      this.stopOtherAudio();

      // 既存のendイベントリスナーを削除
      this.currentSound.off('end');
      
      this.scheduleMidHighlight(this.seekBar.value);
      this.currentSound.seek(this.seekBar.value * this.rate);
      this.currentSound.play();

      this.isPlaying = true;
      
      // ループ再生（鍵盤ハイライトもループ）
      if (this.options.loop) {
        this.currentSound.on('end', () => {
          clearInterval(this.seekTimer);
          this.seekBar.value = 0;
          this.updateTimeDisplay();
          setTimeout(() => {
            this.currentSound.seek(0);
            this.play();
          }, 2000);
        });
      }
    }
    
    playSegment(start, end) {
      if (this.isPlaying) {
        this.stop();
        setTimeout(() => {
          if (this.currentSound) {
            this.currentSound.seek(0);
            this.playSegment();
          }
        }, 1000);
        return;
      }
      
      this.stopOtherAudio();
      
      // セグメントの処理（既存のコード）
      const [options_start, options_end] = this.options.segment.split(",");
      if (start === undefined && end === undefined && this.options.segment) {
        [start, end] = [Number(options_start), Number(options_end)];
        if ((start / this.rate) < this.seekBar.value
            && this.seekBar.value < (end / this.rate) )
        {
          start = this.seekBar.value * this.rate;
        }      
      } else if (start !== undefined && end === undefined && this.options.segment) {
        [start, end] = [Number(start), Number(options_end)];
      
      } else if (start !== undefined && end !== undefined) {
        [start, end] = [Number(start), Number(end)];
      }
      
      // 再生開始位置をstart秒に設定(Howlerのseekは速度変更しても不変。scheduleMidHighlightは体感時間に換算して引数に渡す。)
      this.currentSound.seek(start);
      this.scheduleMidHighlight(start / this.rate);
      
      // 再生開始
      this.currentSound.play();
      this.isPlaying = true;
      
      // end秒で再生を停止
      const duration = (end - start) * 1000;
      this.loopTimer = setTimeout(() => {
        this.stop();
        if (this.options.loop) {
          setTimeout(() => {
            this.playSegment();
          }, 1500);
        }
      }, duration);
    }
    
    pause() {
      if (this.currentSound) {
        this.currentSound.pause();
      }
      this.clearScheduledTimeouts();
      this.isPlaying = false;
      //console.log(`seekBar.value:${this.seekBar.value} @pause`);
    }

    stop() {
      if (this.currentSound) {
        this.currentSound.stop();
      }
      this.isPlaying = false;
      this.clearScheduledTimeouts();
      this.resetAllKeys();
      if (this.loopTimer) {
        clearTimeout(this.loopTimer);
      }
    }
      
    seek() {
      this.isDragging = true;
      if (this.currentSound) {
        this.currentSound.seek(this.seekBar.value * this.rate);
      }
      this.clearScheduledTimeouts();
      this.resetAllKeys();
      this.isPlaying = false;
      this.updateTimeDisplay();
    }
    
    endSeek() {
      if (this.currentSound) {
        this.seekBar.value = this.currentSound.seek() / this.rate;
      }
      this.isDragging = false;
      //this.scheduleMidHighlight(this.seekBar.value);
      this.updateTimeDisplay();
    }
    
    scheduleMidHighlight(currentTime) {
      //currentTimeは秒単位の再生位置(tempo変更時は換算後の体感時間の秒)
      if (this.currentMidiPlayer) {
        this.currentMidiPlayer.scheduleMidHighlight(currentTime);
      }
    }
    
    clearScheduledTimeouts() {
      if (this.currentMidiPlayer) {
        this.currentMidiPlayer.clearScheduledTimeouts();
      }
    }

    resetAllKeys() {
      if (this.currentMidiPlayer) {
        this.currentMidiPlayer.resetAllKeys();
      }
    }

    stopOtherAudio() {
      if (audioControls && audioControls.length > 1) {
        audioControls.forEach(audioControl => {
          if (audioControl.isPlaying) {
            audioControl.stop();
          }
        });
      }
    }

    updateTempo(tempo) {
      if (this.currentMidiPlayer) {
        this.rate = tempo / this.currentMidiPlayer.baseBpm;
        this.currentSound.rate(this.rate);
        this.currentMidiPlayer.rate = this.rate;
        this.updateTempoDisplay(tempo)
        this.updateTimeDisplay();
        this.seekBar.max = this.currentSound.duration() / this.rate;
        this.seekBar.value = this.currentSound.seek() / this.rate;
      }
    }
    
    // 時間を MM:SS 形式にフォーマットする関数
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  
    // 時間表示を更新する関数
    updateTimeDisplay() {
      if (!this.timeDisplay || !this.currentSound) return;
      
      const currentTime = this.currentSound.seek() / this.rate;
      const duration = this.currentSound.duration() / this.rate;
      
      const currentFormatted = this.formatTime(currentTime);
      const durationFormatted = this.formatTime(duration);
      
      this.timeDisplay.textContent = `${currentFormatted} / ${durationFormatted}`;
    }
    updateTempoDisplay(tempo) {
      const inputElement = document.querySelector(`.tempo-display[name="${this.options.name}"] input`);
      if (inputElement) inputElement.value = `♩=${tempo}`;
    }
  }


