// =============================
// docs.js - Firebase Modular
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from '../config/firebaseConfig.js';

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Categoria ativa
let categoriaAtual = "requerimentos";

// Mostrar documentos de uma categoria
function showDocs(categoria) {
  categoriaAtual = categoria;
  carregarDocumentos(categoria);
}
window.showDocs = showDocs; // para funcionar nos botões HTML

// Adicionar documento
document.getElementById("btnAddDoc").addEventListener("click", async () => {
  const titulo = prompt("Digite o título do documento:");
  if (!titulo) return;

  try {
    await addDoc(collection(db, "documentos", categoriaAtual, "itens"), {
      titulo,
      atendido: false,
      criadoEm: serverTimestamp()
    });
    carregarDocumentos(categoriaAtual);
  } catch (err) {
    console.error("Erro ao adicionar documento:", err);
  }
});

// Carregar documentos
async function carregarDocumentos(categoria) {
  const lista = document.getElementById("docList");
  lista.innerHTML = "";

  let totalDocs = 0;
  let atendidos = 0;
  let naoAtendidos = 0;

  try {
    const q = query(collection(db, "documentos", categoria, "itens"), orderBy("criadoEm", "desc"));
    const snapshot = await getDocs(q);
    totalDocs = snapshot.size;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.atendido) atendidos++;
      else naoAtendidos++;

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      // Checkbox + título
      const label = document.createElement("label");
      label.className = "form-check-label d-flex align-items-center";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input me-2";
      checkbox.checked = data.atendido;

      checkbox.addEventListener("change", async () => {
        await updateDoc(doc(db, "documentos", categoria, "itens", docSnap.id), {
          atendido: checkbox.checked
        });

        if (checkbox.checked) {
          atendidos++;
          naoAtendidos--;
        } else {
          atendidos--;
          naoAtendidos++;
        }
        atualizarContadores(totalDocs, atendidos, naoAtendidos);
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(data.titulo));

      // Botões lado a lado
      const btnGroup = document.createElement("div");
      btnGroup.className = "d-flex gap-1";

      // Botão editar
      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn-sm btn-warning";
      btnEdit.innerHTML = '<i class="bi bi-pencil-square"></i>';
      btnEdit.addEventListener("click", async () => {
        const novoTitulo = prompt("Edite o título do documento:", data.titulo);
        if (!novoTitulo) return;
        await updateDoc(doc(db, "documentos", categoria, "itens", docSnap.id), { titulo: novoTitulo });
        carregarDocumentos(categoria);
      });

      // Botão excluir
      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn-sm btn-danger";
      btnDelete.innerHTML = '<i class="bi bi-trash3-fill"></i>';
      btnDelete.addEventListener("click", async () => {
        if (confirm("Deseja excluir este documento?")) {
          try {
            await deleteDoc(doc(db, "documentos", categoria, "itens", docSnap.id));
            carregarDocumentos(categoria);
          } catch (err) {
            console.error("Erro ao excluir documento:", err);
          }
        }
      });

      btnGroup.appendChild(btnEdit);
      btnGroup.appendChild(btnDelete);

      li.appendChild(label);
      li.appendChild(btnGroup);
      lista.appendChild(li);
    });

    atualizarContadores(totalDocs, atendidos, naoAtendidos);
  } catch (err) {
    console.error("Erro ao carregar documentos:", err);
  }
}

// Função para atualizar contadores no HTML
function atualizarContadores(total, atendidos, naoAtendidos) {
  let contadores = document.getElementById("contadores");
  if (!contadores) {
    contadores = document.createElement("div");
    contadores.id = "contadores";
    contadores.className = "mb-2";
    document.getElementById("documentos").insertBefore(contadores, document.getElementById("docList"));
  }

  contadores.innerHTML = `
    <strong>Total:</strong> ${total} |
    <strong>Atendidos:</strong> ${atendidos} |
    <strong>Não atendidos:</strong> ${naoAtendidos}
  `;
}

// Carregar a primeira categoria automaticamente
carregarDocumentos(categoriaAtual);
