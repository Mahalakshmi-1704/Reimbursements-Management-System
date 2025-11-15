const API_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

function updateNav() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navLogin = document.getElementById("navLogin");
  const navRegister = document.getElementById("navRegister");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  if (currentUser) {
    navLogin.style.display = "none";
    navRegister.style.display = "none";
    welcomeMsg.style.display = "inline-block";
    welcomeMsg.textContent = `Welcome, ${currentUser.username}!`;
    logoutBtn.style.display = "inline-block";
  } else {
    navLogin.style.display = "inline-block";
    navRegister.style.display = "inline-block";
    welcomeMsg.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

function showDashboard(role) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  document.getElementById("login").style.display = "none";
  document.getElementById("register").style.display = "none";
  document.getElementById("about").style.display = "none";

  document.getElementById("employee-dashboard").style.display = role === "employee" ? "block" : "none";
  document.getElementById("manager-dashboard").style.display = role === "manager" ? "block" : "none";

  updateNav();
}

document.querySelector("#register form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("newuser").value;
  const password = document.getElementById("newpwd").value;
  const role = document.getElementById("regrole").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);
    alert(data.message);
    e.target.reset();
  } catch {
    alert("Server error!");
  }
});

document.querySelector("#login form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("uname").value;
  const password = document.getElementById("pwd").value;
  const role = document.getElementById("role").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);

    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    alert("Login successful!");
    showDashboard(role);
    loadClaims();
  } catch {
    alert("Server error!");
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  alert("Logged out!");
  location.reload();
});

document.querySelector("#employee-dashboard form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const expense = document.getElementById("expense").value;
  const amount = document.getElementById("amount").value;
  const receiptFile = document.getElementById("receipt").files[0];

  const formData = new FormData();
  formData.append("expense", expense);
  formData.append("amount", amount);
  if (receiptFile) formData.append("receipt", receiptFile);

  try {
    const res = await fetch(`${API_URL}/claims`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);
    alert(data.message);
    e.target.reset();
    loadClaims();
  } catch {
    alert("Server error!");
  }
});

async function loadClaims() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  try {
    const res = await fetch(`${API_URL}/claims`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const claims = await res.json();

    currentUser.role === "employee" ? renderEmployeeClaims(claims) : renderManagerClaims(claims);
  } catch {
    console.error("Error loading claims");
  }
}

function renderEmployeeClaims(claims) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const tbody = document.querySelector("#employee-dashboard tbody");
  tbody.innerHTML = "";

  claims.filter(c => c.userId === currentUser.id).forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.expense}</td>
        <td>${c.amount}</td>
        <td>${c.receiptUrl ? `<a href="${API_URL}${c.receiptUrl}" target="_blank">View</a>` : "No Receipt"}</td>
        <td><span class="status ${c.status.toLowerCase()}">${c.status}</span></td>
      </tr>`;
  });
}

function renderManagerClaims(claims) {
  const tbody = document.querySelector("#manager-dashboard tbody");
  tbody.innerHTML = "";
  claims.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.user}</td>
        <td>${c.expense}</td>
        <td>${c.amount}</td>
        <td>${c.receiptUrl ? `<a href="${API_URL}${c.receiptUrl}" target="_blank">View</a>` : "No Receipt"}</td>
        <td><span class="status ${c.status.toLowerCase()}">${c.status}</span></td>
        <td>
          <button onclick="updateClaim(${c.id}, 'Approved')">Approve</button>
          <button onclick="updateClaim(${c.id}, 'Rejected')">Reject</button>
        </td>
      </tr>`;
  });
}

async function updateClaim(id, status) {
  try {
    const res = await fetch(`${API_URL}/claims/${id}`, {
      method: "PUT",
      headers: { 
        "Authorization": `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);
    loadClaims();
  } catch {
    console.error("Error updating claim");
  }
}

window.onload = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    showDashboard(currentUser.role);
    loadClaims();
  } else {
    updateNav();
  }
};