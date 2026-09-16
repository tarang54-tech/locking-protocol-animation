/**
 * speech.js — Text-to-Speech Engine for Step Explanations
 * Uses the built-in Web Speech API (window.speechSynthesis)
 */
class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isSpeaking = false;
    this.isEnabled = true;
    this.rate = 1;
    this.voice = null;
    this._initVoice();
  }

  _initVoice() {
    if (!this.synth) return;
    // Pick a good English voice once voices are loaded
    const pickVoice = () => {
      const voices = this.synth.getVoices();
      this.voice =
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en-US')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] || null;
    };
    pickVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice;
    }
  }

  /** Check if browser supports speech synthesis */
  isSupported() {
    return !!this.synth;
  }

  /** Speak a text string */
  speak(text) {
    if (!this.synth || !this.isEnabled || !text) return;
    this.stop(); // cancel any ongoing speech

    // Clean text: strip emojis and HTML-like artifacts
    const clean = text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = this.rate;
    utterance.pitch = 1;
    if (this.voice) utterance.voice = this.voice;

    utterance.onstart = () => { this.isSpeaking = true; this._updateButtons(); };
    utterance.onend   = () => { this.isSpeaking = false; this._updateButtons(); };
    utterance.onerror = () => { this.isSpeaking = false; this._updateButtons(); };

    this.synth.speak(utterance);
  }

  /** Speak a simulation step explanation */
  speakStep(step) {
    if (!step) return;
    let text = '';
    if (step.operation) text += `${step.operation}. `;
    if (step.lockRequested) text += `${step.lockRequested}. `;
    text += `Result: ${step.result || 'unknown'}. `;
    if (step.explanation) text += step.explanation;
    if (step.isDeadlocked) text += ` Deadlock detected involving transactions ${(step.deadlockedTxns || []).join(' and ')}.`;
    this.speak(text);
  }

  /** Speak all current step explanations sequentially */
  speakAllSteps(steps) {
    if (!this.synth || !steps || steps.length === 0) return;
    this.stop();
    const combined = steps.map((s, i) => {
      let t = `Step ${s.stepNumber || i + 1}: `;
      if (s.operation) t += `${s.operation}. `;
      t += `Result: ${s.result || 'unknown'}. `;
      if (s.explanation) t += s.explanation;
      return t;
    }).join('. \n');
    this.speak(combined);
  }

  /** Stop speech */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this._updateButtons();
    }
  }

  /** Toggle speech on/off */
  toggle() {
    if (this.isSpeaking) {
      this.stop();
    } else {
      // Speak the latest step if available
      const app = window.app;
      if (app && app.currentSteps && app.currentSteps.length > 0) {
        const lastStep = app.currentSteps[app.currentSteps.length - 1];
        const opStr = lastStep.operation
          ? `${lastStep.operation.txId}: ${lastStep.operation.type.toUpperCase()}${lastStep.operation.item ? '(' + lastStep.operation.item + ')' : ''}`
          : '';
        this.speakStep({
          operation: opStr,
          lockRequested: lastStep.lockRequested ? `Requesting ${lastStep.lockRequested}-lock` : '',
          result: lastStep.result,
          explanation: lastStep.explanation,
          isDeadlocked: lastStep.isDeadlocked,
          deadlockedTxns: lastStep.deadlockedTxns
        });
      }
    }
  }

  /** Update UI buttons to reflect speaking state */
  _updateButtons() {
    const btn = document.getElementById('btn-speech-toggle');
    if (btn) {
      btn.innerHTML = this.isSpeaking
        ? '<i class="fas fa-volume-xmark"></i> Stop Reading'
        : '<i class="fas fa-volume-high"></i> Read Aloud';
      btn.classList.toggle('btn-active-speech', this.isSpeaking);
    }
  }
}

window.SpeechEngine = SpeechEngine;
