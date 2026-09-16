class Chatbot {
  constructor() {
    this.messages = [];
    this.isOpen = false;
    this.isMinimized = false;
    this.apiUrl = '/api/chat'; // Backend proxy endpoint
  }

  init() {
    // Toggle chatbot panel
    document.getElementById('chatbot-toggle')?.addEventListener('click', () => this.toggle());
    document.getElementById('chatbot-close')?.addEventListener('click', () => this.close());
    document.getElementById('chatbot-minimize')?.addEventListener('click', () => this.minimize());
    document.getElementById('chatbot-clear')?.addEventListener('click', () => this.clearChat());

    // Send message
    document.getElementById('chatbot-send')?.addEventListener('click', () => this.sendMessage());
    document.getElementById('chatbot-input-field')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick question buttons
    document.querySelectorAll('.quick-q-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        document.getElementById('chatbot-input-field').value = question;
        this.sendMessage();
      });
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const panel = document.getElementById('chatbot-panel');
    if (panel) {
      panel.style.display = 'flex';
      this.isOpen = true;
      this.isMinimized = false;
      document.getElementById('chatbot-input-field')?.focus();
    }
  }

  close() {
    const panel = document.getElementById('chatbot-panel');
    if (panel) {
      panel.style.display = 'none';
      this.isOpen = false;
    }
  }

  minimize() {
    const body = document.getElementById('chatbot-messages');
    const quick = document.querySelector('.chatbot-quick-questions');
    const input = document.querySelector('.chatbot-input');
    if (body && quick && input) {
      if (this.isMinimized) {
        body.style.display = 'block';
        quick.style.display = 'flex';
        input.style.display = 'flex';
        this.isMinimized = false;
      } else {
        body.style.display = 'none';
        quick.style.display = 'none';
        input.style.display = 'none';
        this.isMinimized = true;
      }
    }
  }

  getSimulationContext() {
    // Build context from current simulation state
    const app = window.app;
    if (!app || !app.simulator || app.currentSteps.length === 0) {
      return 'No simulation is currently active.';
    }

    const protocol = document.getElementById('protocol-select')?.value || 'unknown';
    const protocolNames = {
      'basic-2pl': 'Basic Two-Phase Locking',
      'strict-2pl': 'Strict Two-Phase Locking',
      'rigorous-2pl': 'Rigorous Two-Phase Locking'
    };

    const lastStep = app.currentSteps[app.currentSteps.length - 1];
    const txInput = document.getElementById('transaction-editor')?.value || '';

    let context = `Current Protocol: ${protocolNames[protocol] || protocol}\n`;
    context += `Current Step: ${app.currentSteps.length} of ${app.simulator.getTotalSteps()}\n`;
    context += `Transactions:\n${txInput}\n\n`;

    // Lock Table
    if (lastStep.lockTable && Object.keys(lastStep.lockTable).length > 0) {
      context += 'Current Lock Table:\n';
      for (const [item, entry] of Object.entries(lastStep.lockTable)) {
        const holders = entry.holders.map(h => `${h.txId}(${h.lockType})`).join(', ') || 'None';
        const queue = entry.queue.map(q => `${q.txId}(${q.lockType})`).join(', ') || 'None';
        context += `  ${item}: Holders=[${holders}], Waiting=[${queue}]\n`;
      }
    }

    // Wait-For Graph
    if (lastStep.waitForGraph && Object.keys(lastStep.waitForGraph).length > 0) {
      context += '\nWait-For Graph:\n';
      for (const [from, tos] of Object.entries(lastStep.waitForGraph)) {
        tos.forEach(to => { context += `  ${from} → ${to}\n`; });
      }
    }

    // Transaction States
    if (lastStep.transactionStates) {
      context += '\nTransaction States:\n';
      for (const [txId, state] of Object.entries(lastStep.transactionStates)) {
        context += `  ${txId}: ${state}\n`;
      }
    }

    // Deadlock
    if (lastStep.isDeadlocked) {
      context += `\nDEADLOCK DETECTED!\nDeadlocked Transactions: ${lastStep.deadlockedTxns.join(', ')}\n`;
    }

    // Last step explanation
    context += `\nLast Step: ${lastStep.explanation || ''}\n`;

    return context;
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input-field');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message
    this.addMessage('user', text);

    // Show typing indicator
    this.showTyping();

    try {
      const context = this.getSimulationContext();
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: context, history: this.messages.slice(-10) })
      });

      this.hideTyping();

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      this.addMessage('bot', data.reply || 'I could not generate a response.');
    } catch (error) {
      this.hideTyping();
      console.error('Chatbot error:', error);
      
      // Fallback: Use built-in responses
      const fallbackReply = this.getFallbackResponse(text);
      this.addMessage('bot', fallbackReply);
    }
  }

  getFallbackResponse(question) {
    // Built-in rule-based responses for when the backend is unavailable
    const q = question.toLowerCase();
    
    // Context-aware responses
    const app = window.app;
    const hasSimulation = app && app.simulator && app.currentSteps && app.currentSteps.length > 0;
    
    if (hasSimulation) {
      const lastStep = app.currentSteps[app.currentSteps.length - 1];
      
      if (q.includes('explain this step') || q.includes('current step')) {
        return lastStep.explanation || 'No step explanation available.';
      }
      
      if (q.includes('waiting') || q.includes('why is') && q.includes('wait')) {
        // Find waiting transactions
        const waitingTxns = Object.entries(lastStep.transactionStates || {}).filter(([, s]) => s === 'waiting');
        if (waitingTxns.length === 0) return 'No transactions are currently waiting.';
        
        let response = 'Currently waiting transactions:\n\n';
        for (const [txId] of waitingTxns) {
          // Find what they're waiting for
          const waitFor = (lastStep.waitForGraph || {})[txId] || [];
          response += `• **${txId}** is waiting for ${waitFor.join(', ')} to release locks.\n`;
          
          // Find which item
          for (const [item, entry] of Object.entries(lastStep.lockTable || {})) {
            const inQueue = entry.queue.find(q => q.txId === txId);
            if (inQueue) {
              const holders = entry.holders.map(h => `${h.txId}(${h.lockType})`).join(', ');
              response += `  → ${txId} needs a ${inQueue.lockType}-Lock on **${item}**, but it's held by: ${holders}\n`;
            }
          }
        }
        return response;
      }
      
      if (q.includes('deadlock')) {
        if (lastStep.isDeadlocked) {
          let response = `🔴 **Deadlock detected!**\n\nTransactions involved: ${lastStep.deadlockedTxns.join(', ')}\n\n`;
          response += 'Wait-For Graph (cycle):\n';
          for (const [from, tos] of Object.entries(lastStep.waitForGraph || {})) {
            tos.forEach(to => { response += `• ${from} → ${to}\n`; });
          }
          response += '\nA deadlock occurs because there is a circular dependency — each transaction is waiting for another transaction that is also waiting, forming a cycle.';
          return response;
        } else {
          return 'No deadlock has been detected in the current simulation.';
        }
      }
      
      if (q.includes('lock denied') || q.includes('why was') && q.includes('denied')) {
        const deniedSteps = app.currentSteps.filter(s => s.result === 'waiting');
        if (deniedSteps.length === 0) return 'No locks have been denied in this simulation.';
        const last = deniedSteps[deniedSteps.length - 1];
        return `The most recent lock denial:\n\n${last.explanation}\n\nThis happened because the requested lock was incompatible with existing locks held on the data item. Remember:\n• S + S = Compatible\n• S + X = Conflict\n• X + S = Conflict\n• X + X = Conflict`;
      }
      
      if (q.includes('wait-for graph') || q.includes('wait for graph')) {
        if (Object.keys(lastStep.waitForGraph || {}).length === 0) {
          return 'The Wait-For Graph is currently empty — no transactions are waiting for others.';
        }
        let response = '**Current Wait-For Graph:**\n\n';
        for (const [from, tos] of Object.entries(lastStep.waitForGraph || {})) {
          tos.forEach(to => { response += `• ${from} → ${to} (${from} waits for ${to})\n`; });
        }
        if (lastStep.isDeadlocked) {
          response += '\n⚠️ **A cycle exists in this graph, indicating a deadlock!**';
        } else {
          response += '\nNo cycles detected — no deadlock.';
        }
        return response;
      }
    }
    
    // General knowledge responses
    if (q.includes('shared lock') || q.includes('s-lock') || q.includes('s lock')) {
      return '🔓 **Shared Lock (S-Lock)**\n\nA Shared Lock is acquired when a transaction wants to **read** a data item. Multiple transactions can hold Shared Locks on the same item simultaneously because reading doesn\'t modify data.\n\n**Key point:** S-Lock + S-Lock = Compatible ✅';
    }
    
    if (q.includes('exclusive lock') || q.includes('x-lock') || q.includes('x lock')) {
      return '🔐 **Exclusive Lock (X-Lock)**\n\nAn Exclusive Lock is acquired when a transaction wants to **write** a data item. Only one transaction can hold an X-Lock at a time, and no other locks (S or X) can coexist.\n\n**Key point:** X-Lock conflicts with ALL other locks ❌';
    }
    
    if (q.includes('2pl') || q.includes('two phase') || q.includes('two-phase') || q.includes('locking protocol')) {
      return '📋 **Two-Phase Locking (2PL)**\n\nEvery transaction goes through two phases:\n\n**1. Growing Phase** 📈\nThe transaction acquires locks but cannot release any.\n\n**2. Shrinking Phase** 📉\nThe transaction releases locks but cannot acquire new ones.\n\n**Variants:**\n• **Basic 2PL** — Can release locks before commit\n• **Strict 2PL** — X-locks held until commit\n• **Rigorous 2PL** — ALL locks held until commit';
    }
    
    if (q.includes('compatibility') || q.includes('compatible')) {
      return '📊 **Lock Compatibility Matrix:**\n\n| Existing \\ Request | S-Lock | X-Lock |\n|---|---|---|\n| **S-Lock** | ✅ Compatible | ❌ Conflict |\n| **X-Lock** | ❌ Conflict | ❌ Conflict |\n\nOnly Shared + Shared is compatible. Any combination involving an Exclusive Lock creates a conflict.';
    }
    
    if (q.includes('what is') && q.includes('transaction')) {
      return '📋 **Transaction**\n\nA transaction is a sequence of database operations treated as a single logical unit.\n\nOperations:\n• **R(A)** — Read data item A\n• **W(A)** — Write data item A\n• **C** — Commit (make changes permanent)\n\nExample: `T1: R(A), W(B), C`';
    }
    
    if (q.includes('starvation')) {
      return '⏰ **Starvation** occurs when a transaction waits indefinitely because other transactions keep getting priority. This can happen in locking protocols when new transactions continuously acquire locks that conflict with a waiting transaction.';
    }
    
    // Default fallback
    return '⚠️ **AI Tutor is currently in offline mode** (no backend connection).\n\nI can still answer basic questions about:\n• Shared & Exclusive Locks\n• Lock Compatibility\n• Two-Phase Locking (2PL)\n• Deadlocks\n• Wait-For Graphs\n• Transactions\n\nTry asking one of the quick questions above, or run a simulation and ask about specific steps!\n\n💡 *To enable full AI capabilities, start the backend server with `node server.js`*';
  }

  addMessage(role, text) {
    this.messages.push({ role, content: text });
    
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    // Simple markdown-like formatting
    bubble.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    div.appendChild(avatar);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  showTyping() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'chat-message bot-message';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="chat-avatar"><i class="fas fa-robot"></i></div>
      <div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  clearChat() {
    this.messages = [];
    const container = document.getElementById('chatbot-messages');
    if (container) {
      container.innerHTML = `
        <div class="chat-message bot-message">
          <div class="chat-avatar"><i class="fas fa-robot"></i></div>
          <div class="chat-bubble">👋 Chat cleared! Ask me anything about database locking.</div>
        </div>
      `;
    }
  }
}

window.Chatbot = Chatbot;
