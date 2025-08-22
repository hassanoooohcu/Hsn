document.addEventListener('DOMContentLoaded', () => {
    // --- العناصر ---
    const dateDisplay = document.getElementById('date-display');
    const totalTodayEl = document.getElementById('total-today-count');
    const totalAllTimeEl = document.getElementById('total-all-time-count');
    const gardenArea = document.getElementById('garden-area');
    const counterDisplaySpan = document.getElementById('counter-display-span');
    const goalDisplaySpan = document.getElementById('goal-progress-span');
    const dhikrDropdown = document.querySelector('.dhikr-dropdown');
    const currentDhikrBtn = document.getElementById('current-dhikr-btn');
    const currentDhikrText = document.getElementById('current-dhikr-text');
    const mainCounterBtn = document.getElementById('main-counter-btn');
    const dhikrListContainer = document.getElementById('dhikr-list');
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    const modalOverlay = document.getElementById('modal-overlay');
    const addDhikrModal = document.getElementById('add-dhikr-modal');
    const setGoalModal = document.getElementById('set-goal-modal');
    const addDhikrBtn = document.getElementById('add-dhikr-btn');
    const setGoalBtn = document.getElementById('set-goal-btn');
    
    // --- إعدادات الحديقة ---
    const GARDEN_RESET_COUNT = 6;      // عدد النخيل قبل إعادة تعيين الحديقة بصريًا
    const PALM_BASE_SIZE = 6;           // الحجم الأساسي للنخلة (بالـ rem)
    const PALM_HORIZONTAL_GAP = 3;      // المسافة الأفقية بين كل نخلة (بالـ px)
    const PALM_VERTICAL_GAP = 10;       // المسافة الرأسية بين كل صف (بالـ px)
    const PALM_BOTTOM_MARGIN = 140;      // المسافة من أسفل الأرض (بالـ px)

    // --- البيانات ---
    let adhkar = [
        { key: "subhanAllah", text: "سبحان الله وبحمده", goal: 100 },
        { key: "salawat", text: "اللهم صل على محمد", goal: 100 },
        { key: "istighfar", text: "أستغفر الله", goal: 100 },
        { key: "hawqala", text: "لا حول ولا قوة إلا بالله", goal: 100 },
        { key: "alhamdulillah", text: "الحمد لله", goal: 100 },
        { key: "allahuakbar", text: "الله أكبر", goal: 100 },
    ];
    let currentDhikrIndex = 0;
    let dailyCounts = {};
    let totalCounts = {};

    const loadState = () => {
        const today = new Date().toISOString().slice(0, 10);
        const lastVisitDate = localStorage.getItem('tasbih_last_visit_v7');
        
        const savedAdhkar = JSON.parse(localStorage.getItem('tasbih_adhkar_v7'));
        if (savedAdhkar) adhkar = savedAdhkar;
        totalCounts = JSON.parse(localStorage.getItem('tasbih_total_counts_v7')) || {};
        
        if (today !== lastVisitDate) {
            dailyCounts = {};
        } else {
            dailyCounts = JSON.parse(localStorage.getItem('tasbih_daily_counts_v7')) || {};
        }
        localStorage.setItem('tasbih_last_visit_v7', today);

        currentDhikrIndex = parseInt(localStorage.getItem('tasbih_current_index_v7') || '0', 10);
        if (currentDhikrIndex >= adhkar.length) currentDhikrIndex = 0;
        
        adhkar.forEach(dhikr => {
            if (dailyCounts[dhikr.key] === undefined) dailyCounts[dhikr.key] = 0;
            if (totalCounts[dhikr.key] === undefined) totalCounts[dhikr.key] = 0;
        });

        renderDhikrList();
        updateUI();
    };

    const saveState = () => {
        localStorage.setItem('tasbih_adhkar_v7', JSON.stringify(adhkar));
        localStorage.setItem('tasbih_daily_counts_v7', JSON.stringify(dailyCounts));
        localStorage.setItem('tasbih_total_counts_v7', JSON.stringify(totalCounts));
        localStorage.setItem('tasbih_current_index_v7', currentDhikrIndex);
    };

    const updateUI = () => {
        const currentDhikr = adhkar[currentDhikrIndex];
        const currentDailyCount = dailyCounts[currentDhikr.key] || 0;
        currentDhikrText.textContent = currentDhikr.text;
        counterDisplaySpan.textContent = currentDailyCount;
        goalDisplaySpan.textContent = `${currentDailyCount} / ${currentDhikr.goal}`;
        
        const totalToday = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0);
        const totalAllTime = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
        totalTodayEl.textContent = `مجموع اليوم: ${totalToday}`;
        totalAllTimeEl.textContent = `الإجمالي: ${totalAllTime}`;
        
        renderGarden();
        renderDhikrList();
    };

    const renderDhikrList = () => {
        dhikrListContainer.innerHTML = '';
        adhkar.forEach((dhikr, index) => {
            const item = document.createElement('div');
            item.className = 'dhikr-item';
            item.dataset.index = index;
            const totalCount = totalCounts[dhikr.key] || 0;
            item.innerHTML = `<span>${dhikr.text}</span> <span class="dhikr-total-count">${totalCount}</span>`;
            item.addEventListener('click', () => {
                if (currentDhikrIndex !== index) {
                    currentDhikrIndex = index;
                    updateUI();
                }
                dhikrDropdown.classList.remove('open');
            });
            dhikrListContainer.appendChild(item);
        });
        const addItemBtn = document.createElement('div');
        addItemBtn.id = 'add-dhikr-list-btn';
        addItemBtn.className = 'dhikr-item add-item';
        addItemBtn.textContent = "+ إضافة ذكر جديد";
        addItemBtn.addEventListener('click', openAddDhikrModal);
        dhikrListContainer.appendChild(addItemBtn);
    };
    
    const renderGarden = () => {
        gardenArea.innerHTML = '<div class="sky"><div class="sun"></div></div><div class="ground"></div>';
        const currentKey = adhkar[currentDhikrIndex].key;
        let count = dailyCounts[currentKey] || 0;
        let displayCount = count % GARDEN_RESET_COUNT;
        if (displayCount === 0 && count > 0) displayCount = GARDEN_RESET_COUNT;

        for (let i = 0; i < displayCount; i++) {
            createPalmTree(i, true);
        }
    };
    
    const calculateTreePosition = (index) => {
        const gardenWidth = gardenArea.clientWidth; 
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const treeWidth = PALM_BASE_SIZE * rootFontSize * 0.5; // تقدير عرض النخلة
        const treesPerRow = Math.max(1, Math.floor(gardenWidth / (treeWidth + PALM_HORIZONTAL_GAP)));
        
        const row = Math.floor(index / treesPerRow);
        const indexInRow = index % treesPerRow;
        
        const totalRowWidth = (treesPerRow * (treeWidth + PALM_HORIZONTAL_GAP)) - PALM_HORIZONTAL_GAP;
        const startOffset = (gardenWidth - totalRowWidth) / 2;

        const x = startOffset + indexInRow * (treeWidth + PALM_HORIZONTAL_GAP);
        const y = 5 + (row * PALM_VERTICAL_GAP);

        return { x, y };
    };

    const createPalmTree = (index, isInitialRender = false) => {
        const { x, y } = calculateTreePosition(index);

        if (y > gardenArea.offsetHeight - (PALM_BASE_SIZE * 16)) return;
        
        const tree = document.createElement('div');
        tree.className = 'palm-tree';
        tree.textContent = '🌴';
        tree.style.fontSize = `${PALM_BASE_SIZE}rem`;
        tree.style.bottom = `${PALM_BOTTOM_MARGIN}px`;
        tree.style.left = `${x}px`;
        tree.style.bottom = `${y}px`;
        
        const depthFactor = 1 - (y / (gardenArea.offsetHeight * 1.5));
        tree.style.setProperty('--scale', depthFactor);
        tree.style.setProperty('--opacity', depthFactor);
        tree.style.zIndex = Math.floor(y);
        gardenArea.appendChild(tree);

        if (!isInitialRender) {
            setTimeout(() => {
                tree.classList.add('visible');
                const count = dailyCounts[adhkar[currentDhikrIndex].key];
                const displayCount = count % GARDEN_RESET_COUNT || GARDEN_RESET_COUNT;
                if(index === displayCount - 1) {
                   createLeafEffect(tree);
                }
            }, 10);
        } else {
            requestAnimationFrame(() => tree.classList.add('visible'));
        }
    };

    const createLeafEffect = (treeElement) => {
        const rect = treeElement.getBoundingClientRect();
        const gardenRect = gardenArea.getBoundingClientRect();
        if (!gardenRect) return;
        const x = rect.left - gardenRect.left + (rect.width / 2);
        const y = rect.top - gardenRect.top;
        for (let i = 0; i < 5; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf-effect';
            leaf.style.left = `${x}px`;
            leaf.style.top = `${y}px`;
            leaf.style.setProperty('--x-end', `${(Math.random() - 0.5) * 80}px`);
            leaf.style.setProperty('--r-end', `${(Math.random() - 0.5) * 360}deg`);
            gardenArea.appendChild(leaf);
            leaf.addEventListener('animationend', () => leaf.remove());
        }
    };

    const showToast = (message) => {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const incrementCounter = () => {
        const currentKey = adhkar[currentDhikrIndex].key;
        const currentDhikr = adhkar[currentDhikrIndex];
        dailyCounts[currentKey]++;
        totalCounts[currentKey]++;
        
        if (dailyCounts[currentKey] === currentDhikr.goal) {
            showToast(`ما شاء الله! أتممت هدف اليوم: ${currentDhikr.goal} مرة.`);
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
        
        let displayIndex = (dailyCounts[currentKey] - 1) % GARDEN_RESET_COUNT;
        
        if (displayIndex === 0 && dailyCounts[currentKey] > GARDEN_RESET_COUNT) {
             renderGarden();
        } else {
            createPalmTree(displayIndex, false);
        }
        
        updateUI();
        saveState();
    };
    
    const openModal = (modalElement) => {
        modalOverlay.classList.add('show');
        modalOverlay.querySelectorAll('.modal-content').forEach(m => m.classList.remove('active'));
        modalElement.classList.add('active');
    };
    const closeModal = () => {
        const activeModal = document.querySelector('.modal-content.active');
        if (activeModal) activeModal.classList.remove('active');
        modalOverlay.classList.remove('show');
    };

    const openAddDhikrModal = () => {
        dhikrDropdown.classList.remove('open');
        document.getElementById('new-dhikr-text').value = '';
        document.getElementById('new-dhikr-goal').value = '100';
        openModal(addDhikrModal);
    };
    
    mainCounterBtn.addEventListener('click', incrementCounter);
    currentDhikrBtn.addEventListener('click', () => dhikrDropdown.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (!dhikrDropdown.contains(e.target)) dhikrDropdown.classList.remove('open');
    });

    addDhikrBtn.addEventListener('click', openAddDhikrModal);
    setGoalBtn.addEventListener('click', () => {
        document.getElementById('new-goal-input').value = adhkar[currentDhikrIndex].goal;
        openModal(setGoalModal);
    });

    document.getElementById('confirm-add-dhikr').addEventListener('click', () => {
        const text = document.getElementById('new-dhikr-text').value.trim();
        const goal = parseInt(document.getElementById('new-dhikr-goal').value, 10);
        if (text && goal > 0) {
            const newKey = `custom_${Date.now()}`;
            adhkar.push({ key: newKey, text, goal });
            dailyCounts[newKey] = 0; totalCounts[newKey] = 0;
            currentDhikrIndex = adhkar.length - 1;
            renderDhikrList(); updateUI(); saveState(); closeModal();
        } else { alert("الرجاء إدخال بيانات صحيحة."); }
    });

    document.getElementById('confirm-set-goal').addEventListener('click', () => {
        const goal = parseInt(document.getElementById('new-goal-input').value, 10);
        if (goal > 0) {
            adhkar[currentDhikrIndex].goal = goal;
            updateUI(); saveState(); closeModal(); showToast(`تم تحديد الهدف الجديد: ${goal}`);
        } else { alert("الرجاء إدخال عدد صحيح أكبر من صفر."); }
    });
    
    document.getElementById('cancel-add-dhikr').addEventListener('click', closeModal);
    document.getElementById('cancel-set-goal').addEventListener('click', closeModal);

    window.addEventListener('resize', renderGarden);
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateDisplay.textContent = new Date().toLocaleDateString('ar-EG', options);
    loadState();
});
