// ... (Firebase config ve önceki console logları) ...
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyBMiwLdDaa4DBxi1IizvDJRqNZNfbGXgYY",
    authDomain: "busas-app.firebaseapp.com",
    projectId: "busas-app",
    storageBucket: "busas-app.appspot.com",
    messagingSenderId: "551993626759",
    appId: "1:551993626759:web:50eef523b7459f000de822",
    measurementId: "G-4F3MPNKP6E"
};

// Debugging: Firebase yapılandırmasını göster
console.log("Firebase yapılandırması:", JSON.stringify(firebaseConfig));

// Kullanıcı rollerini tanımla
const USER_ROLES = {
    ADMIN: 'admin',
    EGITMEN: 'egitmen',
    LIDER: 'lider',
    ASISTAN: 'asistan',
    ONE_STAR: '1*',
    KURSIYER: 'kursiyer'
};

// Rich text editor işlevleri
let editorInitialized = false;

function initRichTextEditor() {
    if (editorInitialized) return;
    
    const editorToolbar = document.getElementById('rich-editor-toolbar');
    const editorContent = document.getElementById('announcement-content-editor');
    const hiddenTextarea = document.getElementById('announcement-content');
    
    if (!editorToolbar || !editorContent || !hiddenTextarea) return;
    
    // Tüm düzenleme butonları için event listener ekle
    const buttons = editorToolbar.querySelectorAll('.editor-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.getAttribute('data-command');
            const value = button.getAttribute('data-value') || null;
            
            if (command === 'createLink') {
                const url = prompt('Link URL\'si girin:', 'https://');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, value);
            }
            
            // Editor içeriğini hidden textarea'ya aktar
            hiddenTextarea.value = editorContent.innerHTML;
        });
    });
    
    // Renk paleti butonları için event listener
    const colorItems = editorToolbar.querySelectorAll('.color-item');
    colorItems.forEach(item => {
        item.addEventListener('click', () => {
            const command = item.getAttribute('data-command');
            const value = item.getAttribute('data-value');
            
            document.execCommand(command, false, value);
            
            // Editor içeriğini hidden textarea'ya aktar
            hiddenTextarea.value = editorContent.innerHTML;
        });
    });
    
    // Font seçimi için dropdown itemları
    const fontItems = editorToolbar.querySelectorAll('.dropdown-item[data-command="fontName"]');
    const currentFontSpan = document.getElementById('current-font');
    
    fontItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            
            document.execCommand('fontName', false, value);
            
            // Seçilen fontu göster
            if (currentFontSpan) {
                currentFontSpan.textContent = item.textContent;
            }
            
            // Editor içeriğini hidden textarea'ya aktar
            hiddenTextarea.value = editorContent.innerHTML;
        });
    });
    
    // Font boyutu seçimi için dropdown itemları
    const sizeItems = editorToolbar.querySelectorAll('.dropdown-item[data-command="fontSize"]');
    const currentSizeSpan = document.getElementById('current-size');
    
    sizeItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            
            document.execCommand('fontSize', false, value);
            
            // Seçilen boyutu göster
            if (currentSizeSpan) {
                currentSizeSpan.textContent = item.textContent;
            }
            
            // Editor içeriğini hidden textarea'ya aktar
            hiddenTextarea.value = editorContent.innerHTML;
        });
    });
    
    // Editor içeriği değiştiğinde hidden textarea'ya aktar
    editorContent.addEventListener('input', () => {
        hiddenTextarea.value = editorContent.innerHTML;
    });
    
    // Başlangıç durumu
    hiddenTextarea.value = editorContent.innerHTML;
    
    editorInitialized = true;
    console.log("Rich text editor başlatıldı");
}

// Admin panel verilerini yükleme fonksiyonu
function loadAdminData() {
    console.log("Admin verileri yükleniyor");
    loadAdminAnnouncements();
    loadAdminUsers();
    setupDivePlanningTable();
    loadDivePlannings();
    
    // Rich text editor'ü başlat
    initRichTextEditor();
}

// Admin e-postaları listesi
const ADMIN_EMAILS = [
    'admin@busas.com',
    'yonetici@busas.com',
    'admin@busasapp.com',
    'admin@gmail.com' // Test için, gerekirse kaldırılabilir
];

// Global Auth nesnelerini tanımla
let auth;
let db;

// Dalış planı yükleme fonksiyonu
function loadDivePlan() {
    const divePlanContainer = document.getElementById('dive-plan');
    if (!divePlanContainer) return;
    
    divePlanContainer.innerHTML = '<p>Dalış planı yükleniyor...</p>';
    
    const db = firebase.firestore();
    
    // Current time
    const now = new Date();
    
    // Get the most recent dive planning that has either no publishDateTime or a publishDateTime in the past
    db.collection('divePlannings')
        .orderBy('date', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                divePlanContainer.innerHTML = `
                    <div class="no-dive-plan">
                        <i class="fas fa-info-circle"></i>
                        <p>Şu anda aktif bir dalış planı bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }
            
            // Find the first document that is published (either no publish time or publish time has passed)
            let publishedPlan = null;
            querySnapshot.forEach((doc) => {
                const planning = doc.data();
                
                // Check if plan should be displayed based on publishDateTime
                if (!planning.publishDateTime || new Date(planning.publishDateTime) <= now) {
                    if (!publishedPlan) {
                        publishedPlan = {
                            id: doc.id,
                            ...planning
                        };
                    }
                }
            });
            
            if (!publishedPlan) {
                divePlanContainer.innerHTML = `
                    <div class="no-dive-plan">
                        <i class="fas fa-info-circle"></i>
                        <p>Şu anda aktif bir dalış planı bulunmamaktadır.</p>
                    </div>
                `;
                return;
            }
            
            const planning = publishedPlan;
            console.log("Latest published dive planning data:", planning);
            
            const planningDate = new Date(planning.date).toLocaleDateString('tr-TR');
            
            let planHTML = `
                <div class="dive-plan-card">
                    <div class="dive-plan-info">
                        <h3>Dalış Planı: ${planningDate}</h3>
                        <div class="dive-meta">
                            <div class="dive-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${planning.location}</span>
                            </div>
                            <div class="dive-meta-item">
                                <i class="fas fa-water"></i>
                                <span>${planning.region || 'Belirtilmemiş'}</span>
                            </div>
                        </div>
                        <div class="dive-planning-container">
                            <table class="dive-planning-table">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th class="group-header">Grup 1</th>
                                        <th class="group-header">Grup 2</th>
                                        <th class="group-header">Grup 3</th>
                                        <th class="group-header">Grup 4</th>
                                        <th class="group-header">Grup 5</th>
                                    </tr>
                                </thead>
                                <tbody>`;
            
            // Create table structure in the same format as admin panel
            for (let slot = 1; slot <= 4; slot++) {
                // For each slot, we need 4 rows (for positions 1-4, excluding position 5 which is for observers)
                for (let position = 1; position <= 4; position++) {
                    planHTML += `<tr>`;
                    
                    // First row of each slot gets a rowspan for the slot header
                    if (position === 1) {
                        planHTML += `<td class="slot-header" rowspan="4">Slot ${slot}</td>`;
                    }
                    
                    // Add cells for each group with the correct position value
                    for (let group = 1; group <= 5; group++) {
                        planHTML += `<td class="dive-planning-cell" data-slot="${slot}" data-group="${group}" data-position="${position}">&nbsp;</td>`;
                    }
                    
                    planHTML += `</tr>`;
                }
            }
            
            planHTML += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            divePlanContainer.innerHTML = planHTML;
            
            // Log the data structure for debugging
            if (planning.planningData && planning.planningData.slots) {
                console.log("Planning data structure:", JSON.stringify(planning.planningData.slots, null, 2));
                
                // Create a map to count name occurrences
                const nameOccurrences = new Map();
                
                // First pass: Count occurrences of each name
                planning.planningData.slots.forEach(slot => {
                    slot.groups.forEach(group => {
                        group.positions.forEach(position => {
                            // Skip empty positions or positions without names
                            if (!position.userName || position.userName.trim() === '') return;
                            
                            // Count name occurrences
                            const name = position.userName;
                            nameOccurrences.set(name, (nameOccurrences.get(name) || 0) + 1);
                        });
                    });
                });
                
                console.log("Name occurrences:", Object.fromEntries(nameOccurrences));
                
                // Log positions for debugging
                const allPositions = [];
                planning.planningData.slots.forEach(slot => {
                    slot.groups.forEach(group => {
                        group.positions.forEach(position => {
                            allPositions.push({
                                slot: slot.slotNumber,
                                group: group.groupNumber,
                                position: position.positionNumber,
                                user: position.userName
                            });
                        });
                    });
                });
                console.log("All positions:", allPositions);
                
                // Fill the table with planning data
                planning.planningData.slots.forEach(slot => {
                    slot.groups.forEach(group => {
                        group.positions.forEach(position => {
                            // Skip position 5 (observer position) as it's not displayed in the view
                            if (position.positionNumber === 5) return;
                            
                            // Skip empty positions or positions without names
                            if (!position.userName || position.userName.trim() === '') return;
                            
                            // Find the correct cell using the position number from the data
                            const cell = document.querySelector(`#dive-plan .dive-planning-cell[data-slot="${slot.slotNumber}"][data-group="${group.groupNumber}"][data-position="${position.positionNumber}"]`);
                            
                            console.log(`Looking for cell: slot=${slot.slotNumber}, group=${group.groupNumber}, position=${position.positionNumber}, user=${position.userName}`);
                            
                            if (cell) {
                                // Add asterisk to duplicate names
                                const displayName = position.userName + 
                                    (nameOccurrences.get(position.userName) > 1 ? ' *' : '');
                                
                                console.log(`Found cell for ${displayName} at slot=${slot.slotNumber}, group=${group.groupNumber}, position=${position.positionNumber}`);
                                cell.textContent = displayName;
                                cell.classList.add('filled');
                                
                                // Also add data-user-id for completeness
                                if (position.userId) {
                                    cell.setAttribute('data-user-id', position.userId);
                                }
                                
                                // Highlight the current user
                                const currentUser = firebase.auth().currentUser;
                                if (currentUser && position.userId === currentUser.uid) {
                                    cell.style.backgroundColor = 'rgba(220, 53, 69, 0.2)'; // Highlight in a light red
                                }
                            } else {
                                console.warn(`Cell not found for slot=${slot.slotNumber}, group=${group.groupNumber}, position=${position.positionNumber}, user=${position.userName}`);
                            }
                        });
                    });
                });
            } else {
                console.warn("No planning data or slots found in the planning document");
            }
        })
        .catch((error) => {
            console.error("Error getting dive plan: ", error);
            divePlanContainer.innerHTML = `
                <div class="no-dive-plan">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Dalış planı yüklenirken bir hata oluştu.</p>
                </div>
            `;
        });
}

// Temel navigasyon fonksiyonu
function showSection(sectionId) {
    console.log(`Bölüm gösteriliyor: ${sectionId}`);
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Nav linklerini güncelle
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Seçilen nav linkini aktif yap
    const activeNavLink = document.querySelector(`nav a[href="#"][id="nav-${sectionId.replace('-section', '')}"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // Admin panelini sadece admin-panel seçiliyse göster, diğer bölümlerde gösterme
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        if (sectionId === 'admin-panel') {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }
    }
    
    // Eğer dalış planı bölümüne gidiliyorsa, dalış planını yükle
    if (sectionId === 'dive-plan-section') {
        console.log("Dalış planı bölümü açıldı, dalış planı yükleniyor");
        loadDivePlan();
    }
    
    // Eğer profil bölümüne gidiliyorsa, profil bilgilerini yükle
    if (sectionId === 'profile-section') {
        console.log("Profil bölümü açıldı, profil bilgileri yükleniyor");
        loadUserProfile();
    }
}

// Logout fonksiyonu
function logoutUser() {
    console.log("Çıkış yapılıyor...");
    if (auth) {
        auth.signOut().then(() => {
            console.log("Çıkış başarılı");
        }).catch((error) => {
            console.error("Çıkış yapılırken hata:", error);
        });
    } else {
        console.error("Auth nesnesi tanımlı değil!");
        alert("Bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.");
    }
}

// Giriş formunu göster, kayıt formunu gizle
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

// Kayıt formunu göster, giriş formunu gizle
function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Kullanıcı girişi
function handleLogin() {
    console.log("Giriş denemesi başlatılıyor...");
    
    // Formdan değerleri al
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    
    // Basit validasyon
    if (!email.value || !password.value) {
        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.textContent = 'Lütfen e-posta ve şifre giriniz.';
        }
        return;
    }
    
    // Yükleniyor ekranını göster
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    
    // Firebase Auth ile giriş yap
    auth.signInWithEmailAndPassword(email.value, password.value)
        .then((userCredential) => {
            console.log("Giriş başarılı:", userCredential.user);
            
            // Kullanıcının onaylı olup olmadığını kontrol et
            return db.collection('users').doc(userCredential.user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Kullanıcı onaylı değilse
                        if (!userData.approved) {
                            // Oturumu kapat ve hata göster
                            auth.signOut().then(() => {
                                console.log("Onaylanmamış kullanıcı çıkış yaptırıldı");
                                
                                const loginError = document.getElementById('login-error');
                                if (loginError) {
                                    loginError.textContent = 'Hesabınız henüz onaylanmamış. Lütfen daha sonra tekrar deneyiniz.';
                                }
                                
                                // Yükleniyor ekranını gizle
                                loadingContainer.style.display = 'none';
                            });
                        } else {
                            // Onaylı kullanıcı, işlem devam edebilir
                            console.log("Kullanıcı onaylı, devam ediliyor");
                            // Yükleniyor ekranı otomatik gizlenecek
                        }
                    } else {
                        console.error("Kullanıcı verisi bulunamadı");
                        throw new Error("Kullanıcı verisi bulunamadı");
                    }
                });
        })
        .catch((error) => {
            console.error("Giriş hatası:", error);
            
            // Yükleniyor ekranını gizle
            loadingContainer.style.display = 'none';
            
            // Hata mesajını göster
            const loginError = document.getElementById('login-error');
            if (loginError) {
                switch(error.code) {
                    case 'auth/user-not-found':
                        loginError.textContent = 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.';
                        break;
                    case 'auth/wrong-password':
                        loginError.textContent = 'Hatalı şifre girdiniz.';
                        break;
                    case 'auth/invalid-email':
                        loginError.textContent = 'Geçersiz e-posta adresi.';
                        break;
                    case 'auth/user-disabled':
                        loginError.textContent = 'Bu hesap devre dışı bırakılmış.';
                        break;
                    default:
                        loginError.textContent = `Hata: ${error.message}`;
                }
            }
        });
}

// Yeni kullanıcı kaydı
function handleSignup() {
    console.log("Kayıt denemesi başlatılıyor...");
    
    // Formdan değerleri al
    const firstName = document.getElementById('reg-firstname');
    const lastName = document.getElementById('reg-lastname');
    const email = document.getElementById('reg-email');
    const password = document.getElementById('reg-password');
    const birthDate = document.getElementById('reg-birthdate');
    const classInfo = document.getElementById('reg-class');
    const regYear = document.getElementById('reg-year');
    
    // Basit validasyon
    if (!email.value || !password.value || !firstName.value || !lastName.value || !birthDate.value || !classInfo.value || !regYear.value) {
        const registerError = document.getElementById('register-error');
        if (registerError) {
            registerError.textContent = 'Lütfen tüm alanları doldurunuz.';
        }
        return;
    }
    
    if (password.value.length < 6) {
        const registerError = document.getElementById('register-error');
        if (registerError) {
            registerError.textContent = 'Şifre en az 6 karakter olmalıdır.';
        }
        return;
    }
    
    // Yükleniyor ekranını göster
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    
    // Önce Firestore'da bu e-posta ile kullanıcı var mı kontrol et
    db.collection('users')
        .where('email', '==', email.value.trim().toLowerCase()) // E-postayı standartlaştır
        .get()
        .then((querySnapshot) => {
            // Firestore'da bu e-posta ile kayıt varsa
            if (!querySnapshot.empty) {
                // Kullanıcı zaten Firestore'da var
                console.log("E-posta Firestore'da zaten var:", email.value);
                loadingContainer.style.display = 'none';
                const registerError = document.getElementById('register-error');
                if (registerError) {
                    registerError.textContent = 'Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi deneyin.';
                }
                return Promise.reject({ code: 'firestore/email-already-in-use' });
            }
            
            // Firebase Auth ile kayıt olmayı dene
            console.log("E-posta Firestore'da yok, Auth ile kayıt deneniyor:", email.value);
            return auth.createUserWithEmailAndPassword(email.value.trim(), password.value)
                .catch(authError => {
                    console.error("Auth kayıt hatası:", authError.code, authError.message);
                    // Eğer e-posta zaten kullanılıyorsa
                    if (authError.code === 'auth/email-already-in-use') {
                        console.log("Email Auth'da var ama Firestore'da yok, giriş yapmayı deneyelim...");
                        // Kullanıcı Auth'da var ama Firestore'da yok, giriş yapmayı dene
                        return auth.signInWithEmailAndPassword(email.value.trim(), password.value)
                            .catch(signInError => {
                                console.error("Giriş hatası:", signInError.code, signInError.message);
                                // Şifre yanlışsa
                                if (signInError.code === 'auth/wrong-password') {
                                    loadingContainer.style.display = 'none';
                                    const registerError = document.getElementById('register-error');
                                    if (registerError) {
                                        registerError.textContent = 'Bu e-posta zaten kullanılıyor. Şifrenizi sıfırlamak için giriş ekranını kullanın.';
                                    }
                                    return Promise.reject({ code: 'auth/email-exists-wrong-password' });
                                }
                                return Promise.reject(signInError);
                            });
                    }
                    return Promise.reject(authError);
                });
        })
        .then((userCredential) => {
            if (!userCredential || !userCredential.user) {
                throw new Error("Kullanıcı bilgileri alınamadı");
            }
            
            console.log("Kullanıcı doğrulandı:", userCredential.user);
            
            // İsim ve soyisimi kullanarak displayName oluştur
            const displayName = `${firstName.value} ${lastName.value}`;
            
            // Yeni kullanıcı için Firestore'da döküman oluştur
            return db.collection('users').doc(userCredential.user.uid).set({
                email: email.value.trim().toLowerCase(),
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                displayName: displayName.trim(),
                birthDate: birthDate.value,
                class: classInfo.value.trim(),
                registrationYear: parseInt(regYear.value, 10) || new Date().getFullYear(),
                role: USER_ROLES.KURSIYER, // Yeni kullanıcılar varsayılan olarak Kursiyer
                approved: false, // Yönetici onayı bekliyor
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            console.log("Kullanıcı Firestore'a kaydedildi.");
            
            // Kullanıcıyı otomatik olarak çıkış yaptır (onay beklendiği için)
            return auth.signOut();
        })
        .then(() => {
            // Yükleniyor ekranını gizle
            loadingContainer.style.display = 'none';
            
            // Kayıt başarılı mesajını göster ve giriş formuna yönlendir
            const registerError = document.getElementById('register-error');
            if (registerError) {
                registerError.textContent = '';
            }
            
            // Başarılı mesajını göster
            openModal('Kayıt Başarılı', `
                <div class="confirmation-message">
                    <p><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> Kaydınız başarıyla oluşturuldu.</p>
                    <p>Hesabınız yönetici onayından sonra aktif olacaktır. Onaylandıktan sonra giriş yapabilirsiniz.</p>
                </div>
            `, () => {
                closeModal();
                showLoginForm(); // Başarılı kayıttan sonra giriş formunu göster
            });
        })
        .catch((error) => {
            console.error("Kayıt sırasında hata:", error);
            console.error("Hata kodu:", error.code);
            console.error("Hata mesajı:", error.message);
            
            // Custom rejected promise için kontrol
            if (error.code === 'firestore/email-already-in-use' || 
                error.code === 'auth/email-exists-wrong-password') {
                return; // Hata mesajı zaten gösterildi
            }
            
            // Yükleniyor ekranını gizle
            loadingContainer.style.display = 'none';
            
            // Hata mesajını göster
            const registerError = document.getElementById('register-error');
            if (registerError) {
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        registerError.textContent = 'Bu e-posta adresi zaten kullanılıyor. Farklı bir e-posta adresi deneyin.';
                        break;
                    case 'auth/invalid-email':
                        registerError.textContent = 'Geçersiz e-posta adresi. Lütfen doğru formatta bir e-posta giriniz.';
                        break;
                    case 'auth/weak-password':
                        registerError.textContent = 'Şifre çok zayıf. En az 6 karakter olmalıdır.';
                        break;
                    case 'auth/network-request-failed':
                        registerError.textContent = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
                        break;
                    default:
                        registerError.textContent = `Hata: ${error.message || 'Bilinmeyen bir hata oluştu.'}`;
                }
            }
        });
}

// Global function declarations for admin user management
// These functions need to be globally available for the onclick handlers in the HTML
function editUser(userId) {
    // This will be called by the event handlers in the HTML
    console.log("Global editUser called with ID:", userId);
    // We'll check if the internal implementation is ready
    if (typeof window._editUser === 'function') {
        window._editUser(userId);
    } else {
        console.error("Internal editUser implementation not ready");
        alert("Sistem henüz hazır değil. Lütfen sayfayı yenileyip tekrar deneyin.");
    }
}

function approveUser(userId) {
    // This will be called by the event handlers in the HTML
    console.log("Global approveUser called with ID:", userId);
    // We'll check if the internal implementation is ready
    if (typeof window._approveUser === 'function') {
        window._approveUser(userId);
    } else {
        console.error("Internal approveUser implementation not ready");
        alert("Sistem henüz hazır değil. Lütfen sayfayı yenileyip tekrar deneyin.");
    }
}

function deleteUser(userId) {
    // This will be called by the event handlers in the HTML
    console.log("Global deleteUser called with ID:", userId);
    // We'll check if the internal implementation is ready
    if (typeof window._deleteUser === 'function') {
        window._deleteUser(userId);
    } else {
        console.error("Internal deleteUser implementation not ready");
        alert("Sistem henüz hazır değil. Lütfen sayfayı yenileyip tekrar deneyin.");
    }
}

// Modal işlevleri - global erişim için
function openModal(title, content, onConfirm = null) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if(!modalTitle || !modalContent || !modalConfirm || !modalOverlay) {
        console.error("Modal elementleri bulunamadı!");
        return;
    }
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    // Onay fonksiyonu varsa, onay butonunu göster
    if (onConfirm) {
        modalConfirm.style.display = 'block';
        modalConfirm.onclick = onConfirm;
    } else {
        modalConfirm.style.display = 'none';
    }
    
    modalOverlay.classList.add('active');
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if(!modalOverlay || !modalContent || !modalConfirm) {
        console.error("Modal elementleri bulunamadı!");
        return;
    }
    
    modalOverlay.classList.remove('active');
    modalContent.innerHTML = '';
    modalConfirm.onclick = null;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM tamamen yüklendi ve ayrıştırıldı.");

    try {
        // Firebase'i başlat
        if (typeof firebase === 'undefined') {
            throw new Error("Firebase SDK yüklenemedi. Lütfen internet bağlantınızı ve script etiketlerini kontrol edin.");
        }

        console.log("Firebase SDK mevcut");
        const app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase başarıyla başlatıldı.");

        // İhtiyaç duyulan servisleri alın ve global değişkenlere ata
        auth = firebase.auth();
        console.log("Firebase Auth hizmeti başlatıldı");
        db = firebase.firestore();
        console.log("Firebase Firestore hizmeti başlatıldı");

        // DOM Elemanları
        const authContainer = document.getElementById('auth-container');
        const userContent = document.getElementById('user-content');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');
        const signupButton = document.getElementById('signup-button');
        const logoutButton = document.getElementById('logout-button');
        const authErrorP = document.getElementById('auth-error');
        const userEmailSpan = document.getElementById('user-email');
        const mainNav = document.getElementById('main-nav');
        const userMenu = document.getElementById('user-menu');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const adminPanel = document.getElementById('admin-panel');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalConfirm = document.getElementById('modal-confirm');

        // Modal kapatma butonları için event listener'lar
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (modalCancel) modalCancel.addEventListener('click', closeModal);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        // Mobil menü toggle işlevi
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
            
            // Mobil menüdeki linklere tıklandığında menüyü kapat
            const mobileNavLinks = mainNav.querySelectorAll('a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                });
            });
        }

        // Navigation elements
        const navDashboard = document.getElementById('nav-dashboard');
        const navAnnouncements = document.getElementById('nav-announcements');
        const navDivePlan = document.getElementById('nav-dive-plan');
        const navTraining = document.getElementById('nav-training');
        const navDiveLog = document.getElementById('nav-dive-log');
        const navProfile = document.getElementById('nav-profile');

        // Admin panel tab elemanları
        const tabAdminAnnouncements = document.getElementById('tab-admin-announcements');
        const tabAdminUsers = document.getElementById('tab-admin-users');
        const tabAdminPlanning = document.getElementById('tab-admin-planning'); // Planlama tab'ı
        const tabAdminDives = document.getElementById('tab-admin-dives');
        const tabAdminTraining = document.getElementById('tab-admin-training');

        // Admin panel içerik panelleri
        const adminAnnouncementsContent = document.getElementById('admin-announcements-content');
        const adminUsersContent = document.getElementById('admin-users-content');
        const adminPlanningContent = document.getElementById('admin-planning-content'); // Planlama içeriği
        const adminDivesContent = document.getElementById('admin-dives-content');
        const adminTrainingContent = document.getElementById('admin-training-content');

        // Admin butonları
        const addAnnouncementButton = document.getElementById('add-announcement-button');
        const searchUsersButton = document.getElementById('search-users-button');
        const addDivePlanButton = document.getElementById('add-dive-plan-button');

        // Auth durumu değiştiğinde tetiklenecek fonksiyon
        function authStateObserver(user) {
            console.log("Auth durumu değişti:", user ? "Giriş yapıldı" : "Çıkış yapıldı");
            
            // DOM elementlerini al
            const loadingContainer = document.getElementById('loading-container');
            const authContainer = document.getElementById('auth-container');
            const userContent = document.getElementById('user-content');
            const mainNav = document.getElementById('main-nav');
            const userMenu = document.getElementById('user-menu');
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const adminPanel = document.getElementById('admin-panel');
            const userEmailSpan = document.getElementById('user-email');
            const authErrorP = document.getElementById('auth-error');
            
            // Yükleniyor göstergesini kontrol et
            if (!loadingContainer) {
                console.error("Yükleniyor göstergesi elementi bulunamadı!");
                return;
            }
            
            // Yükleniyor göstergesini görünür yap - sayfa yüklenirken
            loadingContainer.style.display = 'flex';
            
            if (user) {
                // Kullanıcı giriş yapmış durumda
                console.log("Kullanıcı giriş yaptı:", user.email);
                
                // Firestore'dan kullanıcı verilerini al
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            console.log("Kullanıcı verileri başarıyla alındı:", userData);
                            
                            // UI elemanlarının varlığını kontrol et
                            if (!authContainer || !userContent || !mainNav || !userMenu || !mobileMenuToggle) {
                                console.error("Bazı UI elementleri bulunamadı!");
                                return;
                            }
                            
                            // UI'ı güncelle
                            authContainer.style.display = 'none';
                            userContent.style.display = 'block';
                            mainNav.style.display = 'flex';
                            userMenu.style.display = 'flex';
                            
                            // Mobil menü butonunu sadece mobil görünümde göster
                            mobileMenuToggle.style.display = 'none';

                            // Media query ile mobil görünümü kontrol et
                            const mediaQuery = window.matchMedia('(max-width: 768px)');
                            if (mediaQuery.matches) {
                                mobileMenuToggle.style.display = 'block';
                            }
                            
                            // Ekran boyutu değiştiğinde dinle
                            mediaQuery.addEventListener('change', (e) => {
                                mobileMenuToggle.style.display = e.matches ? 'block' : 'none';
                            });
                            
                            // Yükleniyor göstergesini gizle
                            loadingContainer.style.display = 'none';
                            
                            // Kullanıcı e-postasını göster
                            if (userEmailSpan) {
                                userEmailSpan.textContent = user.email;
                            }
                            
                            // Kullanıcı rolünü kontrol et
                            if (userData.role === USER_ROLES.ADMIN && adminPanel) {
                                console.log("Admin kullanıcısı tespit edildi");
                                // Admin panelini gösterme - sadece menü öğesine tıklandığında gösterilecek
                                adminPanel.style.display = 'none';
                                setupAdminPanelTabs(); // Admin panel tab'larını kur
                                loadAdminData(); // Admin verilerini yükle
                                
                                // Admin olduğunu göster
                                if (userEmailSpan) {
                                    userEmailSpan.textContent = `${user.email} (Admin)`;
                                }
                                
                                // Admin menü öğesini göster
                                const adminNavItem = document.getElementById('admin-nav-item');
                                if (adminNavItem) {
                                    adminNavItem.style.display = 'block';
                                }
                            } else if (adminPanel) {
                                // Admin panelini gizle
                                adminPanel.style.display = 'none';
                                
                                // Admin menü öğesini gizle
                                const adminNavItem = document.getElementById('admin-nav-item');
                                if (adminNavItem) {
                                    adminNavItem.style.display = 'none';
                                }
                            }
                            
                            // Navigasyon butonlarını ayarla
                            setupNavigation();
                            
                            // Varsayılan olarak dashboard'u göster
                            showSection('dashboard-section');
                        } else {
                            // Kullanıcı verileri bulunamadı - yeni kullanıcı oluştur veya çıkış yap
                            console.log("Kullanıcı verisi bulunamadı, veri oluşturuluyor veya çıkış yapılıyor");
                            
                            // Buraya yeni kullanıcı verisi oluşturma ekleyebiliriz
                            // Ya da çıkış yaptırabiliriz
                            if (authContainer) {
                                authContainer.style.display = 'flex';
                            }
                            
                            // Yükleniyor göstergesini gizle
                            loadingContainer.style.display = 'none';
                            
                            // Çıkış yap
                            auth.signOut();
                        }
                    })
                    .catch((error) => {
                        console.error("Kullanıcı verileri alınırken hata:", error);
                        
                        // Yükleniyor göstergesini kesinlikle gizle
                        loadingContainer.style.display = 'none';
                        
                        // Giriş ekranını göster
                        if (authContainer) {
                            authContainer.style.display = 'flex';
                        }
                        
                        // Hata mesajı göster
                        if (authErrorP) {
                            authErrorP.textContent = `Hata: ${error.message}`;
                        }
                        
                        // Kullanıcı içeriğini gizle
                        if (userContent) {
                            userContent.style.display = 'none';
                        }
                        
                        // Navigasyonu gizle
                        if (mainNav) {
                            mainNav.style.display = 'none';
                        }
                        
                        // Kullanıcı menüsünü gizle 
                        if (userMenu) {
                            userMenu.style.display = 'none';
                        }
                        
                        // Mobil menü butonunu gizle
                        if (mobileMenuToggle) {
                            mobileMenuToggle.style.display = 'none';
                        }
                        
                        // Çıkış yap - hata durumunda
                        setTimeout(() => {
                            auth.signOut();
                        }, 2000);
                    });
            } else {
                // Kullanıcı çıkış yapmış
                console.log("Kullanıcı giriş yapmamış veya çıkış yapmış");
                
                // Yükleniyor göstergesini gizle ve giriş formunu göster
                setTimeout(() => {
                    // Yükleniyor göstergesini gizle
                    if (loadingContainer) {
                        loadingContainer.style.display = 'none';
                    }
                    
                    // UI'ı düzenle
                    if (authContainer) {
                        authContainer.style.display = 'flex';
                    }
                    
                    if (userContent) {
                        userContent.style.display = 'none';
                    }
                    
                    if (mainNav) {
                        mainNav.style.display = 'none';
                    }
                    
                    if (userMenu) {
                        userMenu.style.display = 'none';
                    }
                    
                    if (mobileMenuToggle) {
                        mobileMenuToggle.style.display = 'none';
                    }
                    
                    // Form alanlarını temizle
                    const emailInput = document.getElementById('email');
                    const passwordInput = document.getElementById('password');
                    if (emailInput) {
                        emailInput.value = '';
                    }
                    if (passwordInput) {
                        passwordInput.value = '';
                    }
                    if (authErrorP) {
                        authErrorP.textContent = '';
                    }
                }, 500); // Süreyi azalttım
            }
        }
        
        // Auth durumu değişince authStateObserver fonksiyonunu çağır
        auth.onAuthStateChanged(authStateObserver);

        // Admin panel tab'larını kurma fonksiyonu
        function setupAdminPanelTabs() {
            // Admin tabları için event listener'lar
            if (tabAdminAnnouncements) {
                tabAdminAnnouncements.addEventListener('click', () => {
                    showAdminTab('admin-announcements-content');
                });
            }
            
            if (tabAdminUsers) {
                tabAdminUsers.addEventListener('click', () => {
                    showAdminTab('admin-users-content');
                });
            }
            
            // Planlama tab'ı için event listener
            if (tabAdminPlanning) {
                tabAdminPlanning.addEventListener('click', () => {
                    showAdminTab('admin-planning-content');
                    setupDivePlanningTable(); // Planlama tablosunu kur
                    loadDivePlannings(); // Planlama verilerini yükle
                });
            }
            
            if (tabAdminDives) {
                tabAdminDives.addEventListener('click', () => {
                    showAdminTab('admin-dives-content');
                });
            }
            
            if (tabAdminTraining) {
                tabAdminTraining.addEventListener('click', () => {
                    showAdminTab('admin-training-content');
                });
            }
        }
        
        // Admin tab'larını gösterme fonksiyonu
        function showAdminTab(tabId) {
            console.log(`Admin tab gösteriliyor: ${tabId}`);
            
            // İçerik panellerini gizle
            if (adminAnnouncementsContent) adminAnnouncementsContent.classList.remove('active');
            if (adminUsersContent) adminUsersContent.classList.remove('active');
            if (adminPlanningContent) adminPlanningContent.classList.remove('active'); // Planlama içeriğini gizle
            if (adminDivesContent) adminDivesContent.classList.remove('active');
            if (adminTrainingContent) adminTrainingContent.classList.remove('active');
            
            // Seçilen paneli göster
            const selectedPanel = document.getElementById(tabId);
            if (selectedPanel) {
                selectedPanel.classList.add('active');
            }
            
            // Tab butonlarını sıfırla
            if (tabAdminAnnouncements) tabAdminAnnouncements.classList.remove('active');
            if (tabAdminUsers) tabAdminUsers.classList.remove('active');
            if (tabAdminPlanning) tabAdminPlanning.classList.remove('active'); // Planlama tab'ının sınıfını kaldır
            if (tabAdminDives) tabAdminDives.classList.remove('active');
            if (tabAdminTraining) tabAdminTraining.classList.remove('active');
            
            // Seçilen tab'ı aktif yap
            switch (tabId) {
                case 'admin-announcements-content':
                    if (tabAdminAnnouncements) tabAdminAnnouncements.classList.add('active');
                    loadAdminAnnouncements();
                    break;
                case 'admin-users-content':
                    if (tabAdminUsers) tabAdminUsers.classList.add('active');
                    loadAdminUsers();
                    break;
                case 'admin-planning-content':
                    if (tabAdminPlanning) tabAdminPlanning.classList.add('active');
                    setupDivePlanningTable(); // Planlama tablosunu kur
                    loadDivePlannings(); // Planlama verilerini yükle
                    break;
                case 'admin-dives-content':
                    if (tabAdminDives) tabAdminDives.classList.add('active');
                    loadAdminDives();
                    break;
                case 'admin-training-content':
                    if (tabAdminTraining) tabAdminTraining.classList.add('active');
                    loadAdminTraining();
                    break;
            }
        }
        
        // Admin verilerini yükleme fonksiyonu
        function loadAdminData() {
            console.log("Admin verileri yükleniyor");
            loadAdminAnnouncements();
            loadAdminUsers();
            setupDivePlanningTable();
            loadDivePlannings();
            
            // Rich text editor'ü başlat
            initRichTextEditor();
        }
        
        // Admin duyurularını yükleme fonksiyonu
        function loadAdminAnnouncements() {
            console.log("Admin duyuruları yükleniyor");
            const adminAnnouncementsList = document.getElementById('admin-announcements-list');
            
            if (adminAnnouncementsList) {
                adminAnnouncementsList.innerHTML = 'Duyurular yükleniyor...';
                
                db.collection('announcements').orderBy('createdAt', 'desc').get()
                .then((querySnapshot) => {
                     if (querySnapshot.empty) {
                            adminAnnouncementsList.innerHTML = '<p>Henüz duyuru bulunmamaktadır.</p>';
                         return;
                     }
                        
                        let html = `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Başlık</th>
                                        <th>İçerik</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        
                     querySnapshot.forEach((doc) => {
                            const announcement = doc.data();
                            const date = announcement.createdAt ? announcement.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih belirtilmemiş';
                            
                            html += `
                                <tr>
                                    <td>${date}</td>
                                    <td>${announcement.title || 'Başlıksız'}</td>
                                    <td>${announcement.content.substring(0, 50)}${announcement.content.length > 50 ? '...' : ''}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary edit-announcement" data-id="${doc.id}">Düzenle</button>
                                        <button class="btn btn-sm btn-danger delete-announcement" data-id="${doc.id}">Sil</button>
                                    </td>
                                </tr>
                            `;
                        });
                        
                        html += `
                                </tbody>
                            </table>
                        `;
                        
                        adminAnnouncementsList.innerHTML = html;
                        
                        // Event listener'ları ekle
                        document.querySelectorAll('.edit-announcement').forEach(button => {
                            button.addEventListener('click', (e) => {
                                const announcementId = e.target.getAttribute('data-id');
                                editAnnouncement(announcementId);
                            });
                        });
                        
                        document.querySelectorAll('.delete-announcement').forEach(button => {
                            button.addEventListener('click', (e) => {
                                const announcementId = e.target.getAttribute('data-id');
                                deleteAnnouncement(announcementId);
                            });
                        });
                 })
                 .catch((error) => {
                     console.error("Duyurular yüklenirken hata:", error);
                        adminAnnouncementsList.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                    });
            }
            
            // Kullanıcı duyurularını da yükle
            loadAnnouncements();
        }
        
        // Kullanıcı duyurularını yükleme fonksiyonu
        function loadAnnouncements() {
            console.log("Kullanıcı duyuruları yükleniyor");
            const announcementsContainer = document.getElementById('announcements');
            if (!announcementsContainer) return;
            
            announcementsContainer.innerHTML = 'Duyurular yükleniyor...';
            
            db.collection('announcements').orderBy('createdAt', 'desc').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        announcementsContainer.innerHTML = '<p>Henüz duyuru bulunmamaktadır.</p>';
                        return;
                    }
                    
                    // Duyuruları önce önceliğe, sonra tarihe göre sırala
                    let announcements = [];
                    querySnapshot.forEach((doc) => {
                        announcements.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Önceliğe göre sırala (yüksek öncelikli olanlar üstte)
                    announcements.sort((a, b) => {
                        // Önce önceliğe göre
                        if (a.priority === 'high' && b.priority !== 'high') return -1;
                        if (a.priority !== 'high' && b.priority === 'high') return 1;
                        
                        // Aynı öncelikte olanları tarihe göre sırala (yeni olanlar üstte)
                        if (a.createdAt && b.createdAt) {
                            return b.createdAt.toDate() - a.createdAt.toDate();
                        }
                        return 0;
                    });
                    
                    let html = '';
                    
                    announcements.forEach((announcement) => {
                        const date = announcement.createdAt ? announcement.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih belirtilmemiş';
                        const priorityClass = announcement.priority === 'high' ? 'high-priority' : '';
                        
                        html += `
                            <div class="announcement-card ${priorityClass}" data-id="${announcement.id}">
                                <div class="announcement-header">
                                    <h3 class="announcement-title">${announcement.title || 'Başlıksız'}</h3>
                                    <span class="announcement-date">${date}</span>
                                </div>
                            </div>
                        `;
                    });
                    
                    announcementsContainer.innerHTML = html;
                    
                    // Duyurulara tıklama olayı ekle
                    document.querySelectorAll('.announcement-card').forEach(card => {
                        card.addEventListener('click', (e) => {
                            const announcementId = card.getAttribute('data-id');
                            openAnnouncementDetail(announcementId);
                        });
                    });
                })
                .catch((error) => {
                    console.error("Duyurular yüklenirken hata:", error);
                    announcementsContainer.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                });
        }
        
        // Admin kullanıcıları yükleme fonksiyonu
        function loadAdminUsers() {
            console.log("Admin kullanıcı listesi yükleniyor");
            
            const usersListContainer = document.getElementById('users-list');
            const pendingUsersListContainer = document.getElementById('pending-users-list');
            
            if (!usersListContainer || !pendingUsersListContainer) {
                console.error("Kullanıcı listesi için gerekli DOM elementleri bulunamadı!");
                return;
            }
            
            // Yükleniyor mesajı
            usersListContainer.innerHTML = '<p>Kullanıcılar yükleniyor...</p>';
            pendingUsersListContainer.innerHTML = '<p>Onay bekleyen kullanıcılar yükleniyor...</p>';
            
            // Kullanıcıları Firestore'dan al
            db.collection('users').get()
                .then((snapshot) => {
                    if (snapshot.empty) {
                        usersListContainer.innerHTML = '<p>Kullanıcı bulunamadı.</p>';
                        pendingUsersListContainer.innerHTML = '<p>Onay bekleyen kullanıcı bulunamadı.</p>';
                        return;
                    }
                    
                    let usersHTML = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Adı Soyadı</th>
                                    <th>E-posta</th>
                                    <th>Bölüm/Sınıf</th>
                                    <th>Kayıt Yılı</th>
                                    <th>Rol</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    let pendingUsersHTML = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Adı Soyadı</th>
                                    <th>E-posta</th>
                                    <th>Bölüm/Sınıf</th>
                                    <th>Kayıt Yılı</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    let activeUsersExist = false;
                    let pendingUsersExist = false;
                    
                    snapshot.forEach((doc) => {
                        const userData = doc.data();
                        const userId = doc.id;
                        
                        // Kullanıcıların tarih bilgisini formatlı göster
                        const createdDate = userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bilinmiyor';
                        
                        // İsim ve soyisim bilgilerini göster
                        const displayName = userData.displayName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email);
                        
                        if (userData.approved) {
                            activeUsersExist = true;
                            usersHTML += `
                                <tr>
                                    <td>${displayName}</td>
                                    <td>${userData.email}</td>
                                    <td>${userData.class || 'Belirtilmemiş'}</td>
                                    <td>${userData.registrationYear || 'Belirtilmemiş'}</td>
                                    <td><a href="#" class="edit-role" onclick="editUser('${userId}'); return false;">${userData.role}</a></td>
                                    <td>Onaylı</td>
                                    <td class="action-buttons">
                                        <button class="action-btn" onclick="editUser('${userId}'); return false;"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" onclick="deleteUser('${userId}'); return false;"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            `;
                        } else {
                            pendingUsersExist = true;
                            pendingUsersHTML += `
                                <tr>
                                    <td>${displayName}</td>
                                    <td>${userData.email}</td>
                                    <td>${userData.class || 'Belirtilmemiş'}</td>
                                    <td>${userData.registrationYear || 'Belirtilmemiş'}</td>
                                    <td>${createdDate}</td>
                                    <td class="action-buttons">
                                        <button class="action-btn" onclick="approveUser('${userId}'); return false;"><i class="fas fa-check"></i></button>
                                        <button class="action-btn" onclick="editUser('${userId}'); return false;"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" onclick="deleteUser('${userId}'); return false;"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            `;
                        }
                    });
                    
                    usersHTML += `</tbody></table>`;
                    pendingUsersHTML += `</tbody></table>`;
                    
                    // Kullanıcı listelerini güncelle
                    if (activeUsersExist) {
                        usersListContainer.innerHTML = usersHTML;
                    } else {
                        usersListContainer.innerHTML = '<p>Onaylı kullanıcı bulunamadı.</p>';
                    }
                    
                    if (pendingUsersExist) {
                        pendingUsersListContainer.innerHTML = pendingUsersHTML;
                    } else {
                        pendingUsersListContainer.innerHTML = '<p>Onay bekleyen kullanıcı bulunamadı.</p>';
                    }
                })
                .catch((error) => {
                    console.error("Kullanıcılar yüklenirken hata oluştu:", error);
                    usersListContainer.innerHTML = `<p>Hata: ${error.message}</p>`;
                    pendingUsersListContainer.innerHTML = `<p>Hata: ${error.message}</p>`;
                });
        }
        
        // Admin dalışları yükleme fonksiyonu
        function loadAdminDives() {
            console.log("Admin dalışları yükleniyor");
            // ... Dalış verilerini yükleme kodu ...
        }
        
        // Admin eğitimleri yükleme fonksiyonu
        function loadAdminTraining() {
            console.log("Admin eğitimleri yükleniyor");
            // ... Eğitim verilerini yükleme kodu ...
            
            // Admin Eğitim tab'larını aktifleştir
            setupAdminTrainingTabs();
        }
        
        // Admin eğitim tab'larını kurma fonksiyonu
        function setupAdminTrainingTabs() {
            console.log("Admin eğitim tab'ları ayarlanıyor");
            
            // Eğitim alt tabları için event listener'lar
            const tabAdminTheoretical = document.getElementById('tab-admin-theoretical');
            const tabAdminPool = document.getElementById('tab-admin-pool');
            const tabAdminLessons = document.getElementById('tab-admin-lessons');
            
            if (tabAdminTheoretical) {
                tabAdminTheoretical.addEventListener('click', () => {
                    showAdminTrainingTab('admin-theoretical-content');
                });
            }
            
            if (tabAdminPool) {
                tabAdminPool.addEventListener('click', () => {
                    showAdminTrainingTab('admin-pool-content');
                });
            }
            
            if (tabAdminLessons) {
                tabAdminLessons.addEventListener('click', () => {
                    showAdminTrainingTab('admin-lessons-content');
                });
            }
        }
        
        // Admin eğitim tab'larını gösterme fonksiyonu
        function showAdminTrainingTab(tabId) {
            console.log(`Admin eğitim tab gösteriliyor: ${tabId}`);
            
            // Eğitim içerik panellerini gizle
            const adminTheoreticalContent = document.getElementById('admin-theoretical-content');
            const adminPoolContent = document.getElementById('admin-pool-content');
            const adminLessonsContent = document.getElementById('admin-lessons-content');
            
            if (adminTheoreticalContent) adminTheoreticalContent.classList.remove('active');
            if (adminPoolContent) adminPoolContent.classList.remove('active');
            if (adminLessonsContent) adminLessonsContent.classList.remove('active');
            
            // Seçilen paneli göster
            const selectedPanel = document.getElementById(tabId);
            if (selectedPanel) {
                selectedPanel.classList.add('active');
            }
            
            // Tab butonlarını sıfırla
            const tabAdminTheoretical = document.getElementById('tab-admin-theoretical');
            const tabAdminPool = document.getElementById('tab-admin-pool');
            const tabAdminLessons = document.getElementById('tab-admin-lessons');
            
            if (tabAdminTheoretical) tabAdminTheoretical.classList.remove('active');
            if (tabAdminPool) tabAdminPool.classList.remove('active');
            if (tabAdminLessons) tabAdminLessons.classList.remove('active');
            
            // Seçilen tab'ı aktif yap
            switch (tabId) {
                case 'admin-theoretical-content':
                    if (tabAdminTheoretical) tabAdminTheoretical.classList.add('active');
                    loadAdminMaterials();
                    break;
                case 'admin-pool-content':
                    if (tabAdminPool) tabAdminPool.classList.add('active');
                    loadAdminPoolSessions();
                    break;
                case 'admin-lessons-content':
                    if (tabAdminLessons) tabAdminLessons.classList.add('active');
                    loadAdminLessons();
                    break;
            }
        }
        
        // Eğitim materyallerini yükleme fonksiyonu
        function loadAdminMaterials() {
            console.log("Eğitim materyalleri yükleniyor");
            // Burada Firestore'dan eğitim materyallerini yükleme kodu gelecek
        }
        
        // Havuz seanslarını yükleme fonksiyonu
        function loadAdminPoolSessions() {
            console.log("Havuz seansları yükleniyor");
            // Burada Firestore'dan havuz seanslarını yükleme kodu gelecek
        }
        
        // Dersleri yükleme fonksiyonu
        function loadAdminLessons() {
            console.log("Dersler yükleniyor");
            // Burada Firestore'dan dersleri yükleme kodu gelecek
        }
        
        // Duyuru düzenleme fonksiyonu
        function editAnnouncement(announcementId) {
            console.log(`Duyuru düzenleniyor: ${announcementId}`);
            
            // Önce duyuru bilgilerini al
            db.collection('announcements').doc(announcementId).get()
                .then((doc) => {
                    if (doc.exists) {
                        const announcementData = doc.data();
                        
                        // Modal içeriğini hazırla
                        const content = `
                            <div class="admin-form">
                                <div class="form-group">
                                    <label for="edit-announcement-title">Başlık</label>
                                    <input type="text" id="edit-announcement-title" value="${announcementData.title || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-announcement-content">İçerik</label>
                                    <div id="edit-rich-editor-toolbar">
                                        <button type="button" class="editor-btn" data-command="bold" title="Kalın"><i class="fas fa-bold"></i></button>
                                        <button type="button" class="editor-btn" data-command="italic" title="İtalik"><i class="fas fa-italic"></i></button>
                                        <button type="button" class="editor-btn" data-command="underline" title="Altı Çizili"><i class="fas fa-underline"></i></button>
                                        <button type="button" class="editor-btn" data-command="strikeThrough" title="Üstü Çizili"><i class="fas fa-strikethrough"></i></button>
                                        <span class="toolbar-divider"></span>
                                        <button type="button" class="editor-btn" data-command="justifyLeft" title="Sola Hizala"><i class="fas fa-align-left"></i></button>
                                        <button type="button" class="editor-btn" data-command="justifyCenter" title="Ortala"><i class="fas fa-align-center"></i></button>
                                        <button type="button" class="editor-btn" data-command="justifyRight" title="Sağa Hizala"><i class="fas fa-align-right"></i></button>
                                        <span class="toolbar-divider"></span>
                                        <button type="button" class="editor-btn" data-command="insertUnorderedList" title="Madde İşaretleri"><i class="fas fa-list-ul"></i></button>
                                        <button type="button" class="editor-btn" data-command="insertOrderedList" title="Numaralı Liste"><i class="fas fa-list-ol"></i></button>
                                        <span class="toolbar-divider"></span>
                                        <button type="button" class="editor-btn" data-command="createLink" title="Bağlantı Ekle"><i class="fas fa-link"></i></button>
                                        <button type="button" class="editor-btn" data-command="unlink" title="Bağlantıyı Kaldır"><i class="fas fa-unlink"></i></button>
                                        <span class="toolbar-divider"></span>
                                        <div class="editor-dropdown">
                                            <button type="button" class="editor-dropdown-toggle"><span id="edit-current-font">Font</span> <i class="fas fa-caret-down"></i></button>
                                            <div class="editor-dropdown-menu">
                                                <button type="button" class="dropdown-item" data-command="fontName" data-value="Arial">Arial</button>
                                                <button type="button" class="dropdown-item" data-command="fontName" data-value="Helvetica">Helvetica</button>
                                                <button type="button" class="dropdown-item" data-command="fontName" data-value="Times New Roman">Times New Roman</button>
                                                <button type="button" class="dropdown-item" data-command="fontName" data-value="Sans Serif">Sans Serif</button>
                                                <button type="button" class="dropdown-item" data-command="fontName" data-value="Courier New">Courier New</button>
                                            </div>
                                        </div>
                                        <div class="editor-dropdown">
                                            <button type="button" class="editor-dropdown-toggle"><span id="edit-current-size">Boyut</span> <i class="fas fa-caret-down"></i></button>
                                            <div class="editor-dropdown-menu">
                                                <button type="button" class="dropdown-item" data-command="fontSize" data-value="1">Çok Küçük</button>
                                                <button type="button" class="dropdown-item" data-command="fontSize" data-value="2">Küçük</button>
                                                <button type="button" class="dropdown-item" data-command="fontSize" data-value="3">Normal</button>
                                                <button type="button" class="dropdown-item" data-command="fontSize" data-value="4">Büyük</button>
                                                <button type="button" class="dropdown-item" data-command="fontSize" data-value="5">Çok Büyük</button>
                                            </div>
                                        </div>
                                        <span class="toolbar-divider"></span>
                                        <button type="button" class="editor-btn" data-command="foreColor" data-value="#000000" title="Siyah" style="color: #000000;"><i class="fas fa-tint"></i></button>
                                        <button type="button" class="editor-btn" data-command="foreColor" data-value="#0000FF" title="Mavi" style="color: #0000FF;"><i class="fas fa-tint"></i></button>
                                        <button type="button" class="editor-btn" data-command="foreColor" data-value="#FF0000" title="Kırmızı" style="color: #FF0000;"><i class="fas fa-tint"></i></button>
                                    </div>
                                    <div id="edit-announcement-content-editor" class="rich-editor-content" contenteditable="true">${announcementData.content || ''}</div>
                                    <textarea id="edit-announcement-content" style="display: none;">${announcementData.content || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label for="edit-announcement-priority">Öncelik</label>
                                    <select id="edit-announcement-priority">
                                        <option value="normal" ${announcementData.priority !== 'high' ? 'selected' : ''}>Normal</option>
                                        <option value="high" ${announcementData.priority === 'high' ? 'selected' : ''}>Yüksek</option>
                                    </select>
                                </div>
                            </div>
                        `;
                        
                        // Modal'ı aç
                        openModal('Duyuru Düzenle', content, () => {
                            // Değerleri al
                            const newTitle = document.getElementById('edit-announcement-title').value;
                            const newContent = document.getElementById('edit-announcement-content').value;
                            const newPriority = document.getElementById('edit-announcement-priority').value;
                            
                            if (!newTitle || !newContent) {
                                alert('Lütfen başlık ve içerik alanlarını doldurun.');
                                return;
                            }
                            
                            // Duyuruyu güncelle
                            db.collection('announcements').doc(announcementId).update({
                                title: newTitle,
                                content: newContent,
                                priority: newPriority,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            })
                            .then(() => {
                                console.log("Duyuru başarıyla güncellendi");
                                closeModal();
                                loadAdminAnnouncements(); // Duyuruları yeniden yükle
                            })
                            .catch((error) => {
                                console.error("Duyuru güncellenirken hata:", error);
                                alert(`Hata: ${error.message}`);
                            });
                        });
                        
                        // Edit modalındaki rich text editor'ü başlat
                        initEditRichTextEditor();
                    } else {
                        console.error("Duyuru bulunamadı");
                        alert("Duyuru bulunamadı!");
                    }
                })
                .catch((error) => {
                    console.error("Duyuru verileri alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        }

        // Edit rich text editor için özel başlatma fonksiyonu
        function initEditRichTextEditor() {
            const editorToolbar = document.getElementById('edit-rich-editor-toolbar');
            const editorContent = document.getElementById('edit-announcement-content-editor');
            const hiddenTextarea = document.getElementById('edit-announcement-content');
            
            if (!editorToolbar || !editorContent || !hiddenTextarea) return;
            
            // Tüm düzenleme butonları için event listener ekle
            const buttons = editorToolbar.querySelectorAll('.editor-btn');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const command = button.getAttribute('data-command');
                    const value = button.getAttribute('data-value') || null;
                    
                    if (command === 'createLink') {
                        const url = prompt('Link URL\'si girin:', 'https://');
                        if (url) {
                            document.execCommand(command, false, url);
                        }
                    } else {
                        document.execCommand(command, false, value);
                    }
                    
                    // Editor içeriğini hidden textarea'ya aktar
                    hiddenTextarea.value = editorContent.innerHTML;
                });
            });
            
            // Renk paleti butonları için event listener
            const colorItems = editorToolbar.querySelectorAll('.color-item');
            colorItems.forEach(item => {
                item.addEventListener('click', () => {
                    const command = item.getAttribute('data-command');
                    const value = item.getAttribute('data-value');
                    
                    document.execCommand(command, false, value);
                    
                    // Editor içeriğini hidden textarea'ya aktar
                    hiddenTextarea.value = editorContent.innerHTML;
                });
            });
            
            // Font seçimi için dropdown itemları
            const fontItems = editorToolbar.querySelectorAll('.dropdown-item[data-command="fontName"]');
            const currentFontSpan = document.getElementById('edit-current-font');
            
            fontItems.forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.getAttribute('data-value');
                    
                    document.execCommand('fontName', false, value);
                    
                    // Seçilen fontu göster
                    if (currentFontSpan) {
                        currentFontSpan.textContent = item.textContent;
                    }
                    
                    // Editor içeriğini hidden textarea'ya aktar
                    hiddenTextarea.value = editorContent.innerHTML;
                });
            });
            
            // Font boyutu seçimi için dropdown itemları
            const sizeItems = editorToolbar.querySelectorAll('.dropdown-item[data-command="fontSize"]');
            const currentSizeSpan = document.getElementById('edit-current-size');
            
            sizeItems.forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.getAttribute('data-value');
                    
                    document.execCommand('fontSize', false, value);
                    
                    // Seçilen boyutu göster
                    if (currentSizeSpan) {
                        currentSizeSpan.textContent = item.textContent;
                    }
                    
                    // Editor içeriğini hidden textarea'ya aktar
                    hiddenTextarea.value = editorContent.innerHTML;
                });
            });
            
            // Editor içeriği değiştiğinde hidden textarea'ya aktar
            editorContent.addEventListener('input', () => {
                hiddenTextarea.value = editorContent.innerHTML;
            });
            
            // Başlangıç durumu
            hiddenTextarea.value = editorContent.innerHTML;
            
            console.log("Edit düzenleme modalı için rich text editor başlatıldı");
        }
        
        // Duyuru silme fonksiyonu
        function deleteAnnouncement(announcementId) {
            console.log(`Duyuru siliniyor: ${announcementId}`);
            
            // Use custom modal for confirmation instead of browser alert
            const confirmContent = `
                <div class="confirmation-message">
                    <p><i class="fas fa-exclamation-triangle" style="color: var(--danger); margin-right: 8px;"></i> Bu duyuruyu silmek istediğinizden emin misiniz?</p>
                    <p>Bu işlem geri alınamaz.</p>
                </div>
            `;
            
            openModal('Duyuru Silme Onayı', confirmContent, () => {
                db.collection('announcements').doc(announcementId).delete()
                    .then(() => {
                        console.log("Duyuru başarıyla silindi");
                        closeModal();
                        loadAdminAnnouncements(); // Duyuruları yeniden yükle
                    })
                    .catch((error) => {
                        console.error("Duyuru silinirken hata:", error);
                        // Show error in modal instead of alert
                        const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                        openModal('Hata', errorContent);
                    });
            });
        }
        
        // Butonlara event listener ekle
        if (loginButton) {
            console.log("Login butonu bulundu, event listener ekleniyor.");
            loginButton.addEventListener('click', handleLogin);
        } else {
            console.error("Login butonu bulunamadı!");
        }

        if (signupButton) {
            console.log("Signup butonu bulundu, event listener ekleniyor.");
            signupButton.addEventListener('click', handleSignup);
        } else {
            console.error("Signup butonu bulunamadı!");
        }

        if (logoutButton) {
            console.log("Logout butonu bulundu, event listener ekleniyor.");
            logoutButton.addEventListener('click', logoutUser);
        }
        
        // Admin butonu için event listener
        if (addAnnouncementButton) {
            addAnnouncementButton.addEventListener('click', () => {
                console.log("Duyuru ekleme butonuna tıklandı");
                const title = document.getElementById('announcement-title').value;
                const content = document.getElementById('announcement-content').value; // Hidden textarea'dan HTML içeriği alınır
                const priority = document.getElementById('announcement-priority').value;
                
                if (!title || !content) {
                    alert('Lütfen başlık ve içerik alanlarını doldurun.');
                    return;
                }
                
                db.collection('announcements').add({
                    title: title,
                    content: content,
                    priority: priority,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: auth.currentUser.uid
                })
                .then(() => {
                    console.log("Duyuru başarıyla eklendi");
                    // Formu temizle
                    document.getElementById('announcement-title').value = '';
                    document.getElementById('announcement-content-editor').innerHTML = ''; // Editor içeriğini temizle
                    document.getElementById('announcement-content').value = ''; // Hidden textarea'yı temizle
                    document.getElementById('announcement-priority').value = 'normal';
                    // Duyuruları yeniden yükle
                    loadAdminAnnouncements();
                    // Kullanıcı arayüzündeki duyuruları da yükle
                    loadAnnouncements();
                })
                .catch((error) => {
                    console.error("Duyuru eklenirken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
            });
        }

        // Temel navigasyon fonksiyonu
        function showSection(sectionId) {
            console.log(`Bölüm gösteriliyor: ${sectionId}`);
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Nav linklerini güncelle
            const navLinks = document.querySelectorAll('nav a');
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // Seçilen nav linkini aktif yap
            const activeNavLink = document.querySelector(`nav a[href="#"][id="nav-${sectionId.replace('-section', '')}"]`);
            if (activeNavLink) {
                activeNavLink.classList.add('active');
            }
            
            // Admin panelini sadece admin-panel seçiliyse göster, diğer bölümlerde gösterme
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                if (sectionId === 'admin-panel') {
                    adminPanel.style.display = 'block';
                } else {
                    adminPanel.style.display = 'none';
                }
            }
            
            // Eğer dalış planı bölümüne gidiliyorsa, dalış planını yükle
            if (sectionId === 'dive-plan-section') {
                console.log("Dalış planı bölümü açıldı, dalış planı yükleniyor");
                loadDivePlan();
            }
            
            // Eğer profil bölümüne gidiliyorsa, profil bilgilerini yükle
            if (sectionId === 'profile-section') {
                console.log("Profil bölümü açıldı, profil bilgileri yükleniyor");
                loadUserProfile();
            }
        }

        // Ana navigasyon butonlarını ayarla
        function setupNavigation() {
            console.log("Ana navigasyon ayarlanıyor");
            
            // Dashboard butonuna tıklama
            if (navDashboard) {
                navDashboard.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Dashboard butonuna tıklandı");
                    showSection('dashboard-section');
                });
            }
            
            // Profil butonuna tıklama
            if (navProfile) {
                navProfile.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Profil butonuna tıklandı");
                    showSection('profile-section');
                });
            }
            
            // Admin paneli butonuna tıklama
            const navAdmin = document.getElementById('nav-admin');
            if (navAdmin) {
                navAdmin.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Admin paneli butonuna tıklandı");
                    showSection('admin-panel');
                });
            }
            
            // Dashboard üzerindeki navigasyon kartları
            setupDashboardNavCards();
        }

        // Dashboard üzerindeki navigasyon kartlarını ayarla
        function setupDashboardNavCards() {
            console.log("Dashboard navigasyon kartları ayarlanıyor");
            
            // Duyurular kartı
            const navCardAnnouncements = document.getElementById('nav-card-announcements');
            if (navCardAnnouncements) {
                navCardAnnouncements.addEventListener('click', () => {
                    console.log("Duyurular kartına tıklandı");
                    showSection('announcements-section');
                });
            }
            
            // Dalış Planı kartı
            const navCardDivePlan = document.getElementById('nav-card-dive-plan');
            if (navCardDivePlan) {
                navCardDivePlan.addEventListener('click', () => {
                    console.log("Dalış Planı kartına tıklandı");
                    showSection('dive-plan-section');
                });
            }
            
            // Eğitim kartı
            const navCardTraining = document.getElementById('nav-card-training');
            if (navCardTraining) {
                navCardTraining.addEventListener('click', () => {
                    console.log("Eğitim kartına tıklandı");
                    showSection('training-section');
                    setupTrainingTabs(); // Eğitim tablarını kur
                });
            }
            
            // Dalış Kaydı kartı
            const navCardDiveLog = document.getElementById('nav-card-dive-log');
            if (navCardDiveLog) {
                navCardDiveLog.addEventListener('click', () => {
                    console.log("Dalış Kaydı kartına tıklandı");
                    showSection('dive-log-section');
                });
            }
        }

        // Kullanıcı eğitim tablarını ayarla
        function setupTrainingTabs() {
            console.log("Kullanıcı eğitim tabları ayarlanıyor");
            
            const tabTheoretical = document.getElementById('tab-theoretical');
            const tabPool = document.getElementById('tab-pool');
            const tabLessons = document.getElementById('tab-lessons');
            
            if (tabTheoretical) {
                tabTheoretical.addEventListener('click', () => {
                    showTrainingTab('theoretical-content');
                });
            }
            
            if (tabPool) {
                tabPool.addEventListener('click', () => {
                    showTrainingTab('pool-content');
                });
            }
            
            if (tabLessons) {
                tabLessons.addEventListener('click', () => {
                    showTrainingTab('lessons-content');
                });
            }
            
            // Varsayılan olarak teorik içeriği göster
            showTrainingTab('theoretical-content');
        }

        // Kullanıcı eğitim tablarını gösterme fonksiyonu
        function showTrainingTab(tabId) {
            console.log(`Eğitim tab gösteriliyor: ${tabId}`);
            
            // İçerik panellerini gizle
            const theoreticalContent = document.getElementById('theoretical-content');
            const poolContent = document.getElementById('pool-content');
            const lessonsContent = document.getElementById('lessons-content');
            
            if (theoreticalContent) theoreticalContent.classList.remove('active');
            if (poolContent) poolContent.classList.remove('active');
            if (lessonsContent) lessonsContent.classList.remove('active');
            
            // Seçilen paneli göster
            const selectedPanel = document.getElementById(tabId);
            if (selectedPanel) {
                selectedPanel.classList.add('active');
            }
            
            // Tab butonlarını sıfırla
            const tabTheoretical = document.getElementById('tab-theoretical');
            const tabPool = document.getElementById('tab-pool');
            const tabLessons = document.getElementById('tab-lessons');
            
            if (tabTheoretical) tabTheoretical.classList.remove('active');
            if (tabPool) tabPool.classList.remove('active');
            if (tabLessons) tabLessons.classList.remove('active');
            
            // Seçilen tab'ı aktif yap
            switch (tabId) {
                case 'theoretical-content':
                    if (tabTheoretical) tabTheoretical.classList.add('active');
                    loadUserMaterials();
                    break;
                case 'pool-content':
                    if (tabPool) tabPool.classList.add('active');
                    loadUserPoolSessions();
                    break;
                case 'lessons-content':
                    if (tabLessons) tabLessons.classList.add('active');
                    loadUserLessons();
                    break;
            }
        }

        // Kullanıcı eğitim materyallerini yükleme fonksiyonu
        function loadUserMaterials() {
            console.log("Kullanıcı eğitim materyalleri yükleniyor");
            const theoreticalMaterials = document.getElementById('theoretical-materials');
            if (!theoreticalMaterials) return;
            
            theoreticalMaterials.innerHTML = 'Materyaller yükleniyor...';
            
            // Giriş yapmış kullanıcının rolünü al
            const user = auth.currentUser;
            if (!user) {
                theoreticalMaterials.innerHTML = 'Kullanıcı bilgisi bulunamadı.';
                return;
            }
            
            db.collection('users').doc(user.uid).get()
                .then((userDoc) => {
                    if (!userDoc.exists) {
                        theoreticalMaterials.innerHTML = 'Kullanıcı bilgisi bulunamadı.';
                        return;
                    }
                    
                    const userData = userDoc.data();
                    const userRole = userData.role;
                    
                    // Kullanıcının erişebileceği materyalleri yükle
                    db.collection('materials').orderBy('createdAt', 'desc').get()
                        .then((querySnapshot) => {
                            if (querySnapshot.empty) {
                                theoreticalMaterials.innerHTML = '<p>Henüz materyal bulunmamaktadır.</p>';
                                return;
                            }
                            
                            let html = '<div class="materials-list">';
                            let materialCount = 0;
                            
                            querySnapshot.forEach((doc) => {
                                const material = doc.data();
                                
                                // Kullanıcı rolü ile materyal rolü kontrolü
                                if (shouldShowMaterial(userRole, material.accessLevel)) {
                                    materialCount++;
                                    
                                    html += `
                                        <div class="material-card">
                                            <div class="material-header">
                                                <h4>${material.title || 'Başlıksız Materyal'}</h4>
                                                <span class="material-date">${material.createdAt ? material.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih belirtilmemiş'}</span>
                                            </div>
                                            <p>${material.description || 'Açıklama yok'}</p>
                                            <a href="${material.link || '#'}" target="_blank" class="btn btn-primary btn-sm">Materyali Görüntüle</a>
                                        </div>
                                    `;
                                }
                            });
                            
                            html += '</div>';
                            
                            if (materialCount === 0) {
                                theoreticalMaterials.innerHTML = '<p>Erişebileceğiniz materyal bulunmamaktadır.</p>';
        } else {
                                theoreticalMaterials.innerHTML = html;
                            }
                        })
                        .catch((error) => {
                            console.error("Materyaller yüklenirken hata:", error);
                            theoreticalMaterials.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                        });
                })
                .catch((error) => {
                    console.error("Kullanıcı bilgisi alınırken hata:", error);
                    theoreticalMaterials.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                });
        }

        // Rol hiyerarşisine göre materyal gösterilip gösterilmeyeceğini kontrol et
        function shouldShowMaterial(userRole, materialAccessLevel) {
            const roleHierarchy = {
                [USER_ROLES.ADMIN]: 5,
                [USER_ROLES.EGITMEN]: 4,
                [USER_ROLES.LIDER]: 3,
                [USER_ROLES.ASISTAN]: 2,
                [USER_ROLES.ONE_STAR]: 1,
                [USER_ROLES.KURSIYER]: 0
            };
            
            const userRoleLevel = roleHierarchy[userRole] || 0;
            const materialLevel = roleHierarchy[materialAccessLevel] || 0;
            
            // Admin her şeye erişebilir, diğerleri kendi seviyelerine göre
            return userRole === USER_ROLES.ADMIN || userRoleLevel >= materialLevel;
        }

        // Kullanıcı havuz seanslarını yükleme fonksiyonu
        function loadUserPoolSessions() {
            console.log("Kullanıcı havuz seansları yükleniyor");
            const poolSessions = document.getElementById('pool-sessions');
            if (!poolSessions) return;
            
            poolSessions.innerHTML = 'Havuz seansları yükleniyor...';
            
            db.collection('poolSessions').orderBy('date', 'asc').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        poolSessions.innerHTML = '<p>Henüz planlanmış havuz seansı bulunmamaktadır.</p>';
                        return;
                    }
                    
                    let html = '<div class="sessions-list">';
                    
                    querySnapshot.forEach((doc) => {
                        const session = doc.data();
                        // Gelecekteki seansları göster
                        if (session.date && session.date.toDate() >= new Date()) {
                            const sessionDate = session.date.toDate().toLocaleDateString('tr-TR');
                            const sessionTime = session.time || 'Saat belirtilmemiş';
                            
                            html += `
                                <div class="session-card">
                                    <div class="session-header">
                                        <h4>${sessionDate}, ${sessionTime}</h4>
                                        <span class="session-capacity">Kapasite: ${session.capacity || 'Belirtilmemiş'}</span>
                                    </div>
                                    <p>${session.notes || 'Ek bilgi yok'}</p>
                                    <button class="btn btn-primary btn-sm join-pool-session" data-id="${doc.id}">Katıl</button>
                                </div>
                            `;
                        }
                    });
                    
                    html += '</div>';
                    
                    poolSessions.innerHTML = html;
                    
                    // Katılma butonları için event listener
                    document.querySelectorAll('.join-pool-session').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const sessionId = e.target.getAttribute('data-id');
                            joinPoolSession(sessionId);
                        });
                    });
                })
                .catch((error) => {
                    console.error("Havuz seansları yüklenirken hata:", error);
                    poolSessions.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                });
        }

        // Kullanıcı derslerini yükleme fonksiyonu
        function loadUserLessons() {
            console.log("Kullanıcı dersleri yükleniyor");
            const lessonsSchedule = document.getElementById('lessons-schedule');
            if (!lessonsSchedule) return;
            
            lessonsSchedule.innerHTML = 'Ders programı yükleniyor...';
            
            db.collection('lessons').orderBy('date', 'asc').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        lessonsSchedule.innerHTML = '<p>Henüz planlanmış ders bulunmamaktadır.</p>';
                        return;
                    }
                    
                    let html = '<div class="schedule-grid">';
                    
                    querySnapshot.forEach((doc) => {
                        const lesson = doc.data();
                        // Gelecekteki dersleri göster
                        if (lesson.date && lesson.date.toDate() >= new Date()) {
                            const lessonDate = lesson.date.toDate().toLocaleDateString('tr-TR');
                            const lessonTime = lesson.time || 'Saat belirtilmemiş';
                            
                            html += `
                                <div class="lesson-card">
                                    <div class="lesson-header">
                                        <h4>${lesson.title || 'Başlıksız Ders'}</h4>
                                        <span class="lesson-date">${lessonDate}, ${lessonTime}</span>
                                    </div>
                                    <p class="lesson-instructor">Eğitmen: ${lesson.instructor || 'Belirtilmemiş'}</p>
                                    <p>${lesson.notes || 'Ek bilgi yok'}</p>
                                    <button class="btn btn-primary btn-sm join-lesson" data-id="${doc.id}">Katıl</button>
                                </div>
                            `;
                        }
                    });
                    
                    html += '</div>';
                    
                    lessonsSchedule.innerHTML = html;
                    
                    // Katılma butonları için event listener
                    document.querySelectorAll('.join-lesson').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const lessonId = e.target.getAttribute('data-id');
                            joinLesson(lessonId);
                        });
                    });
                })
                .catch((error) => {
                    console.error("Dersler yüklenirken hata:", error);
                    lessonsSchedule.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                });
        }

        // Havuz seansına katılma fonksiyonu
        function joinPoolSession(sessionId) {
            console.log(`Havuz seansına katılım: ${sessionId}`);
            
            const user = auth.currentUser;
            if (!user) {
                alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
                return;
            }
            
            // Seansı kontrol et
            db.collection('poolSessions').doc(sessionId).get()
                .then((doc) => {
                    if (!doc.exists) {
                        alert('Bu havuz seansı artık mevcut değil.');
                        return;
                    }
                    
                    const session = doc.data();
                    
                    // Katılımcıları kontrol et
                    if (session.participants && session.participants.includes(user.uid)) {
                        alert('Bu havuz seansına zaten katılmışsınız.');
                        return;
                    }
                    
                    // Kapasite kontrolü
                    if (session.participants && session.capacity && session.participants.length >= session.capacity) {
                        alert('Bu havuz seansı dolu. Başka bir seansa katılmayı deneyin.');
                        return;
                    }
                    
                    // Katılımcı listesine ekle
                    let participants = session.participants || [];
                    participants.push(user.uid);
                    
                    db.collection('poolSessions').doc(sessionId).update({
                        participants: participants
                    })
                    .then(() => {
                        alert('Havuz seansına başarıyla katıldınız!');
                        loadUserPoolSessions(); // Sayfayı güncelle
                    })
                    .catch((error) => {
                        console.error("Havuz seansına katılırken hata:", error);
                        alert(`Hata: ${error.message}`);
                    });
                })
                .catch((error) => {
                    console.error("Havuz seansı bilgisi alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        }

        // Derse katılma fonksiyonu
        function joinLesson(lessonId) {
            console.log(`Derse katılım: ${lessonId}`);
            
            const user = auth.currentUser;
            if (!user) {
                alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
                return;
            }
            
            // Dersi kontrol et
            db.collection('lessons').doc(lessonId).get()
                .then((doc) => {
                    if (!doc.exists) {
                        alert('Bu ders artık mevcut değil.');
                        return;
                    }
                    
                    const lesson = doc.data();
                    
                    // Katılımcıları kontrol et
                    if (lesson.participants && lesson.participants.includes(user.uid)) {
                        alert('Bu derse zaten katılmışsınız.');
                        return;
                    }
                    
                    // Kapasite kontrolü (eğer varsa)
                    if (lesson.participants && lesson.capacity && lesson.participants.length >= lesson.capacity) {
                        alert('Bu ders dolu. Başka bir derse katılmayı deneyin.');
                        return;
                    }
                    
                    // Katılımcı listesine ekle
                    let participants = lesson.participants || [];
                    participants.push(user.uid);
                    
                    db.collection('lessons').doc(lessonId).update({
                        participants: participants
                    })
                    .then(() => {
                        alert('Derse başarıyla katıldınız!');
                        loadUserLessons(); // Sayfayı güncelle
                    })
                    .catch((error) => {
                        console.error("Derse katılırken hata:", error);
                        alert(`Hata: ${error.message}`);
                    });
                })
                .catch((error) => {
                    console.error("Ders bilgisi alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        }

        // Navigasyon butonlarını ayarla - giriş yapmasa bile çalışsın
        setupNavigation();
        
        // Dashboard üzerindeki navigasyon kartlarını ayarla - giriş yapmasa bile çalışsın
        setupDashboardNavCards();

        // Duyuru detayını açma fonksiyonu
        function openAnnouncementDetail(announcementId) {
            console.log(`Duyuru detayı açılıyor: ${announcementId}`);
            
            // Duyuru bilgilerini al
            db.collection('announcements').doc(announcementId).get()
                .then((doc) => {
                    if (doc.exists) {
                        const announcementData = doc.data();
                        const date = announcementData.createdAt ? announcementData.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih belirtilmemiş';
                        
                        // Duyuru detay içeriğini ayarla
                        const announcementModalTitle = document.getElementById('announcement-modal-title');
                        const announcementModalContent = document.getElementById('announcement-modal-content');
                        const announcementOverlay = document.getElementById('announcement-modal-overlay');
                        
                        if (!announcementModalTitle || !announcementModalContent || !announcementOverlay) {
                            console.error("Duyuru detay modal elemanları bulunamadı");
                            return;
                        }
                        
                        announcementModalTitle.textContent = announcementData.title || 'Başlıksız';
                        
                        // Duyuru içeriğini hazırla
                        const detailContent = `
                            <div class="announcement-detail-content">
                                <div class="announcement-detail-meta">
                                    <span class="announcement-detail-date">${date}</span>
                                    <span class="announcement-detail-priority">${announcementData.priority === 'high' ? 'Yüksek Öncelikli' : 'Normal Öncelik'}</span>
                                </div>
                                <div class="announcement-detail-text">
                                    ${announcementData.content || 'İçerik yok'}
                                </div>
                            </div>
                            <div class="announcement-comments">
                                <h4>Yorumlar</h4>
                                <div id="comments-container" data-announcement-id="${announcementId}">
                                    <p>Yorumlar yükleniyor...</p>
                                </div>
                                <div class="comment-form">
                                    <textarea id="comment-input" placeholder="Yorumunuzu yazın..."></textarea>
                                    <button id="add-comment-button" class="btn btn-primary" data-announcement-id="${announcementId}">Yorum Ekle</button>
                                </div>
                            </div>
                        `;
                        
                        announcementModalContent.innerHTML = detailContent;
                        
                        // Modalı göster
                        announcementOverlay.classList.add('active');
                        
                        // Yorum ekleme butonuna event listener ekle
                        const addCommentButton = document.getElementById('add-comment-button');
                        if (addCommentButton) {
                            addCommentButton.addEventListener('click', () => {
                                addComment(announcementId);
                            });
                        }
                        
                        // Modal kapatma butonuna event listener ekle
                        const closeButton = document.getElementById('announcement-modal-close');
                        if (closeButton) {
                            closeButton.addEventListener('click', closeAnnouncementDetail);
                        }
                        
                        // Modalın dışına tıklama ile kapatma
                        announcementOverlay.addEventListener('click', (e) => {
                            if (e.target === announcementOverlay) {
                                closeAnnouncementDetail();
                            }
                        });
                        
                        // Yorumları yükle
                        loadComments(announcementId);
                    } else {
                        console.error("Duyuru bulunamadı");
                        alert("Duyuru bulunamadı!");
                    }
                })
                .catch((error) => {
                    console.error("Duyuru verileri alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        }

        // Duyuru detay modalını kapatma fonksiyonu
        function closeAnnouncementDetail() {
            const announcementOverlay = document.getElementById('announcement-modal-overlay');
            if (announcementOverlay) {
                announcementOverlay.classList.remove('active');
            }
        }

        // Yorumları yükleme fonksiyonu
        function loadComments(announcementId) {
            console.log(`Yorumlar yükleniyor, duyuru ID: ${announcementId}`);
            const commentsContainer = document.getElementById('comments-container');
            if (!commentsContainer) return;
            
            commentsContainer.innerHTML = 'Yorumlar yükleniyor...';
            
            db.collection('announcements').doc(announcementId)
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        commentsContainer.innerHTML = '<p>Henüz yorum yapılmamış.</p>';
                        return;
                    }
                    
                    let html = '';
                    
                    querySnapshot.forEach((doc) => {
                        const comment = doc.data();
                        const date = comment.createdAt ? comment.createdAt.toDate().toLocaleString('tr-TR') : 'Tarih belirtilmemiş';
                        
                        html += `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <span class="comment-author">${comment.author || 'İsimsiz'}</span>
                                    <span class="comment-date">${date}</span>
                                </div>
                                <div class="comment-content">
                                    <p style="white-space: pre-line;">${comment.content || ''}</p>
                                </div>
                            </div>
                        `;
                    });
                    
                    commentsContainer.innerHTML = html;
                })
                .catch((error) => {
                    console.error("Yorumlar yüklenirken hata:", error);
                    commentsContainer.innerHTML = `<p class="error">Hata: ${error.message}</p>`;
                });
        }

        // Yorum ekleme fonksiyonu
        function addComment(announcementId) {
            console.log(`Yorum ekleniyor, duyuru ID: ${announcementId}`);
            
            const commentInput = document.getElementById('comment-input');
            if (!commentInput) return;
            
            const commentContent = commentInput.value.trim();
            if (!commentContent) {
                alert('Lütfen bir yorum yazın.');
                return;
            }
            
            // Kullanıcı bilgisini al
            const user = auth.currentUser;
            if (!user) {
                alert('Yorum yapabilmek için giriş yapmalısınız.');
                return;
            }
            
            // Kullanıcı adını al
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    const userData = doc.exists ? doc.data() : { email: user.email };
                    const displayName = userData.displayName || userData.email.split('@')[0];
                    
                    // Yorumu ekle
                    db.collection('announcements').doc(announcementId)
                        .collection('comments')
                        .add({
                            content: commentContent,
                            author: displayName,
                            authorId: user.uid,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        })
                        .then(() => {
                            console.log("Yorum başarıyla eklendi");
                            // Input alanını temizle
                            commentInput.value = '';
                            // Yorumları yeniden yükle
                            loadComments(announcementId);
                        })
                        .catch((error) => {
                            console.error("Yorum eklenirken hata:", error);
                            alert(`Hata: ${error.message}`);
                        });
                })
                .catch((error) => {
                    console.error("Kullanıcı verileri alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        }

        // Dive Planning Table Functionality
        function setupDivePlanningTable() {
            console.log("Dalış planlama tablosu kuruluyor");
            const cells = document.querySelectorAll('.dive-planning-cell');
            
            // Her hücre için başlangıç stili ayarla - boş hücre bile belirli bir yükseklikte olacak
            cells.forEach(cell => {
                // Boş içeriği kontrol et
                if (!cell.textContent || cell.textContent.trim() === '') {
                    cell.innerHTML = '&nbsp;';
                }
                
                // Hücreye tıklama işlevi ekle
                cell.addEventListener('click', function() {
                    const slot = this.getAttribute('data-slot');
                    const group = this.getAttribute('data-group');
                    const position = this.getAttribute('data-position');
                    
                    openUserSelectionModal(slot, group, position, this);
                });
            });
            
            // Add event listener to save planning button
            const savePlanningButton = document.getElementById('save-planning-button');
            if (savePlanningButton) {
                savePlanningButton.addEventListener('click', saveDivePlanning);
            }
            
            // Set up user selection modal close button
            const userSelectionModalClose = document.getElementById('user-selection-modal-close');
            if (userSelectionModalClose) {
                userSelectionModalClose.addEventListener('click', closeUserSelectionModal);
            }
            
            const userSelectionCancel = document.getElementById('user-selection-cancel');
            if (userSelectionCancel) {
                userSelectionCancel.addEventListener('click', closeUserSelectionModal);
            }
            
            // Kullanıcı silme butonunu ayarla
            const userSelectionDelete = document.getElementById('user-selection-delete');
            if (userSelectionDelete) {
                userSelectionDelete.addEventListener('click', function() {
                    removeUserFromCell();
                });
            }
            
            // Set up user search functionality
            const userSearchInput = document.getElementById('user-search-input');
            if (userSearchInput) {
                userSearchInput.addEventListener('keyup', function() {
                    filterUsers(this.value);
                });
            }
        }

        // Global variable to store the current selected cell
        let currentSelectedCell = null;

        function openUserSelectionModal(slot, group, position, cell) {
            currentSelectedCell = {
                cell: cell,
                slot: slot,
                group: group,
                position: position
            };
            
            // Load user list
            loadUsersList();
            
            // Show modal and ensure it's on top
            const modal = document.getElementById('user-selection-modal-overlay');
            if (modal) {
                // Ensure this modal has the highest z-index
                modal.style.zIndex = 2000; // Much higher than any other modal
                modal.classList.add('active');
                
                // Silme butonunun durumunu güncelle
                updateDeleteButtonState();
            } else {
                console.error("User selection modal not found");
            }
        }

        function closeUserSelectionModal() {
            const modal = document.getElementById('user-selection-modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                // Reset z-index back to default after animation completes
                setTimeout(() => {
                    modal.style.zIndex = '';
                }, 300); // Match the transition duration in CSS
            }
            currentSelectedCell = null;
        }

        // Functions for Planning Edit Modal
        function openPlanningEditModal() {
            const modal = document.getElementById('planning-edit-modal-overlay');
            if (modal) {
                modal.classList.add('active');
                
                // Setup the event listeners for the modal
                const closeButton = document.getElementById('planning-edit-modal-close');
                const cancelButton = document.getElementById('planning-edit-cancel');
                
                if (closeButton) {
                    closeButton.onclick = closePlanningEditModal;
                }
                
                if (cancelButton) {
                    cancelButton.onclick = closePlanningEditModal;
                }
            } else {
                console.error("Planning edit modal not found");
            }
        }
        
        function closePlanningEditModal() {
            const modal = document.getElementById('planning-edit-modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                
                // Clear the planning table in the modal
                clearPlanningEditTable();
                
                // Form alanlarını da açıkça temizle
                const dateInput = document.getElementById('edit-planning-date');
                const regionInput = document.getElementById('edit-planning-region');
                const locationInput = document.getElementById('edit-planning-location');
                
                if (dateInput) dateInput.value = '';
                if (regionInput) regionInput.value = '';
                if (locationInput) locationInput.value = '';
            }
        }
        
        // Clear only the edit modal planning table
        function clearPlanningEditTable() {
            // Clear all cells in the edit modal planning table
            const cells = document.querySelectorAll('#editDivePlanningTable .dive-planning-cell');
            cells.forEach(cell => {
                cell.innerHTML = '&nbsp;'; // Keep empty cells' height
                cell.removeAttribute('data-user-id');
                cell.classList.remove('filled');
            });
            
            // Form alanlarını temizleme kodu kaldırıldı - sadece tablo hücreleri temizleniyor
        }

        // Load users list for selecting in the planning table
        function loadUsersList() {
            const userList = document.getElementById('user-selection-list');
            if (!userList) {
                console.error("User selection list not found");
                return;
            }
            
            userList.innerHTML = '<li>Kullanıcılar yükleniyor...</li>';
            
            // Update delete button state based on whether the current cell has a user
            updateDeleteButtonState();
            
            // Get all users from Firestore
            db.collection('users').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        userList.innerHTML = '<li>Kullanıcı bulunamadı.</li>';
                        return;
                    }
                    
                    userList.innerHTML = '';
                    querySnapshot.forEach((doc) => {
                        const userData = doc.data();
                        const userItem = document.createElement('li');
                        userItem.className = 'user-list-item';
                        userItem.setAttribute('data-user-id', doc.id);
                        userItem.setAttribute('data-user-name', userData.displayName || userData.email);
                        userItem.textContent = userData.displayName ? `${userData.displayName} (${userData.email})` : userData.email;
                        
                        userItem.addEventListener('click', function() {
                            selectUser(doc.id, userData.displayName || userData.email);
                        });
                        
                        userList.appendChild(userItem);
                    });
                })
                .catch((error) => {
                    console.error("Error getting users: ", error);
                    userList.innerHTML = '<li>Kullanıcılar yüklenirken hata oluştu.</li>';
                });
        }

        function filterUsers(searchText) {
            const userItems = document.querySelectorAll('.user-list-item');
            const searchLower = searchText.toLowerCase();
            
            userItems.forEach(item => {
                const userName = item.getAttribute('data-user-name').toLowerCase();
                if (userName.includes(searchLower)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        function selectUser(userId, userName) {
            console.log(`User selected: ${userName} (${userId})`);
            
            if (currentSelectedCell) {
                // Update the cell with the selected user
                const cell = currentSelectedCell.cell;
                if (cell) {
                    if (userName && userName.trim() !== '') {
                        cell.textContent = userName;
                        cell.setAttribute('data-user-id', userId);
                        cell.classList.add('filled');
                    } else {
                        cell.innerHTML = '&nbsp;'; // Keep empty cells' height
                        cell.removeAttribute('data-user-id');
                        cell.classList.remove('filled');
                    }
                    
                    // Close the user selection modal
                    closeUserSelectionModal();
                }
            }
        }

        // Save the dive planning to Firestore
        function saveDivePlanning() {
            const planningDate = document.getElementById('planning-date').value;
            const planningRegion = document.getElementById('planning-region').value;
            const planningLocation = document.getElementById('planning-location').value;
            const planningPublishDateTime = document.getElementById('planning-publish-datetime').value;
            
            if (!planningDate || !planningLocation) {
                // Show validation error in modal instead of alert
                const errorContent = `<p class="error-message">Lütfen tarih ve yer alanlarını doldurun.</p>`;
                openModal('Eksik Bilgi', errorContent);
                return;
            }
            
            // Collect data from the planning table
            const planningData = {
                date: planningDate,
                region: planningRegion,
                location: planningLocation,
                slots: []
            };
            
            // Loop through all filled cells to collect data
            for (let slot = 1; slot <= 4; slot++) {
                const slotData = {
                    slotNumber: slot,
                    groups: []
                };
                
                for (let group = 1; group <= 5; group++) {
                    const groupData = {
                        groupNumber: group,
                        positions: []
                    };
                    
                    for (let position = 1; position <= 5; position++) {
                        const cell = document.querySelector(`.dive-planning-cell[data-slot="${slot}"][data-group="${group}"][data-position="${position}"]`);
                        
                        if (cell && cell.classList.contains('filled')) {
                            const userId = cell.getAttribute('data-user-id');
                            const userName = cell.textContent;
                            
                            groupData.positions.push({
                                positionNumber: position,
                                userId: userId,
                                userName: userName
                            });
                        }
                    }
                    
                    if (groupData.positions.length > 0) {
                        slotData.groups.push(groupData);
                    }
                }
                
                if (slotData.groups.length > 0) {
                    planningData.slots.push(slotData);
                }
            }
            
            // Save to Firestore
            db.collection('divePlannings').add({
                date: planningDate,
                region: planningRegion,
                location: planningLocation,
                publishDateTime: planningPublishDateTime,
                planningData: planningData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Show success message in modal instead of alert
                const successContent = `
                    <div class="confirmation-message">
                        <p><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> Dalış planlaması başarıyla kaydedildi.</p>
                    </div>
                `;
                openModal('Başarılı', successContent, () => {
                    closeModal();
                    loadDivePlannings();
                    clearPlanningTable();
                });
            })
            .catch((error) => {
                console.error("Error saving dive planning: ", error);
                // Show error in modal instead of alert
                const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                openModal('Hata', errorContent);
            });
        }

        // Planlama tablosunu temizle
        function clearPlanningTable() {
            // Bütün hücreleri temizle
            const cells = document.querySelectorAll('.dive-planning-cell');
            cells.forEach(cell => {
                cell.innerHTML = '&nbsp;'; // Boş hücrelerin yüksekliğini korumak için
                cell.removeAttribute('data-user-id');
                cell.classList.remove('filled');
            });
            
            // Tarih ve konum alanlarını da temizle
            const dateInput = document.getElementById('planning-date');
            const regionInput = document.getElementById('planning-region');
            const locationInput = document.getElementById('planning-location');
            const publishDateTimeInput = document.getElementById('planning-publish-datetime');
            
            if (dateInput) dateInput.value = '';
            if (regionInput) regionInput.value = '';
            if (locationInput) locationInput.value = '';
            if (publishDateTimeInput) publishDateTimeInput.value = '';
        }

        function loadDivePlannings() {
            console.log("Dalış planlamaları yükleniyor");
            const planningListContainer = document.getElementById('admin-dive-planning-list');
            if (!planningListContainer) {
                console.error("Dive planning list container not found");
                return;
            }
            
            planningListContainer.innerHTML = '<p>Dalış planlamaları yükleniyor...</p>';
            
            db.collection('divePlannings')
                .orderBy('date', 'desc')
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        planningListContainer.innerHTML = '<p>Henüz dalış planlaması bulunmuyor.</p>';
                        return;
                    }
                    
                    let tableHTML = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Bölge</th>
                                    <th>Yer</th>
                                    <th>Yayın Tarihi</th>
                                    <th>Katılımcı Sayısı</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            querySnapshot.forEach((doc) => {
                const planning = doc.data();
                const planningDate = planning.date ? new Date(planning.date).toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş';
                
                // Format the publish date-time if exists
                let publishDateTimeStr = 'Belirtilmemiş (hemen yayınlanır)';
                if (planning.publishDateTime) {
                    const publishDateTime = new Date(planning.publishDateTime);
                    publishDateTimeStr = publishDateTime.toLocaleString('tr-TR');
                    
                    // Add an indicator if publish time is in the future
                    const now = new Date();
                    if (publishDateTime > now) {
                        publishDateTimeStr += ' <i class="fas fa-clock" title="Henüz yayınlanmadı"></i>';
                    }
                }
                
                // Count total participants
                let participantCount = 0;
                if (planning.planningData && planning.planningData.slots) {
                    planning.planningData.slots.forEach(slot => {
                        slot.groups.forEach(group => {
                            participantCount += group.positions.length;
                        });
                    });
                }
                
                tableHTML += `
                    <tr>
                        <td>${planningDate}</td>
                        <td>${planning.region || 'Belirtilmemiş'}</td>
                        <td>${planning.location || 'Belirtilmemiş'}</td>
                        <td>${publishDateTimeStr}</td>
                        <td>${participantCount}</td>
                        <td class="action-buttons">
                            <button class="action-btn" onclick="viewPlanning('${doc.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn" onclick="editPlanning('${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deletePlanning('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            planningListContainer.innerHTML = tableHTML;
        })
        .catch((error) => {
            console.error("Error loading dive plannings: ", error);
            planningListContainer.innerHTML = '<p>Dalış planlamaları yüklenirken bir hata oluştu.</p>';
        });
        }

        // Dive viewing function
        function viewPlanning(planningId) {
            db.collection('divePlannings').doc(planningId).get()
                .then((doc) => {
                    if (doc.exists) {
                        const planning = doc.data();
                        const planningDate = planning.date ? new Date(planning.date).toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş';
                        
                        let modalContent = `
                            <div class="dive-plan-date">
                                <strong>Tarih:</strong> ${planningDate} - <strong>Bölge:</strong> ${planning.region || 'Belirtilmemiş'} - <strong>Yer:</strong> ${planning.location || 'Belirtilmemiş'}
                            </div>
                            <div class="dive-planning-container">
                                <table class="dive-planning-table">
                                    <thead>
                                        <tr>
                                            <th>Slot</th>
                                            <th class="group-header">Grup 1</th>
                                            <th class="group-header">Grup 2</th>
                                            <th class="group-header">Grup 3</th>
                                            <th class="group-header">Grup 4</th>
                                            <th class="group-header">Grup 5</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;
                
                // Create table structure in the same format as admin panel
                for (let slot = 1; slot <= 4; slot++) {
                    // For each slot, we need 5 rows (for 5 positions)
                    for (let position = 1; position <= 5; position++) {
                        modalContent += `<tr>`;
                        
                        // First row of each slot gets a rowspan for the slot header
                        if (position === 1) {
                            modalContent += `<td class="slot-header" rowspan="5">Slot ${slot}</td>`;
                        }
                        
                        // Add cells for each group
                        for (let group = 1; group <= 5; group++) {
                            // Use the correct position value - match the actual position from the table (1-5 for each slot)
                            modalContent += `<td class="dive-planning-cell" data-slot="${slot}" data-group="${group}" data-position="${position}">&nbsp;</td>`;
                        }
                        
                        modalContent += `</tr>`;
                    }
                }
                
                modalContent += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                openModal(`Dalış Planlaması: ${planningDate}`, modalContent);
                
                // Fill the table with planning data
                if (planning.planningData && planning.planningData.slots) {
                    planning.planningData.slots.forEach(slot => {
                        slot.groups.forEach(group => {
                            group.positions.forEach(position => {
                                // Find the correct cell using the position number from the data
                                const cell = document.querySelector(`.modal-container .dive-planning-cell[data-slot="${slot.slotNumber}"][data-group="${group.groupNumber}"][data-position="${position.positionNumber}"]`);
                                if (cell) {
                                    cell.textContent = position.userName;
                                    cell.classList.add('filled');
                                }
                            });
                        });
                    });
                }
            } else {
                console.log("No such document!");
            }
        })
        .catch((error) => {
            console.error("Error getting dive planning: ", error);
        });
        }

        function editPlanning(planningId) {
            // Fetch the planning data and fill the modal form
            db.collection('divePlannings').doc(planningId)
                .get()
                .then((doc) => {
                    if (!doc.exists) {
                        console.error("Planning document not found");
                        return;
                    }
                    
                    const planning = doc.data();
                    
                    // Set form values
                    document.getElementById('edit-planning-date').value = planning.date || '';
                    document.getElementById('edit-planning-region').value = planning.region || '';
                    document.getElementById('edit-planning-location').value = planning.location || '';
                    
                    // Set publish datetime if it exists
                    if (planning.publishDateTime) {
                        document.getElementById('edit-planning-publish-datetime').value = planning.publishDateTime;
                    } else {
                        document.getElementById('edit-planning-publish-datetime').value = '';
                    }
                    
                    console.log("Form fields set:", {
                        date: planning.date,
                        region: planning.region,
                        location: planning.location,
                        publishDateTime: planning.publishDateTime
                    });
                    
                    // Clear the edit modal table first
                    clearPlanningEditTable();
                    
                    // Fill the edit modal table with planning data
                    if (planning.planningData && planning.planningData.slots) {
                        planning.planningData.slots.forEach(slot => {
                            slot.groups.forEach(group => {
                                group.positions.forEach(position => {
                                    // Find the correct cell in the edit modal table
                                    const positionNumber = position.positionNumber;
                                    const cell = document.querySelector(`#editDivePlanningTable .dive-planning-cell[data-slot="${slot.slotNumber}"][data-group="${group.groupNumber}"][data-position="${positionNumber}"]`);
                                    
                                    if (cell) {
                                        cell.textContent = position.userName;
                                        cell.setAttribute('data-user-id', position.userId);
                                        cell.classList.add('filled');
                                    } else {
                                        console.warn(`Cell not found for slot=${slot.slotNumber}, group=${group.groupNumber}, position=${positionNumber}`);
                                    }
                                });
                            });
                        });
                    }
                    
                    // Set up the save button to update the planning
                    const saveButton = document.getElementById('planning-edit-save');
                    if (saveButton) {
                        saveButton.onclick = function() {
                            updatePlanningFromModal(planningId);
                        };
                    }
                    
                    // Make the table cells clickable for user selection
                    setupEditModalPlanningTable();
                    
                    // Open the modal
                    openPlanningEditModal();
                })
                .catch((error) => {
                    console.error("Error getting dive planning: ", error);
                });
        }

        function updatePlanningFromModal(planningId) {
            const editDate = document.getElementById('edit-planning-date').value;
            const editRegion = document.getElementById('edit-planning-region').value;
            const editLocation = document.getElementById('edit-planning-location').value;
            const editPublishDateTime = document.getElementById('edit-planning-publish-datetime').value;
            
            if (!editDate || !editLocation) {
                // Show validation error
                const errorContent = `<p class="error-message">Lütfen tarih ve yer alanlarını doldurun.</p>`;
                openModal('Eksik Bilgi', errorContent);
                return;
            }
            
            // Collect data from the planning table in the edit modal
            const planningData = {
                date: editDate,
                region: editRegion,
                location: editLocation,
                slots: []
            };
            
            // Loop through all filled cells to collect data
            for (let slot = 1; slot <= 4; slot++) {
                const slotData = {
                    slotNumber: slot,
                    groups: []
                };
                
                for (let group = 1; group <= 5; group++) {
                    const groupData = {
                        groupNumber: group,
                        positions: []
                    };
                    
                    for (let position = 1; position <= 5; position++) {
                        const cell = document.querySelector(`#editDivePlanningTable .dive-planning-cell[data-slot="${slot}"][data-group="${group}"][data-position="${position}"]`);
                        
                        if (cell && cell.classList.contains('filled')) {
                            const userId = cell.getAttribute('data-user-id');
                            const userName = cell.textContent;
                            
                            groupData.positions.push({
                                positionNumber: position,
                                userId: userId,
                                userName: userName
                            });
                        }
                    }
                    
                    if (groupData.positions.length > 0) {
                        slotData.groups.push(groupData);
                    }
                }
                
                if (slotData.groups.length > 0) {
                    planningData.slots.push(slotData);
                }
            }
            
            // Update in Firestore
            db.collection('divePlannings').doc(planningId).update({
                date: editDate,
                region: editRegion,
                location: editLocation,
                publishDateTime: editPublishDateTime,
                planningData: planningData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Close the edit modal first
                closePlanningEditModal();
                
                // Show success message in modal
                const successContent = `
                    <div class="confirmation-message">
                        <p><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> Dalış planlaması başarıyla güncellendi.</p>
                    </div>
                `;
                openModal('Başarılı', successContent, () => {
                    // Reload plannings and close this modal too
                    closeModal();
                    loadDivePlannings();
                });
            })
            .catch((error) => {
                console.error("Error updating dive planning: ", error);
                
                const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                openModal('Hata', errorContent);
            });
        }

        // Set up the planning table in the edit modal
        function setupEditModalPlanningTable() {
            console.log("Edit modal planning table setup");
            const cells = document.querySelectorAll('#editDivePlanningTable .dive-planning-cell');
            
            cells.forEach(cell => {
                cell.addEventListener('click', function() {
                    const slot = this.getAttribute('data-slot');
                    const group = this.getAttribute('data-group');
                    const position = this.getAttribute('data-position');
                    console.log(`Clicked on edit modal table cell: slot=${slot}, group=${group}, position=${position}`);
                    
                    // Directly open the user selection modal
                    openUserSelectionModal(slot, group, position, this);
                });
            });
            
            // Set up the user selection modal close/cancel buttons
            const userSelectionCloseButton = document.getElementById('user-selection-modal-close');
            const userSelectionCancelButton = document.getElementById('user-selection-cancel');
            const userSelectionDeleteButton = document.getElementById('user-selection-delete');
            
            if (userSelectionCloseButton) {
                userSelectionCloseButton.addEventListener('click', closeUserSelectionModal);
            }
            
            if (userSelectionCancelButton) {
                userSelectionCancelButton.addEventListener('click', closeUserSelectionModal);
            }
            
            if (userSelectionDeleteButton) {
                userSelectionDeleteButton.addEventListener('click', function() {
                    removeUserFromCell();
                });
            }
            
            // Set up user search input
            const userSearchInput = document.getElementById('user-search-input');
            
            if (userSearchInput) {
                userSearchInput.addEventListener('keyup', function() {
                    filterUsers(this.value);
                });
            }
        }

        // Load users list for selecting in the planning table
        function loadUsersList() {
            const userList = document.getElementById('user-selection-list');
            if (!userList) {
                console.error("User selection list not found");
                return;
            }
            
            userList.innerHTML = '<li>Kullanıcılar yükleniyor...</li>';
            
            // Update delete button state based on whether the current cell has a user
            updateDeleteButtonState();
            
            // Get all users from Firestore
            db.collection('users').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        userList.innerHTML = '<li>Kullanıcı bulunamadı.</li>';
                        return;
                    }
                    
                    userList.innerHTML = '';
                    querySnapshot.forEach((doc) => {
                        const userData = doc.data();
                        const userItem = document.createElement('li');
                        userItem.className = 'user-list-item';
                        userItem.setAttribute('data-user-id', doc.id);
                        userItem.setAttribute('data-user-name', userData.displayName || userData.email);
                        userItem.textContent = userData.displayName ? `${userData.displayName} (${userData.email})` : userData.email;
                        
                        userItem.addEventListener('click', function() {
                            selectUser(doc.id, userData.displayName || userData.email);
                        });
                        
                        userList.appendChild(userItem);
                    });
                })
                .catch((error) => {
                    console.error("Error getting users: ", error);
                    userList.innerHTML = '<li>Kullanıcılar yüklenirken hata oluştu.</li>';
                });
        }

        // Kullanıcıyı hücreden kaldır
        function removeUserFromCell() {
            if (!currentSelectedCell || !currentSelectedCell.cell) {
                console.error("No cell selected for removal");
                return;
            }
            
            const cell = currentSelectedCell.cell;
            
            // Hücreyi temizle
            cell.innerHTML = '&nbsp;'; // Boş hücrelerin yüksekliğini korumak için
            cell.removeAttribute('data-user-id');
            cell.classList.remove('filled');
            
            console.log("User removed from cell");
            
            // User selection modalını kapat
            closeUserSelectionModal();
        }

        // Silme butonunun durumunu güncelle
        function updateDeleteButtonState() {
            const deleteButton = document.getElementById('user-selection-delete');
            if (!deleteButton) return;
            
            if (currentSelectedCell && currentSelectedCell.cell) {
                const cell = currentSelectedCell.cell;
                // Eğer hücrede kullanıcı varsa silme butonu aktif olsun
                const hasUser = cell.classList.contains('filled');
                deleteButton.disabled = !hasUser;
                deleteButton.title = hasUser ? "Bu hücreden kullanıcıyı kaldır" : "Bu hücre zaten boş";
            } else {
                deleteButton.disabled = true;
                deleteButton.title = "Seçili hücre yok";
            }
        }

        function deletePlanning(planningId) {
            console.log(`Dalış planlaması siliniyor: ${planningId}`);
            
            // Use custom modal for confirmation instead of browser alert
            const confirmContent = `
                <div class="confirmation-message">
                    <p><i class="fas fa-exclamation-triangle" style="color: var(--danger); margin-right: 8px;"></i> Bu dalış planlamasını silmek istediğinizden emin misiniz?</p>
                    <p>Bu işlem geri alınamaz.</p>
                </div>
            `;
            
            openModal('Dalış Planlaması Silme Onayı', confirmContent, () => {
                db.collection('divePlannings').doc(planningId).delete()
                    .then(() => {
                        console.log("Dalış planlaması başarıyla silindi");
                        closeModal();
                        loadDivePlannings(); // Planları yeniden yükle
                    })
                    .catch((error) => {
                        console.error("Dalış planlaması silinirken hata:", error);
                        // Show error in modal instead of alert
                        const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                        openModal('Hata', errorContent);
                    });
            });
        }

        // Expose these functions to the global window object so they can be called from HTML onclick
        window.viewPlanning = viewPlanning;
        window.editPlanning = editPlanning;
        window.deletePlanning = deletePlanning;
        window.setupEditModalPlanningTable = setupEditModalPlanningTable;
        window.closePlanningEditModal = closePlanningEditModal;
        
        // Kullanıcı profil bilgilerini yükleme fonksiyonu
        function loadUserProfile() {
            console.log("Kullanıcı profil bilgileri yükleniyor");
            
            const profileNameElement = document.getElementById('profile-name');
            const profileEmailElement = document.getElementById('profile-email');
            const profileRoleElement = document.getElementById('profile-role');
            
            if (!profileNameElement || !profileEmailElement || !profileRoleElement) {
                console.error("Profil elementleri bulunamadı!");
                return;
            }
            
            // Varsayılan değerler (yükleme sırasında gösterilecek)
            profileNameElement.textContent = "Yükleniyor...";
            profileEmailElement.textContent = "Yükleniyor...";
            profileRoleElement.textContent = "Yükleniyor...";
            
            // Giriş yapmış kullanıcının bilgilerini al
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error("Kullanıcı bilgisi bulunamadı!");
                return;
            }
            
            // Firestore'dan kullanıcı verilerini al
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        console.log("Kullanıcı profil verileri başarıyla alındı:", userData);
                        
                        // İsim ve soyisim uygun formatta göster
                        let displayName = "Belirtilmemiş";
                        if (userData.firstName && userData.lastName) {
                            displayName = `${userData.firstName} ${userData.lastName}`;
                        } else if (userData.displayName) {
                            displayName = userData.displayName;
                        }
                        
                        // Profil bilgilerini güncelle
                        profileNameElement.textContent = displayName;
                        profileEmailElement.textContent = user.email;
                        profileRoleElement.textContent = userData.role || "Bilinmiyor";
                        
                        // Profil bilgilerini daha detaylı göstermek için
                        const profileInfo = document.querySelector('.profile-info');
                        if (profileInfo) {
                            // Profil bilgilerinde sınıf, doğum tarihi ve kayıt yılı yoksa ekle
                            if (!document.getElementById('profile-class') && !document.getElementById('profile-birthdate') && !document.getElementById('profile-regyear')) {
                                const classInfo = document.createElement('span');
                                classInfo.id = 'profile-class';
                                classInfo.textContent = userData.class ? `Bölüm: ${userData.class}` : 'Bölüm: Belirtilmemiş';
                                
                                const birthDateInfo = document.createElement('span');
                                birthDateInfo.id = 'profile-birthdate';
                                birthDateInfo.textContent = userData.birthDate ? `Doğum Tarihi: ${userData.birthDate}` : 'Doğum Tarihi: Belirtilmemiş';
                                
                                const regYearInfo = document.createElement('span');
                                regYearInfo.id = 'profile-regyear';
                                regYearInfo.textContent = userData.registrationYear ? `Kayıt Yılı: ${userData.registrationYear}` : 'Kayıt Yılı: Belirtilmemiş';
                                
                                profileInfo.appendChild(classInfo);
                                profileInfo.appendChild(birthDateInfo);
                                profileInfo.appendChild(regYearInfo);
                            } else {
                                // Var olan bilgileri güncelle
                                const classInfo = document.getElementById('profile-class');
                                const birthDateInfo = document.getElementById('profile-birthdate');
                                const regYearInfo = document.getElementById('profile-regyear');
                                
                                if (classInfo) {
                                    classInfo.textContent = userData.class ? `Bölüm: ${userData.class}` : 'Bölüm: Belirtilmemiş';
                                }
                                
                                if (birthDateInfo) {
                                    birthDateInfo.textContent = userData.birthDate ? `Doğum Tarihi: ${userData.birthDate}` : 'Doğum Tarihi: Belirtilmemiş';
                                }
                                
                                if (regYearInfo) {
                                    regYearInfo.textContent = userData.registrationYear ? `Kayıt Yılı: ${userData.registrationYear}` : 'Kayıt Yılı: Belirtilmemiş';
                                }
                            }
                        }
                        
                        // İstatistikleri güncelleme (varsa)
                        const totalDivesElement = document.getElementById('total-dives');
                        const attendedLessonsElement = document.getElementById('attended-lessons');
                        const poolSessionsCountElement = document.getElementById('pool-sessions-count');
                        
                        if (totalDivesElement) totalDivesElement.textContent = userData.totalDives || "0";
                        if (attendedLessonsElement) attendedLessonsElement.textContent = userData.attendedLessons || "0";
                        if (poolSessionsCountElement) poolSessionsCountElement.textContent = userData.poolSessionsCount || "0";
                    } else {
                        console.error("Kullanıcı profil verisi bulunamadı!");
                        profileNameElement.textContent = "Bilgi yok";
                        profileEmailElement.textContent = user.email;
                        profileRoleElement.textContent = "Bilgi yok";
                    }
                })
                .catch((error) => {
                    console.error("Kullanıcı profil verileri alınırken hata:", error);
                    profileNameElement.textContent = "Hata!";
                    profileEmailElement.textContent = user.email;
                    profileRoleElement.textContent = "Hata!";
                });
        }

        // Kullanıcı profilini düzenleme fonksiyonu
        function editUserProfile() {
            console.log("Profil düzenleme başlatılıyor");
            
            // Mevcut kullanıcı bilgilerini al
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error("Kullanıcı bilgisi bulunamadı!");
                return;
            }
            
            // Firestore'dan kullanıcı verilerini al
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Modal içeriğini hazırla
                        const content = `
                            <div class="admin-form">
                                <div class="form-group">
                                    <label for="edit-profile-firstname">Ad</label>
                                    <input type="text" id="edit-profile-firstname" value="${userData.firstName || ''}" placeholder="Adınız">
                                </div>
                                <div class="form-group">
                                    <label for="edit-profile-lastname">Soyad</label>
                                    <input type="text" id="edit-profile-lastname" value="${userData.lastName || ''}" placeholder="Soyadınız">
                                </div>
                                <div class="form-group">
                                    <label for="edit-profile-birthdate">Doğum Tarihi</label>
                                    <input type="date" id="edit-profile-birthdate" value="${userData.birthDate || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-profile-class">Sınıf</label>
                                    <input type="text" id="edit-profile-class" value="${userData.class || ''}" placeholder="Örn: 2024, CE-2">
                                </div>
                                <div class="form-group">
                                    <label for="edit-profile-email">E-posta</label>
                                    <input type="email" id="edit-profile-email" value="${userData.email}" disabled>
                                </div>
                            </div>
                        `;
                        
                        // Modal'ı aç
                        openModal('Profil Düzenle', content, () => {
                            // Değerleri al
                            const firstName = document.getElementById('edit-profile-firstname').value.trim();
                            const lastName = document.getElementById('edit-profile-lastname').value.trim();
                            const birthDate = document.getElementById('edit-profile-birthdate').value;
                            const classInfo = document.getElementById('edit-profile-class').value.trim();
                            
                            // Kullanıcıyı güncelle
                            const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : '';
                            
                            db.collection('users').doc(user.uid).update({
                                firstName: firstName,
                                lastName: lastName,
                                birthDate: birthDate,
                                class: classInfo,
                                displayName: displayName,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            })
                            .then(() => {
                                console.log("Profil başarıyla güncellendi");
                                closeModal();
                                loadUserProfile(); // Profili yeniden yükle
                                
                                // Başarılı mesajını göster
                                const successContent = `
                                    <div class="confirmation-message">
                                        <p><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> Profiliniz başarıyla güncellendi.</p>
                                    </div>
                                `;
                                openModal('Başarılı', successContent);
                            })
                            .catch((error) => {
                                console.error("Profil güncellenirken hata:", error);
                                
                                const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                                openModal('Hata', errorContent);
                            });
                        });
                    } else {
                        console.error("Kullanıcı profil verisi bulunamadı!");
                        const errorContent = `<p class="error-message">Kullanıcı profil verisi bulunamadı!</p>`;
                        openModal('Hata', errorContent);
                    }
                })
                .catch((error) => {
                    console.error("Kullanıcı profil verileri alınırken hata:", error);
                    
                    const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                    openModal('Hata', errorContent);
                });
        }

        // Internal implementation of the user editing function
        window._editUser = function(userId) {
            console.log(`Kullanıcı düzenleniyor: ${userId}`);
            
            // Önce kullanıcı bilgilerini al
            db.collection('users').doc(userId).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Rol seçenekleri
                        const roleOptions = Object.values(USER_ROLES).map(role => 
                            `<option value="${role}" ${userData.role === role ? 'selected' : ''}>${role}</option>`
                        ).join('');
                        
                        // Modal içeriğini hazırla
                        const content = `
                            <div class="admin-form">
                                <div class="form-group">
                                    <label for="edit-user-email">E-posta</label>
                                    <input type="email" id="edit-user-email" value="${userData.email}" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-firstname">Ad</label>
                                    <input type="text" id="edit-user-firstname" value="${userData.firstName || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-lastname">Soyad</label>
                                    <input type="text" id="edit-user-lastname" value="${userData.lastName || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-birthdate">Doğum Tarihi</label>
                                    <input type="date" id="edit-user-birthdate" value="${userData.birthDate || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-class">Bölüm/Sınıf</label>
                                    <input type="text" id="edit-user-class" value="${userData.class || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-regyear">Kayıt Yılı</label>
                                    <input type="number" id="edit-user-regyear" value="${userData.registrationYear || ''}" min="2000" max="2100">
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-role">Rol</label>
                                    <select id="edit-user-role">
                                        ${roleOptions}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-user-approved">Onay Durumu</label>
                                    <select id="edit-user-approved">
                                        <option value="true" ${userData.approved ? 'selected' : ''}>Onaylı</option>
                                        <option value="false" ${!userData.approved ? 'selected' : ''}>Onaysız</option>
                                    </select>
                                </div>
                            </div>
                        `;
                        
                        // Modal'ı aç
                        openModal('Kullanıcı Düzenle', content, () => {
                            // Değerleri al
                            const firstName = document.getElementById('edit-user-firstname').value.trim();
                            const lastName = document.getElementById('edit-user-lastname').value.trim();
                            const birthDate = document.getElementById('edit-user-birthdate').value;
                            const classInfo = document.getElementById('edit-user-class').value.trim();
                            const regYear = document.getElementById('edit-user-regyear').value.trim();
                            const newRole = document.getElementById('edit-user-role').value;
                            const approved = document.getElementById('edit-user-approved').value === 'true';
                            
                            // Display name oluştur
                            const displayName = (firstName && lastName) ? `${firstName} ${lastName}` : '';
                            
                            // Kullanıcıyı güncelle
                            db.collection('users').doc(userId).update({
                                firstName: firstName,
                                lastName: lastName,
                                birthDate: birthDate,
                                class: classInfo,
                                registrationYear: regYear,
                                displayName: displayName,
                                role: newRole,
                                approved: approved,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            })
                            .then(() => {
                                console.log("Kullanıcı başarıyla güncellendi");
                                closeModal();
                                loadAdminUsers(); // Kullanıcıları yeniden yükle
                            })
                            .catch((error) => {
                                console.error("Kullanıcı güncellenirken hata:", error);
                                alert(`Hata: ${error.message}`);
                            });
                        });
                    } else {
                        console.error("Kullanıcı bulunamadı");
                        alert("Kullanıcı bulunamadı!");
                    }
                })
                .catch((error) => {
                    console.error("Kullanıcı verileri alınırken hata:", error);
                    alert(`Hata: ${error.message}`);
                });
        };
        
        // Internal implementation of the user approval function
        window._approveUser = function(userId) {
            console.log(`Kullanıcı onaylanıyor: ${userId}`);
            db.collection('users').doc(userId).update({
                approved: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log("Kullanıcı başarıyla onaylandı");
                loadAdminUsers(); // Kullanıcıları yeniden yükle
            })
            .catch((error) => {
                console.error("Kullanıcı onaylanırken hata:", error);
                alert(`Hata: ${error.message}`);
            });
        };

        // Internal implementation of the user deletion function
        window._deleteUser = function(userId) {
            console.log(`Kullanıcı siliniyor: ${userId}`);
            
            // Silme işlemi için onay modalı
            const confirmContent = `
                <div class="confirmation-message">
                    <p><i class="fas fa-exclamation-triangle" style="color: var(--danger); margin-right: 8px;"></i> Bu kullanıcıyı silmek istediğinizden emin misiniz?</p>
                    <p>Bu işlem geri alınamaz.</p>
                </div>
            `;
            
            openModal('Kullanıcı Silme Onayı', confirmContent, () => {
                db.collection('users').doc(userId).delete()
                    .then(() => {
                        console.log("Kullanıcı başarıyla silindi");
                        closeModal();
                        loadAdminUsers(); // Kullanıcıları yeniden yükle
                    })
                    .catch((error) => {
                        console.error("Kullanıcı silinirken hata:", error);
                        // Alert yerine modal içinde hata göster
                        const errorContent = `<p class="error-message">Hata: ${error.message}</p>`;
                        openModal('Hata', errorContent);
                    });
            });
        };

        // Internal implementations for local usage inside the event listener scope
        function editUser(userId) {
            window._editUser(userId);
        }
        
        function approveUser(userId) {
            window._approveUser(userId);
        }
        
        function deleteUser(userId) {
            window._deleteUser(userId);
        }
    } catch (e) {
        console.error("Firebase başlatılırken veya script çalıştırılırken hata oluştu:", e);
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color: red;">Uygulama başlatılırken bir hata oluştu: ${e.message}. Lütfen konsolu kontrol edin.</p>`;
        }
    }
}); 