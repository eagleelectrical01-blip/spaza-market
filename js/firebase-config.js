const firebaseConfig = {
  apiKey: "AIzaSyBD-t4Y9zN_0SO5S27EC_GcZFEsoXSip2s",
authDomain: "spaza-market-sa.firebaseapp.com",
projectId: "spaza-market-sa",
storageBucket: "spaza-market-sa.firebasestorage.app",
messagingSenderId: "927673884911",
appId: "1:927673884911:web:992f5b818f3da2deaabb1a",
measurementId: "G-N2EM0Y5LSY"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

const DEFAULT_PRICING = {
  freeListings: 2,
  extraListingFee: 30,
  boost7Price: 20,
  boost30Price: 50,
  badgePrice: 99
};

async function getPricing() {
  try {
    const doc = await db.collection('settings').doc('pricing').get();
    if (doc.exists) return doc.data();
    return DEFAULT_PRICING;
  } catch {
    return DEFAULT_PRICING;
  }
}

async function savePricing(pricing) {
  await db.collection('settings').doc('pricing').set(pricing);
}

async function getListingCountByPhone(phone) {
  const snap = await db.collection('listings')
    .where('phone', '==', phone)
    .where('active', '==', true)
    .get();
  return snap.size;
}

async function addListing(data) {
  return await db.collection('listings').add({
    ...data,
    active: true,
    boosted: false,
    verified: false,
    boostExpiry: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function getListings(filters = {}) {
  let query = db.collection('listings').where('active', '==', true);
  if (filters.category && filters.category !== 'All') {
    query = query.where('category', '==', filters.category);
  }
  query = query.orderBy('boosted', 'desc').orderBy('createdAt', 'desc');
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addBoostRequest(data) {
  return await db.collection('boostRequests').add({
    ...data,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function getBoostRequests() {
  const snap = await db.collection('boostRequests')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateBoostRequest(id, data) {
  await db.collection('boostRequests').doc(id).update(data);
}

async function addPayment(data) {
  return await db.collection('payments').add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function getPayments() {
  const snap = await db.collection('payments')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function removeListing(id) {
  await db.collection('listings').doc(id).update({ active: false });
}

async function activateBoost(listingId, days) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  await db.collection('listings').doc(listingId).update({
    boosted: true,
    boostExpiry: firebase.firestore.Timestamp.fromDate(expiry)
  });
}

async function uploadPhoto(file, listingId, index) {
  const ref = storage.ref(`listings/${listingId}/photo_${index}`);
  await ref.put(file);
  return await ref.getDownloadURL();
}
