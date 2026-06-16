<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Live Vote | Eco-Block 2025</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Outfit:wght@400;500;700;800;900&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: { 
                extend: { 
                    colors: { primary: '#0d9488', primaryLight: '#14b8a6', danger: '#f43f5e', darkBg: '#020617' }, 
                    fontFamily: { eng: ['Outfit', 'sans-serif'], bn: ['Hind Siliguri', 'sans-serif'] } 
                } 
            }
        }
    </script>
    <style>
        /* 1. Base Setup */
        * { -webkit-tap-highlight-color: transparent; }
        body { background: #020617; color: white; font-family: 'Hind Siliguri', sans-serif; overflow: hidden; }
        
        /* 2. Immersive Background */
        .bg-mesh {
            position: fixed; inset: 0; z-index: -2;
            background-image: url('https://saifulinfo.com/imagelink/uploads/IMG_692b51ea8186d2.29615030.jpg');
            background-size: cover; background-position: center;
            filter: blur(25px) brightness(0.25) saturate(1.2);
            transform: scale(1.1);
        }
        .bg-overlay {
            position: fixed; inset: 0; z-index: -1;
            background: radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.15) 0%, transparent 60%),
                        linear-gradient(to bottom, rgba(2, 6, 23, 0.4), rgba(2, 6, 23, 0.95));
        }

        /* 3. Premium App Card */
        .app-card { 
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        /* 4. Modern Input */
        .modern-input {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255,255,255,0.1);
            color: white; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .modern-input:focus {
            background: rgba(20, 184, 166, 0.05);
            border-color: rgba(20, 184, 166, 0.5);
            box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.15), inset 0 2px 4px rgba(0,0,0,0.1);
            outline: none;
        }

        /* 5. Smooth Buttons with Haptic-like scaling */
        .btn-modern { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .btn-modern:active { transform: scale(0.95); }
        
        .btn-primary-gradient {
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            box-shadow: 0 10px 20px -5px rgba(13, 148, 136, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 1px solid rgba(20, 184, 166, 0.5);
        }
        .btn-glass {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-glass:hover { background: rgba(255,255,255,0.08); }

        /* 6. Custom Scrollbar for feeds */
        .feed-scroll { overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 20px; }
        .feed-scroll::-webkit-scrollbar { display: none; }

        /* 7. Animations */
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-enter { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        .animate-pop { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    </style>
</head>
<body class="h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6">

    <div class="bg-mesh"></div>
    <div class="bg-overlay"></div>

    <div class="app-card w-full max-w-[420px] h-full max-h-[850px] rounded-[2.5rem] flex flex-col relative overflow-hidden animate-enter">
        
        <div class="flex justify-between items-center px-6 pt-8 pb-4 border-b border-white/5">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <i data-lucide="leaf" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                    <h1 class="font-eng font-bold text-lg leading-none tracking-wide text-white">ECO-BLOCK</h1>
                    <p class="font-eng text-[10px] text-teal-400 tracking-widest uppercase font-bold mt-1">Science Fair '25</p>
                </div>
            </div>
            <a href="magazine.php" class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                <i data-lucide="info" class="w-4 h-4 text-gray-300"></i>
            </a>
        </div>

        <div id="voteForm" class="flex-1 flex flex-col p-6 overflow-hidden">
            
            <div class="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
                    <i data-lucide="bar-chart-2" class="w-10 h-10 text-teal-400"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-white mb-2">আপনার মতামত দিন</h2>
                    <p class="text-sm text-gray-400 leading-relaxed max-w-[260px] mx-auto">
                        পরিবেশ রক্ষায় এই আধুনিক প্রযুক্তির ব্যবহার সম্পর্কে আপনি কি একমত?
                    </p>
                </div>
            </div>

            <div class="w-full mt-auto space-y-5 pb-2">
                <div>
                    <label class="font-eng text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 block ml-2">Voter Name</label>
                    <div class="relative group">
                        <input type="text" id="voterName" placeholder="আপনার নাম লিখুন..." class="modern-input w-full p-4 pl-12 rounded-2xl text-base font-medium placeholder-gray-500">
                        <i data-lucide="user" class="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-teal-400"></i>
                    </div>
                </div>

                <div class="flex flex-col gap-3 pt-2">
                    <button onclick="submitVote('yes')" class="btn-modern btn-primary-gradient w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3">
                        <i data-lucide="thumbs-up" class="w-5 h-5"></i> হ্যাঁ, আমি সমর্থন করি
                    </button>
                    <button onclick="submitVote('no')" class="btn-modern btn-glass w-full py-4 rounded-2xl text-gray-300 font-bold text-base flex items-center justify-center gap-3">
                        <i data-lucide="thumbs-down" class="w-5 h-5"></i> না, দ্বিমত পোষণ করছি
                    </button>
                </div>
            </div>
        </div>

        <div id="loadingView" class="hidden absolute inset-0 bg-darkBg/80 backdrop-blur-md z-50 flex-col items-center justify-center">
            <div class="relative w-24 h-24 mb-6">
                <div class="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-t-teal-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <i data-lucide="cloud-upload" class="w-8 h-8 text-teal-400 animate-pulse"></i>
                </div>
            </div>
            <h3 class="text-xl font-bold text-white tracking-wide">প্রসেসিং হচ্ছে...</h3>
        </div>

        <div id="resultsSection" class="hidden flex-col h-full p-6 pb-0 overflow-hidden animate-pop">
            
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">লাইভ পোল রেজাল্ট</h2>
                <div class="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span class="font-eng text-[9px] font-bold text-green-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div class="bg-white/[0.03] border border-white/5 rounded-3xl p-5 mb-5 flex items-center gap-5">
                <div class="relative w-[110px] h-[110px] shrink-0">
                    <canvas id="voteChart"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="font-eng text-2xl font-black text-white" id="approvalRate">0%</span>
                    </div>
                </div>
                <div class="flex-1 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-teal-400"></div>
                            <span class="font-eng text-xs font-bold text-gray-300 uppercase tracking-wider">Support</span>
                        </div>
                        <span class="font-eng text-xl font-black text-white" id="resYes">0</span>
                    </div>
                    <div class="w-full h-[1px] bg-white/5"></div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span class="font-eng text-xs font-bold text-gray-300 uppercase tracking-wider">Oppose</span>
                        </div>
                        <span class="font-eng text-xl font-black text-white" id="resNo">0</span>
                    </div>
                </div>
            </div>

            <div class="flex-1 flex flex-col min-h-0">
                <div class="flex items-center justify-between mb-3 px-1">
                    <h3 class="text-sm font-bold text-gray-400">সাম্প্রতিক ভোটসমূহ</h3>
                    <span class="font-eng text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-bold" id="totalCountBadge">Total: 0</span>
                </div>
                
                <div id="voterList" class="feed-scroll flex-1 space-y-2">
                    </div>
            </div>

        </div>

    </div>

    <script>
        lucide.createIcons();
        const API_URL = 'vote_api.php';
        let voteChart;
        let fetchTimer;

        // Auto-check if voted
        if(localStorage.getItem('hasVoted')) {
            showResults();
        }

        async function submitVote(type) {
            const nameInput = document.getElementById('voterName');
            const name = nameInput.value.trim();
            
            if(!name) {
                nameInput.parentElement.classList.add('animate-pulse');
                nameInput.style.borderColor = '#f43f5e';
                setTimeout(() => {
                    nameInput.style.borderColor = 'rgba(255,255,255,0.1)';
                    nameInput.parentElement.classList.remove('animate-pulse');
                }, 1000);
                nameInput.focus();
                return;
            }

            document.getElementById('voteForm').classList.add('hidden');
            document.getElementById('loadingView').classList.remove('hidden');
            document.getElementById('loadingView').style.display = 'flex';

            try {
                const response = await fetch(API_URL + '?action=vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: type, name: name })
                });
                const result = await response.json();

                // Fake delay for premium UX feel
                setTimeout(() => {
                    if(result.status === 'success') {
                        localStorage.setItem('hasVoted', 'true');
                        showResults();
                    } else {
                        alert("সার্ভারে সমস্যা হয়েছে।");
                        location.reload();
                    }
                }, 1200);

            } catch (error) {
                alert("ইন্টারনেট সংযোগ চেক করুন।");
                location.reload();
            }
        }

        function showResults() {
            document.getElementById('voteForm').classList.add('hidden');
            document.getElementById('loadingView').classList.add('hidden');
            document.getElementById('loadingView').style.display = 'none';
            
            const resSection = document.getElementById('resultsSection');
            resSection.classList.remove('hidden');
            resSection.style.display = 'flex';
            
            initChart();
            fetchData();
            fetchTimer = setInterval(fetchData, 3000); // 3 sec live sync for mobile to save battery
        }

        function initChart() {
            const ctx = document.getElementById('voteChart').getContext('2d');
            voteChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Yes', 'No'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#2dd4bf', '#f43f5e'],
                        borderWidth: 0,
                        hoverOffset: 0,
                        cutout: '78%',
                        borderRadius: 20
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    animation: { animateScale: true, animateRotate: true }
                }
            });
        }

        let lastFeedJSON = '';
        async function fetchData() {
            try {
                const response = await fetch(API_URL + '?action=fetch&t=' + Date.now());
                const data = await response.json();
                
                // Update Stats
                document.getElementById('resYes').innerText = data.yes;
                document.getElementById('resNo').innerText = data.no;
                
                const total = data.yes + data.no;
                const rate = total > 0 ? Math.round((data.yes / total) * 100) : 0;
                document.getElementById('approvalRate').innerText = rate + "%";
                document.getElementById('totalCountBadge').innerText = "Total: " + total;

                // Update Chart softly
                if(voteChart.data.datasets[0].data[0] !== data.yes || voteChart.data.datasets[0].data[1] !== data.no) {
                    voteChart.data.datasets[0].data = [data.yes, data.no];
                    voteChart.update();
                }

                // Update List if changed
                const currentJSON = JSON.stringify(data.feed);
                if(currentJSON !== lastFeedJSON) {
                    const list = document.getElementById('voterList');
                    let html = '';
                    
                    if(data.feed.length === 0) {
                        html = `<div class="text-center text-xs text-gray-500 mt-6 font-eng">No votes recorded yet</div>`;
                    } else {
                        data.feed.forEach(vote => {
                            const isYes = vote.type === 'yes';
                            const color = isYes ? 'text-teal-400' : 'text-rose-400';
                            const icon = isYes ? 'thumbs-up' : 'thumbs-down';
                            const bg = isYes ? 'bg-teal-500/10 border-teal-500/20' : 'bg-rose-500/10 border-rose-500/20';
                            
                            html += `
                                <div class="flex justify-between items-center p-3 rounded-2xl ${bg} border animate-pop">
                                    <div class="flex items-center gap-3 overflow-hidden">
                                        <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white font-eng">
                                            ${vote.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div class="text-sm font-semibold text-gray-200 truncate">
                                            ${vote.name}
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    list.innerHTML = html;
                    lucide.createIcons();
                    lastFeedJSON = currentJSON;
                }

            } catch (e) { console.error("Sync Error", e); }
        }
    </script>
</body>
</html>