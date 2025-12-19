function passwordProtect() {
    const correctPassword = "123456";
    const passwordInput = document.getElementById("passwordInput").value;
    
    if (passwordInput === correctPassword) {
        document.getElementById("lock").style.display = "none";
        // hyper link
        window.location.href = "home.html";
    } else {
        alert("Incorrect password!");
    }
}
let list= [];
list = JSON.parse(localStorage.getItem("history")) || [];
function saveDeposit() {
    const amount = document.getElementById("amount").value;
    if (amount && !isNaN(amount) && amount > 0) {
        let currentBalance = parseFloat(localStorage.getItem("balance")) || 0;
        currentBalance += parseFloat(amount);
        localStorage.setItem("balance", currentBalance.toFixed(2));
        alert(`Deposit successful! New balance: $${currentBalance.toFixed(2)}`);
        document.getElementById("amount").value = "";
        let date = new Date();
        list.push({'savedAmount':amount,'date':date.toLocaleString()});
        localStorage.setItem("history", JSON.stringify(list));
    } else {
        alert("Please enter a valid amount.");
    }   
}
function showBalance() {
    let currentBalance = parseFloat(localStorage.getItem("balance")) || 0;
    document.getElementById("ttk").innerText = currentBalance.toFixed(2)+'TK';
}
showBalance();

function Withdraw() {
    const amount = document.getElementById("withdraw-amount").value;
    if (amount && !isNaN(amount) && amount > 0) {
        let currentBalance = parseFloat(localStorage.getItem("balance")) || 0;
        if (currentBalance >= parseFloat(amount)) {
            currentBalance -= parseFloat(amount);
            localStorage.setItem("balance", currentBalance.toFixed(2));
            alert(`Withdrawal successful! New balance: $${currentBalance.toFixed(2)}`);
            document.getElementById("withdraw-amount").value = "";
            let date = new Date();
            list.push({'withdrawnAmount':amount,'date':date.toLocaleString()});
            localStorage.setItem("history", JSON.stringify(list));

        } else {
            alert("Insufficient funds.");
        }
    } else {
        alert("Please enter a valid amount.");
    }
}
function pdfGenerate() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yOffset = 10;
    doc.setFontSize(16);
    doc.text("Transaction History", 10, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    list.forEach((entry, index) => {
        let entryText = `${index + 1}. `;   
        if (entry.savedAmount) {
            entryText += `Deposited: $${entry.savedAmount} on ${entry.date}`;
        } else if (entry.withdrawnAmount) {
            entryText += `Withdrawn: $${entry.withdrawnAmount} on ${entry.date}`;
        }
        doc.text(entryText, 10, yOffset);
        yOffset += 10;

        if (yOffset > 280) {
            doc.addPage();
            yOffset = 10;
        }   
    });
    doc.save("transaction_history.pdf");
}