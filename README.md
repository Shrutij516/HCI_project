# SoniDash: Audio-Augmented Analytics

## Overview
SoniDash is a web application that visualizes luxury cosmetics data and allows users to "hear" the data by clicking on chart bars. This is **audio-augmented analytics** (sonification) - it doesn't replace visuals, but adds an auditory layer to help with pattern recognition, accessibility, and multimodal data exploration.

## What Each Sound Variable Means

### 1. **Pitch (Frequency in Hz)** → `units_sold`
- **What it represents**: The number of units sold for that specific event
- **How to interpret**:
  - **Low pitch (220 Hz)** = Few units sold (low sales volume)
  - **High pitch (880 Hz)** = Many units sold (high sales volume)
- **Range**: 220-880 Hz (calculated from normalized `units_sold` values)

### 2. **Volume (Loudness in dB)** → Rate of Change in `units_sold`
- **What it represents**: How much the `units_sold` changed compared to the previous event for that brand
- **How to interpret**:
  - **Quiet** = Small or no change (stable sales)
  - **Loud** = Large change (big increase or decrease in sales)
- **Range**: 0-1 (normalized), converted to decibels for audio

### 3. **Instrument (Timbre)** → Brand Identity
- **What it represents**: Each brand has a unique instrument sound
- **How to interpret**:
  - **Sine wave** = Smooth, pure tone (one brand)
  - **Triangle wave** = Slightly brighter (another brand)
  - **Square wave** = Harsh, buzzy (another brand)
  - **Sawtooth wave** = Bright, sharp (another brand)
- **Purpose**: Helps identify brands by ear when scanning through data

## Why This Project is Useful

### The Problem with Visual-Only Analytics
- Large datasets can be overwhelming visually
- Patterns in sequences are hard to spot
- Visually impaired users are excluded
- Quick scanning of many data points is difficult

### How Audio-Augmented Analytics Helps
1. **Pattern Recognition**: Our ears excel at detecting sequences and trends
2. **Accessibility**: Makes data accessible to visually impaired users
3. **Quick Scanning**: Listen to multiple data points rapidly
4. **Outlier Detection**: Unusual sounds (very high/low pitch, very loud/quiet) stand out immediately
5. **Multimodal Exploration**: Using both vision and hearing provides richer data understanding

### Who Benefits
- **Data Analysts**: Exploring large datasets, identifying patterns
- **Business Intelligence Teams**: Quick data scanning and trend detection
- **Accessibility Researchers**: Making analytics inclusive
- **HCI Researchers**: Studying multimodal interfaces
- **Anyone**: Who wants to explore data in a novel, engaging way

## How It Works

### 1. Data Flow
1. **Colab Preprocessing**: The Jupyter notebook (`SoniDash.ipynb`) processes the luxury cosmetics dataset:
   - Cleans and validates data
   - Calculates derived KPIs (total_visitors, revenue_est, conversion_est)
   - Maps KPIs to audio parameters (`pitch_hz`, `volume`, `instrument`)
   - Exports `SoniDash_KPI.csv` with only the columns needed for the web app

2. **Web App**: 
   - User uploads `SoniDash_KPI.csv`
   - PapaParse reads the CSV
   - Chart.js displays a bar chart of `sell_through_pct` by brand
   - Tone.js handles audio synthesis

### 2. Audio Mapping (Detailed)
- **Pitch**: `pitch_hz` column 
  - Calculated in Colab: `220 + (normalized_units_sold) * (880 - 220)`
  - Maps `units_sold` to frequency range 220-880 Hz
- **Volume**: `volume` column
  - Calculated from rate of change: `abs(units_sold - previous_units_sold)`
  - Normalized to 0-1 range
  - Converted to dB in JavaScript: `20 * log10(volume)`
- **Instrument**: `instrument` column
  - Assigned per brand using hash function
  - One of: sine, triangle, square, sawtooth

### 3. User Interaction
- Click any bar in the chart
- The app plays a sound with:
  - Frequency = `pitch_hz` from that row
  - Volume = `volume` from that row (converted to dB)
  - Timbre = `instrument` from that row

## File Structure
```
SoniDash/
├── index.html          # Main HTML file
├── script.js           # JavaScript logic
└── SoniDash_KPI.csv    # Data file (upload from Colab)
```

## Usage
1. Run the Colab notebook to generate `SoniDash_KPI.csv`
2. Download `SoniDash_KPI.csv` from Colab
3. Open `index.html` in a web browser
4. Click "Choose File" and select `SoniDash_KPI.csv`
5. Click any bar in the chart to hear the data

## Technical Details

### Volume Conversion
The code converts linear volume (0-1) to decibels using:
```javascript
synth.volume.value = 20 * Math.log10(safeVol);
```
This is correct for audio volume control in Tone.js.

## How to Differentiate Between Sounds

### Practical Example
1. **Click a bar with high sell-through %** → You'll hear:
   - High pitch (if that event had many units sold)
   - Medium volume (depending on change from previous event)
   - Specific instrument (identifies the brand)

2. **Compare two brands**:
   - Click multiple bars from different brands
   - Notice the different instrument sounds (timbre)
   - Compare pitches to see which had more units sold
   - Compare volumes to see which had bigger changes

3. **Find outliers**:
   - Very high or very low pitches = extreme units_sold values
   - Very loud sounds = large changes (potential anomalies)
   - Unusual instrument combinations = different brand patterns

### Tips for Effective Use
- **Scan sequentially**: Click bars in order to hear trends
- **Compare brands**: Click bars from different brands to compare by instrument sound
- **Look for patterns**: Listen for sequences of similar pitches (consistent sales) or varying volumes (volatile sales)

## Note on Chart Display
The current implementation shows all rows as individual bars. With 2133 rows, this may be cluttered. Consider aggregating by brand (e.g., average `sell_through_pct` per brand) for a cleaner visualization.

