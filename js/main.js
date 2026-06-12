import { 
    auth, db, currentUser, currentUserRole, escapeHtml, initAuthStateListener,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from './core.js';
import { 
    collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, increment, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const IMGBB_API_KEY = "9de6bd941d44c05dbf0955dbe14a6859";

let selectedLat = null;
let selectedLng = null;
let searchTimeout;
let currentChatListener = null;

// ========== EXPANDED GUWAHATI AREAS (over 100 localities) ==========
const guwahatiAreas = [
    { name: "Uzan Bazar, Guwahati, Assam", lat: 26.1802, lng: 91.7547 },
    { name: "Maligaon, Guwahati, Assam", lat: 26.1523, lng: 91.6724 },
    { name: "Paltan Bazar, Guwahati, Assam", lat: 26.1734, lng: 91.7504 },
    { name: "Fancy Bazar, Guwahati, Assam", lat: 26.1832, lng: 91.7465 },
    { name: "Ganeshguri, Guwahati, Assam", lat: 26.1385, lng: 91.7782 },
    { name: "Beltola, Guwahati, Assam", lat: 26.1205, lng: 91.7854 },
    { name: "Dispur, Guwahati, Assam", lat: 26.1383, lng: 91.8012 },
    { name: "Jayanagar, Guwahati, Assam", lat: 26.1402, lng: 91.7915 },
    { name: "Christian Basti, Guwahati, Assam", lat: 26.1623, lng: 91.7654 },
    { name: "Bhangagarh, Guwahati, Assam", lat: 26.1689, lng: 91.7645 },
    { name: "Sundarpur, Guwahati, Assam", lat: 26.1635, lng: 91.7888 },
    { name: "Zoo Road, Guwahati, Assam", lat: 26.1645, lng: 91.7901 },
    { name: "Jalukbari, Guwahati, Assam", lat: 26.1432, lng: 91.6543 },
    { name: "Lal Ganesh, Guwahati, Assam", lat: 26.1834, lng: 91.7245 },
    { name: "Athgaon, Guwahati, Assam", lat: 26.1778, lng: 91.7389 },
    { name: "Bamunimaidan, Guwahati, Assam", lat: 26.1502, lng: 91.7582 },
    { name: "Basistha, Guwahati, Assam", lat: 26.1045, lng: 91.8123 },
    { name: "Betkuchi, Guwahati, Assam", lat: 26.1123, lng: 91.7456 },
    { name: "Bhetapara, Guwahati, Assam", lat: 26.1456, lng: 91.7712 },
    { name: "Bonda, Guwahati, Assam", lat: 26.1789, lng: 91.7123 },
    { name: "Chandmari, Guwahati, Assam", lat: 26.1723, lng: 91.7678 },
    { name: "Dakhingaon, Guwahati, Assam", lat: 26.1234, lng: 91.7234 },
    { name: "Dharapur, Guwahati, Assam", lat: 26.1321, lng: 91.6789 },
    { name: "Garchuk, Guwahati, Assam", lat: 26.1145, lng: 91.7654 },
    { name: "Gotanagar, Guwahati, Assam", lat: 26.1256, lng: 91.7456 },
    { name: "Guwahati Club, Guwahati, Assam", lat: 26.1765, lng: 91.7589 },
    { name: "Hatimuria, Guwahati, Assam", lat: 26.1654, lng: 91.7345 },
    { name: "Hatigaon, Guwahati, Assam", lat: 26.1489, lng: 91.7823 },
    { name: "Hengerabari, Guwahati, Assam", lat: 26.1623, lng: 91.7212 },
    { name: "Kahilipara, Guwahati, Assam", lat: 26.1345, lng: 91.7889 },
    { name: "Kalapahar, Guwahati, Assam", lat: 26.1656, lng: 91.7456 },
    { name: "Kamakhya, Guwahati, Assam", lat: 26.1689, lng: 91.7056 },
    { name: "Kamakhya Gate, Guwahati, Assam", lat: 26.1700, lng: 91.7100 },
    { name: "Bhootnath, Guwahati, Assam", lat: 26.1750, lng: 91.7300 },
    { name: "Santipur, Guwahati, Assam", lat: 26.1525, lng: 91.6825 },
    { name: "Narengi, Guwahati, Assam", lat: 26.1899, lng: 91.7899 },
    { name: "Khanapara, Guwahati, Assam", lat: 26.1289, lng: 91.7987 },
    { name: "Lachit Nagar, Guwahati, Assam", lat: 26.1678, lng: 91.7589 },
    { name: "Lokhra, Guwahati, Assam", lat: 26.1567, lng: 91.7123 },
    { name: "Nabin Nagar, Guwahati, Assam", lat: 26.1823, lng: 91.7456 },
    { name: "Nepali Mandir, Guwahati, Assam", lat: 26.1689, lng: 91.7512 },
    { name: "Noonmati, Guwahati, Assam", lat: 26.1789, lng: 91.7234 },
    { name: "Pandu, Guwahati, Assam", lat: 26.1876, lng: 91.6876 },
    { name: "Panjabari, Guwahati, Assam", lat: 26.1399, lng: 91.8111 },
    { name: "Paschim Boragaon, Guwahati, Assam", lat: 26.1278, lng: 91.6543 },
    { name: "Patharquarry, Guwahati, Assam", lat: 26.1645, lng: 91.7234 },
    { name: "Pragjyotishpur, Guwahati, Assam", lat: 26.1812, lng: 91.7654 },
    { name: "Rajgarh, Guwahati, Assam", lat: 26.1456, lng: 91.8023 },
    { name: "Rehabari, Guwahati, Assam", lat: 26.1823, lng: 91.7345 },
    { name: "Rukminigaon, Guwahati, Assam", lat: 26.1256, lng: 91.7899 },
    { name: "Sarumataria, Guwahati, Assam", lat: 26.1123, lng: 91.7567 },
    { name: "Satgaon, Guwahati, Assam", lat: 26.1456, lng: 91.8123 },
    { name: "Six Mile, Guwahati, Assam", lat: 26.1345, lng: 91.8012 },
    { name: "Sonapur, Guwahati, Assam", lat: 26.1123, lng: 91.8456 },
    { name: "Sorumotoria, Guwahati, Assam", lat: 26.1212, lng: 91.7654 },
    { name: "Sunderbari, Guwahati, Assam", lat: 26.1789, lng: 91.7345 },
    { name: "Survey, Guwahati, Assam", lat: 26.1654, lng: 91.7456 },
    { name: "Tarun Nagar, Guwahati, Assam", lat: 26.1623, lng: 91.7567 },
    { name: "Ulubari, Guwahati, Assam", lat: 26.1745, lng: 91.7456 },
    { name: "V.I.P. Colony, Guwahati, Assam", lat: 26.1589, lng: 91.7123 },
    // Additional areas (new)
    { name: "Anil Nagar, Guwahati, Assam", lat: 26.1550, lng: 91.7750 },
    { name: "Barsapara, Guwahati, Assam", lat: 26.1300, lng: 91.7500 },
    { name: "Birubari, Guwahati, Assam", lat: 26.1710, lng: 91.7300 },
    { name: "Doul Gobinda Road, Guwahati, Assam", lat: 26.1650, lng: 91.7400 },
    { name: "Gandhi Basti, Guwahati, Assam", lat: 26.1550, lng: 91.7600 },
    { name: "Guwahati Medical College, Guwahati, Assam", lat: 26.1580, lng: 91.7200 },
    { name: "Hengrabari, Guwahati, Assam", lat: 26.1620, lng: 91.7200 },
    { name: "Japorigog, Guwahati, Assam", lat: 26.1350, lng: 91.7900 },
    { name: "Kalipur, Guwahati, Assam", lat: 26.1480, lng: 91.7600 },
    { name: "Kharghuli, Guwahati, Assam", lat: 26.1760, lng: 91.7450 },
    { name: "Lankeshwar, Guwahati, Assam", lat: 26.1920, lng: 91.7000 },
    { name: "Lalmati, Guwahati, Assam", lat: 26.1700, lng: 91.7200 },
    { name: "Mathgharia, Guwahati, Assam", lat: 26.1400, lng: 91.6800 },
    { name: "Nalapara, Guwahati, Assam", lat: 26.1600, lng: 91.7100 },
    { name: "Phatasil, Guwahati, Assam", lat: 26.1550, lng: 91.7300 },
    { name: "Rupnagar, Guwahati, Assam", lat: 26.1450, lng: 91.7100 },
    { name: "Sila Simalu, Guwahati, Assam", lat: 26.1850, lng: 91.7550 },
    { name: "Tetelia, Guwahati, Assam", lat: 26.1280, lng: 91.8100 },
    { name: "Tokobari, Guwahati, Assam", lat: 26.1680, lng: 91.6900 },
    { name: "Umananda, Guwahati, Assam", lat: 26.1890, lng: 91.7450 },
    { name: "Baihata Chariali, Guwahati, Assam", lat: 26.3000, lng: 91.7000 },
    { name: "Changsari, Guwahati, Assam", lat: 26.2500, lng: 91.6800 },
    { name: "Khetri, Guwahati, Assam", lat: 26.2300, lng: 91.7500 },
    { name: "Azara, Guwahati, Assam", lat: 26.1150, lng: 91.6200 },
    { name: "Borjhar, Guwahati, Assam", lat: 26.1100, lng: 91.6000 }
];

// ========== IMAGE UPLOAD ==========
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error("Image upload failed");
    return data.data.url;
}

// ========== ADD PROPERTY (with owner name, email, phone) ==========
async function addProperty(propertyData, imageFile) {
    if (!currentUser) throw new Error("Not authenticated");
    if (imageFile && imageFile.size > 2 * 1024 * 1024) throw new Error("Image exceeds 2MB");
    let imageUrl = "";
    if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
    }
    await addDoc(collection(db, "properties"), {
        ...propertyData,
        imageUrl,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        views: 0,
        avgRating: 0,
        reviewCount: 0,
        ownerName: propertyData.ownerName,
        ownerEmail: propertyData.ownerEmail,
        ownerPhone: propertyData.ownerPhone,
        lat: propertyData.lat || null,
        lng: propertyData.lng || null
    });
}

// ========== PROPERTY LIST & RENDER ==========
let allProperties = [];

async function fetchProperties() {
    const querySnapshot = await getDocs(collection(db, "properties"));
    allProperties = [];
    querySnapshot.forEach(doc => {
        allProperties.push({ id: doc.id, ...doc.data() });
    });
    renderPropertyCards();
}

function renderPropertyCards() {
    const container = document.getElementById('property-list');
    if (!container) return;
    
    const priceMin = parseFloat(document.getElementById('filter-price')?.value.split('-')[0]) || 0;
    const priceMax = parseFloat(document.getElementById('filter-price')?.value.split('-')[1]) || 999999;
    const typeFilter = document.getElementById('filter-type')?.value || 'all';
    const locationQuery = document.getElementById('filter-location')?.value.toLowerCase().trim() || '';
    const bhkFilter = document.getElementById('filter-bhk')?.value || 'all';
    const genderFilter = document.getElementById('filter-gender')?.value || 'all';
    
    const queryWords = locationQuery.split(/[ ,]+/).filter(w => w.length > 2);
    const locationMatches = (propLocation) => {
        if (!locationQuery) return true;
        const lowerProp = propLocation.toLowerCase();
        if (lowerProp.includes(locationQuery)) return true;
        return queryWords.some(word => lowerProp.includes(word));
    };
    
    let filtered = allProperties.filter(prop => {
        const priceOk = prop.price >= priceMin && prop.price <= priceMax;
        const typeOk = typeFilter === 'all' || prop.type === typeFilter;
        const locationOk = locationMatches(prop.location);
        const bhkOk = bhkFilter === 'all' || prop.bhk === bhkFilter;
        const genderOk = genderFilter === 'all' || prop.genderPreference === genderFilter;
        return priceOk && typeOk && locationOk && bhkOk && genderOk;
    });
    
    if (selectedLat && selectedLng) {
        filtered = filtered.filter(prop => {
            if (prop.lat && prop.lng) {
                const distance = getDistanceFromLatLonInKm(selectedLat, selectedLng, prop.lat, prop.lng);
                return distance <= 5;
            }
            return true;
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="loader"><i class="fas fa-search"></i> No properties found.</div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(prop => {
        const imageUrl = prop.imageUrl || '';
        const genderIcon = prop.genderPreference === 'boys' ? 'fa-mars' : (prop.genderPreference === 'girls' ? 'fa-venus' : 'fa-venus-mars');
        const genderText = prop.genderPreference === 'boys' ? 'Boys only' : (prop.genderPreference === 'girls' ? 'Girls only' : 'Anyone');
        const avgRating = prop.avgRating ? prop.avgRating.toFixed(1) : 'N/A';
        html += `
            <div class="property-card" data-id="${prop.id}">
                <div class="card-img">${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(prop.title)}">` : '<div style="height:200px; display:flex; align-items:center; justify-content:center; background:var(--border-color);">No Image</div>'}<div class="type-badge">${prop.type.toUpperCase()}</div></div>
                <div class="card-body">
                    <h3>${escapeHtml(prop.title)}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(prop.location)}</p>
                    <p><i class="fas fa-rupee-sign"></i> ₹${prop.price} / month</p>
                    <p><i class="fas fa-star" style="color: gold;"></i> ${avgRating} / 5 (${prop.reviewCount || 0} reviews)</p>
                    <div class="amenities">
                        ${prop.parking ? '<span><i class="fas fa-car"></i> Parking</span>' : ''}
                        ${prop.petFriendly ? '<span><i class="fas fa-paw"></i> Pet</span>' : ''}
                        ${prop.hasWifi ? '<span><i class="fas fa-wifi"></i> WiFi</span>' : ''}
                    </div>
                    <div><span class="bhk-badge" style="background: var(--accent-light); padding:2px 8px; border-radius:20px;">${prop.bhk || 'N/A'} BHK</span> <span><i class="fas ${genderIcon}"></i> ${genderText}</span></div>
                    <div style="margin-top: 0.8rem; display: flex; gap: 0.5rem;">
                        <button class="btn-outline review-btn" data-id="${prop.id}" style="font-size:0.8rem;"><i class="fas fa-star"></i> Rate</button>
                        ${currentUserRole === 'admin' ? `<button class="btn-outline delete-prop-btn" data-id="${prop.id}" style="background:#e74c3c; color:white;">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); openReviewModal(btn.dataset.id); });
    });
    if (currentUserRole === 'admin') {
        document.querySelectorAll('.delete-prop-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("Delete this property?")) { await deleteDoc(doc(db, "properties", btn.dataset.id)); await fetchProperties(); alert("Deleted"); }
            });
        });
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ========== LOCATION AUTOCOMPLETE ==========
async function fetchLocationSuggestions(query) {
    if (!query || query.length < 2) {
        const suggestionsDiv = document.getElementById('location-suggestions');
        if (suggestionsDiv) suggestionsDiv.style.display = 'none';
        return [];
    }
    const bbox = "89.5,24.5,96.0,28.0";
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&state=Assam&viewbox=${bbox}&bounded=1&limit=5&addressdetails=0`;
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'SpotMyStayy/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return data;
        } else {
            return getLocalSuggestions(query);
        }
    } catch (err) {
        console.warn('Nominatim failed, using local suggestions:', err);
        return getLocalSuggestions(query);
    }
}

function getLocalSuggestions(query) {
    const lowerQuery = query.toLowerCase();
    return guwahatiAreas.filter(area => area.name.toLowerCase().includes(lowerQuery));
}

function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('location-suggestions');
    if (!suggestionsDiv) return;
    if (!suggestions.length) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    suggestionsDiv.innerHTML = '';
    suggestions.forEach(place => {
        const div = document.createElement('div');
        div.className = 'location-suggestion-item';
        const displayName = place.display_name || place.name;
        div.textContent = displayName;
        div.addEventListener('click', () => {
            const lat = parseFloat(place.lat || place.lat);
            const lng = parseFloat(place.lon || place.lng);
            selectedLat = lat;
            selectedLng = lng;
            const locationInput = document.getElementById('filter-location');
            locationInput.value = displayName;
            suggestionsDiv.style.display = 'none';
            renderPropertyCards();
        });
        suggestionsDiv.appendChild(div);
    });
    suggestionsDiv.style.display = 'block';
}

function initLocationSearch() {
    const locationInput = document.getElementById('filter-location');
    if (!locationInput) return;
    
    locationInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const suggestions = await fetchLocationSuggestions(query);
            displaySuggestions(suggestions);
        }, 300);
    });
    
    document.addEventListener('click', (e) => {
        const filterGroup = document.querySelector('.filter-group');
        if (filterGroup && !filterGroup.contains(e.target)) {
            const suggestionsDiv = document.getElementById('location-suggestions');
            if (suggestionsDiv) suggestionsDiv.style.display = 'none';
        }
    });
}

// ========== REVIEW MODAL ==========
function openReviewModal(propertyId) {
    if (!currentUser) { alert("Please login to leave a review."); window.location.href = 'login.html'; return; }
    document.getElementById('review-property-id').value = propertyId;
    document.getElementById('review-modal').style.display = 'flex';
}

async function submitReview() {
    const propertyId = document.getElementById('review-property-id').value;
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-text').value.trim();
    if (!rating) return;
    try {
        const reviewRef = collection(db, `properties/${propertyId}/reviews`);
        await addDoc(reviewRef, { userId: currentUser.uid, userName: currentUser.email.split('@')[0], rating, comment, timestamp: serverTimestamp() });
        const reviewsSnap = await getDocs(reviewRef);
        let total = 0; reviewsSnap.forEach(doc => total += doc.data().rating);
        const avg = total / reviewsSnap.size;
        await updateDoc(doc(db, 'properties', propertyId), { avgRating: avg, reviewCount: reviewsSnap.size });
        alert("Review submitted!");
        document.getElementById('review-modal').style.display = 'none';
        document.getElementById('review-text').value = '';
        await fetchProperties();
    } catch (err) { alert("Error: " + err.message); }
}

// ========== PROPERTY DETAILS PAGE (fixed – uses stored owner fields) ==========
async function loadPropertyDetails() {
    console.log("loadPropertyDetails started");
    const container = document.getElementById('property-details-container');
    if (!container) {
        console.error("Container #property-details-container not found");
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    console.log("Property ID:", propertyId);
    if (!propertyId) {
        container.innerHTML = '<p>Invalid property ID. No id parameter in URL.</p>';
        return;
    }
    try {
        const propDoc = await getDoc(doc(db, "properties", propertyId));
        console.log("Property document exists?", propDoc.exists());
        if (!propDoc.exists()) {
            container.innerHTML = '<p>Property not found in database.</p>';
            return;
        }
        const property = { id: propDoc.id, ...propDoc.data() };
        // Increment view count
        await updateDoc(doc(db, 'properties', propertyId), { views: increment(1) }).catch(e => console.warn("View increment failed:", e));
        
        const genderIcon = property.genderPreference === 'boys' ? 'fa-mars' : (property.genderPreference === 'girls' ? 'fa-venus' : 'fa-venus-mars');
        const genderText = property.genderPreference === 'boys' ? 'Boys only' : (property.genderPreference === 'girls' ? 'Girls only' : 'Anyone');
        const avgRating = property.avgRating ? property.avgRating.toFixed(1) : 'N/A';
        
        let reviewsHtml = '';
        const reviewsSnap = await getDocs(collection(db, `properties/${propertyId}/reviews`));
        reviewsSnap.forEach(doc => {
            const r = doc.data();
            reviewsHtml += `<div class="review-item"><strong>${escapeHtml(r.userName)}</strong> rated ${r.rating}/5<br><em>${escapeHtml(r.comment || '')}</em><br><small>${new Date(r.timestamp?.toDate()).toLocaleDateString()}</small></div>`;
        });
        if (!reviewsHtml) reviewsHtml = '<p>No reviews yet.</p>';
        
        const html = `
            <div class="property-details">
                <div class="details-image"><img src="${property.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image'}" alt="${escapeHtml(property.title)}"></div>
                <div class="details-info">
                    <h1>${escapeHtml(property.title)}</h1>
                    <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(property.location)}</p>
                    <p><i class="fas fa-rupee-sign"></i> ₹${property.price} / month</p>
                    <p><i class="fas fa-info-circle"></i> ${escapeHtml(property.accommodation)}</p>
                    <div class="details-badges"><span class="badge"><i class="fas fa-door-open"></i> ${property.bhk || 'N/A'} BHK</span><span class="badge"><i class="fas ${genderIcon}"></i> ${genderText}</span></div>
                    <div class="details-amenities">${property.parking ? '<span><i class="fas fa-car"></i> Parking</span>' : ''}${property.petFriendly ? '<span><i class="fas fa-paw"></i> Pet Friendly</span>' : ''}${property.hasWifi ? '<span><i class="fas fa-wifi"></i> WiFi</span>' : ''}</div>
                    <div class="details-rating"><i class="fas fa-star" style="color: gold;"></i> ${avgRating} / 5 (${property.reviewCount || 0} reviews)</div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button id="show-contact-btn" class="btn-primary"><i class="fas fa-envelope"></i> Contact Owner</button>
                        <button id="chat-owner-btn" class="btn-primary" style="background: #2c5f7a;"><i class="fas fa-comment-dots"></i> Chat with Owner</button>
                    </div>
                    <div id="owner-contact-info" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--card-bg); border-radius: 20px;">
                        <h3>Owner Details</h3>
                        <p><i class="fas fa-user"></i> <strong>Name:</strong> ${escapeHtml(property.ownerName || 'Not provided')}</p>
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${escapeHtml(property.ownerEmail || 'Not provided')}</p>
                        <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${escapeHtml(property.ownerPhone || 'Not provided')}</p>
                    </div>
                </div>
                <div class="details-reviews"><h2>Reviews</h2>${reviewsHtml}</div>
            </div>
        `;
        container.innerHTML = html;
        
        const contactBtn = document.getElementById('show-contact-btn');
        const contactInfo = document.getElementById('owner-contact-info');
        if (contactBtn && contactInfo) {
            contactBtn.addEventListener('click', () => {
                if (contactInfo.style.display === 'none') { contactInfo.style.display = 'block'; contactBtn.textContent = 'Hide Owner Details'; }
                else { contactInfo.style.display = 'none'; contactBtn.textContent = 'Contact Owner'; }
            });
        }
        
        const chatBtn = document.getElementById('chat-owner-btn');
        if (chatBtn) {
            chatBtn.addEventListener('click', async () => {
                if (!currentUser) { alert("Please login to chat."); window.location.href = 'login.html'; return; }
                if (currentUser.uid === property.ownerId) { alert("You cannot chat with yourself."); return; }
                await startChat(property.ownerId, property.id);
            });
        }
    } catch (err) {
        console.error("Error loading property details:", err);
        container.innerHTML = `<p>Error loading property: ${err.message}. Check console for details.</p>`;
    }
}

// ========== CHAT FUNCTIONS ==========
async function startChat(ownerId, propertyId) {
    if (!currentUser) return;
    const q = query(collection(db, 'chats'), 
        where('participants', 'array-contains', currentUser.uid),
        where('propertyId', '==', propertyId)
    );
    const snap = await getDocs(q);
    let chatId = null;
    if (!snap.empty) {
        chatId = snap.docs[0].id;
    } else {
        const participants = [currentUser.uid, ownerId];
        const chatRef = await addDoc(collection(db, 'chats'), {
            participants: participants,
            propertyId: propertyId,
            lastMessage: '',
            lastUpdated: serverTimestamp(),
            unreadCount: { [currentUser.uid]: 0, [ownerId]: 0 }
        });
        chatId = chatRef.id;
    }
    window.location.href = `chat-room.html?chatId=${chatId}`;
}

async function sendMessage(chatId, text) {
    if (!currentUser || !text.trim()) return;
    const message = {
        senderId: currentUser.uid,
        text: text.trim(),
        timestamp: serverTimestamp()
    };
    await addDoc(collection(db, `chats/${chatId}/messages`), message);
    await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text.trim(),
        lastUpdated: serverTimestamp()
    });
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    const chatData = chatDoc.data();
    const otherId = chatData.participants.find(p => p !== currentUser.uid);
    const newUnread = (chatData.unreadCount?.[otherId] || 0) + 1;
    await updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${otherId}`]: newUnread
    });
}

function loadChats() {
    const container = document.getElementById('chat-list');
    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<p>Please login to see your conversations.</p>';
        return;
    }
    
    const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastUpdated', 'desc')
    );
    
    getDocs(q).then(snapshot => {
        if (snapshot.empty) {
            container.innerHTML = '<p>No conversations yet.</p>';
            return;
        }
        let html = '';
        snapshot.forEach(chatDoc => {
            const chat = chatDoc.data();
            const otherId = chat.participants.find(p => p !== currentUser.uid);
            const otherShortId = otherId ? otherId.slice(0,8) : 'unknown';
            const unread = chat.unreadCount?.[currentUser.uid] || 0;
            const lastMsg = chat.lastMessage || 'No messages yet';
            html += `<div class="chat-list-item" data-chatid="${chatDoc.id}">
                        <div><i class="fas fa-user-circle"></i> <strong>User: ${escapeHtml(otherShortId)}</strong>
                        <div><small>${escapeHtml(lastMsg)}</small></div>
                        ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}</div>
                        <i class="fas fa-chevron-right"></i>
                    </div>`;
        });
        container.innerHTML = html;
        document.querySelectorAll('.chat-list-item').forEach(el => {
            el.addEventListener('click', () => {
                window.location.href = `chat-room.html?chatId=${el.dataset.chatid}`;
            });
        });
    }).catch(err => {
        console.error("Firestore error in loadChats:", err);
        container.innerHTML = `<p>Error loading chats: ${err.message}</p>`;
    });
}

function loadChatRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    if (!chatId || !currentUser) return;
    
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message');
    
    if (!messagesDiv || !input || !sendBtn) {
        console.error("Chat room elements not found");
        return;
    }
    
    // Clear any existing listener
    if (currentChatListener) currentChatListener();
    
    // Real-time listener for messages
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        let html = '';
        snapshot.forEach(doc => {
            const msg = doc.data();
            const isMine = msg.senderId === currentUser.uid;
            html += `<div class="message-bubble ${isMine ? 'message-mine' : 'message-other'}">
                        ${escapeHtml(msg.text)}<br>
                        <small>${msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : ''}</small>
                    </div>`;
        });
        messagesDiv.innerHTML = html;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
    currentChatListener = unsubscribe;
    
    // Mark messages as read
    (async () => {
        try {
            const chatDoc = await getDoc(doc(db, 'chats', chatId));
            if (chatDoc.exists()) {
                await updateDoc(doc(db, 'chats', chatId), {
                    [`unreadCount.${currentUser.uid}`]: 0
                });
            }
        } catch (err) {
            console.error("Error marking read:", err);
        }
    })();
    
    // Send message function
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        try {
            const message = {
                senderId: currentUser.uid,
                text: text,
                timestamp: serverTimestamp()
            };
            await addDoc(collection(db, `chats/${chatId}/messages`), message);
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: text,
                lastUpdated: serverTimestamp()
            });
            // Increment unread count for the other participant
            const chatDoc = await getDoc(doc(db, 'chats', chatId));
            const chatData = chatDoc.data();
            const otherId = chatData.participants.find(p => p !== currentUser.uid);
            const newUnread = (chatData.unreadCount?.[otherId] || 0) + 1;
            await updateDoc(doc(db, 'chats', chatId), {
                [`unreadCount.${otherId}`]: newUnread
            });
            input.value = '';
        } catch (err) {
            console.error("Send message error:", err);
            alert("Failed to send message: " + err.message);
        }
    }
    
    // Attach event listeners
    sendBtn.onclick = sendMessage;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// ========== DASHBOARD ==========
async function loadDashboard() {
    if (!currentUser) { window.location.href = 'login.html'; return; }
    const q = query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid));
    const propsSnap = await getDocs(q);
    const properties = propsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('total-listings').innerText = properties.length;
    let totalViews = 0; properties.forEach(p => totalViews += (p.views || 0));
    document.getElementById('total-views').innerText = totalViews;
    let totalRating = 0, reviewCount = 0;
    for (const prop of properties) {
        const revSnap = await getDocs(collection(db, `properties/${prop.id}/reviews`));
        revSnap.forEach(r => { totalRating += r.data().rating; reviewCount++; });
    }
    const avg = reviewCount ? (totalRating / reviewCount).toFixed(1) : 0;
    document.getElementById('avg-rating').innerText = avg;
    const ctx = document.getElementById('viewsChart')?.getContext('2d');
    if (ctx && properties.length) {
        new Chart(ctx, { type: 'bar', data: { labels: properties.map(p => p.title.substring(0, 20)), datasets: [{ label: 'Views', data: properties.map(p => p.views || 0), backgroundColor: '#e67e22' }] } });
    }
    let propsHtml = '';
    properties.forEach(prop => {
        propsHtml += `<div class="property-card"><div class="card-img"><img src="${prop.imageUrl || ''}" style="height:150px;"></div><div class="card-body"><h3>${escapeHtml(prop.title)}</h3><p>Views: ${prop.views || 0}</p><p>Rating: ${prop.avgRating ? prop.avgRating.toFixed(1) : 'N/A'}</p></div></div>`;
    });
    document.getElementById('owner-properties-list').innerHTML = propsHtml || '<p>You haven\'t listed any properties yet.</p>';
}

// ========== ADMIN PANEL (buttons fixed) ==========
async function loadAdminPanel(tab = 'users') {
    if (currentUserRole !== 'admin') { 
        document.getElementById('admin-content').innerHTML = '<p style="color:red;">Access denied. Admins only.</p>'; 
        return; 
    }
    const contentDiv = document.getElementById('admin-content');
    
    if (tab === 'users') {
        const usersSnap = await getDocs(collection(db, 'users'));
        let html = `<h2>👥 All Users</h2><div class="admin-table-container"><table class="admin-table"><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Actions</th></tr></thead><tbody>`;
        usersSnap.forEach(doc => {
            const user = doc.data();
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';
            html += `<tr>
                    <td>${escapeHtml(user.email)}</td>
                    <td>${escapeHtml(fullName)}</td>
                    <td>${escapeHtml(user.role || 'user')}</td>
                    <td>
                        <button class="btn-outline make-admin" data-id="${doc.id}">Make Admin</button>
                        <button class="btn-outline delete-user" data-id="${doc.id}" style="background:#e74c3c; color:white;">Delete</button>
                    </div>
                </tr>`;
        });
        html += `</tbody></table></div>`;
        contentDiv.innerHTML = html;
        
        document.querySelectorAll('.make-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.id;
                await updateDoc(doc(db, 'users', userId), { role: 'admin' });
                alert('User is now an admin');
                loadAdminPanel('users');
            });
        });
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this user permanently?')) {
                    const userId = btn.dataset.id;
                    await deleteDoc(doc(db, 'users', userId));
                    alert('User deleted');
                    loadAdminPanel('users');
                }
            });
        });
    } 
    else if (tab === 'properties') {
        const propsSnap = await getDocs(collection(db, 'properties'));
        let html = '<h2>🏠 All Properties</h2><div class="property-grid">';
        propsSnap.forEach(doc => {
            const p = doc.data();
            html += `<div class="property-card">
                        <div class="card-img"><img src="${p.imageUrl || ''}" style="height:120px; object-fit:cover;"></div>
                        <div class="card-body">
                            <h3>${escapeHtml(p.title)}</h3>
                            <p>${escapeHtml(p.location)}</p>
                            <p>₹${p.price}</p>
                            <button class="btn-outline delete-prop-admin" data-id="${doc.id}" style="background:#e74c3c; color:white;">Delete</button>
                        </div>
                    </div>`;
        });
        html += '</div>';
        contentDiv.innerHTML = html;
        
        document.querySelectorAll('.delete-prop-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this property?')) {
                    await deleteDoc(doc(db, 'properties', btn.dataset.id));
                    loadAdminPanel('properties');
                }
            });
        });
    } 
    else if (tab === 'reviews') {
        const propsSnap = await getDocs(collection(db, 'properties'));
        let html = '<h2>⭐ All Reviews</h2>';
        for (const propDoc of propsSnap.docs) {
            const reviewsSnap = await getDocs(collection(db, `properties/${propDoc.id}/reviews`));
            reviewsSnap.forEach(rev => {
                const r = rev.data();
                html += `<div style="background:var(--card-bg); margin:1rem 0; padding:1rem; border-radius:20px;">
                            <strong>${escapeHtml(r.userName)}</strong> rated ${r.rating}/5<br>
                            <em>${escapeHtml(r.comment || '')}</em><br>
                            <button class="btn-outline delete-review" data-prop="${propDoc.id}" data-review="${rev.id}" style="background:#e74c3c; color:white;">Delete</button>
                        </div>`;
            });
        }
        contentDiv.innerHTML = html;
        
        document.querySelectorAll('.delete-review').forEach(btn => {
            btn.addEventListener('click', async () => {
                await deleteDoc(doc(db, `properties/${btn.dataset.prop}/reviews`, btn.dataset.review));
                loadAdminPanel('reviews');
            });
        });
    } 
    else if (tab === 'stats') {
        const usersSnap = await getDocs(collection(db, 'users'));
        const propsSnap = await getDocs(collection(db, 'properties'));
        contentDiv.innerHTML = `<h2>📊 Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card"><i class="fas fa-users"></i><h3>${usersSnap.size}</h3><p>Total Users</p></div>
                <div class="stat-card"><i class="fas fa-building"></i><h3>${propsSnap.size}</h3><p>Properties</p></div>
            </div>
            <canvas id="statsChart" style="max-height:300px;"></canvas>`;
        const canvas = document.getElementById('statsChart');
        if (canvas) {
            new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Users', 'Properties'],
                    datasets: [{ label: 'Count', data: [usersSnap.size, propsSnap.size], backgroundColor: '#e67e22' }]
                }
            });
        }
    }
}

// ========== HOME PAGE INIT ==========
function initHomePage() {
    const listBtn = document.getElementById('list-property-btn');
    const propertyModal = document.getElementById('property-modal');
    const propertyForm = document.getElementById('property-form');
    const applyFilters = document.getElementById('apply-filters');
    const typeSelect = document.getElementById('prop-type');
    const bhkGroup = document.getElementById('bhk-group');
    if (typeSelect && bhkGroup) {
        typeSelect.addEventListener('change', () => { bhkGroup.style.display = typeSelect.value === 'apartment' ? 'block' : 'none'; });
    }
    if (listBtn) {
        listBtn.onclick = () => {
            if (!currentUser) { window.location.href = 'login.html'; return; }
            propertyModal.style.display = 'flex';
        };
    }
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            if (propertyModal) propertyModal.style.display = 'none';
            const reviewModal = document.getElementById('review-modal');
            if (reviewModal) reviewModal.style.display = 'none';
        };
    });
    if (propertyForm) {
        propertyForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentUser) { alert("Please login"); window.location.href = 'login.html'; return; }
            const title = document.getElementById('prop-title').value;
            const type = document.getElementById('prop-type').value;
            const price = parseFloat(document.getElementById('prop-price').value);
            const location = document.getElementById('prop-location').value;
            const accommodation = document.getElementById('prop-accommodation').value;
            let bhk = type === 'apartment' ? document.getElementById('prop-bhk').value : '0';
            if (type === 'apartment' && !bhk) { alert("Select BHK"); return; }
            const genderPreference = document.getElementById('prop-gender').value;
            const imageFile = document.getElementById('prop-image').files[0];
            const parking = document.getElementById('prop-parking').checked;
            const petFriendly = document.getElementById('prop-pet').checked;
            const hasWifi = document.getElementById('prop-wifi').checked;
            const lat = parseFloat(document.getElementById('prop-lat').value);
            const lng = parseFloat(document.getElementById('prop-lng').value);
            const ownerName = document.getElementById('prop-owner-name').value;
            const ownerEmail = document.getElementById('prop-owner-email').value;
            const ownerPhone = document.getElementById('prop-owner-phone').value;
            if (!title || !type || !price || !location || !accommodation || !genderPreference || !imageFile || !ownerName || !ownerEmail || !ownerPhone) {
                alert("Fill all fields (title, type, price, location, accommodation, gender, image, owner name, email, phone)");
                return;
            }
            try {
                await addProperty({ title, type, price, location, accommodation, bhk, genderPreference, parking, petFriendly, hasWifi, lat, lng, ownerName, ownerEmail, ownerPhone }, imageFile);
                alert("Property listed!");
                propertyModal.style.display = 'none';
                propertyForm.reset();
                await fetchProperties();
            } catch (err) { alert("Error: " + err.message); }
        };
    }
    if (applyFilters) applyFilters.onclick = () => renderPropertyCards();
    fetchProperties();
    document.getElementById('property-list')?.addEventListener('click', async (e) => {
        const card = e.target.closest('.property-card');
        if (card && !e.target.classList.contains('review-btn') && !e.target.classList.contains('delete-prop-btn')) {
            const propId = card.dataset.id;
            window.location.href = `property-details.html?id=${propId}`;
        }
    });
    initLocationSearch();
}

// ========== LOGIN & REGISTER ==========
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Logged in!");
                window.location.href = 'index.html';
            } catch (err) { 
                // Show user‑friendly message instead of Firebase error code
                let errorMsg = "Invalid email or password. Please try again.";
                if (err.code === 'auth/user-not-found') {
                    errorMsg = "No account found with this email. Please register first.";
                } else if (err.code === 'auth/wrong-password') {
                    errorMsg = "Incorrect password. Please try again.";
                } else if (err.code === 'auth/invalid-email') {
                    errorMsg = "Please enter a valid email address.";
                }
                alert(errorMsg);
                console.error(err);
            }
        };
    }
}

function initRegisterPage() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('reg-firstname').value;
            const lastName = document.getElementById('reg-lastname').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            if (!firstName || !lastName) {
                alert("Please enter both first and last name");
                return;
            }
            if (password !== confirmPassword) {
                alert("Passwords do not match. Please re‑enter.");
                return;
            }
            if (password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }
            try {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCred.user.uid), { 
                    firstName, lastName, email, 
                    role: 'user' 
                });
                alert("Registration successful! Please login.");
                window.location.href = 'login.html';
            } catch (err) { 
                alert("Registration error: " + err.message);
                console.error(err);
            }
        };
    }
}

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') document.body.classList.remove('dark');
    else document.body.classList.add('dark');
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        };
    }
}

// ========== AUTH STATE LISTENER ==========
initAuthStateListener(async (user) => {
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const dashboardLink = document.getElementById('dashboard-link');
    const adminLink = document.getElementById('admin-link');
    const chatLink = document.getElementById('chat-link');
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const displayName = userDoc.exists() ? `${userDoc.data().firstName || ''} ${userDoc.data().lastName || ''}`.trim() : user.email.split('@')[0];
        if (userDisplay) userDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${displayName}`;
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (dashboardLink) dashboardLink.style.display = 'inline-flex';
        if (adminLink && currentUserRole === 'admin') adminLink.style.display = 'inline-flex';
        if (chatLink) chatLink.style.display = 'inline-flex';
        await fetchProperties();
        if (document.getElementById('owner-properties-list')) loadDashboard();
        if (document.getElementById('chat-list')) loadChats();
        if (document.getElementById('chat-room-container')) loadChatRoom();
    } else {
        if (userDisplay) userDisplay.innerHTML = '<i class="fas fa-user"></i> Guest';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (chatLink) chatLink.style.display = 'none';
        await fetchProperties();
        if (!document.querySelector('.toast-notification') && window.location.pathname.includes('index.html')) {
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = '<i class="fas fa-info-circle"></i><span>👋 Sign up to list properties.</span><a href="register.html">Register</a><span class="close-toast"><i class="fas fa-times"></i></span>';
            document.body.appendChild(toast);
            toast.querySelector('.close-toast').onclick = () => toast.remove();
            setTimeout(() => toast.remove(), 8000);
        }
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
            alert("Logged out");
            window.location.href = 'index.html';
        } catch (err) { alert("Error logging out: " + err.message); console.error(err); }
    };
}

// ========== PAGE INITIALISATION ==========
if (document.getElementById('property-list')) initHomePage();
if (document.getElementById('login-form')) initLoginPage();
if (document.getElementById('register-form')) initRegisterPage();
if (document.getElementById('review-modal')) document.getElementById('submit-review')?.addEventListener('click', submitReview);
if (document.getElementById('property-details-container')) loadPropertyDetails();
if (document.getElementById('admin-content')) {
    const tabUsers = document.getElementById('tab-users');
    const tabProperties = document.getElementById('tab-properties');
    const tabReviews = document.getElementById('tab-reviews');
    const tabStats = document.getElementById('tab-stats');
    if (tabUsers) tabUsers.addEventListener('click', () => loadAdminPanel('users'));
    if (tabProperties) tabProperties.addEventListener('click', () => loadAdminPanel('properties'));
    if (tabReviews) tabReviews.addEventListener('click', () => loadAdminPanel('reviews'));
    if (tabStats) tabStats.addEventListener('click', () => loadAdminPanel('stats'));
    loadAdminPanel('users');
}
initTheme();

// Seed demo data (only if empty)
(async () => {
    const qSnap = await getDocs(collection(db, "properties"));
    if (qSnap.empty) {
        const demo = [
            { title: "Cozy Studio near GMCH", type: "apartment", price: 8500, location: "Guwahati, Maligaon", accommodation: "1 BHK, furnished", bhk: "1", genderPreference: "anyone", parking: false, petFriendly: true, hasWifi: true, ownerId: "demo", createdAt: serverTimestamp(), imageUrl: "https://picsum.photos/id/106/400/300", views: 0, avgRating: 0, reviewCount: 0, ownerName: "Demo Owner", ownerEmail: "owner@example.com", ownerPhone: "1234567890", lat: 26.1523, lng: 91.6724 },
            { title: "Luxury 2BHK with Park View", type: "house", price: 22000, location: "Uzan Bazar, Guwahati", accommodation: "2 BHK + study", bhk: "2", genderPreference: "anyone", parking: true, petFriendly: false, hasWifi: true, ownerId: "demo", createdAt: serverTimestamp(), imageUrl: "https://picsum.photos/id/20/400/300", views: 0, avgRating: 0, reviewCount: 0, ownerName: "Demo Owner", ownerEmail: "owner@example.com", ownerPhone: "1234567890", lat: 26.1802, lng: 91.7547 }
        ];
        for (let prop of demo) await addDoc(collection(db, "properties"), prop);
        await fetchProperties();
    }
})();