/**
 * ========================================================
 * AUTHENTICATION & SESSION CONTROLLER
 * File: js/auth.js
 * ========================================================
 */

const Auth = {
    sessionKey: "shopease_current_user",
    usersKey: "shopease_registered_users",

    // 1. Current logged in user fetch karein
    getCurrentUser() {
        const data = localStorage.getItem(this.sessionKey);
        return data ? JSON.parse(data) : null;
    },

    // 2. Check karein ki kya Admin logged in hai
    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        return user.role === "admin" ||
            user.email === "admin@shopease.com" ||
            user.email === "sujitmodi2021@gmail.com";
    },

    // 3. Registered Customers ki list
    getRegisteredUsers() {
        const data = localStorage.getItem(this.usersKey);
        return data ? JSON.parse(data) : [];
    },

    // 4. Login Function (Backend Server se verify karein)
    async login(email, password) {
        const cleanEmail = email.trim().toLowerCase();

        // Direct Admin check (Offline & Online support)
        if (cleanEmail === "admin@shopease.com" && password === "admin123") {
            const adminSession = { name: "Store Admin", email: cleanEmail, role: "admin" };
            localStorage.setItem(this.sessionKey, JSON.stringify(adminSession));
            return { success: true, role: "admin" };
        }

        if (cleanEmail === "sujitmodi2021@gmail.com" && password === "Modi@123") {
            const adminSession = { name: "Sujit Modi", email: cleanEmail, role: "admin" };
            localStorage.setItem(this.sessionKey, JSON.stringify(adminSession));
            return { success: true, role: "admin" };
        }

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem(this.sessionKey, JSON.stringify(data.user));
                return { success: true, role: data.user.role };
            }
            return { success: false, message: data.message || "Invalid credentials!" };
        } catch (err) {
            return { success: false, message: "Invalid email or password!" };
        }
    },

    // 5. Register New Customer (Backend Database me save karein)
    async register(name, email, phone, password) {
        const cleanEmail = email.trim().toLowerCase();

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email: cleanEmail, phone, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem(this.sessionKey, JSON.stringify(data.user));
                return { success: true, role: "customer" };
            }
            return { success: false, message: data.message || "Registration failed!" };
        } catch (err) {
            // Fallback local registration
            const users = this.getRegisteredUsers();
            const newUser = { id: Date.now(), name, email: cleanEmail, phone, password, role: "customer" };
            users.push(newUser);
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            localStorage.setItem(this.sessionKey, JSON.stringify(newUser));
            return { success: true, role: "customer" };
        }
    },

    // 6. Logout
    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = "login.html";
    },

    // 7. Update Customer Profile
    async updateProfile(profileData) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: "Not logged in" };

        const updatedUser = {
            ...user,
            name: profileData.name ? profileData.name.trim() : user.name,
            phone: profileData.phone ? profileData.phone.trim() : user.phone,
            address: profileData.address !== undefined ? profileData.address.trim() : (user.address || '')
        };

        // Update session
        localStorage.setItem(this.sessionKey, JSON.stringify(updatedUser));

        // Update registered list
        const users = this.getRegisteredUsers();
        const idx = users.findIndex(u => u.email === user.email);
        if (idx > -1) {
            users[idx] = { ...users[idx], ...updatedUser };
            localStorage.setItem(this.usersKey, JSON.stringify(users));
        }

        // Call Backend API
        try {
            await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    address: updatedUser.address
                })
            });
        } catch (e) {
            console.warn("Server offline, profile updated locally.");
        }

        return { success: true, user: updatedUser };
    },

    // 8. Get Current Customer's Orders
    async getCustomerOrders() {
        const user = this.getCurrentUser();
        if (!user) return [];

        let allOrders = [];
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                allOrders = await res.json();
            } else {
                allOrders = JSON.parse(localStorage.getItem('shopease_orders') || '[]');
            }
        } catch (e) {
            allOrders = JSON.parse(localStorage.getItem('shopease_orders') || '[]');
        }

        const cleanEmail = (user.email || '').toLowerCase();
        const cleanPhone = (user.phone || '');
        const cleanName = (user.name || '').toLowerCase();

        return allOrders.filter(ord => {
            const ordEmail = (ord.customerEmail || '').toLowerCase();
            const ordPhone = (ord.customerPhone || '');
            const ordName = (ord.customerName || '').toLowerCase();

            return (ordEmail && ordEmail === cleanEmail) ||
                (ordPhone && ordPhone === cleanPhone) ||
                (ordName && ordName === cleanName);
        });
    }
};

// ================= LOGIN PAGE UI CONTROLLER =================
document.addEventListener("DOMContentLoaded", () => {
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authAlert = document.getElementById("authAlert");

    if (!loginForm) return; // Agar login.html par nahi hain toh return karein

    function showAlert(msg, isSuccess = false) {
        authAlert.textContent = msg;
        authAlert.className = `auth-alert ${isSuccess ? "success" : "error"}`;
        authAlert.style.display = "block";
    }

    // Tab Toggle
    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener("click", () => {
            tabLoginBtn.classList.add("active");
            tabRegisterBtn.classList.remove("active");
            loginForm.style.display = "flex";
            registerForm.style.display = "none";
            authAlert.style.display = "none";
        });

        tabRegisterBtn.addEventListener("click", () => {
            tabRegisterBtn.classList.add("active");
            tabLoginBtn.classList.remove("active");
            registerForm.style.display = "flex";
            loginForm.style.display = "none";
            authAlert.style.display = "none";
        });
    }

    // Handle Login Submit
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const pass = document.getElementById("loginPassword").value;

        const res = await Auth.login(email, pass);
        if (res.success) {
            showAlert("Login successful! Redirecting...", true);
            setTimeout(() => {
                if (res.role === "admin") {
                    sessionStorage.setItem('shopease_admin_unlocked', 'true');
                    window.location.href = "admin.html"; // Admin Dashboard
                } else {
                    window.location.href = "index.html"; // Storefront
                }
            }, 600);
        } else {
            showAlert(res.message, false);
        }
    });

    // Handle Register Submit
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value;
            const email = document.getElementById("regEmail").value;
            const phone = document.getElementById("regPhone").value;
            const pass = document.getElementById("regPassword").value;

            const res = await Auth.register(name, email, phone, pass);
            if (res.success) {
                showAlert("Account created successfully! Redirecting...", true);
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 600);
            } else {
                showAlert(res.message, false);
            }
        });
    }
});
