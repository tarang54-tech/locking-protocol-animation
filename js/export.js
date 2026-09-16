class ExportManager {
  static toJSON(data, filename = 'locking-simulation.json') {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error("Error exporting to JSON:", e);
      alert("Failed to export JSON.");
    }
  }

  static toPDF(data, filename = 'locking-simulation-report.pdf') {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error("jsPDF is not loaded. Ensure the CDN script is included.");
      alert("PDF generation failed: jsPDF library not found.");
      return;
    }

    try {
      const doc = new window.jspdf.jsPDF();
      let y = 20;
      const margin = 14;
      const pageHeight = doc.internal.pageSize.height;
      const lineHeight = 7;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight >= pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
        }
      };

      const protocolNames = {
        'basic-2pl': 'Basic Two-Phase Locking',
        'strict-2pl': 'Strict Two-Phase Locking',
        'rigorous-2pl': 'Rigorous Two-Phase Locking'
      };

      const protocolName = protocolNames[data.protocol] || data.protocol || 'Unknown';
      const txIds = new Set(data.schedule ? data.schedule.map(op => op.txId) : []);
      const totalTxns = txIds.size;
      const totalOps = data.schedule ? data.schedule.length : 0;
      const finalStatus = data.isDeadlocked ? 'Deadlock Detected' : 'Completed Successfully';

      // 1. Title & Header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Locking Protocol Simulation Report', margin, y);
      y += 10;
      doc.setLineWidth(0.5);
      doc.line(margin, y, doc.internal.pageSize.width - margin, y);
      y += 10;

      // 2. Simulation Information
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Simulation Information', margin, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Date and Time: ${new Date().toLocaleString()}`, margin, y); y += lineHeight;
      doc.text(`Selected Protocol: ${protocolName}`, margin, y); y += lineHeight;
      doc.text(`Total Transactions: ${totalTxns}`, margin, y); y += lineHeight;
      doc.text(`Total Operations: ${totalOps}`, margin, y); y += lineHeight;
      doc.text(`Final Status: ${finalStatus}`, margin, y); y += lineHeight;
      y += 10;

      // 3. User Input
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('User Input', margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const userInput = document.getElementById('transaction-editor') ? document.getElementById('transaction-editor').value : '';
      if (userInput) {
        const splitInput = doc.splitTextToSize(userInput, doc.internal.pageSize.width - 2 * margin);
        checkPageBreak(splitInput.length * lineHeight);
        doc.text(splitInput, margin, y);
        y += splitInput.length * lineHeight;
      } else {
        doc.text('No user input found.', margin, y);
        y += lineHeight;
      }
      y += 10;

      // 4. Initial Schedule
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Initial Schedule', margin, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      if (data.schedule && data.schedule.length > 0) {
        data.schedule.forEach((op, index) => {
          checkPageBreak(lineHeight);
          let opStr = '';
          if (op.type === 'commit') opStr = 'COMMIT';
          else if (op.type === 'abort') opStr = 'ABORT';
          else if (op.type === 'read') opStr = `READ(${op.item})`;
          else if (op.type === 'write') opStr = `WRITE(${op.item})`;
          
          doc.text(`${index + 1}. ${op.txId} - ${opStr}`, margin, y);
          y += lineHeight;
        });
      } else {
        doc.text('No initial schedule.', margin, y);
        y += lineHeight;
      }
      y += 10;

      // 5. Processing Steps
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Processing Steps', margin, y);
      y += 10;
      
      if (data.steps && data.steps.length > 0) {
        data.steps.forEach(step => {
          checkPageBreak(60); // need space for step info + lock table
          
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`Step ${step.stepNumber}:`, margin, y);
          doc.setFont(undefined, 'normal');
          
          let opStr = '';
          if (step.operation) {
            if (step.operation.type === 'commit') opStr = 'COMMIT';
            else if (step.operation.type === 'abort') opStr = 'ABORT';
            else if (step.operation.type === 'read') opStr = `READ(${step.operation.item})`;
            else if (step.operation.type === 'write') opStr = `WRITE(${step.operation.item})`;
          }
          
          const stepInfo = [
            `Transaction ID: ${step.operation ? step.operation.txId : 'N/A'}`,
            `Operation: ${opStr}`,
            `Lock Requested: ${step.lockRequested || 'None'}`,
            `Result: ${step.result ? step.result.toUpperCase() : 'N/A'}`
          ];
          
          y += lineHeight;
          stepInfo.forEach(info => {
            doc.text(`  • ${info}`, margin, y);
            y += lineHeight;
          });
          
          const explSplit = doc.splitTextToSize(`Explanation: ${step.explanation || ''}`, doc.internal.pageSize.width - 2 * margin - 5);
          checkPageBreak(explSplit.length * lineHeight);
          doc.text(explSplit, margin + 5, y);
          y += explSplit.length * lineHeight + 5;

          // Lock Table After Step N
          doc.setFont(undefined, 'bold');
          doc.text(`Lock Table After Step ${step.stepNumber}:`, margin, y);
          doc.setFont(undefined, 'normal');
          y += lineHeight;
          
          if (step.lockTable && Object.keys(step.lockTable).length > 0) {
            Object.keys(step.lockTable).forEach(item => {
              checkPageBreak(lineHeight * 3);
              const entry = step.lockTable[item];
              const holdersText = entry.holders && entry.holders.length > 0
                ? entry.holders.map(h => `${h.txId}(${h.lockType})`).join(', ')
                : 'None';
              const queueText = entry.queue && entry.queue.length > 0
                ? entry.queue.map(q => `${q.txId}(${q.lockType})`).join(', ')
                : 'None';
                
              doc.text(`  - Item ${item}:`, margin, y); y += lineHeight;
              doc.text(`      Holders: ${holdersText}`, margin, y); y += lineHeight;
              doc.text(`      Waiting Queue: ${queueText}`, margin, y); y += lineHeight;
            });
          } else {
            doc.text(`  (Empty Lock Table)`, margin, y);
            y += lineHeight;
          }
          y += 5;

          // Wait-For Graph After Step N
          let hasWaiters = false;
          if (step.lockTable) {
            hasWaiters = Object.values(step.lockTable).some(entry => entry.queue && entry.queue.length > 0);
          }
          
          if (hasWaiters && step.waitForGraph) {
            checkPageBreak(25);
            doc.setFont(undefined, 'bold');
            doc.text(`Wait-For Graph After Step ${step.stepNumber}:`, margin, y);
            doc.setFont(undefined, 'normal');
            y += lineHeight;
            
            let hasEdges = false;
            Object.keys(step.waitForGraph).forEach(tx => {
              if (step.waitForGraph[tx] && step.waitForGraph[tx].length > 0) {
                hasEdges = true;
                step.waitForGraph[tx].forEach(waitingOn => {
                  doc.text(`  • ${tx} → ${waitingOn}`, margin, y);
                  y += lineHeight;
                });
              }
            });
            
            if (!hasEdges) {
              doc.text(`  (No edges)`, margin, y);
              y += lineHeight;
            }
            
            if (step.isDeadlocked) {
              doc.setTextColor(200, 0, 0); // Red
              doc.setFont(undefined, 'bold');
              doc.text(`  Cycle Detected (Deadlock involving ${step.deadlockedTxns ? step.deadlockedTxns.join(', ') : ''})`, margin, y);
              doc.setFont(undefined, 'normal');
              doc.setTextColor(0, 0, 0);
              y += lineHeight;
            }
            y += 5;
          }
          
          y += 10;
        });
      } else {
        doc.text('No execution steps recorded.', margin, y);
        y += lineHeight;
      }

      // 6. Final Simulation Summary
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Final Simulation Summary', margin, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      let locksGranted = 0;
      let waitingReqs = 0;
      if (data.steps) {
        data.steps.forEach(s => {
          if (s.result === 'granted') locksGranted++;
          if (s.result === 'waiting') waitingReqs++;
        });
      }
      
      doc.text(`Total Transactions: ${totalTxns}`, margin, y); y += lineHeight;
      doc.text(`Total Operations: ${totalOps}`, margin, y); y += lineHeight;
      doc.text(`Locks Granted: ${locksGranted}`, margin, y); y += lineHeight;
      doc.text(`Waiting Requests: ${waitingReqs}`, margin, y); y += lineHeight;
      
      if (data.isDeadlocked) {
        doc.setTextColor(200, 0, 0); // Red
        doc.setFont(undefined, 'bold');
        doc.text(`Deadlock Detected: Yes`, margin, y); y += lineHeight;
        doc.text(`Transactions Involved: ${data.deadlockedTxns ? data.deadlockedTxns.join(', ') : 'Unknown'}`, margin, y); y += lineHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
      } else {
        doc.text(`Deadlock Detected: No`, margin, y); y += lineHeight;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(`Final Status: ${finalStatus}`, margin, y);
      
      doc.save(filename);
    } catch (e) {
      console.error("Error exporting to PDF:", e);
      alert("Failed to export PDF.");
    }
  }
}
window.ExportManager = ExportManager;
