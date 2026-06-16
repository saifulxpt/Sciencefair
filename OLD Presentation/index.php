<?php
// ফোল্ডার থেকে এইচটিএমএল স্লাইড স্ক্যান
$dir = __DIR__;
$files = scandir($dir);
$slides = [];

foreach ($files as $file) {
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if ($ext === 'html') {
        if (preg_match('/^(\d+)/', $file, $matches)) {
            $slideNumber = (int)$matches[1];
            $slides[$slideNumber] = $file; 
        }
    }
}
ksort($slides);
$slidesList = array_values($slides);
$totalSlides = count($slidesList);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Eco-Block | Premium Presentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { width: 100vw; height: 100vh; overflow: hidden; background-color: #000000; font-family: 'Inter', sans-serif; }
        #slides-container { position: relative; width: 100%; height: 100%; background: #000000; }
        
        /* --- Smooth Transition CSS (Black Flash Fixed) --- */
        .slide-frame { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; 
            opacity: 0; pointer-events: none; z-index: 1; transform: scale(1.02); 
            background-color: transparent;
            /* Hardware acceleration & smooth crossfade */
            transition: opacity 0.3s ease-in-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            will-change: opacity, transform;
        }
        .slide-frame.active { 
            opacity: 1; pointer-events: auto; z-index: 10; transform: scale(1); 
        }

        /* UI Elements */
        #room-pin-display { position: fixed; top: 25px; right: 25px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 10px 20px; border-radius: 12px; color: #94a3b8; font-weight: bold; font-size: 16px; z-index: 1000; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: opacity 0.4s ease; cursor: pointer; }
        #pin-code { color: #2dd4bf; font-size: 22px; letter-spacing: 3px; margin-left: 5px; }
        
        .controls-wrapper { position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); padding: 8px 25px; border-radius: 100px; display: flex; gap: 15px; align-items: center; border: 1px solid rgba(0, 0, 0, 0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.2); z-index: 1000; opacity: 0; visibility: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .controls-wrapper.show, .controls-wrapper:hover { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
        
        .control-btn { background: none; border: none; color: #475569; font-size: 16px; cursor: pointer; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .control-btn:hover { background: #f1f5f9; color: #0d9488; }
        .control-btn.active { color: #0d9488; font-weight: bold; background: #ccfbf1; }
        #btn-unlink { color: #ef4444; display: none; }
        #btn-unlink:hover { background: #fee2e2; color: #dc2626; }
        
        .slide-counter { color: #64748b; font-size: 13px; min-width: 50px; text-align: center; font-weight: 600; letter-spacing: 1px; }
        .settings-panel { display: flex; align-items: center; gap: 8px; border-left: 1px solid rgba(0, 0, 0, 0.1); padding-left: 15px; margin-left: 5px; }
        .settings-panel input { width: 45px; padding: 4px; border-radius: 5px; border: 1px solid rgba(0,0,0,0.1); background: transparent; color: #0f172a; text-align: center; font-weight: bold; outline: none; }
        
        #initial-loader { position: fixed; inset: 0; background: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; transition: opacity 0.8s ease; }
        .loader-logo { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 20px; letter-spacing: -1px; }
        .progress-bar { width: 250px; height: 4px; background: #334155; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #14b8a6, #2dd4bf); width: 0%; transition: width 0.4s ease; }
        #presentation-progress { position: fixed; bottom: 0; left: 0; height: 3px; background: #0d9488; z-index: 1000; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0.8; }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="loader-logo">ECO-BLOCK<span style="color:#2dd4bf">.</span></div>
        <div class="progress-bar"><div class="progress-fill" id="load-progress"></div></div>
        <div style="color: #64748b; font-size: 12px; margin-top: 15px; font-weight: bold;" id="load-text">Initializing Engine...</div>
    </div>

    <div id="room-pin-display" onclick="enableWakeLock()" title="Click to keep screen awake">
        ROOM PIN: <span id="pin-code">----</span>
    </div>

    <div id="slides-container"></div>
    <div id="presentation-progress" style="width: 0%;"></div>

    <div class="controls-wrapper" id="control-panel">
        <button class="control-btn" id="btn-prev"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="control-btn" id="btn-play"><i class="fa-solid fa-play"></i></button>
        <button class="control-btn" id="btn-next"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="slide-counter"><span id="current-slide-num">1</span> / <?php echo $totalSlides; ?></div>
        <button class="control-btn" id="btn-loop"><i class="fa-solid fa-arrows-rotate"></i></button>
        <button class="control-btn" id="btn-refresh"><i class="fa-solid fa-arrow-rotate-right"></i></button>
        <button class="control-btn" id="btn-fullscreen"><i class="fa-solid fa-expand"></i></button>
        <button class="control-btn" id="btn-unlink"><i class="fa-solid fa-mobile-screen-button"></i></button>
        <div class="settings-panel">
            <i class="fa-regular fa-clock" style="color: #94a3b8; font-size: 13px;"></i>
            <input type="number" id="interval-input" value="10" min="3" max="60">
        </div>
    </div>

    <script>
        let myPIN = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('pin-code').textContent = myPIN;

        // State Variables
        const slidesList = <?php echo json_encode($slidesList); ?>;
        const totalSlides = slidesList.length;
        let currentIndex = 0; 
        let loadedFrames = 0; 
        const container = document.getElementById('slides-container'); 
        const frames = [];
        let isPlaying = false; 
        let isLooping = false;
        let playInterval; 
        let intervalSeconds = 10;
        let isFirstSlideReady = false;

        // --- PUSHER REALTIME ENGINE ---
        Pusher.logToConsole = false;
        const pusher = new Pusher('e9724bd6db7ccd51f076', { cluster: 'ap2' });
        let channel = pusher.subscribe('ecoblock-' + myPIN);

        function setupPusherListener(targetChannel) {
            targetChannel.bind('slide-update', function(data) {
                if(data.action === 'sync_remote' || data.action === 'disconnect') return; 

                document.getElementById('room-pin-display').style.display = 'none';
                document.getElementById('btn-unlink').style.display = 'flex';

                // Slide Controls
                if (data.action === 'goto' && data.slide !== null) {
                    let targetNum = parseInt(data.slide) - 1;
                    if(targetNum >= 0 && targetNum < totalSlides && targetNum !== currentIndex) showSlide(targetNum, true);
                } 
                else if (data.action === 'next') { goNext(true); } 
                else if (data.action === 'prev') { goPrev(true); }
                
                // Advanced Settings Controls (From Mobile)
                else if (data.action === 'play') { startAutoPlay(false); }
                else if (data.action === 'pause') { pauseAutoPlay(false); }
                else if (data.action === 'toggle_loop') { toggleLoop(false); }
                else if (data.action === 'set_interval') { 
                    intervalSeconds = parseInt(data.interval);
                    document.getElementById('interval-input').value = intervalSeconds;
                    if(isPlaying) { pauseAutoPlay(false); startAutoPlay(false); }
                    syncWithMobile(); // Confirm back to mobile
                }
                else if (data.action === 'status') { syncWithMobile(); }
            });
        }
        setupPusherListener(channel);

        // --- FULL STATE SYNC WITH MOBILE ---
        function syncWithMobile() {
            fetch('pusher_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pin: myPIN, 
                    action: 'sync_remote', 
                    current: currentIndex + 1, 
                    total: totalSlides,
                    isPlaying: isPlaying,
                    isLooping: isLooping,
                    interval: intervalSeconds
                })
            });
        }

        // --- PRELOADER ---
        function preloadSlides() {
            if(totalSlides === 0) {
                document.getElementById('load-text').innerHTML = "<span style='color:#ef4444'>No slides found!</span>";
                return;
            }
            slidesList.forEach((src, index) => {
                const iframe = document.createElement('iframe');
                iframe.src = src; 
                iframe.className = 'slide-frame';
                iframe.onload = () => {
                    loadedFrames++;
                    document.getElementById('load-progress').style.width = `${(loadedFrames / totalSlides) * 100}%`;
                    try {
                        iframe.contentWindow.addEventListener('keydown', handleKeyboardEvent);
                        iframe.contentWindow.addEventListener('mousemove', handleMouseHover);
                    } catch(e) {}
                    if(index === 0 && !isFirstSlideReady) {
                        isFirstSlideReady = true;
                        document.getElementById('load-text').innerText = "Ready!";
                        setTimeout(() => {
                            document.getElementById('initial-loader').style.opacity = '0';
                            setTimeout(() => { 
                                document.getElementById('initial-loader').style.display = 'none'; 
                                showSlide(0); 
                            }, 600);
                        }, 300);
                    }
                };
                container.appendChild(iframe); 
                frames.push(iframe);
            });
        }

        // --- NAVIGATION & LOGIC ---
        function showSlide(index, sync = false) {
            if(frames[currentIndex]) {
                frames[currentIndex].classList.remove('active');
                try { if(typeof frames[currentIndex].contentWindow.stopSlide === 'function') frames[currentIndex].contentWindow.stopSlide(); } catch(e) {}
            }

            currentIndex = index;
            frames[currentIndex].classList.add('active');
            
            try { frames[currentIndex].contentWindow.focus(); } catch(e) {}
            try { if(typeof frames[currentIndex].contentWindow.startSlide === 'function') frames[currentIndex].contentWindow.startSlide(); } catch(e) {}
            
            document.getElementById('current-slide-num').textContent = currentIndex + 1;
            document.getElementById('presentation-progress').style.width = `${((currentIndex + 1) / totalSlides) * 100}%`;
            
            if(sync) syncWithMobile();
        }

        function goNext(sync = false) {
            if (currentIndex < totalSlides - 1) { showSlide(currentIndex + 1, sync); } 
            else if (isLooping) { showSlide(0, sync); } 
            else { pauseAutoPlay(sync); }
        }

        function goPrev(sync = false) {
            if (currentIndex > 0) { showSlide(currentIndex - 1, sync); } 
            else if (isLooping) { showSlide(totalSlides - 1, sync); }
        }

        function refreshCurrent() {
            frames[currentIndex].src = frames[currentIndex].src;
            const icon = document.getElementById('btn-refresh').querySelector('i');
            icon.classList.add('fa-spin'); 
            setTimeout(() => icon.classList.remove('fa-spin'), 1000);
        }

        const btnPlay = document.getElementById('btn-play'); 
        const btnLoop = document.getElementById('btn-loop'); 
        
        function startAutoPlay(sync = true) { 
            isPlaying = true; 
            btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>'; btnPlay.classList.add('active'); 
            clearInterval(playInterval); 
            playInterval = setInterval(() => goNext(true), intervalSeconds * 1000); 
            if(sync) syncWithMobile();
        }

        function pauseAutoPlay(sync = true) { 
            isPlaying = false; 
            btnPlay.innerHTML = '<i class="fa-solid fa-play"></i>'; btnPlay.classList.remove('active'); 
            clearInterval(playInterval); 
            if(sync) syncWithMobile();
        }

        function toggleLoop(sync = true) {
            isLooping = !isLooping;
            if(isLooping) btnLoop.classList.add('active'); else btnLoop.classList.remove('active');
            if(sync) syncWithMobile();
        }

        // --- UNLINK PHONE ---
        document.getElementById('btn-unlink').addEventListener('click', () => {
            fetch('pusher_api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: myPIN, action: 'disconnect' }) });
            pusher.unsubscribe('ecoblock-' + myPIN);
            
            myPIN = Math.floor(1000 + Math.random() * 9000); 
            document.getElementById('pin-code').textContent = myPIN; 
            document.getElementById('room-pin-display').style.display = 'block'; 
            document.getElementById('btn-unlink').style.display = 'none'; 
            
            channel = pusher.subscribe('ecoblock-' + myPIN);
            setupPusherListener(channel);
        });

        // --- UTILS & LISTENERS ---
        let wakeLock = null;
        async function enableWakeLock() {
            try { wakeLock = await navigator.wakeLock.request('screen'); document.getElementById('room-pin-display').style.borderColor = '#2dd4bf'; } catch (err) {}
        }
        document.addEventListener('visibilitychange', () => { if (wakeLock !== null && document.visibilityState === 'visible') enableWakeLock(); });
        window.addEventListener('click', () => { if(!wakeLock) enableWakeLock(); }, {once: true});

        function toggleFullscreen() {
            if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => {}); } 
            else { if (document.exitFullscreen) document.exitFullscreen(); }
        }

        function handleMouseHover(e) {
            const cp = document.getElementById('control-panel');
            if(e.clientY > window.innerHeight - 80) cp.classList.add('show'); else cp.classList.remove('show');
            const pinDisplay = document.getElementById('room-pin-display');
            if(e.clientY < 100) pinDisplay.style.opacity = '1'; else pinDisplay.style.opacity = '0.3';
        }

        function handleKeyboardEvent(e) {
            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { goNext(true); pauseAutoPlay(); } 
            else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { goPrev(true); pauseAutoPlay(); } 
            else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); } 
            else if (e.key === 'r' || e.key === 'R') { refreshCurrent(); }
        }

        window.addEventListener('keydown', handleKeyboardEvent);
        window.addEventListener('mousemove', handleMouseHover);
        document.getElementById('btn-next').addEventListener('click', () => { goNext(true); pauseAutoPlay(); });
        document.getElementById('btn-prev').addEventListener('click', () => { goPrev(true); pauseAutoPlay(); });
        document.getElementById('btn-refresh').addEventListener('click', refreshCurrent);
        document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
        btnPlay.addEventListener('click', () => { if (isPlaying) pauseAutoPlay(true); else startAutoPlay(true); });
        btnLoop.addEventListener('click', () => toggleLoop(true));
        
        document.getElementById('interval-input').addEventListener('change', (e) => { 
            intervalSeconds = parseInt(e.target.value); 
            if(isPlaying) { pauseAutoPlay(true); startAutoPlay(true); } else { syncWithMobile(); }
        });

        window.onload = preloadSlides;
    </script>
</body>
</html>