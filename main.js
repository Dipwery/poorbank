const _supabaseUrl = 'https://dnelzlyuhhxloysstnlg.supabase.co';
const _supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZWx6bHl1aGh4bG95c3N0bmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM4MjAsImV4cCI6MjA4MTQyOTgyMH0.jYdJM1FTJja_A5CdTN3C3FWlKd_0E1JgHyaM4767SLc';

const supabaseClient = supabase.createClient(_supabaseUrl, _supabaseKey);

async function saveData() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    
    if(!email || !pass) return alert("সব ঘর পূরণ করুন!");
    
    const text = email + " : " + pass;
    
    const { error } = await supabaseClient
        .from('entries')
        .insert([{ content: text, tk: '0' }]);

    if (error) alert("এরর: " + error.message);
    else {
        alert("সেভ হয়েছে!");
        localStorage.setItem("userSession", text); 
    }
    
}
function autofild(){
    const sv= localStorage.getItem("userSession");
    if(sv){
        const parts = sv.split(" : ");
        document.getElementById('emailInput').value = parts[0];
        document.getElementById('passwordInput').value = parts[1];
        window.location.href = "home.html";
    }
}
setInterval(() => {
    autofild();
}, 1000);

async function showData() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    const text = email + " : " + pass;
    
    const { data, error } = await supabaseClient
        .from('entries')
        .select('content');
        
    if (error) {
        alert("ডাটাবেস কানেকশন সমস্যা!");
    } else if (data && data.some(entry => entry.content === text)) {
        localStorage.setItem("userSession", text); 
        alert("সঠিক তথ্য!");
        window.location.href = "home.html";
    } else {
        alert("ভুল তথ্য!");
    }
}

async function savetk() {
    const tk = document.getElementById('amount').value;
    const userSession = localStorage.getItem("userSession"); 

    if(!tk) return alert("টাকা লিখুন!");
        const { data } = await supabaseClient
            .from('entries')
            .select('tk')
            .eq('content', userSession);

        const ttk= data[0].tk;



    const { error } = await supabaseClient
        .from('entries')
        .update({ tk: tk+ttk })
        .eq('content', userSession);

    if(error) alert("এরর: " + error.message);
    else alert("টাকা সেভ হয়েছে!");
}
async function viewtk() {
    const userSession = localStorage.getItem("userSession");
     const { data } = await supabaseClient
            .from('entries')
            .select('tk')
            .eq('content', userSession);

        const ttk= data[0].tk;
        document.getElementById('ttk').innerText = '৳' + ttk;
}
setInterval(() => {
    viewtk();
}, 1000);
async function logout() {
    localStorage.removeItem("userSession");
    window.location.href = "index.html";
}

async function witdrow() {
    const tk = parseFloat(document.getElementById('withdraw-amount').value);
    const userSession = localStorage.getItem("userSession");
    if(!tk) return alert("টাকা লিখুন!");
        const { data } = await supabaseClient
            .from('entries')
            .select('tk')
            .eq('content', userSession);
        const ttk = parseFloat(data[0].tk);
        if(tk>ttk) return alert("আপনার কাছে এত টাকা নেই!");
    const { error } = await supabaseClient
        .from('entries')
        .update({ tk: ttk - tk })
        .eq('content', userSession);
    if(error) alert("এরর: " + error.message);
    else alert("টাকা উইথড্র হয়েছে!");
}

// ১. ইউজার ইনফো আপডেট এবং ফটো আপলোড
async function updateUserInfo() {
    const name = document.getElementById('nameAccount').value;
    const newPassword = document.getElementById('changePassword').value;
    const file = document.getElementById('userPhoto').files[0];
    const userSession = localStorage.getItem("userSession");

    if(!name || !newPassword) return alert("সব ঘর পূরণ করুন!");

    const parts = userSession.split(" : ");
    const email = parts[0];
    const updatedSession = email + " : " + newPassword;

    // ডাটাবেস আপডেট
    const { error } = await supabaseClient
        .from('entries')
        .update({ content: updatedSession, nameuser: name })
        .eq('content', userSession);

    if (error) {
        alert("এরর: " + error.message);
    } else {
        // যদি ফাইল সিলেক্ট করা থাকে তবে আপলোড হবে
        if(file){
            // আপলোড করার সময় upsert: true দিলে পুরনো ছবি পরিবর্তন হয়ে নতুন ছবি আসবে
            const { error: uploadError } = await supabaseClient
                .storage
                .from('poorpbank')
                .upload(email + '_profile', file, { upsert: true });

            if (uploadError) {
                alert("ফটো আপলোড এরর: " + uploadError.message);
                return;
            }
        }
        alert("ইনফো আপডেট হয়েছে!");
        localStorage.setItem("userSession", updatedSession); 
    }
}

// ২. ইউজার ইনফো এবং ছবি লোড করা
async function loadUserInfo() {
    const userSession = localStorage.getItem("userSession");
    if(!userSession) return;

    const parts = userSession.split(" : ");
    const email = parts[0];

    const { data, error } = await supabaseClient
        .from('entries')
        .select('nameuser')
        .eq('content', userSession);

    if (data && data[0]) {
        // নাম সেট করা
        const userName = data[0].nameuser || "User";
        const nameElement = document.getElementById('currentName');
        if(nameElement) nameElement.innerText = "Welcome, " + userName + "!";
        
        const homeName = document.getElementById('Name');
        if(homeName) homeName.innerText = "Welcome, " + userName;

        // ছবির পাবলিক ইউআরএল নেওয়া
        const { data: photoData } = supabaseClient
            .storage
            .from('poorpbank')
            .getPublicUrl(email + '_profile');

        if (photoData.publicUrl) {
            // ছবির সোর্স আপডেট (Cache এড়িয়ে নতুন ছবি দেখানোর জন্য টাইমস্ট্যাম্প যোগ করা হয়েছে)
            const finalUrl = photoData.publicUrl + "?t=" + new Date().getTime();
            
            const currentPhoto = document.getElementById('currentPhoto');
            if(currentPhoto) currentPhoto.src = finalUrl;

            const mainPhoto = document.getElementById('Photo');
            if(mainPhoto) mainPhoto.src = finalUrl;
        }
    }
}

// পেজ লোড হওয়ার পর একবার কল হবে
loadUserInfo();

// সেভ করা টাকা আপডেট দেখার জন্য ছোট ইন্টারভাল (১০০০ms থেকে বাড়িয়ে ৩০০০ms করা ভালো)
setInterval(() => {
    viewtk();
}, 3000);