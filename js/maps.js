// mapa.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js';
import { firebaseConfig } from '../config/firebaseConfig.js'; // seu arquivo com a config

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inicializa mapa em Oriximiná
const mapa = L.map('mapa').setView([-1.7633428, -55.8839918], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(mapa);

const ROOT_DOC = "defaultDoc";

// Função para carregar pontos
async function carregarPontos() {
  const snap = await getDocs(collection(db, "mapa_visitas", ROOT_DOC, "itens"));

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const iconUrl = data.status === "visitado"
      ? 'images/location_green.png'
      : 'images/location_red.png';

    const marker = L.marker([data.lat, data.lng], {
      icon: L.icon({
        iconUrl: iconUrl,
        iconSize: [35, 35],
        iconAnchor: [17, 35]
      })
    }).addTo(mapa);

    marker.bindPopup(`
      <strong>${data.titulo}</strong><br>
      📌 Demanda: ${data.demanda || "Não informada"}<br>
      Status: ${data.status}<br>
      <button onclick="toggleStatus('${docSnap.id}')">Alterar status</button>
    `);
  });
}

// Alterna status
window.toggleStatus = async (id) => {
  const pontoRef = doc(db, "mapa_visitas", ROOT_DOC, "itens", id);
  const snap = await getDocs(collection(db, "mapa_visitas", ROOT_DOC, "itens"));
  let novoStatus = "visitado";

  snap.forEach(d => {
    if (d.id === id) {
      novoStatus = d.data().status === "visitado" ? "a visitar" : "visitado";
    }
  });

  await updateDoc(pontoRef, { status: novoStatus });

  mapa.eachLayer(layer => {
    if (layer instanceof L.Marker) layer.remove();
  });

  carregarPontos();
}

// Adiciona ponto clicando no mapa
mapa.on('click', async (e) => {
  const titulo = prompt("Nome do local:");
  if (!titulo) return;

  const demanda = prompt("Demanda do local:");
  if (!demanda) return;

  await addDoc(collection(db, "mapa_visitas", ROOT_DOC, "itens"), {
    titulo,
    demanda,
    lat: e.latlng.lat,
    lng: e.latlng.lng,
    status: "a visitar"
  });

  mapa.eachLayer(layer => {
    if (layer instanceof L.Marker) layer.remove();
  });

  carregarPontos();
});

// Carrega os pontos inicialmente
carregarPontos();
