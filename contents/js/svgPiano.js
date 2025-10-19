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

class MidiPlayer {
    constructor(svgPiano, midiFile, trackIndex = null){
      this.scheduledTimeouts = [];
      this.piano = svgPiano;
      this.trackIndex = trackIndex;
      this.isLoaded = false;
      this.midi = null;
      this.loadingPromise = this.loadMidi(midiFile);
    }
    
    async loadMidi(midiFile) {
      const midiResponse = await fetch(midiFile);
      const midiArrayBuffer = await midiResponse.arrayBuffer();
      this.midi = new Midi(midiArrayBuffer);
      console.log("316:midi.tracks");
      console.log(this.midi.tracks.length);
      console.dir(this.midi.tracks);
      this.isLoaded = true;
    }
  
    // ========= MIDIハイライトのスケジューリングメソッド =========
    // 引数pianoはSvgPianoクラスのインスタンス
    async scheduleMidHeighlight(seekPosition) {
      console.trace();
      await this.loadingPromise; // MIDIファイルが読み込まれるのを待つ
      
      this.scheduledTimeouts.forEach(clearTimeout);
      this.scheduledTimeouts = [];
      
      const trackIndices = this.convertedTrackIndex();
      const tracksToProcess =
        this.trackIndex === null
          ? this.midi.tracks
          : this.midi.tracks.filter((_, i) => trackIndices.includes(i));

      tracksToProcess.forEach(track => {
        track.notes.forEach(note => {
          const heighlightDelay = (note.time - seekPosition) * 1000;
          const resetDelay = (note.time + note.duration - seekPosition) * 1000;  
          if (heighlightDelay >= 0) {
            const t1 = setTimeout(
              () => this.highlightKey(note.midi),
              heighlightDelay
            );
            this.scheduledTimeouts.push(t1);
          }
          if (resetDelay >= 0) {
            const t2 = setTimeout(
              () => this.resetKey(note.midi),
              resetDelay
            );
            this.scheduledTimeouts.push(t2);
          }
        });
      });
    }

    clearScheduledTimeouts() {
      this.scheduledTimeouts.forEach(clearTimeout);
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
      console.log(tracktable);
      for (let i = 0; i < trackIndex.length; i++) {
        converted.push(tracktable[trackIndex[i]]);
      }
      console.log(`${this.trackIndex} ⇒ convertedTrackIndex: ${converted}`);
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
        segment: null,
        loop: false,
        ...controls,
      }
      this.playBtn = document.getElementById(this.options.playBtn);
      this.pauseBtn = document.getElementById(this.options.pauseBtn);
      this.stopBtn = document.getElementById(this.options.stopBtn);
      this.seekBar = document.getElementById(this.options.seekBar);
      this.timeDisplay = document.getElementById(this.options.timeDisplay);
      this.midi = null;
      this.howl = null;
      this.seekTimer = null;
      this.isDragging = false;
      this.midiPlayer = null;
      this.isPlaying = false;
      this.init();
    }

    init() {
      this.sound = new Howl({
          src: [this.options.mp3File],
          html5: false,
          onload: () => { 
            this.seekBar.max = this.sound.duration(); 
            this.updateTimeDisplay();
          },
          onplay: () => {
            this.seekTimer = setInterval(() => {
              if (!this.isDragging) this.seekBar.value = this.sound.seek();
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
          onend: () => { 
            clearInterval(this.seekTimer);  
            this.seekBar.value = 0;
            this.updateTimeDisplay();
          }
      });
      
      if (this.playBtn) this.playBtn.addEventListener('click', () => this.play());
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

      this.midiPlayer = new MidiPlayer(this.options.svgPiano, this.options.midiFile, this.options.trackIndex);      
    }

    update(newOptions){
      this.options = {
        ...this.options,
        ...newOptions,
      }
      if (Object.keys(newOptions).includes('mp3File') ||
          Object.keys(newOptions).includes('midiFile')) 
      {
        this.init();
      }
    }
      
    play() {
      if (this.isPlaying) {
        this.stop();
        setTimeout(() => {
          this.sound.seek(0);
          this.play();
        },1000);
        return
      }
      this.stopOtherAudio();
      this.scheduleMidHighlight(this.seekBar.value);
      this.sound.seek(this.seekBar.value); //pauseしている場合はpause位置からスタート
      this.sound.play();
      this.isPlaying = true;
      // ループ再生（鍵盤ハイライトもループ）
      if (this.options.loop) {
        this.sound.on('end', () => {
          setTimeout(() => {
            this.seekBar.value = 0;
            this.sound.seek(0);
            this.play();
          }, 1500);
        });
      }
    }

    // 指定された時間区間を再生
    playSegment(start, end) {
      if (this.isPlaying) {
        this.stop();
        setTimeout(() => {
          this.sound.seek(0);
          this.playSegment();
        },1000);
        return
      }
      this.stopOtherAudio();
      console.log(`this.options.segment => ${this.options.segment}`);
      const [options_start, options_end] = this.options.segment.split(",");
      if (start === undefined && end === undefined && this.options.segment) {
        console.log("rout1 @playSegment");
        [start, end] = [ Number(options_start), Number(options_end) ];
        if (start < this.seekBar.value && this.seekBar.value < end) start = this.seekBar.value; //pauseからの再開の場合
      
      } else if (start !== undefined && end === undefined && this.options.segment) {
        console.log("rout2 @playSegment");
        [start, end] = [ Number(start), Number(options_end)] ;
      
      } else if (start !== undefined && end !== undefined) {
        console.log("rout3 @playSegment");
        [start, end] = [ Number(start), Number(end)] ;
      }
      console.log(`start, end => ${start},${end}`);

      // 再生開始位置をstart秒に設定
      this.sound.seek(start);
      
      // 再生開始
      this.scheduleMidHighlight(start);
      console.log("ハイライトスケジュール完了");
      this.sound.play();
      console.log("再生開始");
      this.isPlaying = true;
      
      // end秒で再生を停止
      const duration = (end - start) * 1000; // ミリ秒に変換
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
      this.sound.pause();
      this.clearScheduledTimeouts();
      this.isPlaying = false;
    }
    
    stop() {
      this.sound.stop();
      this.isPlaying = false;
      this.clearScheduledTimeouts();
      this.resetAllKeys();
      if (this.loopTimer) {
        clearTimeout(this.loopTimer);
      }
    }
      
    seek() {
      this.isDragging = true;
      this.sound.seek(this.seekBar.value);
      this.clearScheduledTimeouts();
      this.resetAllKeys();
      this.isPlaying = false;
      this.updateTimeDisplay();
    }
    
    endSeek() {
      this.seekBar.value = this.sound.seek();
      this.isDragging = false;
      this.scheduleMidHighlight(this.seekBar.value);
      this.updateTimeDisplay();
    }
    
    scheduleMidHighlight(currentTime) {
      this.midiPlayer.scheduleMidHeighlight(currentTime);
    }
    
    clearScheduledTimeouts() {
      this.midiPlayer.clearScheduledTimeouts();
    }

    resetAllKeys() {
      this.midiPlayer.resetAllKeys();
    }

    stopOtherAudio() {
      if (window.audioControls && window.audioControls.length > 1) {
        window.audioControls.forEach(audioControl => {
          if (audioControl.isPlaying) {
            audioControl.stop();
          }
        });
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
      if (!this.timeDisplay) return;
      
      const currentTime = this.sound ? this.sound.seek() : 0;
      const duration = this.sound ? this.sound.duration() : 0;
      
      const currentFormatted = this.formatTime(currentTime);
      const durationFormatted = this.formatTime(duration);
      
      this.timeDisplay.textContent = `${currentFormatted} / ${durationFormatted}`;
    }
  }


