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
      key: "C",
      isMajor: true,
      justIntnation: false,
      ...options //引数で渡された値でデフォルト値を上書き
    }
    this.white_keys = [];
    this.black_keys = [];
    this.svg = null;
    this.otherKeys = null;
    this.playNoteOption = {};

    // 和音機能用プロパティ
    this.highlightedKeys = new Set(); // ハイライトされた鍵盤のMIDI番号を格納

    this.init();
  }

  init() {
    this.setKey();
    this.getKeyNumberArray();
    this.createSvg();
    this.createWhiteKeys();
    this.createBlackKeys();
    this.createKeyLabel();
    this.createKeyTitle();
    this.createChordControl();
    this.setupContainer();
    this.addPianoInteractions();
    this.addPianoClickEvents();
    this.setupEventListeners();
  }

  setKey(index=0) {
    const keys = this.options.key;
    if (Array.isArray(keys)) {
      this.options.key = keys[index];
      this.otherKeys = keys.filter((_,i) => i !== index);
    } else {
      this.options.key = keys;
      this.otherKeys = null;
    }
    this.playNoteOption = {
      volume: this.options.volume,
      duration: 2,
      oscType: "triangle",
      tuning: 440,
      key: this.options.key,
      justIntnation: this.options.justIntnation,
    } 
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
      const midiNum = this.white_keys[key - 1];
      console.log(`white, midiNum:${midiNum}`);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const x = ( key - 1 ) * this.options.white_key_width;
      console.log(`white, midiNum:${midiNum}, x:${x}`);
      rect.setAttribute('id', `piano-key-${midiNum}`);
      rect.setAttribute('x', x);
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
      const midiNum = this.black_keys[key - 1];
      console.log(`black, midiNum:${midiNum}`);
      let x;
      if (midiNum == this.options.min_key_number) {
        x = 0;
      } else {
        const targetElement = this.svg.querySelector(`#piano-key-${midiNum-1}`);
        if (targetElement) {
          const base_key_elm = this.svg.querySelector(`#piano-key-${midiNum-1}`);
          const base_key_x = parseFloat(base_key_elm.getAttribute('x'));
          const white_key_width = this.options.white_key_width;
          const black_key_width = this.options.black_key_width;
          x = base_key_x + (white_key_width - black_key_width / 2) ;
        }
      }
      console.log(`black, midiNum:${midiNum}, x:${x}`);
      let key_width = this.options.black_key_width;
      if (midiNum == this.options.min_key_number || 
          midiNum == this.options.max_key_number) 
      {
        key_width = key_width / 2;
      }
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', `piano-key-${midiNum}`);
      rect.setAttribute('x', x);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', key_width);
      rect.setAttribute('height', this.options.black_key_height);
      rect.setAttribute('style', 'fill:black;stroke:black;cursor:pointer;');
      frag.appendChild(rect);
    }
    this.svg.appendChild(frag);
  }
  
  createKeyLabel() {
    const svg = document.getElementById('piano-svg');
    const keyArrays = [this.white_keys, this.black_keys];
    for ( let i = 0; i < 2; i++) {
      keyArrays[i].forEach(midiNum => {
        const tonicMidi = getTonicMidi(this.options.key);
        console.log(`tonicMidi:${tonicMidi}`);
        const octave=[0,2,4,5,7,9,11];
        const diff = ((midiNum - tonicMidi) % 12 + 12 ) % 12
        if (octave.includes(diff)) {
          let label = octave.indexOf(diff) + 1;
          if (label==1) {
            label = getTonicKey(this.options.key);
          }
          console.log(`midiNum:${midiNum}, label:${label}`);
          const parentKey = document.getElementById(`piano-key-${midiNum}`);
          const x = parseFloat(parentKey.getAttribute('x')) + parseFloat(parentKey.getAttribute('width')) / 2;
          console.log(`midiNum:${midiNum}, x:${x} @createKeyLabel()`);
          const y = parentKey.getAttribute('height') - 5 ;
          const style = (i == 0)
                   ? 'color:black;font-size:12px;font-family:sans-serif;font-weight:bold;text-anchor:middle;fill:black;stroke:white;stroke-width:0.5;'
                   : 'color:white;font-size:12px;font-family:sans-serif;font-weight:bold;text-anchor:middle;fill:white;stroke:black;stroke-width:0.5;';
          const tonicLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          tonicLabel.textContent = label;
          tonicLabel.setAttribute('id', `label-${midiNum}`);
          tonicLabel.setAttribute('x', x);
          tonicLabel.setAttribute('y', y);
          tonicLabel.setAttribute('style', style);
          tonicLabel.setAttribute('pointer-events', 'none');
          svg.appendChild(tonicLabel);
        }
      });
    }
  }

  removeKeyLabel() {
    const svg = document.getElementById('piano-svg');
    const keyLabels = svg.querySelectorAll('text[id^="label-"]'); // idがlabel-から始まる要素を取得
    keyLabels.forEach(label => {
      label.remove();
    });
  }

  // 調タイトル
  createKeyTitle(){
    const keyName = (key) => {
      if (key == undefined) {
        key = this.options.key;
      }
      const JapaneseKeyName = { C : "ハ", D : "ニ", E : "ホ", F : "ヘ", G : "ト", A : "イ", B : "ロ"};
      let tonicKey = getTonicKey(key);
      let prefix = tonicKey[1] ? ( tonicKey[1] == "b" ? "変" : "嬰" ) : "";    
      return prefix + JapaneseKeyName[tonicKey[0]] + (this.options.isMajor ? "長調" : "短調");
    }
    const keyTitle = document.createElement('div');
    keyTitle.setAttribute('style', 'font-size:18px;margin:0 10px 5px 0;vertical-align:baseline;');
    this.container.insertBefore(keyTitle, this.svg);

    const textSpan = document.createElement('span');
    textSpan.textContent = `${keyName()} ${this.options.justIntnation ? "純正律鍵盤 " : "平均律鍵盤 "}`;
    keyTitle.appendChild(textSpan);

    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '平均律にチェンジ';
    toggleButton.setAttribute('style', 'height:1.6em;');
    keyTitle.appendChild(toggleButton);

    if (this.otherKeys) {
      const modulationContainer = document.createElement('div');
      modulationContainer.setAttribute('style', 'display:inline-flex;gap:5px;');
      const textSpan2 = document.createElement('span');
      textSpan2.textContent = '転調する他の調:';
      textSpan2.setAttribute('style', 'margin-left:1em;font-size:14px;');
      modulationContainer.appendChild(textSpan2);

      this.otherKeys.forEach(key => {
        const otherKeyButton = document.createElement('button');
        otherKeyButton.innerHTML = `${keyName(key)}（${key}）`;
        otherKeyButton.setAttribute('name', key);
        otherKeyButton.setAttribute('style', 'height:1.6em;width:auto;');
        modulationContainer.appendChild(otherKeyButton);
        
        otherKeyButton.addEventListener('click', () => {
          const txt = textSpan.textContent;
          const titleKey = this.options.key;
          const thisKey = otherKeyButton.getAttribute('name');
          console.log(`titleKey:${titleKey}, thisKey:${thisKey} @createKeyTitle()`);
          textSpan.textContent = txt.replace(keyName(titleKey), keyName(thisKey));
          otherKeyButton.innerHTML = `${keyName(titleKey)}（${titleKey}）`;
          otherKeyButton.setAttribute('name', titleKey);

          const keys = [this.options.key].concat(this.otherKeys);
          this.options.key = keys; // this.options.key を初期化
          const index = keys.indexOf(thisKey);
          this.setKey(index);

          this.removeKeyLabel();
          this.createKeyLabel();
        });
      });
      keyTitle.appendChild(modulationContainer);
    }

    toggleButton.addEventListener('click', () => {
      if (toggleButton.innerHTML === '平均律にチェンジ'){
        this.playNoteOption.justIntnation = false;
        toggleButton.innerHTML = '純正律にチェンジ';
        textSpan.textContent = textSpan.textContent.replace('純正律鍵盤', '平均律鍵盤');
      } else {
        this.playNoteOption.justIntnation = true;
        toggleButton.innerHTML = '平均律にチェンジ';
        textSpan.textContent = textSpan.textContent.replace('平均律鍵盤', '純正律鍵盤');
      }
    });
  }

  // 和音再生コントロール
  createChordControl() {
    const chordControl = document.createElement('div');
    chordControl.setAttribute('id', 'chord-control');
    chordControl.setAttribute('style', `display:flex;flex-direction:row;width:auto;justify-content:flex-end;gap:5px;`);
    this.container.appendChild(chordControl);

    const label = document.createElement('label');
    label.setAttribute('for', 'chord-mode');
    label.setAttribute('style', 'font-size:14px;text-align:right;');
    label.innerHTML = '和音モード';
    chordControl.appendChild(label);

    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', 'chord-mode');
    label.appendChild(input);
    input.addEventListener('change', () => {
      if (!input.checked) {
        this.clearHighlights();
      }
    });

    const playButton = document.createElement('button');
    playButton.innerHTML = 'play colored keys';
    chordControl.appendChild(playButton);
    playButton.addEventListener('click', () => {
      if (input.checked) {
        this.playChord();
      }
    });

    const stopButton = document.createElement('button');
    stopButton.innerHTML = 'stop';
    chordControl.appendChild(stopButton);
    stopButton.addEventListener('click', () => {
      this.stopChord();
    });
  }

  setupContainer() {
    this.container.setAttribute('style', `max-width:${this.options.white_key_width * this.white_keys.length}px;`);
    this.container.setAttribute('style', `display:flex;flex-direction:column;justify-content:flex-end;`);
  }
  // 白鍵と黒鍵のマウスオーバー効果を追加
  addPianoInteractions() {
    
    // 白鍵のマウスオーバー効果
    this.white_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            //console.log(key.id);
            key.addEventListener('mouseover', () => {
                if(this.chordMode()) return;
                key.style.fill = '#e0e0e0';
            });
            key.addEventListener('mouseleave', () => {
                if(this.chordMode()) return;
                key.style.fill = 'white';
            });
        }
    });
  
    // 黒鍵のマウスオーバー効果
    this.black_keys.forEach(midi => {
        const key = document.getElementById(`piano-key-${midi}`);
        if (key) {
            key.addEventListener('mouseover', () => {
                if(this.chordMode()) return;
                key.style.fill = '#222';
            });
            key.addEventListener('mouseleave', () => {
                if(this.chordMode()) return;
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
              if (this.chordMode()) {
                this.toggleKeyHighlight(midi);
              } else {
                key.style.fill = '#3b3b3b';
                stopNote(midi);
                playNote(midi, this.playNoteOption);
              }
            });
                        
            // タッチイベント
            key.addEventListener('touchstart', (e) => {
              e.preventDefault();
              if (this.chordMode()) {
                this.toggleKeyHighlight(midi);
              } else {
                key.style.fill = '#ccc';
                stopNote(midi);
                playNote(midi, this.playNoteOption);
              }
            });

            // マウスアップ
            key.addEventListener('mouseup', () => {
                if (this.chordMode()) return;
                key.style.fill = '#e0e0e0';
            });

            // タッチエンド
            key.addEventListener('touchend', () => {
              if (this.chordMode()) return;
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
                if (this.chordMode()) {
                  this.toggleKeyHighlight(midi);
                } else {
                  key.style.fill = '#3b3b3b';
                  stopNote(midi);
                  playNote(midi, this.playNoteOption);
                }
            });
            
            // タッチイベント
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.chordMode()) {
                  this.toggleKeyHighlight(midi);
                } else {
                  key.style.fill = '#ccc';
                  stopNote(midi);
                  playNote(midi, this.playNoteOption);
                }
            });
            
            // マウスアップ
            key.addEventListener('mouseup', () => {
                if (this.chordMode()) return;
                key.style.fill = '#222';
            });
            
            // タッチエンド
            key.addEventListener('touchend', () => {
                if (this.chordMode()) return;
                key.style.fill = 'black';
                key.style.stroke = 'black';
            });
        }
    });
  }

  // 和音モードを取得
  chordMode(){
     return document.getElementById('chord-mode').checked;
  }

  // キーのハイライトを切り替え
  toggleKeyHighlight(midi) {
    if (this.highlightedKeys.has(midi)) {
      this.highlightedKeys.delete(midi);
      this.updateKeyAppearance(midi, false);
    } else {
      this.highlightedKeys.add(midi);
      this.updateKeyAppearance(midi, true);
    }
  }
  
  // キーの見た目を更新
  updateKeyAppearance(midi, highlighted) {
    const key = document.getElementById(`piano-key-${midi}`);
    if (!key) return;
    
    if (highlighted) {
      // ハイライト色（例：ピンク）
      key.style.fill = '#FB92FC';
      key.style.stroke = 'black';
      key.style.strokeWidth = '1'
    } else {
      // 元の色に戻す
      if (this.white_keys.includes(midi)) {
        key.style.fill = 'white';
        key.style.stroke = 'black';
        key.style.strokeWidth = '1';
      } else {
        key.style.fill = 'black';
        key.style.stroke = 'black';
        key.style.strokeWidth = '1';
      }
    }
  }
  
  // 和音を再生
  playChord() {
    // 既存の音を停止
    this.stopChord();
    
    // ハイライトされたキーを同時に再生
    const highlightedKeysArray = Array.from(this.highlightedKeys);
    highlightedKeysArray.forEach((midi, index) => {
      setTimeout(() => {
        console.log(`${midi} @playChord`);
        const playNoteOption = {
          ...this.playNoteOption,
          ...{
              duration:20,
              volume:0.7
            }
        }
        playNote(midi, playNoteOption);
      }, index * 500);
    });
  }

  // 和音を止める
  stopChord() {
    this.highlightedKeys.forEach(midi => {
      stopNote(midi);
    });
  }

  // ハイライトをクリア
  clearHighlights() {
    this.highlightedKeys.forEach(midi => {
      this.updateKeyAppearance(midi, false);
    });
    this.highlightedKeys.clear();
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

function getTonicMidi(key = "C"){
  // 調名 ⇒ MIDI番号
  const tonicMidi = {
    Cb  :59,
    C   :60, 
    'C♯':61,
    Db  :61, 
    D   :62, 
    Eb  :63, 
    E   :64, 
    F   :65, 
    'F♯':66,
    Gb  :66, 
    G   :67, 
    Ab  :68, 
    A   :69, 
    Bb  :70, 
    B   :71 
  };
  const tonicKey = ['♭', '♯'].includes(key[0]) ? getTonicKey(key) : key;
  return tonicMidi[tonicKey];
}

function getTonicKey(signeture){
  // 調号表記（例: "♭3"）⇒ 調名（例: "Eb"）
  const signetureToKey = {
    '♭1' : 'F',
    '♭2' : 'Bb',
    '♭3' : 'Eb',
    '♭4' : 'Ab',
    '♭5' : 'Db',
    '♭6' : 'Gb',
    '♭7' : 'Cb',
    '♯1' : 'G',
    '♯2' : 'D',
    '♯3' : 'A',
    '♯4' : 'E',
    '♯5' : 'B',
    '♯6' : 'F♯',
    '♯7' : 'C♯',
  };
  console.log(`signeture:${signeture}`);
  if (signeture == "C" ||Object.values(signetureToKey).includes(signeture)) {
    console.log(`return:${signeture}`);
    return signeture;
  } else {
    console.log(`return:${signetureToKey[signeture]}`);
    return signetureToKey[signeture];
  }
}

// SVGのピアノ鍵盤で音を出す関数
function playNote(midi, {volume = 0.25, duration = 2, oscType = "triangle", tuning = 440, key = "C", justIntnation = false}) {
  // 同じ番号の既存の音を止める
  stopNote(midi);

  // volumeを対数スケールにする
  volume = Math.pow(10, (-40 + 40 * volume) / 20);

  // 基本設定
  let freq;
  if (justIntnation) {
    const baseFreq= tuning * Math.pow(2, (getTonicMidi(key) - 69) / 12);
    //console.warn(`baseFreq:${baseFreq}`);
    const justRatios = {
      0:  1.0,
      2:  9/8,
      4:  5/4,
      5:  4/3,
      7:  3/2,
      9:  5/3,
      11:  15/8
    };
    const difference = midi - getTonicMidi(key);
    const octave = Math.floor(difference / 12);
    const semitone = (difference + 12) % 12;
    const justRatio = justRatios[semitone] || Math.pow(2, semitone / 12); // 非ダイアトニックは平均律補完
    freq = baseFreq * justRatio * Math.pow(2, octave);
    console.warn(`midi:${midi}, 純正律周波数:${freq}`);
  } else {
    freq = tuning * Math.pow(2, (midi - 69) / 12);
    console.warn(`midi:${midi}, 平均律周波数:${freq}`);
  }
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

// MIDIファイルのキャッシュ（同一ファイルの重複読み込みを防ぐ）
const midiCache = new Map();

class MidiPlayer {
    constructor(svgPiano, midiFile, OFFSET = 0, midiSegment = null, trackIndex = null){
      this.piano = svgPiano;
      this.midiFile = midiFile;
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
      // キャッシュに存在する場合は再利用
      if (midiCache.has(midiFile)) {
        console.log(`MIDIファイルをキャッシュから読み込み: ${midiFile}`);
        const cached = midiCache.get(midiFile);
        this.midi = cached.midi;
        this.baseBpm = cached.baseBpm;
        this.isLoaded = true;
        return;
      }

      // 新規読み込み
      console.log(`MIDIファイルを新規読み込み: ${midiFile}`);
      const midiResponse = await fetch(midiFile);
      const midiArrayBuffer = await midiResponse.arrayBuffer();
      this.midi = new Midi(midiArrayBuffer);
      console.log(this.midi.tracks.length);
      console.dir(this.midi.tracks);
      const bpm = this.midi.header.tempos[0]?.bpm || 120;
      this.baseBpm = Math.round(bpm);
      this.isLoaded = true;

      // キャッシュに保存
      midiCache.set(midiFile, {
        midi: this.midi,
        baseBpm: this.baseBpm
      });
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
      return Promise.resolve();
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
      this.howler_html5 = false;
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
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;
      const iosVersion = isIOS ? this.getIOSVersion() : null;
      console.warn(`iosVersion:${iosVersion}`);
      const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);
  
      // モバイル優先 → HTML5 Audio
      const useHtml5 = (isMobile && (iosVersion == null || iosVersion < 16.0)) || !hasWebAudio;
      if (useHtml5) {
        this.howler_html5 = true;
      } else {
        this.howler_html5 = false;
      }
      // Safariデスクトップ版はHTML5 Audioを使用
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari && !isIOS) this.howler_html5 = true;

      console.warn(`useHtml5:${useHtml5}`);
      if (this.options.mp3File) {
        this.setupMp3();
      }
      if (this.playBtn) this.playBtn.addEventListener('click', () => {
        unlockAudio();
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

      // ✅ iOS Safari 対応：最初のタップでAudioContextを再開
      if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
        document.addEventListener(
          'touchstart',
          () => {
            Howler.ctx.resume().then(() => {
              console.log('🔊 Howler AudioContext resumed');
            });
          },
          { once: true } // ← 1回だけでOK
        );
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
        const m4aFile = this.options.mp3File.replace('.mp3','.m4a');
        preloadedSet.sound = new Howl({
          src: [m4aFile,fileSet.mp3File],
          html5: this.howler_html5,
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

    // MP3ファイルとm4aファイルをセットアップ(m4aファイルを優先)
    async setupMp3() {
      console.warn("setup mp3/m4a開始");
      const m4aFile = this.options.mp3File.replace('.mp3','.m4a');
      console.warn(`mp3File, m4aFile: ${this.options.mp3File}, ${m4aFile}`);
      this.sound = new Howl({
        src: [m4aFile,this.options.mp3File],
        html5: this.howler_html5,
        preload: true,
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
    async play() {
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
      
      await this.scheduleMidHighlight(this.seekBar.value);
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
    
    async playSegment(start, end) {
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
      await this.scheduleMidHighlight(start / this.rate);
      
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
    
    async scheduleMidHighlight(currentTime) {
      //currentTimeは秒単位の再生位置(tempo変更時は換算後の体感時間の秒)
      if (this.currentMidiPlayer) {
        await this.currentMidiPlayer.scheduleMidHighlight(currentTime);
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
    // iOSのバージョンを取得
    getIOSVersion() {
      const ua = navigator.userAgent;
      const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);  // iOS X_Y_Z形式
      if (!match) return null;
      return parseFloat(match[1] + '.' + match[2]);  // X.Y形式（例: 15.8 → 15.8）
    }
  }

  // iPhoneの古い機種用（ロックが解除されていないと再生ボタンで音が出ないため）
  let unlocked = false;
  function unlockAudio() {
    // 一度だけロック解除を試みる
    if (!unlocked && Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        unlocked = true;
        console.log('🔓 AudioContext unlocked!');
      });
    }
  }
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('click', unlockAudio, { once: true });
