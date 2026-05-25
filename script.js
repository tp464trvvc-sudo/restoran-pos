// ========== VERİ YAPILARI ==========
let users = [
    { id: 1, username: "garson1", password: "123", role: "garson" },
    { id: 2, username: "kasiyer1", password: "123", role: "kasiyer" },
    { id: 3, username: "admin1", password: "123", role: "admin" }
];

let categories = [
    { id: 1, name: "Ana Yemekler" },
    { id: 2, name: "İçecekler" },
    { id: 3, name: "Tatlılar" }
];

let tables = [
    { id: 1, name: "Masa 01" },
    { id: 2, name: "Masa 02" },
    { id: 3, name: "Masa 03" },
    { id: 4, name: "Masa 04" },
    { id: 5, name: "Masa 05" },
    { id: 6, name: "Masa 06" }
];

let products = [
    { id: 1, name: "İskender Kebap", price: 180, categoryId: 1 },
    { id: 2, name: "Adana Kebap", price: 160, categoryId: 1 },
    { id: 3, name: "Lahmacun", price: 70, categoryId: 1 },
    { id: 4, name: "Ayran", price: 20, categoryId: 2 },
    { id: 5, name: "Kola", price: 25, categoryId: 2 },
    { id: 6, name: "Künefe", price: 110, categoryId: 3 },
    { id: 7, name: "Baklava", price: 85, categoryId: 3 }
];

let orders = {};
let systemLogs = [];
let currentUser = null;
let selectedTableId = null;
let selectedCategoryId = null;

// ========== LOCALSTORAGE İŞLEMLERİ ==========
function loadData() {
    const storedUsers = localStorage.getItem("pos_users_full");
    if(storedUsers) users = JSON.parse(storedUsers);
    const storedCategories = localStorage.getItem("pos_categories");
    if(storedCategories) categories = JSON.parse(storedCategories);
    const storedTables = localStorage.getItem("pos_tables_full");
    if(storedTables) tables = JSON.parse(storedTables);
    const storedProducts = localStorage.getItem("pos_products_full");
    if(storedProducts) products = JSON.parse(storedProducts);
    const storedOrders = localStorage.getItem("pos_orders_full");
    if(storedOrders) orders = JSON.parse(storedOrders);
    const storedLogs = localStorage.getItem("pos_system_logs");
    if(storedLogs) systemLogs = JSON.parse(storedLogs);
    if(!orders) orders = {};
}

function saveAll() {
    localStorage.setItem("pos_users_full", JSON.stringify(users));
    localStorage.setItem("pos_categories", JSON.stringify(categories));
    localStorage.setItem("pos_tables_full", JSON.stringify(tables));
    localStorage.setItem("pos_products_full", JSON.stringify(products));
    localStorage.setItem("pos_orders_full", JSON.stringify(orders));
    localStorage.setItem("pos_system_logs", JSON.stringify(systemLogs));
}

function addLog(message, userRole = "system") {
    const logEntry = { 
        time: new Date().toLocaleString('tr-TR'), 
        text: message, 
        role: userRole 
    };
    systemLogs.unshift(logEntry);
    if(systemLogs.length > 300) systemLogs.pop();
    saveAll();
    if(document.getElementById("adminLogViewer") && document.getElementById("adminModal").style.display === "flex") {
        renderAdminLogs();
    }
}

// ========== YARDIMCI FONKSİYONLAR ==========
function getTableOrders(tableId) { 
    if(!orders[tableId]) orders[tableId] = []; 
    return orders[tableId]; 
}

function tableTotal(tableId) { 
    return getTableOrders(tableId).reduce((sum, item) => sum + (item.price * item.quantity), 0); 
}

// ========== RENDER FONKSİYONLARI ==========
function renderTables() {
    const container = document.getElementById("tablesContainer");
    if(!container) return;
    container.innerHTML = "";
    tables.forEach(table => {
        const total = tableTotal(table.id);
        const card = document.createElement("div");
        card.className = `table-card ${selectedTableId === table.id ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="table-name">${table.name}</div>
            <div class="table-status">₺${total.toFixed(2)}</div>
        `;
        card.onclick = () => selectTable(table.id);
        container.appendChild(card);
    });
}

function selectTable(tableId) {
    selectedTableId = tableId;
    selectedCategoryId = null;
    renderTables();
    updateTableHeader();
    showAdisyonPanel(true);
    renderCategories();
    renderCart();
    renderDynamicButtons();
    addLog(`${tables.find(t => t.id === tableId)?.name} açıldı`, currentUser.role);
}

function updateTableHeader() {
    const masa = tables.find(t => t.id === selectedTableId);
    document.getElementById("masaAdiHeader").innerText = masa ? masa.name : "Seçilmedi";
}

function showAdisyonPanel(show) {
    const categoriesSection = document.getElementById("categoriesSection");
    const productsSection = document.getElementById("productsSection");
    const cartSection = document.getElementById("cartSection");
    const noTableMessage = document.getElementById("noTableSelected");
    
    if(show && selectedTableId) {
        categoriesSection.style.display = "block";
        productsSection.style.display = "block";
        cartSection.style.display = "block";
        noTableMessage.style.display = "none";
    } else {
        categoriesSection.style.display = "none";
        productsSection.style.display = "none";
        cartSection.style.display = "none";
        noTableMessage.style.display = "flex";
    }
}

function renderCategories() {
    const container = document.getElementById("categoriesList");
    if(!container) return;
    container.innerHTML = "";
    categories.forEach(category => {
        const card = document.createElement("div");
        card.className = `category-card ${selectedCategoryId === category.id ? 'active' : ''}`;
        card.innerHTML = category.name;
        card.onclick = () => selectCategory(category.id);
        container.appendChild(card);
    });
    
    if(categories.length > 0 && !selectedCategoryId) {
        selectCategory(categories[0].id);
    } else if(selectedCategoryId) {
        renderProducts();
    }
}

function selectCategory(categoryId) {
    selectedCategoryId = categoryId;
    renderCategories();
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById("productsList");
    if(!container) return;
    container.innerHTML = "";
    const filteredProducts = products.filter(p => p.categoryId === selectedCategoryId);
    if(filteredProducts.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Bu kategoride ürün yok</div>';
        return;
    }
    filteredProducts.forEach(product => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-price">₺${product.price}</div>
        `;
        div.onclick = () => addItemToOrder(product);
        container.appendChild(div);
    });
}

function addItemToOrder(product) {
    if(!currentUser || !selectedTableId) return;
    const tableOrders = getTableOrders(selectedTableId);
    const existing = tableOrders.find(item => item.productId === product.id);
    if(existing) {
        existing.quantity += 1;
    } else {
        tableOrders.push({ 
            productId: product.id, 
            productName: product.name, 
            price: product.price, 
            quantity: 1 
        });
    }
    orders[selectedTableId] = tableOrders;
    saveAll();
    addLog(`${product.name} eklendi (${tables.find(t => t.id === selectedTableId)?.name})`, currentUser.role);
    renderCart();
    renderTables();
}

function removeOrDecrease(productId) {
    const tableOrders = getTableOrders(selectedTableId);
    const index = tableOrders.findIndex(item => item.productId === productId);
    if(index !== -1) {
        if(tableOrders[index].quantity > 1) {
            tableOrders[index].quantity -= 1;
            addLog(`${tableOrders[index].productName} adet azaltıldı`, currentUser.role);
        } else {
            const removed = tableOrders[index].productName;
            tableOrders.splice(index, 1);
            addLog(`${removed} sepetten kaldırıldı`, currentUser.role);
        }
        orders[selectedTableId] = tableOrders;
        saveAll();
        renderCart();
        renderTables();
    }
}

function renderCart() {
    const container = document.getElementById("cartItemsArea");
    if(!container) return;
    if(!selectedTableId) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Masa seçilmedi</div>';
        document.getElementById("cartTotalAmount").innerText = "0.00";
        return;
    }
    const items = getTableOrders(selectedTableId);
    if(items.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Adisyon boş</div>';
        document.getElementById("cartTotalAmount").innerText = "0.00";
        return;
    }
    let html = "";
    let total = 0;
    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-price">₺${item.price} x ${item.quantity}</div>
                </div>
                <div class="item-controls">
                    <button class="decrease-btn" data-id="${item.productId}">-</button>
                    <strong>₺${itemTotal.toFixed(2)}</strong>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById("cartTotalAmount").innerText = total.toFixed(2);
    
    document.querySelectorAll(".decrease-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const pid = parseInt(btn.getAttribute("data-id"));
            removeOrDecrease(pid);
        });
    });
}

function renderDynamicButtons() {
    const container = document.getElementById("dynamicActionButtons");
    if(!container) return;
    container.innerHTML = "";
    if(!selectedTableId) return;
    
    if(currentUser.role === "kasiyer" || currentUser.role === "admin") {
        const hizliBtn = document.createElement("button");
        hizliBtn.innerHTML = '<i class="fas fa-bolt"></i> Hızlı Ödeme';
        hizliBtn.className = "btn-primary";
        hizliBtn.onclick = () => odemeYap("Hızlı");
        
        const detayBtn = document.createElement("button");
        detayBtn.innerHTML = '<i class="fas fa-receipt"></i> Detaylı Ödeme';
        detayBtn.className = "btn-secondary";
        detayBtn.onclick = () => odemeYap("Detaylı");
        
        container.appendChild(hizliBtn);
        container.appendChild(detayBtn);
    } else {
        const infoSpan = document.createElement("span");
        infoSpan.innerHTML = '<i class="fas fa-info-circle"></i> Garson modu: sadece ürün ekleyip çıkarabilirsiniz.';
        infoSpan.style.fontSize = "12px";
        infoSpan.style.color = "#64748b";
        container.appendChild(infoSpan);
    }
}

function odemeYap(tip) {
    if(!selectedTableId) return;
    const total = tableTotal(selectedTableId);
    if(total === 0) { 
        alert("Sipariş yok!"); 
        return; 
    }
    const masaAd = tables.find(t => t.id === selectedTableId)?.name;
    addLog(`${tip} ödeme alındı - Masa ${masaAd}, Tutar: ₺${total.toFixed(2)}`, currentUser.role);
    alert(`💰 ${tip} ödeme tamamlandı.\nMasa: ${masaAd}\nTutar: ₺${total.toFixed(2)}`);
    orders[selectedTableId] = [];
    saveAll();
    renderCart();
    renderTables();
}

function gunSonuSifirla() {
    if(confirm("⚠️ Gün sonu sıfırlama yapılacak. Tüm masaların siparişleri silinecek ve günlük rapor sıfırlanacak. Devam etmek istiyor musunuz?")) {
        orders = {};
        saveAll();
        addLog("Gün sonu sıfırlama yapıldı. Tüm siparişler temizlendi.", "admin");
        renderTables();
        if(selectedTableId) {
            renderCart();
        }
        alert("✅ Gün sonu sıfırlama tamamlandı. Tüm masaların siparişleri silindi.");
    }
}

// ========== ADMIN PANEL İŞLEMLERİ ==========
function renderAdminUsersTable() {
    const tbody = document.getElementById("usersTableBody");
    if(!tbody) return;
    tbody.innerHTML = "";
    users.forEach(user => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = user.username;
        row.insertCell(1).innerHTML = `<span class="role-badge" style="background:#e2e8f0; color:#475569;">${user.role === "garson" ? "Garson" : (user.role === "kasiyer" ? "Kasiyer" : "Admin")}</span>`;
        const actionCell = row.insertCell(2);
        if(currentUser && currentUser.id !== user.id) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-user-btn";
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deleteUser(user.id);
            actionCell.appendChild(deleteBtn);
        } else {
            actionCell.innerHTML = '<span style="color:#94a3b8; font-size:11px;">(siz)</span>';
        }
    });
}

function deleteUser(userId) {
    const userToDelete = users.find(u => u.id === userId);
    if(!userToDelete) return;
    if(confirm(`${userToDelete.username} kullanıcısını silmek istediğinize emin misiniz?`)) {
        users = users.filter(u => u.id !== userId);
        saveAll();
        addLog(`Kullanıcı silindi: ${userToDelete.username} (${userToDelete.role})`, "admin");
        renderAdminUsersTable();
        renderAdminUsersList();
    }
}

function renderAdminUsersList() { 
    renderAdminUsersTable();
}

function renderDeleteTableSelect() { 
    const sel = document.getElementById("deleteTableSelect"); 
    if(sel) sel.innerHTML = tables.map(t => `<option value="${t.id}">${t.name}</option>`).join(""); 
}

function renderDeleteCategorySelect() {
    const sel = document.getElementById("deleteCategorySelect");
    if(sel) sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderProductCategorySelect() {
    const sel = document.getElementById("productCategorySelect");
    if(sel) sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderEditProductSelect() { 
    const sel = document.getElementById("editProductSelect"); 
    if(sel) sel.innerHTML = products.map(p => {
        const cat = categories.find(c => c.id === p.categoryId);
        return `<option value="${p.id}">${p.name} - ${p.price}₺ (${cat?.name || 'Kategorisiz'})</option>`;
    }).join(""); 
}

function renderAdminLogs() { 
    const logDiv = document.getElementById("adminLogViewer"); 
    if(logDiv) logDiv.innerHTML = systemLogs.map(l => `[${l.time}] ${l.role}: ${l.text}`).join("<br>") || "Log yok"; 
}

function gunSonuRapor() { 
    let ciro = 0; 
    let masaBazli = [];
    for(let tid in orders) {
        const masaToplam = orders[tid].reduce((a, i) => a + (i.price * i.quantity), 0);
        ciro += masaToplam;
        const masaAd = tables.find(t => t.id == tid)?.name || `Masa ${tid}`;
        if(masaToplam > 0) masaBazli.push(`${masaAd}: ₺${masaToplam.toFixed(2)}`);
    }
    const raporHtml = `<strong><i class="fas fa-chart-line"></i> Gün Sonu Raporu</strong><br><br>
                       <strong>Toplam Ciro:</strong> ₺${ciro.toFixed(2)}<br><br>
                       ${masaBazli.length > 0 ? '<strong>Masa Bazlı:</strong><br>' + masaBazli.join('<br>') : 'Hiç sipariş yok'}`;
    document.getElementById("raporDiv").innerHTML = raporHtml;
    addLog("Gün sonu raporu alındı, ciro: " + ciro.toFixed(2), "admin");
}

function setupAdminEvents() {
    // Kullanıcı işlemleri
    document.getElementById("adminAddUserBtn").onclick = () => {
        const uname = document.getElementById("newUserName").value;
        const pass = document.getElementById("newUserPass").value;
        const role = document.getElementById("newUserRoleSelect").value;
        if(!uname || !pass) return alert("Kullanıcı adı ve şifre gerekli!");
        users.push({ id: Date.now(), username: uname, password: pass, role });
        saveAll(); 
        addLog(`Yeni kullanıcı: ${uname} (${role})`, "admin"); 
        renderAdminUsersTable();
        document.getElementById("newUserName").value = "";
        document.getElementById("newUserPass").value = "";
    };
    
    // Kategori işlemleri
    document.getElementById("addCategoryBtn").onclick = () => {
        const cname = document.getElementById("newCategoryName").value;
        if(!cname) return alert("Kategori adı girin!");
        categories.push({ id: Date.now(), name: cname });
        saveAll();
        addLog(`Kategori eklendi: ${cname}`, "admin");
        renderCategories();
        renderDeleteCategorySelect();
        renderProductCategorySelect();
        document.getElementById("newCategoryName").value = "";
    };
    
    document.getElementById("deleteCategoryBtn").onclick = () => {
        const sel = document.getElementById("deleteCategorySelect");
        const id = parseInt(sel.value);
        const index = categories.findIndex(c => c.id === id);
        if(index !== -1) {
            const catName = categories[index].name;
            categories.splice(index, 1);
            const deletedProducts = products.filter(p => p.categoryId === id);
            products = products.filter(p => p.categoryId !== id);
            if(selectedCategoryId === id) selectedCategoryId = null;
            saveAll();
            addLog(`Kategori silindi: ${catName} (${deletedProducts.length} ürün silindi)`, "admin");
            renderCategories();
            renderDeleteCategorySelect();
            renderProductCategorySelect();
            renderEditProductSelect();
            if(selectedTableId) renderProducts();
        }
    };
    
    // Masa işlemleri
    document.getElementById("addTableAdminBtn").onclick = () => {
        const tname = document.getElementById("newTableName").value;
        if(!tname) return;
        tables.push({ id: Date.now(), name: tname });
        saveAll(); 
        addLog(`Masa eklendi: ${tname}`, "admin"); 
        renderTables(); 
        renderDeleteTableSelect();
        document.getElementById("newTableName").value = "";
    };
    
    document.getElementById("deleteTableAdminBtn").onclick = () => {
        const sel = document.getElementById("deleteTableSelect");
        const id = parseInt(sel.value);
        const index = tables.findIndex(t => t.id === id);
        if(index !== -1) { 
            const tableName = tables[index].name;
            tables.splice(index, 1); 
            if(selectedTableId === id) {
                selectedTableId = null;
                showAdisyonPanel(false);
            }
            saveAll(); 
            addLog(`Masa silindi: ${tableName}`, "admin"); 
            renderTables(); 
            renderDeleteTableSelect(); 
        }
    };
    
    // Ürün işlemleri
    document.getElementById("addProductAdminBtn").onclick = () => {
        const catId = parseInt(document.getElementById("productCategorySelect").value);
        const pname = document.getElementById("newProductName").value;
        const price = parseFloat(document.getElementById("newProductPrice").value);
        if(!pname || isNaN(price)) return alert("Ürün adı ve fiyat girin!");
        products.push({ id: Date.now(), name: pname, price, categoryId: catId });
        saveAll(); 
        addLog(`Ürün eklendi: ${pname} ₺${price}`, "admin"); 
        if(selectedCategoryId === catId) renderProducts();
        renderEditProductSelect();
        document.getElementById("newProductName").value = "";
        document.getElementById("newProductPrice").value = "";
    };
    
    document.getElementById("updateProductPriceBtn").onclick = () => {
        const sel = document.getElementById("editProductSelect");
        const id = parseInt(sel.value);
        const newPrice = parseFloat(document.getElementById("updateProductPriceField").value);
        const product = products.find(p => p.id === id);
        if(product && !isNaN(newPrice)) { 
            product.price = newPrice; 
            saveAll(); 
            addLog(`Ürün fiyat güncellendi: ${product.name} yeni ₺${newPrice}`, "admin"); 
            if(selectedCategoryId === product.categoryId) renderProducts();
            renderCart();
            renderEditProductSelect(); 
        }
    };
    
    document.getElementById("deleteProductAdminBtn").onclick = () => {
        const sel = document.getElementById("editProductSelect");
        const id = parseInt(sel.value);
        const index = products.findIndex(p => p.id === id);
        if(index !== -1) { 
            const productName = products[index].name;
            products.splice(index, 1); 
            saveAll(); 
            addLog(`Ürün silindi: ${productName}`, "admin"); 
            if(selectedTableId) renderProducts();
            renderEditProductSelect(); 
            renderCart();
        }
    };
    
    // Rapor ve log işlemleri
    document.getElementById("gunSonuRaporBtn").onclick = gunSonuRapor;
    document.getElementById("gunSonuSifirlaBtn").onclick = gunSonuSifirla;
    document.getElementById("clearLogsAdminBtn").onclick = () => { 
        systemLogs = []; 
        saveAll(); 
        renderAdminLogs(); 
        addLog("Loglar temizlendi", "admin"); 
    };
}

// ========== GİRİŞ/ÇIKIŞ İŞLEMLERİ ==========
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if(!user) { 
        document.getElementById("loginError").innerText = "Kullanıcı adı veya şifre hatalı!"; 
        document.getElementById("loginError").style.display = "block"; 
        return false; 
    }
    currentUser = user;
    addLog(`Giriş yapıldı: ${user.username} (${user.role})`, user.role);
    
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appMain").style.display = "block";
    document.getElementById("currentUserName").innerText = user.username;
    document.getElementById("currentUserRoleLabel").innerText = user.role === "garson" ? "Garson" : (user.role === "kasiyer" ? "Kasiyer" : "Admin");
    
    if(user.role === "admin") {
        document.getElementById("adminPanelHeaderBtn").style.display = "inline-block";
    } else {
        document.getElementById("adminPanelHeaderBtn").style.display = "none";
    }
    
    selectedTableId = null;
    showAdisyonPanel(false);
    renderTables();
    return true;
}

function logout() {
    addLog(`Çıkış yapıldı: ${currentUser?.username}`, currentUser?.role);
    currentUser = null;
    selectedTableId = null;
    document.getElementById("appMain").style.display = "none";
    document.getElementById("loginScreen").style.display = "block";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").style.display = "none";
}

function openAdminModal() { 
    if(currentUser?.role === "admin") { 
        renderAdminUsersTable();
        renderDeleteTableSelect(); 
        renderDeleteCategorySelect();
        renderProductCategorySelect();
        renderEditProductSelect(); 
        renderAdminLogs(); 
        document.getElementById("adminModal").style.display = "flex"; 
    } else { 
        alert("Yetkisiz erişim!"); 
    } 
}

// ========== SAYFA YÜKLENİNCE ==========
window.onload = () => {
    loadData();
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("appMain").style.display = "none";
    
    document.getElementById("doLoginBtn").onclick = () => {
        const uname = document.getElementById("loginUsername").value;
        const pwd = document.getElementById("loginPassword").value;
        login(uname, pwd);
    };
    
    document.getElementById("logoutHeaderBtn").onclick = logout;
    document.getElementById("adminPanelHeaderBtn").onclick = openAdminModal;
    document.getElementById("closeAdminModal").onclick = () => document.getElementById("adminModal").style.display = "none";
    
    window.onclick = (e) => { 
        if(e.target === document.getElementById("adminModal")) {
            document.getElementById("adminModal").style.display = "none";
        }
    };
    
    setupAdminEvents();
    
    if(users.length === 0) { 
        users.push({id: 1, username: "admin1", password: "123", role: "admin"}); 
        saveAll();
    }
    
    if(categories.length === 0) {
        categories = [
            { id: 1, name: "Ana Yemekler" },
            { id: 2, name: "İçecekler" },
            { id: 3, name: "Tatlılar" }
        ];
        saveAll();
    }
};