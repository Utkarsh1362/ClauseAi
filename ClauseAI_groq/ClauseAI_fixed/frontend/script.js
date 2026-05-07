// FIX: Stop any residual speech immediately when the page loads or is refreshed
window.speechSynthesis.cancel();
window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();
});

document.addEventListener('DOMContentLoaded', () => {

    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const fileUpload = document.getElementById('file-upload');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const chatWindow = document.getElementById('chat-window');
    const sendBtn = document.getElementById('send-btn');
    const sendIcon = sendBtn.querySelector('i');
    const typingIndicator = document.getElementById('typing-indicator');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const clearChatBtn = document.getElementById('clear-chat');
    const quickPrompts = document.querySelectorAll('.prompt-pill');
    
    // Sidebar Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');
    const sidebarUsername = document.getElementById('sidebar-username');
    const userAvatarInitials = document.getElementById('user-avatar-initials');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    function showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // ==========================================
    // EXCLUSIVE: Cinematic Splash Screen Logic
    // ==========================================
    const splashScreen = document.getElementById('splash-screen');
    const nameInput = document.getElementById('user-name-input');
    const splashGreeting = document.getElementById('splash-greeting');
    let userName = localStorage.getItem('clauseai_username') || "Counsel"; 
    
    // Auto-fill if returning user
    if (userName !== "Counsel") {
        nameInput.value = userName;
    }
    
    // Focus the input immediately
    setTimeout(() => nameInput.focus(), 800);

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const enteredName = nameInput.value.trim();
            if (enteredName) {
                userName = enteredName;
                localStorage.setItem('clauseai_username', userName); // Save for next time
            }
            
            // Beautiful Morph Animation
            nameInput.style.opacity = '0';
            splashGreeting.style.opacity = '0';
            
            setTimeout(() => {
                splashGreeting.textContent = `Welcome, ${userName}.`;
                splashGreeting.style.opacity = '1';
                
                // Update sidebar info
                sidebarUsername.textContent = userName;
                userAvatarInitials.textContent = userName.charAt(0).toUpperCase();
                
                // Dissolve entire screen after reading it
                setTimeout(() => {
                    splashScreen.classList.add('hidden');
                    
                    // Generate time-based greeting like Gemini
                    const hour = new Date().getHours();
                    let greetingTime = "Good evening";
                    if (hour >= 5 && hour < 12) greetingTime = "Good morning";
                    else if (hour >= 12 && hour < 17) greetingTime = "Good afternoon";
                    
                    // Update the first AI message dynamically if it exists
                    const firstMsg = document.querySelector('.ai-message .bubble');
                    if (firstMsg) {
                        firstMsg.innerHTML = `${greetingTime}, <strong>${userName}</strong>. I am ClauseAI, your advanced legal assistant. I have been initialized and am ready to analyze your contracts or answer legal inquiries. How can I help you today?`;
                    }
                }, 1800);
            }, 500);
        }
    });

    // ==========================================
    // CHAT HISTORY ENGINE (ChatGPT Style)
    // ==========================================
    let currentChatId = Date.now().toString();
    let conversations = JSON.parse(localStorage.getItem('clauseai_history')) || [];

    function saveCurrentConversation() {
        const messages = [];
        const messageElements = chatWindow.querySelectorAll('.message');
        
        messageElements.forEach(el => {
            const isUser = el.classList.contains('user-message');
            const bubble = el.querySelector('.bubble');
            if (bubble) {
                messages.push({
                    role: isUser ? 'user' : 'ai',
                    content: bubble.innerHTML,
                    timestamp: el.querySelector('.timestamp')?.textContent || ''
                });
            }
        });

        if (messages.length <= 1) return; // Don't save if only welcome message

        const existingIdx = conversations.findIndex(c => c.id === currentChatId);
        const title = messages[1]?.content.substring(0, 30).replace(/<[^>]*>/g, '') + '...' || 'New Chat';

        const chatData = {
            id: currentChatId,
            title: title,
            messages: messages,
            lastUpdated: new Date().toISOString()
        };

        if (existingIdx > -1) {
            conversations[existingIdx] = chatData;
        } else {
            conversations.unshift(chatData);
        }

        localStorage.setItem('clauseai_history', JSON.stringify(conversations));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        conversations.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            item.innerHTML = `<i class="fa-regular fa-message"></i> ${chat.title}`;
            item.onclick = () => loadConversation(chat.id);
            historyList.appendChild(item);
        });
    }

    function loadConversation(id) {
        const chat = conversations.find(c => c.id === id);
        if (!chat) return;

        currentChatId = id;
        chatWindow.innerHTML = '';
        
        chat.messages.forEach(msg => {
            // Re-use appendMessage logic but without typewriter for history
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', `${msg.role}-message`);

            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('avatar');
            avatarDiv.innerHTML = msg.role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

            const bubbleWrapper = document.createElement('div');
            bubbleWrapper.classList.add('bubble-wrapper');

            const bubbleDiv = document.createElement('div');
            bubbleDiv.classList.add('bubble');
            bubbleDiv.innerHTML = msg.content;

            const timeDiv = document.createElement('div');
            timeDiv.classList.add('timestamp');
            timeDiv.textContent = msg.timestamp;

            bubbleWrapper.appendChild(bubbleDiv);
            bubbleWrapper.appendChild(timeDiv);
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(bubbleWrapper);
            chatWindow.appendChild(messageDiv);
        });

        document.getElementById('quick-prompts').style.display = 'none';
        renderHistory();
        scrollToBottom();
        
        // Mobile: Close sidebar after selection
        if (window.innerWidth < 900) {
            sidebar.classList.add('collapsed');
        }
    }

    function startNewChat() {
        currentChatId = Date.now().toString();
        const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        chatWindow.innerHTML = `
            <div class="message ai-message">
                <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="bubble-wrapper">
                    <div class="bubble">
                        Hello! I am ClauseAI, your premium legal assistant. How can I help you in this new session?
                    </div>
                    <div class="timestamp">${timeNow}</div>
                </div>
            </div>
        `;
        document.getElementById('quick-prompts').style.display = 'flex';
        renderHistory();
        messageInput.focus();
    }

    newChatBtn.addEventListener('click', startNewChat);

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Initial render
    renderHistory();

    // Setup Marked.js options for safe parsing
    marked.setOptions({
        breaks: true, // Enables line breaks
        gfm: true     // Github flavored markdown
    });

    // Initialize Vanta.js 3D Backgrounds
    function initDarkVanta() {
        return VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xa78bfa, // Glowing Purple Nodes
            backgroundColor: 0x030305, // Deep Space Dark
            points: 15.00,
            maxDistance: 24.00,
            spacing: 18.00,
            showDots: true
        });
    }

    function initLightVanta() {
        return VANTA.FOG({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0xfb923c, // Warm Sunset Orange
            midtoneColor: 0xf43f5e, // Soft Coral Pink
            lowlightColor: 0x38bdf8, // Morning Sky Blue
            baseColor: 0xffffff, // Pure White Canvas
            blurFactor: 0.85, // Smooth liquid blend
            speed: 2.00, // Peaceful swirling motion
            zoom: 1.10
        });
    }

    let vantaEffect = initDarkVanta();

    // Theme Toggle Logic
    let isLightMode = false;
    const appContainer = document.querySelector('.app-container');
    
    themeToggle.addEventListener('click', () => {
        // Add a 3D Zoom out/in transition effect
        appContainer.style.transform = 'scale(0.97) rotateX(2deg)';
        setTimeout(() => {
            appContainer.style.transform = 'scale(1) rotateX(0deg)';
        }, 400);

        // Destroy previous 3D world to render the new one
        if (vantaEffect) vantaEffect.destroy();

        isLightMode = !isLightMode;
        if (isLightMode) {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            // Transition to beautiful Birds in Light Mode
            vantaEffect = initLightVanta();
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            // Transition back to Network in Dark Mode
            vantaEffect = initDarkVanta();
        }

        // Keep confidential mode background if active
        if (isConfidential) {
            vantaEffect.setOptions({ backgroundColor: 0x1a0505 });
        }
    });

    // Insights Panel Toggle
    const insightsToggle = document.getElementById('insights-toggle');
    const rightPanel = document.getElementById('right-panel');
    
    // Initialize width for desktop
    if (window.innerWidth > 1200) {
        rightPanel.style.width = '320px';
    }
    
    insightsToggle.addEventListener('click', () => {
        rightPanel.classList.toggle('show');
        if (window.innerWidth > 1200) {
            // On desktop, toggle width instead of overlay
            if (rightPanel.style.width === '0px') {
                rightPanel.style.width = '320px';
                rightPanel.style.opacity = '1';
                rightPanel.style.borderLeft = '1px solid var(--glass-border)';
            } else {
                rightPanel.style.width = '0px';
                rightPanel.style.opacity = '0';
                rightPanel.style.borderLeft = 'none';
            }
        }
    });

    // Magnetic Buttons (Pulls buttons toward cursor)
    const magneticBtns = document.querySelectorAll('.icon-btn, .send-btn, .upload-btn, .voice-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px) scale(1)`;
        });
    });

    // Initialize 3D Tilt for Prompt Pills
    VanillaTilt.init(document.querySelectorAll(".prompt-pill"), {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.3,
    });

    // ==========================================
    // EXCLUSIVE: Procedural Sci-Fi Audio Engine
    // ==========================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playProceduralSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'hover') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'click') {
            // Soft premium "glass tap" sound instead of retro boop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.06);
            gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.06);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    }

    // Attach Audio to UI elements
    document.querySelectorAll('.aesthetic-btn, .prompt-pill').forEach(btn => {
        btn.addEventListener('mouseenter', () => playProceduralSound('hover'));
        btn.addEventListener('click', () => playProceduralSound('click'));
    });

    // ==========================================
    // EXCLUSIVE: Confidential Redaction Mode
    // ==========================================
    const confidentialToggle = document.getElementById('confidential-toggle');
    let isConfidential = false;
    
    confidentialToggle.addEventListener('click', () => {
        isConfidential = !isConfidential;
        if (isConfidential) {
            document.body.classList.add('confidential-mode');
            // Change colors of Vanta background to alert red!
            vantaEffect.setOptions({ color: 0xef4444, backgroundColor: 0x1a0505 });
        } else {
            document.body.classList.remove('confidential-mode');
            // Revert Vanta background
            if (isLightMode) {
                vantaEffect.setOptions({ color: 0xec4899, backgroundColor: 0xf8fafc });
            } else {
                vantaEffect.setOptions({ color: 0xa78bfa, backgroundColor: 0x030305 });
            }
        }
    });

    // Clear Chat Logic — toast-style confirmation instead of ugly browser confirm()
    clearChatBtn.addEventListener('click', () => {
        // Show an inline confirmation toast with Confirm / Cancel buttons
        const toast = document.createElement('div');
        toast.className = 'toast toast-error show';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="toast-content">
                <h4>Clear Chat?</h4>
                <p>This will erase the current conversation.</p>
                <div style="display:flex;gap:8px;margin-top:6px;">
                    <button id="confirm-clear-yes" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#f87171;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;">Clear</button>
                    <button id="confirm-clear-no" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text-secondary);padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;">Cancel</button>
                </div>
            </div>
        `;
        toastContainer.appendChild(toast);

        document.getElementById('confirm-clear-yes').onclick = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
            // Keep only the first welcome message
            const firstMessage = chatWindow.firstElementChild;
            chatWindow.innerHTML = '';
            chatWindow.appendChild(firstMessage);
            document.getElementById('quick-prompts').style.display = 'flex';
            showToast('Chat Cleared', 'Conversation has been reset.', 'success');
        };
        document.getElementById('confirm-clear-no').onclick = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        };
        // Auto-dismiss after 6 seconds
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);
    });

    // Quick Prompts Logic
    quickPrompts.forEach(pill => {
        pill.addEventListener('click', () => {
            messageInput.value = pill.textContent.replace(/[^\w\s\?]/g, '').trim(); // Remove emojis
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') this.style.height = 'auto';

        // ==========================================
        // SLASH COMMAND AUTOCOMPLETE
        // ==========================================
        const val = this.value;
        const slashCommands = [
            { cmd: '/nda',      label: '/nda',      desc: 'Draft a Non-Disclosure Agreement' },
            { cmd: '/rent',     label: '/rent',     desc: 'Draft a Rent Agreement' },
            { cmd: '/analyze',  label: '/analyze',  desc: 'Analyze an uploaded contract' },
            { cmd: '/risks',    label: '/risks',    desc: 'List common contract risks' },
            { cmd: '/explain',  label: '/explain',  desc: 'Explain a legal clause in simple terms' },
        ];

        let dropdown = document.getElementById('slash-dropdown');

        if (val.startsWith('/') && val.length >= 1) {
            const query = val.toLowerCase();
            const matches = slashCommands.filter(c => c.cmd.startsWith(query));

            if (matches.length > 0) {
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.id = 'slash-dropdown';
                    dropdown.className = 'slash-dropdown';
                    // Insert above the input area
                    document.querySelector('.input-area').insertBefore(dropdown, document.getElementById('file-preview-container'));
                }
                dropdown.innerHTML = matches.map(m => `
                    <div class="slash-item" data-cmd="${m.cmd}">
                        <span class="slash-cmd">${m.label}</span>
                        <span class="slash-desc">${m.desc}</span>
                    </div>
                `).join('');

                dropdown.querySelectorAll('.slash-item').forEach(item => {
                    item.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // Prevent blur
                        const cmd = item.dataset.cmd;
                        // Map command to a full prompt
                        const prompts = {
                            '/nda':     'Draft an NDA between [Party A] and [Party B] for [purpose]. Valid for [duration].',
                            '/rent':    'Draft a Rent Agreement between [Landlord] and [Tenant] for property at [address]. Monthly rent: [amount].',
                            '/analyze': 'Please analyze the uploaded contract and highlight risks, obligations, and key clauses.',
                            '/risks':   'What are the most common risks in a standard commercial contract?',
                            '/explain': 'Explain the following legal clause in simple plain English: ',
                        };
                        messageInput.value = prompts[cmd] || cmd;
                        messageInput.style.height = 'auto';
                        messageInput.style.height = (messageInput.scrollHeight) + 'px';
                        dropdown.remove();
                        messageInput.focus();
                    });
                });

                return; // Don't remove dropdown
            }
        }

        // Remove dropdown if no match or not a slash command
        if (dropdown) dropdown.remove();
    });

    // Enter to send, Shift+Enter for new line
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Display selected file with Rich Preview
    fileUpload.addEventListener('change', () => {
        const file = fileUpload.files[0];
        if (file) {
            renderFilePreview(file);
            messageInput.focus(); // Auto-focus so user can press Enter to upload
        } else {
            filePreviewContainer.classList.remove('active');
            filePreviewContainer.innerHTML = '';
        }
    });

    function renderFilePreview(file) {
        filePreviewContainer.innerHTML = '';
        filePreviewContainer.classList.add('active');

        const chip = document.createElement('div');
        chip.className = 'file-chip';

        // Determine icon based on extension
        const ext = file.name.split('.').pop().toLowerCase();
        let iconClass = 'fa-file-lines';
        let iconColor = 'var(--accent-primary)';

        if (ext === 'pdf') { iconClass = 'fa-file-pdf'; iconColor = '#ef4444'; }
        else if (ext === 'docx' || ext === 'doc') { iconClass = 'fa-file-word'; iconColor = '#2563eb'; }
        else if (ext === 'txt') { iconClass = 'fa-file-lines'; iconColor = '#3b82f6'; }

        const size = (file.size / 1024).toFixed(1) + ' KB';

        chip.innerHTML = `
            <div class="file-chip-icon" style="color: ${iconColor}">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="file-chip-info">
                <span class="file-chip-name">${file.name}</span>
                <span class="file-chip-size">${size}</span>
            </div>
            <button type="button" class="file-chip-remove" title="Remove file">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        chip.querySelector('.file-chip-remove').onclick = () => {
            fileUpload.value = '';
            filePreviewContainer.classList.remove('active');
            setTimeout(() => { filePreviewContainer.innerHTML = ''; }, 400);
        };

        filePreviewContainer.appendChild(chip);
        playProceduralSound('hover');
    }

    // Upload Menu (+ Button) Logic
    const plusBtn = document.getElementById('plus-btn');
    const uploadMenu = document.getElementById('upload-menu');
    
    if (plusBtn && uploadMenu) {
        plusBtn.addEventListener('click', () => {
            uploadMenu.classList.toggle('show');
        });
        
        document.querySelectorAll('.upload-menu-item').forEach(item => {
            item.addEventListener('click', () => uploadMenu.classList.remove('show'));
        });

        document.addEventListener('click', (e) => {
            if (!plusBtn.contains(e.target) && !uploadMenu.contains(e.target)) {
                uploadMenu.classList.remove('show');
            }
        });
    }

    // Add Voice Recognition (Speech-to-Text)
    const voiceBtn = document.getElementById('voice-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        let isRecording = false;
        
        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
        
        recognition.onstart = () => {
            isRecording = true;
            voiceBtn.classList.add('recording');
            messageInput.placeholder = "Listening...";
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value += transcript;
        };
        
        recognition.onend = () => {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            messageInput.placeholder = "Type your legal question or attach a file...";
        };
    } else {
        voiceBtn.style.display = 'none'; // Hide if browser doesn't support
    }

    // Export Chat Logic - Now generating a professional PDF Legal Report
    document.getElementById('export-chat').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(124, 58, 237); // Premium Purple
        doc.text("ClauseAI - Legal Analysis Report", 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated for: ${userName}`, 20, 30);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 35);
        doc.line(20, 40, 190, 40);
        
        let y = 50;
        const messages = chatWindow.querySelectorAll('.message');
        
        messages.forEach(msg => {
            const isUser = msg.classList.contains('user-message');
            const bubble = msg.querySelector('.bubble');
            if (bubble) {
                const text = bubble.innerText || bubble.textContent;
                
                // Role Label
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(isUser ? 59 : 124, isUser ? 130 : 58, isUser ? 246 : 237);
                doc.text(isUser ? "USER" : "CLAUSEAI", 20, y);
                y += 5;
                
                // Content
                doc.setFont(undefined, 'normal');
                doc.setTextColor(30, 30, 30);
                const splitText = doc.splitTextToSize(text, 170);
                
                if (y + (splitText.length * 5) > 280) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.text(splitText, 20, y);
                y += (splitText.length * 5) + 10;
            }
        });
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`ClauseAI Premium Legal Assistant - Page ${i} of ${pageCount}`, 105, 290, null, null, "center");
        }
        
        doc.save(`ClauseAI_Legal_Report_${Date.now()}.pdf`);
        playProceduralSound('receive');
    });

    // ==========================================
    // EXCLUSIVE: RISK ANALYSIS ENGINE
    // ==========================================
    function updateRiskInsights(text) {
        const riskPath = document.getElementById('risk-path');
        const riskValue = document.getElementById('risk-value');
        const flagsContainer = document.getElementById('key-flags');
        const summaryContainer = document.getElementById('legal-summary');

        // Simple Keyword Analysis
    const highRiskKeywords = ['liable', 'breach', 'termination', 'indemnity', 'lawsuit', 'litigation', 'penalty', 'dispute', 'arbitration', 'court', 'unilateral'];
    const medRiskKeywords = ['notice', 'confidential', 'obligation', 'assignment', 'governing law', 'force majeure', 'compliance', 'warranty', 'guarantee'];
        
        let score = 0;
        let flags = [];

        highRiskKeywords.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                score += 15;
                flags.push({ type: 'high', text: `Critical ${word.charAt(0).toUpperCase() + word.slice(1)} clause detected.` });
            }
        });

        medRiskKeywords.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                score += 8;
                flags.push({ type: 'med', text: `Review ${word.charAt(0).toUpperCase() + word.slice(1)} requirements.` });
            }
        });

        score = Math.min(score, 100);
        
        // Update Gauge
        const offset = 125.6 - (125.6 * (score / 100));
        riskPath.style.strokeDashoffset = offset;
        riskValue.textContent = `${score}%`;
        
        // Update Color based on risk
        if (score > 60) riskPath.style.stroke = "#ef4444";
        else if (score > 30) riskPath.style.stroke = "#f59e0b";
        else riskPath.style.stroke = "var(--accent-primary)";

        // Render Flags
        if (flags.length > 0) {
            flagsContainer.innerHTML = '';
            flags.slice(0, 4).forEach(flag => {
                const div = document.createElement('div');
                div.className = `flag-item flag-${flag.type}`;
                div.innerHTML = `<i class="fa-solid ${flag.type === 'high' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i> <span>${flag.text}</span>`;
                flagsContainer.appendChild(div);
            });
        }

        // Generate dynamic summary
        summaryContainer.textContent = text.split('.')[0] + ". " + (text.split('.')[1] || "");
    }

    // ==========================================
    // EXCLUSIVE: Premium British Voice AI
    // ==========================================
    let premiumVoice = null;
    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        // Look for a sophisticated British accent (perfect for a Legal Assistant)
        premiumVoice = voices.find(v => v.name.includes('Google UK English Female')) || 
                       voices.find(v => v.lang === 'en-GB' && v.name.includes('Female')) ||
                       voices.find(v => v.lang === 'en-GB') ||
                       voices.find(v => v.lang.startsWith('en'));
    }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Try immediately just in case

    let currentAbortController = null;

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If a request is already running, the button acts as a STOP button
        if (appContainer.classList.contains('analyzing')) {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                hideTypingIndicator();
                appendMessage('ai', '_Analysis stopped by user._');
                return;
            }
        }

        const message = messageInput.value.trim();
        const file = fileUpload.files[0];

        if (!message && !file) return;

        // Hide quick prompts once conversation starts
        document.getElementById('quick-prompts').style.display = 'none';

        // Display user message with Rich Attachment
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            let iconClass = 'fa-file-lines';
            if (ext === 'pdf') iconClass = 'fa-file-pdf';
            else if (ext === 'docx' || ext === 'doc') iconClass = 'fa-file-word';
            
            const attachmentHTML = `
                <div class="file-attachment">
                    <i class="fa-solid ${iconClass}"></i>
                    <span>${file.name}</span>
                </div>
            `;
            appendMessage('user', message ? attachmentHTML + message : attachmentHTML);
        } else {
            appendMessage('user', message);
        }

        // Clear inputs immediately
        messageInput.value = '';
        fileUpload.value = '';
        filePreviewContainer.classList.remove('active');
        setTimeout(() => { filePreviewContainer.innerHTML = ''; }, 400);

        showTypingIndicator();
        
        // Initialize AbortController for this request
        currentAbortController = new AbortController();

        const formData = new FormData();
        if (message) formData.append('message', message);
        if (file) formData.append('file', file);

        // Show Scanning Overlay if file is attached
        if (file) {
            const overlay = document.createElement('div');
            overlay.className = 'scanning-overlay active';
            overlay.innerHTML = '<div class="scan-line"></div>';
            chatWindow.appendChild(overlay);
            showToast("Analyzing Document", `Processing ${file.name} for legal risks...`, "info");
            
            setTimeout(() => overlay.remove(), 3500);
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                body: formData,
                signal: currentAbortController.signal
            });

            const data = await response.json();
            hideTypingIndicator();
            currentAbortController = null;

            if (response.ok) {
                appendMessage('ai', data.reply);
                updateRiskInsights(data.reply); // Update the insights panel
                saveCurrentConversation(); // Save after AI response
                playProceduralSound('receive'); // Play Sci-Fi receive sound
                // TTS is manual only — use the speak button on each message bubble
                if (file) showToast("Analysis Complete", "Legal insights have been updated in the right panel.", "success");
            } else {
                appendMessage('ai', `Error: ${data.error || 'Something went wrong.'}`);
                showToast("System Error", data.error || "Could not process request.", "error");
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Error:', error);
                hideTypingIndicator();
                appendMessage('ai', 'Error: Could not connect to the server. Is the backend running?');
            }
            currentAbortController = null;
        }
    });

    // Highly advanced HTML Typewriter for letter-by-letter animation
    async function typeHTML(element, htmlString, speed = 12) {
        let i = 0;
        let isTag = false;
        let currentHTML = '';
        element.classList.add('typing-cursor');
        
        return new Promise(resolve => {
            function typeChar() {
                if (i < htmlString.length) {
                    let char = htmlString.charAt(i);
                    currentHTML += char;

                    if (char === '<') isTag = true;
                    if (char === '>') isTag = false;

                    // Skip HTML entities whole (e.g. &amp; &lt; &#39;) to prevent mid-entity corruption
                    if (!isTag && char === '&') {
                        const entityEnd = htmlString.indexOf(';', i);
                        if (entityEnd !== -1 && entityEnd - i <= 8) {
                            currentHTML += htmlString.slice(i + 1, entityEnd + 1);
                            i = entityEnd + 1;
                            element.innerHTML = currentHTML;
                            scrollToBottom();
                            setTimeout(typeChar, speed);
                            return;
                        }
                    }

                    if (!isTag) {
                        element.innerHTML = currentHTML;
                        scrollToBottom();
                        setTimeout(() => { i++; typeChar(); }, speed);
                    } else {
                        i++;
                        typeChar();
                    }
                } else {
                    element.classList.remove('typing-cursor');
                    resolve();
                }
            }
            typeChar();
        });
    }

    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar');
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.classList.add('bubble-wrapper');

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('bubble');
        
        // Use Markdown parsing for AI, plain text for User
        if (sender === 'ai') {
            const parsedHTML = marked.parse(text);
            
            // Actions wrapper for Copy and Text-to-Speech
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ai-actions';

            // Speak Button (Text-to-Speech)
            const speakBtn = document.createElement('button');
            speakBtn.className = 'action-btn';
            speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            speakBtn.title = 'Read Aloud';
            speakBtn.onclick = () => {
                // If already speaking, STOP the speech and return
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                    document.querySelectorAll('.bubble').forEach(b => b.classList.remove('speaking'));
                    speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                    return;
                }

                window.speechSynthesis.cancel(); // Clear any previous speech queue
                const cleanText = text
                    .replace(/[*#_`~>]/g, '') 
                    .replace(/-/g, ' ')
                    .replace(/\n+/g, '. ');
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                if (premiumVoice) utterance.voice = premiumVoice;
                
                // Remove speaking class from all other bubbles, add to this one
                document.querySelectorAll('.bubble').forEach(b => b.classList.remove('speaking'));
                
                utterance.onstart = () => {
                    bubbleDiv.classList.add('speaking');
                    speakBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; // Change to Stop icon
                };
                utterance.onend = () => {
                    bubbleDiv.classList.remove('speaking');
                    speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>'; // Change back to Play icon
                };
                
                window.speechSynthesis.speak(utterance);
            };

            // Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-btn';
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyBtn.title = 'Copy to clipboard';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(text);
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                showToast('Copied!', 'Response copied to clipboard.', 'success');
                setTimeout(() => { copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 2000);
            };
            
            actionsDiv.appendChild(speakBtn);
            actionsDiv.appendChild(copyBtn);
            
            // Start typewriter effect, then append actions and time
            typeHTML(bubbleDiv, parsedHTML).then(() => {
                bubbleWrapper.appendChild(actionsDiv);
            });
            
        } else {
            // Check if text contains HTML (for file attachments)
            if (text.includes('class="file-attachment"')) {
                bubbleDiv.innerHTML = text;
            } else {
                bubbleDiv.textContent = text;
            }
        }

        // Add Timestamp
        const timeNow = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('timestamp');
        timeDiv.textContent = timeNow;

        bubbleWrapper.appendChild(bubbleDiv);
        
        // For User, append time directly. For AI, wait for typing to finish.
        if (sender === 'user') {
            bubbleWrapper.appendChild(timeDiv);
        } else {
            // Append time after a slight delay to match typewriter finish
            setTimeout(() => bubbleWrapper.appendChild(timeDiv), 500); 
        }
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleWrapper);

        chatWindow.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        appContainer.classList.add('analyzing');
        sendIcon.className = 'fa-solid fa-square'; // Change to Stop Icon
        sendBtn.title = "Stop Generating";

        // Create Triple Dot Typing Message (ChatGPT style)
        const typingMsg = document.createElement('div');
        typingMsg.className = 'message ai-message typing-temp';
        typingMsg.innerHTML = `
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="bubble-wrapper">
                <div class="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatWindow.appendChild(typingMsg);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const temp = chatWindow.querySelector('.typing-temp');
        if (temp) temp.remove();
        
        appContainer.classList.remove('analyzing');
        sendIcon.className = 'fa-solid fa-paper-plane'; // Revert to Send Icon
        sendBtn.title = "Send";
    }

    // Auto-scroll logic with user override protection
    let userScrolledUp = false;
    
    // Detect if user manually scrolled up
    chatWindow.addEventListener('scroll', () => {
        if (chatWindow.scrollHeight - chatWindow.scrollTop - chatWindow.clientHeight > 50) {
            userScrolledUp = true;
        } else {
            userScrolledUp = false;
        }
    });

    function scrollToBottom() {
        if (!userScrolledUp) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    }
});
