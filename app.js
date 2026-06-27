(function(){
  "use strict";

  const STORAGE_KEY = "foodbridge_listings_v1";
  const ACCOUNTS_KEY = "foodbridge_accounts_v1";

  let currentUser = JSON.parse(localStorage.getItem("foodbridge_user")) || null;
  let registeredAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  let authMode = "login"; 

  const grid = document.getElementById('listing-grid');
  const dashGrid = document.getElementById('dash-listings-grid');
  const dashClaimsGrid = document.getElementById('dash-claims-grid');
  const heroTicker = document.getElementById('hero-ticker');
  const toast = document.getElementById('toast');
  const statActive = document.getElementById('stat-active');
  const statRescued = document.getElementById('stat-rescued');
  const tickerClockNow = document.getElementById('ticker-clock-now');

  const mainView = document.getElementById('main-view');
  const dashboardView = document.getElementById('dashboard-view');
  const authModal = document.getElementById('auth-modal');
  const profileModal = document.getElementById('profile-modal');
  
  const authActionTrigger = document.getElementById('auth-action-trigger');
  const dashLink = document.getElementById('nav-dash-link');
  const closeAuth = document.getElementById('close-auth');
  const closeProfile = document.getElementById('close-profile');
  const navBrand = document.getElementById('nav-brand');

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const authForm = document.getElementById('auth-form');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authNameWrapper = document.getElementById('auth-name-wrapper');
  const authNameInput = document.getElementById('auth-name-input');
  const authEmailInput = document.getElementById('auth-email-input');
  const authPasswordInput = document.getElementById('auth-password-input');
  
  const profNameInput = document.getElementById('prof-name-input');
  const profEmailInput = document.getElementById('prof-email-input');
  const profPasswordInput = document.getElementById('prof-password-input');

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 3000);
  }

  function seedData() {
    const now = Date.now();
    return [
      { id: "id_1", name: "Fresh Baked Loaves", category: "packaged", qty: "20 items", expiry: new Date(now + 45*60000).toISOString(), location: "Metro Bakery Central", contact: "Alex", phone: "987654321", status: "active", owner: "system", claimedBy: null },
      { id: "id_2", name: "Premium Vegetable Stew", category: "cooked", qty: "40 portions", expiry: new Date(now + 120*60000).toISOString(), location: "Harvest Kitchen, Block C", contact: "Samantha", phone: "912345678", status: "active", owner: "system", claimedBy: null },
      { id: "id_3", name: "Organic Garden Tomatoes", category: "veg", qty: "15 kg", expiry: new Date(now + 180*60000).toISOString(), location: "Green-Earth Organic Hub", contact: "Marcus", phone: "984512367", status: "active", owner: "system", claimedBy: null }
    ];
  }

  let listings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedData();
  let activeFilter = 'all';

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(listings)); }

  function updateAuthUI() {
    if (currentUser) {
      const displayName = currentUser.name || currentUser.email.split('@')[0];
      authActionTrigger.innerHTML = `<i class="fas fa-user-circle"></i> ${displayName}`;
      authActionTrigger.classList.add('logged-in');
      dashLink.classList.remove('hidden');
    } else {
      authActionTrigger.innerHTML = `<i class="fas fa-sign-in-alt"></i> Sign In / Register`;
      authActionTrigger.classList.remove('logged-in');
      dashLink.classList.add('hidden');
      showLanding();
    }
  }

  function showLanding() {
    dashboardView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }

  function showDashboard() {
    if(!currentUser) {
      showToast("Access Denied: Please sign in or register to view details.");
      setAuthMode("login");
      authModal.classList.remove('hidden');
      return;
    }
    mainView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderDashboard();
  }

  function setAuthMode(mode) {
    authMode = mode;
    authForm.reset();
    
    if(mode === "login") {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      authNameWrapper.classList.add('hidden');
      authNameInput.removeAttribute('required');
      authSubmitBtn.textContent = "Sign In";
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      authNameWrapper.classList.remove('hidden');
      authNameInput.setAttribute('required', 'required');
      authSubmitBtn.textContent = "Create Account";
    }
  }

  function fmtClock(ms){
    if (ms <= 0) return "Window Closed";
    const totalSec = Math.floor(ms/1000);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = totalSec%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function clockState(msLeft){
    if(msLeft <= 20*60000) return 'crit';
    if(msLeft < 60*60000) return 'warn';
    return 'ok';
  }

  function render() {
    const now = Date.now();
    let visible = listings.filter(l => (activeFilter === 'all' || l.category === activeFilter) && l.status === 'active');
    
    grid.innerHTML = '';
    if(visible.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">No active listings match these parameters.</div>`;
    }

    visible.forEach(item => {
      const msLeft = new Date(item.expiry) - now;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
          <h3 style="color:var(--primary-green); font-size:1.2rem; min-width:0; overflow-wrap:break-word; word-break:break-word;">${item.name}</h3>
          <span class="qty-badge">${item.qty}</span>
        </div>
        <div class="detail-text">
          <p><i class="fas fa-map-marker-alt"></i> <span>${item.location}</span></p>
          <p><i class="fas fa-phone-alt fa-flip-horizontal"></i> <span>${item.contact} · ${item.phone}</span></p>
        </div>
        <div class="clock ${clockState(msLeft)} mono" data-expiry="${item.expiry}">${fmtClock(msLeft)}</div>
        <div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">
          <button class="claim-btn" data-id="${item.id}">Claim Rescue</button>
          <a class="call-btn" href="tel:${item.phone}" style="background:var(--bg-beige); display:inline-flex; align-items:center; justify-content:center; gap:6px; flex-grow:1; text-align:center;">
            <i class="fas fa-phone-alt fa-flip-horizontal"></i> Call
          </a>
        </div>
      `;
      grid.appendChild(card);
    });

    heroTicker.innerHTML = '';
    listings.filter(l => l.status === 'active').slice(0, 4).forEach(item => {
      const msLeft = new Date(item.expiry) - now;
      const div = document.createElement('div');
      div.className = 'ticker-item';
      div.innerHTML = `<span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name} (${item.qty})</span><span class="ticker-clock mono">${msLeft > 0 ? fmtClock(msLeft).slice(3) : 'Closed'}</span>`;
      heroTicker.appendChild(div);
    });

    statActive.textContent = listings.filter(l => l.status === 'active').length;
    statRescued.textContent = listings.filter(l => l.status === 'claimed').length + 142;
  }

  function renderDashboard() {
    if(!currentUser) return;
    
    const userDonations = listings.filter(l => l.owner === currentUser.email);
    dashGrid.innerHTML = '';
    if(userDonations.length === 0) {
      dashGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#888;"><i class="fas fa-info-circle"></i> You have not posted any donation supplies yet.</div>`;
    } else {
      userDonations.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
            <h3 style="color:var(--primary-green); min-width:0; overflow-wrap:break-word;">${item.name}</h3>
            <span class="qty-badge" style="background:var(--accent-orange); color:white;">${item.status.toUpperCase()}</span>
          </div>
          <div class="detail-text" style="margin-top:6px;">
            <p><i class="fas fa-box"></i> <span>Qty: ${item.qty}</span></p>
            <p><i class="fas fa-map-marker-alt"></i> <span>${item.location}</span></p>
          </div>
        `;
        dashGrid.appendChild(card);
      });
    }

    const userClaims = listings.filter(l => l.claimedBy === currentUser.email);
    dashClaimsGrid.innerHTML = '';
    if(userClaims.length === 0) {
      dashClaimsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#888;"><i class="fas fa-info-circle"></i> You have not claimed any active rescues yet.</div>`;
    } else {
      userClaims.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
            <h3 style="color:var(--green-dark); min-width:0; overflow-wrap:break-word;">${item.name}</h3>
            <span class="qty-badge" style="background:var(--primary-green); color:white;">CLAIMED</span>
          </div>
          <div class="detail-text" style="margin-top:6px;">
            <p><i class="fas fa-box"></i> <span>Qty: ${item.qty}</span></p>
            <p><i class="fas fa-phone-alt fa-flip-horizontal"></i> <span>Contact: ${item.contact} (${item.phone})</span></p>
            <p><i class="fas fa-map-marker-alt"></i> <span>Pickup: ${item.location}</span></p>
          </div>
        `;
        dashClaimsGrid.appendChild(card);
      });
    }
  }

  setInterval(() => {
    tickerClockNow.textContent = new Date().toLocaleTimeString();
    document.querySelectorAll('[data-expiry]').forEach(el => {
      const msLeft = new Date(el.dataset.expiry) - Date.now();
      el.textContent = fmtClock(msLeft);
    });
  }, 1000);

  document.getElementById('donate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!currentUser) {
      showToast("Access Denied: Please login or register before publishing donations.");
      setAuthMode("login");
      authModal.classList.remove('hidden');
      return;
    }

    const expiryVal = document.getElementById('f-expiry').value;
    if(new Date(expiryVal) <= new Date()){
      return showToast("Error: Expiration threshold date must be set in the future!");
    }

    const newListing = {
      id: "id_" + Math.random().toString(36).slice(2,9),
      name: document.getElementById('f-name').value,
      category: document.getElementById('f-category').value,
      qty: document.getElementById('f-qty').value,
      expiry: new Date(expiryVal).toISOString(),
      location: document.getElementById('f-location').value,
      contact: document.getElementById('f-contact').value,
      phone: document.getElementById('f-phone').value,
      status: "active",
      owner: currentUser.email,
      claimedBy: null
    };

    listings.unshift(newListing);
    save();
    render();
    renderDashboard();
    document.getElementById('donate-form').reset();
    showToast("Success! Your listing is live.");
  });

  grid.addEventListener('click', (e) => {
    if(e.target.classList.contains('claim-btn')) {
      if(!currentUser) {
        showToast("Access Denied: You must sign in or register before claiming food items.");
        setAuthMode("login");
        authModal.classList.remove('hidden');
        return;
      }

      const id = e.target.dataset.id;
      const targetItem = listings.find(l => l.id === id);
      if(targetItem) {
        targetItem.status = 'claimed';
        targetItem.claimedBy = currentUser.email;
        save();
        render();
        renderDashboard();
        showToast(`Asset "${targetItem.name}" claimed successfully.`);
      }
    }
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      render();
    });
  });

  authActionTrigger.addEventListener('click', () => {
    if (currentUser) {
      profNameInput.value = currentUser.name || "";
      profEmailInput.value = currentUser.email || "";
      profPasswordInput.value = ""; 
      profileModal.classList.remove('hidden');
    } else {
      setAuthMode("login");
      authModal.classList.remove('hidden');
    }
  });

  closeAuth.addEventListener('click', () => { authModal.classList.add('hidden'); });
  closeProfile.addEventListener('click', () => { profileModal.classList.add('hidden'); });

  dashLink.addEventListener('click', showDashboard);
  navBrand.addEventListener('click', showLanding);
  document.getElementById('link-listings').addEventListener('click', showLanding);
  document.getElementById('link-donate').addEventListener('click', showLanding);

  tabLogin.addEventListener('click', () => setAuthMode("login"));
  tabRegister.addEventListener('click', () => setAuthMode("register"));

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim().toLowerCase();
    const password = authPasswordInput.value;
    
    if (authMode === "register") {
      const matchingAccount = registeredAccounts.find(a => a.email === email);
      if (matchingAccount) {
        showToast("Registration Refused: Email already registered.");
        setAuthMode("login");
        return;
      }
      
      const name = authNameInput.value.trim() || email.split('@')[0];
      registeredAccounts.push({ name: name, email: email, password: password });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registeredAccounts));
      showToast("Account registered! You can now sign in.");
      setAuthMode("login");
    } else {
      const match = registeredAccounts.find(a => a.email === email && a.password === password);
      if (!match) {
        showToast("Access Denied: Incorrect email address or password configuration.");
        return;
      }
      currentUser = match;
      localStorage.setItem("foodbridge_user", JSON.stringify(currentUser));
      updateAuthUI();
      authModal.classList.add('hidden');
      authForm.reset();
      showToast("Logged in successfully.");
      renderDashboard();
    }
  });

  document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const oldEmail = currentUser.email;
    const newName = profNameInput.value.trim();
    const newEmail = profEmailInput.value.trim().toLowerCase();
    const newPassword = profPasswordInput.value;

    const accountIndex = registeredAccounts.findIndex(a => a.email === oldEmail);
    if(accountIndex !== -1) {
      const fallbackPassword = registeredAccounts[accountIndex].password || "password123";
      
      registeredAccounts[accountIndex] = { 
        name: newName, 
        email: newEmail,
        password: newPassword.length > 0 ? newPassword : fallbackPassword
      };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registeredAccounts));
    }

    listings.forEach(l => {
      if(l.owner === oldEmail) l.owner = newEmail;
      if(l.claimedBy === oldEmail) l.claimedBy = newEmail;
    });
    save();

    currentUser = registeredAccounts.find(a => a.email === newEmail);
    localStorage.setItem("foodbridge_user", JSON.stringify(currentUser));
    
    updateAuthUI();
    renderDashboard();
    profileModal.classList.add('hidden');
    showToast("Profile details updated successfully.");
  });

  document.getElementById('prof-logout-btn').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem("foodbridge_user");
    profileModal.classList.add('hidden');
    updateAuthUI();
    showToast("Session closed.");
  });

  updateAuthUI();
  render();
})();