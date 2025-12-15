# SoniDash: Audio-Augmented Analytics Dashboard

## Project Overview
SoniDash is a research prototype that combines **visual analytics** with **sonification** (audio feedback) to support multimodal data exploration.  
Users interact with a web-based dashboard where clicking on chart elements triggers sounds mapped to underlying data values.

This project was developed as part of an HCI / data visualization assignment and includes data preprocessing, a web-based interface, and an evaluation plan.

---

## Repository Structure

SoniDash/ <br>
├── index.html # Web interface (UI layout + library imports) <br>
├── script.js # Core logic: data parsing, chart rendering, audio playback <br>
├── SoniDash.ipynb # Data preprocessing and KPI generation notebook <br>
├── luxury_cosmetics_popups.xlsx # Original dataset (Excel format) <br>
├── SoniDash_KPI.csv # Processed dataset used by the web app <br>
├── Final_Presentation.pptx # Final presentation slides <br>
├── Project_description.pdf # Research motivation and evaluation plan <br>
└── README.md # Project documentation <br>



---

## Code Components Explained

### 1. `SoniDash.ipynb` — Data Preprocessing
- Loads the original Excel dataset (`luxury_cosmetics_popups.xlsx`)
- Cleans and validates data
- Computes derived KPIs (e.g., units sold, sell-through percentage)
- Maps data values to audio parameters:
  - pitch
  - volume
  - instrument (timbre)
- Exports the processed dataset as `SoniDash_KPI.csv`

This notebook represents the **offline preprocessing stage**.

---

### 2. `index.html` — Web Interface
- Defines the structure of the dashboard
- Loads required libraries:
  - Chart.js (visualization)
  - PapaParse (CSV parsing)
  - Tone.js (audio synthesis)
- Provides a file upload interface for `SoniDash_KPI.csv`

---

### 3. `script.js` — Visualization & Sonification Logic
- Parses uploaded CSV data
- Aggregates and formats data for display
- Renders interactive bar charts
- Handles user interaction (click events)
- Triggers sound playback using Tone.js with parameters derived from the data

This file contains the **core application logic**.

---

## How to Run the Project

1. Run `SoniDash.ipynb` to generate `SoniDash_KPI.csv`  
   *(or use the provided CSV directly)*

2. Open `index.html` in a web browser (Chrome recommended)

3. Upload `SoniDash_KPI.csv` using the file picker

4. Click on bars in the chart to hear the corresponding audio feedback

---

## Research Focus

The project explores:
- Audio-augmented analytics
- Multimodal data interaction
- Accessibility and alternative data representations

Details of the research rationale, prototype design, and evaluation methodology are described in `Project_description.pdf`.

---
