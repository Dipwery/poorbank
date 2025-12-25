const _supabaseUrl = 'https://dnelzlyuhhxloysstnlg.supabase.co';
const _supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZWx6bHl1aGh4bG95c3N0bmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM4MjAsImV4cCI6MjA4MTQyOTgyMH0.jYdJM1FTJja_A5CdTN3C3FWlKd_0E1JgHyaM4767SLc';

const supabaseClient = supabase.createClient(_supabaseUrl, _supabaseKey);

// --- ১. সাইন আপ / সেভ ডাটা ---
async function saveData() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    
    if(!email || !pass) return alert("সব ঘর পূরণ করুন!");
    
    const text = email + " : " + pass;
    
    const { error } = await supabaseClient
        .from('entries')
        .insert([{ content: text, tk: 0, nameuser: 'New User' }]); // tk number হিসেবে পাঠাচ্ছি

    if (error) alert("এরর: " + error.message);
    else {
        alert("অ্যাকাউন্ট তৈরি হয়েছে!");
        localStorage.setItem("userSession", text); 
        window.location.href = "home.html";
    }
}

// --- ২. লগইন ফাংশন ---
async function showData() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    const text = email + " : " + pass;
    
    const { data, error } = await supabaseClient
        .from('entries')
        .select('content')
        .eq('content', text);
        
    if (error) {
        alert("ডাটাবেস কানেকশন সমস্যা!");
    } else if (data && data.length > 0) {
        localStorage.setItem("userSession", text); 
        alert("সফল লগইন!");
        window.location.href = "home.html";
    } else {
        alert("ভুল ইমেইল বা পাসওয়ার্ড!");
    }
}

// --- ৩. টাকা জমা দেওয়া (Fix: 2030 logic) ---
async function savetk() {
    const tkInput = document.getElementById('amount').value;
    const tkToAdd = parseFloat(tkInput); 
    const userSession = localStorage.getItem("userSession"); 

    if(!tkInput || isNaN(tkToAdd)) return alert("সঠিক টাকার অংক লিখুন!");

    // বর্তমান ব্যালেন্স আনা
    const { data } = await supabaseClient
        .from('entries')
        .select('tk')
        .eq('content', userSession);

    const currentTk = parseFloat(data[0].tk) || 0;
    const totalTk = currentTk + tkToAdd; // গাণিতিক যোগফল

    const { error } = await supabaseClient
        .from('entries')
        .update({ tk: totalTk })
        .eq('content', userSession);

    if(error) alert("এরর: " + error.message);
    else alert("টাকা সেভ হয়েছে!");
}

// --- ৪. ব্যালেন্স দেখা ---
async function viewtk() {
    const userSession = localStorage.getItem("userSession");
    if(!userSession) return;

    const { data } = await supabaseClient
        .from('entries')
        .select('tk')
        .eq('content', userSession);

    if(data && data[0]) {
        document.getElementById('ttk').innerText = '৳' + data[0].tk;
    }
}

// --- ৫. টাকা উইথড্র করা ---
async function witdrow() {
    const tkInput = document.getElementById('withdraw-amount').value;
    const tkToWithdraw = parseFloat(tkInput);
    const userSession = localStorage.getItem("userSession");

    if(!tkToWithdraw || isNaN(tkToWithdraw)) return alert("টাকা লিখুন!");

    const { data } = await supabaseClient
        .from('entries')
        .select('tk')
        .eq('content', userSession);

    const currentTk = parseFloat(data[0].tk) || 0;

    if(tkToWithdraw > currentTk) return alert("আপনার কাছে এত টাকা নেই!");

    const { error } = await supabaseClient
        .from('entries')
        .update({ tk: currentTk - tkToWithdraw })
        .eq('content', userSession);

    if(error) alert("এরর: " + error.message);
    else alert("টাকা উইথড্র হয়েছে!");
}

// --- ৬. ইউজার প্রোফাইল আপডেট (ফটোসহ) ---
async function updateUserInfo() {
    const name = document.getElementById('nameAccount').value;
    const newPassword = document.getElementById('changePassword').value;
    const file = document.getElementById('userPhoto').files[0];
    const userSession = localStorage.getItem("userSession");

    if(!name || !newPassword) return alert("সব ঘর পূরণ করুন!");

    const email = userSession.split(" : ")[0];
    const updatedSession = email + " : " + newPassword;

    const { error } = await supabaseClient
        .from('entries')
        .update({ content: updatedSession, nameuser: name })
        .eq('content', userSession);

    if (error) {
        alert("এরর: " + error.message);
    } else {
        if(file){
            const { error: uploadError } = await supabaseClient
                .storage
                .from('poorpbank')
                .upload(email + '_profile', file, { upsert: true });

            if (uploadError) alert("ফটো আপলোড এরর: " + uploadError.message);
        }
        alert("ইনফো আপডেট হয়েছে!");
        localStorage.setItem("userSession", updatedSession); 
    }
}

// --- ৭. ইউজার ইনফো লোড করা (Home Page) ---
async function loadUserInfo() {
    const userSession = localStorage.getItem("userSession");
    if(!userSession) return;

    const email = userSession.split(" : ")[0];

    const { data } = await supabaseClient
        .from('entries')
        .select('nameuser')
        .eq('content', userSession);

    if (data && data[0]) {
        const userName = data[0].nameuser || "User";
        if(document.getElementById('currentName')) document.getElementById('currentName').innerText = "Welcome, " + userName + "!";
        if(document.getElementById('Name')) document.getElementById('Name').innerText = "Welcome, " + userName;

        const { data: photoData } = supabaseClient
            .storage
            .from('poorpbank')
            .getPublicUrl(email + '_profile');

        const finalUrl = photoData.publicUrl + "?t=" + new Date().getTime();
        if(document.getElementById('currentPhoto')) document.getElementById('currentPhoto').src = finalUrl;
        if(document.getElementById('Photo')) document.getElementById('Photo').src = finalUrl;
    }
}
function logout() {
    localStorage.removeItem("userSession");
    window.location.href = "index.html";
}
if(window.location.pathname.includes("home.html") || window.location.pathname.includes("user.html")) {
    loadUserInfo();
    viewtk();
    setInterval(viewtk, 1000);
}