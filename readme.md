<img src="https://github.com/user-attachments/assets/b6a4f78e-bece-4a7b-a010-3882776c5b96" alt="Useless Projects 3.0 Banner" width="100%">

# YELL 🎯

## 🔗 Basic Details

**Team Name:** Absica

**Team Members**
* Team Lead: Nishikanth V - College of Engineering Chengannur
* Member 2: Abin Xavier - College of Engineering Chengannur

**Project Description**

YELL: Universal Voice Volume Controller is a chaotic, prank-focused Chrome Extension that dynamically scales your browser's media volume across all tabs (including Spotify) based on your real-time microphone loudness. If you whisper, your videos whisper; if you yell, they blast.

**The Problem (that doesn't exist)**

We are solving the incredibly useless problem of web browsing being too peaceful, predictable, and physically effortless.

Specifically, this project "fixes" these non-issues:

The "Burden" of the Volume Slider: We are replacing the quiet, simple act of pressing a volume key with the socially awkward and exhausting requirement of constantly screaming at your screen just to hear a Spotify track.

Too Much Productivity: We are solving the "problem" of you actually navigating to the website you asked for by actively sabotaging your voice commands (sending you to Instagram when you just wanted Wikipedia).

The "Horror" of Peace and Quiet: We are ensuring that taking a 10-second breather to rest your vocal cords is immediately punished with a Malayalam jumpscare.

**The Solution (that nobody asked for)**

We are "solving" it through three layers of engineered chaos:

Forced Vocalization: By tying media volume directly to microphone input (RMS amplitude), we force you to constantly make noise just to hear your videos or music.

Sabotaged Navigation: By hijacking the Web Speech API, we intercept your attempts to be productive (saying "open wikipedia") and intentionally redirect you to distraction sites (Instagram).

Punishing Silence: By tracking microphone activity, we weaponize peace and quiet. If you stop talking for 10 seconds, the extension spikes the volume to 100% and yells at you in Malayalam.

In short, we solved the "problem" by turning the browser into a high-maintenance, sarcastic troll.

## Technical Details

Here is the technical stack and component breakdown used to build this chaotic extension:

1. Browser Extension Architecture (Manifest V3)
manifest.json (V3): The configuration file granting permissions like tabs, storage, and web_accessible_resources.

Service Workers (background.js): Acts as the central nervous system, using chrome.runtime.sendMessage and chrome.tabs.sendMessage to relay volume data and UI state across all isolated browser tabs.

Storage API (chrome.storage.local): Syncs the global "ON/OFF" state so the extension remains consistent regardless of which tab you navigate to.

2. Core Web APIs (The Engine)
MediaDevices API (getUserMedia): Requests and captures the raw live audio stream from the user's microphone.

Web Audio API (AudioContext, createAnalyser): Processes the microphone stream at 60 Frames Per Second (FPS) to calculate the Root-Mean-Square (RMS) amplitude (loudness) in real-time.

Web Speech API (webkitSpeechRecognition): Runs on a background thread to continuously parse spoken words and trigger the deceptive navigation commands ("open google", "open wikipedia").

3. DOM & UI Manipulation
Shadow DOM (attachShadow): Used to inject the floating toggle button into the webpage. This ensures the button's CSS (glassmorphism, shaking animations) doesn't break the host website's design, and the website's CSS doesn't break the button's CSS.

Prototype Hooking (Spotify Bypass): Uses a MAIN world content script (spotify_bridge.js) to intercept window.Audio and HTMLMediaElement.prototype.play. This bypasses Spotify's hidden audio layers that normally block Chrome extensions from changing the volume.

Custom Event Dispatching: Bridging communication between the isolated content script and the main page environment using window.dispatchEvent.

4. Front-End (Landing Page)
GSAP (GreenSock) & ScrollTrigger: Powers the scroll-linked animations and horizontal illusion effects on the promotional website.

## Installation

Installation Steps

Get the Source Code:
Download or clone the project files and place them into a single folder (e.g., YELL-Extension). Ensure the folder contains:

- manifest.json
- background.js
- content.js
- spotify_bridge.js
- prank.mp3

Access Browser Extensions:
Open your browser's extensions management page:

- Chrome/Brave: Type chrome://extensions/ in the URL bar.
- Edge: Type edge://extensions/ in the URL bar.

Enable Developer Mode:
Toggle the Developer mode switch located in the top right corner of the extensions page.

Load the Extension:
Click the Load unpacked button and select your YELL-Extension folder.

Test the Landing Page (Optional):
To view the animated promotional website, open index.html in your browser. No local server is required.

## Run

Because this project uses vanilla JavaScript and native browser APIs, there are zero run commands.

To run the extension, open chrome://extensions/ and click Load unpacked to load the extension folder.

To run the landing page, open index.html directly in Chrome.

## Screenshots

<img width="1866" height="862" alt="sc1" src="https://github.com/user-attachments/assets/bd5b5d13-e24b-4f9e-9e95-eeaabf486993" />

<img width="1812" height="612" alt="sc2" src="https://github.com/user-attachments/assets/7a1386a7-a3ba-42f4-9630-68fa9e58a4f3" />

<img width="1902" height="1005" alt="sc3" src="https://github.com/user-attachments/assets/1e9b9ac2-5538-491f-a043-91dfac36f412" />

## Diagrams

<img width="1536" height="1024" alt="ChatGPT Image Sep 12, 2026, 05_45_32 AM" src="https://github.com/user-attachments/assets/596918c3-bd0c-4cdc-a494-8ba442ed5b18" />

## Project Demo

### Video

https://drive.google.com/file/d/1NksjqLIe2L9ytA1241T5lYvboy3Z1SF_/view?usp=sharing

## Team Contributions

* Nishikanth V: Idea and project creator
* Abin Xavier: Project developer and Presentation member

---
Made with ❤️ at TinkerHub Useless Projects
