# Locking Protocol Animation — DBMS Virtual Lab

## Project Overview
Project 51 | DBMS Module 5 | Difficulty: Medium

Interactive web application that teaches and demonstrates Locking Protocols through visualization, simulation, and step-by-step explanations.

## Features
- 3-panel dashboard (Input, Visualization, Explanation)
- Two-Phase Locking simulation (Basic, Strict, Rigorous)
- D3.js animated visualizations (Lock Table, Wait-For Graph, Timeline)
- Deadlock detection with cycle highlighting
- 6 pre-built examples
- Dark/Light mode
- Export to JSON and PDF
- Session history with localStorage
- Fully responsive design
- Keyboard accessible

## Technology Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+)
- Visualization: D3.js v7
- PDF Export: jsPDF
- Icons: Font Awesome 6
- Storage: localStorage

## Getting Started
1. Clone or download this project
2. Open `index.html` in a modern web browser
3. No build step or server required!

## Usage
1. Select a locking protocol (Basic/Strict/Rigorous 2PL)
2. Choose a pre-built example or write custom transactions
3. Click "Run All" for automatic execution or "Step" for step-by-step
4. View the animated Lock Table, Wait-For Graph, and Timeline
5. Read step-by-step explanations in the right panel
6. Export results as JSON or PDF

## Transaction Input Format
```
T1: R(A), W(B), C
T2: R(A), R(B), W(A), C
```
- R(X) = Read data item X
- W(X) = Write data item X  
- C = Commit
- A = Abort

## Sample Scenarios
1. Basic 2PL — No Conflict
2. Shared Lock Compatibility
3. Lock Conflict & Waiting
4. Lock Upgrade Conflict
5. Deadlock Detection
6. Rigorous 2PL Demo

## Background Theory
The application includes built-in theory covering:
- Shared (S) and Exclusive (X) locks
- Lock compatibility matrix
- Two-Phase Locking protocol and its variants
- Deadlock detection using wait-for graphs

## Screenshots
(Screenshots to be added after deployment)

## License
This project is created for educational purposes as part of the DBMS Virtual Lab.
