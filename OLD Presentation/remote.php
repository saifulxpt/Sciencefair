<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Eco-Block Pro Remote</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <style>
        /* --- PREMIUM DARK THEME CSS --- */
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; user-select: none; -webkit-tap-highlight-color: transparent; }
        body { background: #020617; color: white; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        /* Setup Screen */
        .setup-box { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; padding: 20px; transition: 0.3s; }
        .setup-box h2 { color: #2dd4bf; letter-spacing: 2px; margin-bottom: 30px; font-weight: 800;}
        .pin-input { font-size: 32px; text-align: center; padding: 15px; width: 220px; border-radius: 16px; border: 2px solid #334155; background: #0f172a; color: #fff; outline: none; margin-bottom: 30px; letter-spacing: 8px; font-weight: bold; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);}
        .pin-input:focus { border-color: #2dd4bf; box-shadow: 0 0 15px rgba(45, 212, 191, 0.2); }
        .btn-connect { background: linear-gradient(135deg, #14b8a6, #0d9488); color: #fff; border: none; padding: 18px 50px; font-size: 20px; font-weight: bold; border-radius: 50px; cursor: pointer; box-shadow: 0 10px 25px rgba(13, 148, 136, 0.3); transition: 0.2s;}
        .btn-connect:active { transform: scale(0.96); box-shadow: 0 5px 10px rgba(13, 148, 136, 0.2); }
        
        /* --- MAIN REMOTE DASHBOARD (As per Sketch) --- */
        #remote-ui { display: none; flex-direction: column; height: 100vh; }
        
        /* Header: [Settings] [1/12] [Power] */
        .remote-header { padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 10;}
        .icon-btn { color: #94a3b8; font-size: 20px; cursor: pointer; padding: 12px; border-radius: 12px; transition: 0.2s;}
        .icon-btn:active { background: rgba(255,255,255,0.08); color: #fff; }
        .slide-counter { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 1px;}
        .slide-counter span { color: #2dd4bf; }

        /* Middle Section: Dynamic Slide Grid (Swipeable) */
        .grid-container { flex: 1; padding: 25px 15px; overflow-y: auto; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); position: relative;}
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-bottom: 20px;}
        .slide-btn { background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 20px 0; font-size: 20px; border-radius: 16px; font-weight: 800; transition: all 0.2s ease; position: relative; overflow: hidden;}
        /* Active/Current Slide Highlight */
        .slide-btn.active { background: #0d9488; color: #fff; border-color: #2dd4bf; box-shadow: 0 0 20px rgba(45, 212, 191, 0.5); transform: scale(1.05); z-index: 2;}
        .slide-btn:active:not(.active) { background: #334155; transform: scale(0.95);}

        /* Bottom Section: Huge Prev/Next Buttons */
        .main-nav { display: flex; gap: 15px; padding: 15px 20px 25px 20px; background: #0f172a; border-top: 1px solid #1e293b; box-shadow: 0 -5px 20px rgba(0,0,0,0.2);}
        .nav-btn { flex: 1; padding: 25px; border-radius: 16px; border: none; font-size: 22px; font-weight: 800; color: #fff; background: #1e293b; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);}
        .nav-btn i { font-size: 26px; }
        .nav-btn-next { background: #0d9488; box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3); }
        .nav-btn:active { transform: scale(0.96); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
        
        /* --- SETTINGS BOTTOM SHEET --- */
        .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 90; backdrop-filter: blur(4px); opacity: 0; transition: 0.3s; }
        .settings-sheet { position: fixed; bottom: -100%; left: 0; width: 100%; background: #1e293b; padding: 30px 25px; border-top-left-radius: 30px; border-top-right-radius: 30px; z-index: 100; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 -10px 40px rgba(0,0,0,0.5); border-top: 1px solid #334155;}
        .settings-sheet.open { bottom: 0; }
        .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .sheet-header h3 { margin: 0; color: #f8fafc; font-size: 20px; letter-spacing: 1px; font-weight: 800;}
        .sheet-close { background: #334155; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; transition: 0.2s;}
        .sheet-close:active { background: #475569; }
        
        .control-row { display: flex; gap: 15px; margin-bottom: 25px; }
        .action-btn { flex: 1; padding: 18px; border-radius: 16px; border: 1px solid #475569; font-size: 17px; font-weight: 700; color: #cbd5e1; background: #1e293b; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.2s; cursor: pointer;}
        /* Highlight for Play/Loop states */
        .action-btn.active { background: #0d9488; color: #fff; border-color: #2dd4bf; box-shadow: 0 5px 15px rgba(13, 148, 136, 0.3); }
        .action-btn:active:not(.active) { background: #334155; }
        
        .time-control { background: #0f172a; padding: 18px 25px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155;}
        .time-control label { color: #94a3b8; font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 10px;}
        .time-control input { width: 70px; background: #1e293b; border: 2px solid #475569; color: #2dd4bf; font-size: 20px; font-weight: 800; text-align: center; padding: 8px; border-radius: 10px; outline: none; transition: 0.2s;}
        .time-control input:focus { border-color: #2dd4bf; background: #0f172a;}
    </style>
</head>
<body>

    <div id="setup-ui" class="setup-box">
        <h2>ECO-BLOCK</h2>
        <input type="number" id="pin-input" class="pin-input" placeholder="XXXX" autocomplete="off" pattern="\d*">
        <button class="btn-connect" onclick="connectRemote()"><i class="fa-solid fa-link"></i> CONNECT</button>
    </div>

    <div id="remote-ui">
        <div class="remote-header">
            <div class="icon-btn" onclick="openSettings()"><i class="fa-solid fa-gear"></i></div>
            
            <div class="slide-counter" id="slide-counter"><span>-</span> / -</div>
            
            <div class="icon-btn" onclick="confirmDisconnect()"><i class="fa-solid fa-power-off" style="color:#ef4444"></i></div>
        </div>
        
        <div class="grid-container" id="swipe-zone">
            <div class="grid" id="slide-grid">
                </div>
        </div>

        <div class="main-nav">
            <button class="nav-btn nav-btn-prev" onclick="sendCommand('prev')"><i class="fa-solid fa-chevron-left"></i> Prev</button>
            <button class="nav-btn nav-btn-next" onclick="sendCommand('next')">Next <i class="fa-solid fa-chevron-right"></i></button>
        </div>
    </div>

    <div class="overlay" id="overlay" onclick="closeSettings()"></div>
    <div class="settings-sheet" id="settings-sheet">
        <div class="sheet-header">
            <h3><i class="fa-solid fa-sliders" style="color:#2dd4bf; margin-right:10px;"></i> Presentation Settings</h3>
            <div class="sheet-close" onclick="closeSettings()"><i class="fa-solid fa-xmark"></i></div>
        </div>
        
        <div class="control-row">
            <button class="action-btn" id="remote-btn-play" onclick="togglePlayState()">
                <i class="fa-solid fa-play"></i> <span>Auto Play</span>
            </button>
            <button class="action-btn" id="remote-btn-loop" onclick="sendCommand('toggle_loop')">
                <i class="fa-solid fa-arrows-rotate"></i> Loop Slides
            </button>
        </div>
        
        <div class="time-control">
            <label><i class="fa-regular fa-clock"></i> Slide Interval (Sec)</label>
            <input type="number" id="remote-interval" value="10" min="3" max="60" onchange="changeInterval(this.value)" pattern="\d*">
        </div>
    </div>

    <script>
        let currentPin = '';
        let isPlayingRemote = false; // Local state to track PC play mode
        let totalSlidesRemote = 0;
        
        // Pusher configuration (Use your specific keys)
        const pusher = new Pusher('e9724bd6db7ccd51f076', { cluster: 'ap2' });
        let channel;
        let wakeLock = null;

        // Keep screen awake
        async function requestWakeLock() { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} }

        function connectRemote() {
            const pin = document.getElementById('pin-input').value;
            if(pin.length >= 4) {
                currentPin = pin;
                requestWakeLock(); 
                
                document.getElementById('setup-ui').style.display = 'none';
                document.getElementById('remote-ui').style.display = 'flex';
                if (navigator.vibrate) navigator.vibrate(60);

                // Subscribe to the specific room channel
                channel = pusher.subscribe('ecoblock-' + currentPin);
                channel.bind('slide-update', function(data) {
                    if(data.action === 'disconnect') {
                        forceDisconnect();
                    } else if (data.action === 'sync_remote') {
                        // Receive full state from PC and update UI
                        updateDashboard(data);
                    }
                });

                // Ask PC to send its current status immediately
                sendCommand('status'); 
            } else {
                alert("Please enter a valid 4-digit PIN");
                document.getElementById('pin-input').focus();
            }
        }

        function confirmDisconnect() {
            if(confirm("Disconnect from presentation?")) { forceDisconnect(); }
        }

        function forceDisconnect() {
            if(channel) pusher.unsubscribe('ecoblock-' + currentPin);
            currentPin = '';
            totalSlidesRemote = 0;
            if(wakeLock) { wakeLock.release(); wakeLock = null; }
            
            document.getElementById('remote-ui').style.display = 'none';
            document.getElementById('setup-ui').style.display = 'flex';
            document.getElementById('pin-input').value = '';
            closeSettings();
            if (navigator.vibrate) navigator.vibrate([60, 60, 60]);
        }

        // --- CORE UI UPDATE ENGINE (Receives data from PC) ---
        function updateDashboard(data) {
            // 1. Update Header Counter [Current / Total]
            document.getElementById('slide-counter').innerHTML = `<span>${data.current}</span> / ${data.total}`;
            
            const grid = document.getElementById('slide-grid');
            
            // 2. Generate/Update Grid buttons if total slides count changed
            if(totalSlidesRemote !== data.total) {
                totalSlidesRemote = data.total;
                let html = '';
                for(let i = 1; i <= data.total; i++) {
                    html += `<button class="slide-btn" id="btn-slide-${i}" onclick="sendCommand('goto', ${i})">${i}</button>`;
                }
                grid.innerHTML = html;
            }
            
            // 3. Highlight Current Slide Button (Fixes highlighting issue)
            document.querySelectorAll('.slide-btn').forEach(b => b.classList.remove('active'));
            const activeBtn = document.getElementById(`btn-slide-${data.current}`);
            if(activeBtn) {
                activeBtn.classList.add('active');
                // Scroll grid to keep active button visible if needed
                activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }

            // --- 4. FIXING PLAY/PAUSE BUG: Sync Settings UI ---
            isPlayingRemote = data.isPlaying; // Update local state
            const playBtn = document.getElementById('remote-btn-play');
            const playIcon = playBtn.querySelector('i');
            const playText = playBtn.querySelector('span');

            if(isPlayingRemote) {
                // If PC is playing, remote show "Pause" action
                playBtn.classList.add('active'); // Teal highlight
                playIcon.className = 'fa-solid fa-pause';
                playText.innerText = 'Pause Presentation';
            } else {
                // If PC is paused, remote show "Play" action
                playBtn.classList.remove('active'); // Gray background
                playIcon.className = 'fa-solid fa-play';
                playText.innerText = 'Auto Play';
            }

            // Sync Loop Button highlight
            const loopBtn = document.getElementById('remote-btn-loop');
            if(data.isLooping) loopBtn.classList.add('active'); else loopBtn.classList.remove('active');

            // Sync Interval Input value
            document.getElementById('remote-interval').value = data.interval;
        }

        // --- COMMAND SENDER ---
        function sendCommand(action, slideNum = null, extraData = {}) {
            if(!currentPin) return;
            if (navigator.vibrate && action !== 'status') navigator.vibrate(35);
            
            // Optimistic UI for grid: Highlight clicked button immediately for responsive feel
            if(action === 'goto' && slideNum !== null) {
                document.querySelectorAll('.slide-btn').forEach(b => b.classList.remove('active'));
                const clickedBtn = document.getElementById(`btn-slide-${slideNum}`);
                if(clickedBtn) clickedBtn.classList.add('active');
            }

            // Construct payload including PIN for API routing
            const payload = { pin: currentPin, action: action, slide: slideNum, ...extraData };
            
            fetch('pusher_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        // --- SETTINGS SHEET LOGIC ---
        function openSettings() {
            document.getElementById('overlay').style.display = 'block';
            setTimeout(() => {
                document.getElementById('overlay').style.opacity = '1';
                document.getElementById('settings-sheet').classList.add('open');
            }, 10);
            if(navigator.vibrate) navigator.vibrate(25);
        }

        function closeSettings() {
            document.getElementById('settings-sheet').classList.remove('open');
            document.getElementById('overlay').style.opacity = '0';
            setTimeout(() => { document.getElementById('overlay').style.display = 'none'; }, 350);
        }

        function togglePlayState() {
            // Based on current local knowledge of PC state, send opposite command
            if(isPlayingRemote) sendCommand('pause'); else sendCommand('play');
        }

        function changeInterval(val) {
            val = parseInt(val);
            if(val >= 3 && val <= 60) sendCommand('set_interval', null, { interval: val });
            else { alert("Interval must be between 3 and 60 seconds."); document.getElementById('remote-interval').value = 10;}
        }

        // --- SWIPE GESTURE LOGIC (Added for better UX in Grid Area) ---
        let touchstartX = 0;
        let touchendX = 0;
        const swipeZone = document.getElementById('swipe-zone');

        swipeZone.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, {passive: true});
        swipeZone.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            const threshold = 70; // min distance for swipe
            if (touchendX < touchstartX - threshold) { sendCommand('next'); } // Left swipe -> Next
            if (touchendX > touchstartX + threshold) { sendCommand('prev'); } // Right swipe -> Prev
        }
    </script>
</body>
</html>