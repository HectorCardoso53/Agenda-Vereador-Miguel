// =============================
// Importando Firebase
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, doc, deleteDoc, updateDoc, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { firebaseConfig } from '../config/firebaseConfig.js';
// =============================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =============================
// Função para listar compromissos do mês selecionado
// =============================
async function listTasks() {
  const selectMes = document.getElementById("selectMes");
  const taskList = document.getElementById("taskList");
  const filtroStatusSelect = document.getElementById("filtroStatus");

  if (!selectMes || !taskList || !filtroStatusSelect) return;

  const mesSelecionado = selectMes.value;
  const filtroStatus = filtroStatusSelect.value; // 'todos', 'pendentes', 'concluidos'
  taskList.innerHTML = "";

  const compromissosRef = collection(db, "agenda", mesSelecionado, "compromissos");
  const querySnapshot = await getDocs(compromissosRef);

  querySnapshot.forEach((docSnap) => {
    const task = docSnap.data();
    const taskId = docSnap.id;

    // ======= Filtro =======
    if (filtroStatus === "pendentes" && task.concluido) return;
    if (filtroStatus === "concluidos" && !task.concluido) return;

    const listItem = document.createElement("li");
    listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-start", "mb-2", "shadow-sm");

    // Visual para compromissos concluídos
    if (task.concluido) {
      listItem.style.backgroundColor = "#d4edda"; // verde claro
    }

    const taskText = document.createElement("div");
    taskText.innerHTML = `
      <div>
        <strong>${task.diaSemana || "Dia não informado"}</strong> - 
        <strong>${task.nome}</strong> - 
        <span style="color:#d30f7e;">${task.horarioSaida || ""}</span>
      </div>
      <small class="text-muted">
        📅 ${task.data || ""} | 🚏 Saída: ${task.localSaida || ""} às ${task.horarioSaida || ""} | 🎯 Destino: ${task.destino || ""}
      </small>
    `;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.concluido;
    checkbox.classList.add("form-check-input", "me-2");
    checkbox.addEventListener("change", async () => {
      await updateDoc(doc(db, "agenda", mesSelecionado, "compromissos", taskId), { concluido: checkbox.checked });
      listTasks();
    });

    const btnRow = document.createElement("div");
    btnRow.classList.add("d-flex", "gap-1");

    // Editar
    const btnEdit = document.createElement("button");
    btnEdit.classList.add("btn", "btn-sm", "btn-warning");
    btnEdit.innerHTML = '<i class="bi bi-pencil-square"></i>';
    btnEdit.addEventListener("click", async () => {
      const newDiaSemana = prompt("Dia da Semana:", task.diaSemana) ?? task.diaSemana;
      const newNome = prompt("Nome:", task.nome) ?? task.nome;
      const newData = prompt("Data:", task.data) ?? task.data;
      const newHorario = prompt("Horário:", task.horarioSaida || "") ?? task.horarioSaida;
      const newLocal = prompt("Local de saída:", task.localSaida || "") ?? task.localSaida;
      const newDestino = prompt("Destino:", task.destino || "") ?? task.destino;

      await updateDoc(doc(db, "agenda", mesSelecionado, "compromissos", taskId), {
        diaSemana: newDiaSemana,
        nome: newNome,
        data: newData,
        horarioSaida: newHorario,
        localSaida: newLocal,
        destino: newDestino
      });
      listTasks();
    });

    // Excluir
    const btnDelete = document.createElement("button");
    btnDelete.classList.add("btn", "btn-sm", "btn-danger");
    btnDelete.innerHTML = '<i class="bi bi-trash3-fill"></i>';
    btnDelete.addEventListener("click", async () => {
      if (confirm("Excluir compromisso?")) {
        await deleteDoc(doc(db, "agenda", mesSelecionado, "compromissos", taskId));
        listTasks();
      }
    });

    // Compartilhar como imagem
    const btnShare = document.createElement("button");
    btnShare.classList.add("btn", "btn-sm", "btn-info");
    btnShare.innerHTML = '<i class="bi bi-share-fill"></i>';
    btnShare.addEventListener("click", async () => {
      const tempCard = listItem.cloneNode(true);
      tempCard.style.position = "absolute";
      tempCard.style.left = "-9999px";
      tempCard.style.backgroundColor = "#f8f9fa";
      tempCard.style.padding = "15px";
      tempCard.style.border = "1px solid #112f79";
      tempCard.style.borderRadius = "8px";
      tempCard.style.width = "300px";
      tempCard.style.fontFamily = "Arial, sans-serif";
      tempCard.style.color = "#112f79";
      tempCard.style.boxShadow = "0 0 5px rgba(0,0,0,0.2)";
      tempCard.style.textAlign = "left";

      document.body.appendChild(tempCard);

      html2canvas(tempCard).then(async (canvas) => {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], "compromisso.png", { type: "image/png" });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: "Compromisso da Agenda" });
            } catch (error) {
              console.error("Erro ao compartilhar:", error);
            }
          } else {
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            alert("Seu navegador não suporta compartilhamento direto. A imagem foi aberta em nova aba!");
          }
        });
        tempCard.remove();
      });
    });

    btnRow.appendChild(btnEdit);
    btnRow.appendChild(btnDelete);
    btnRow.appendChild(btnShare);

    const leftDiv = document.createElement("div");
    leftDiv.classList.add("d-flex", "align-items-start");
    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(taskText);

    listItem.appendChild(leftDiv);
    listItem.appendChild(btnRow);

    taskList.appendChild(listItem);
  });
}



// =============================
// Adicionar compromisso
// =============================
async function addTask() {
  const selectMes = document.getElementById("selectMes");
  if (!selectMes) return;

  const mesSelecionado = selectMes.value;

  const diaSemana = prompt("Dia da Semana:");
  if (!diaSemana) return;
  const nome = prompt("Nome do compromisso:");
  if (!nome) return;
  const data = prompt("Data (ex: 10/09/2025):");
  if (!data) return;
  const horarioSaida = prompt("Horário:") || "";
  const localSaida = prompt("Local de saída:") || "";
  const destino = prompt("Destino:") || "";

  await addDoc(collection(db, "agenda", mesSelecionado, "compromissos"), {
    diaSemana,
    nome,
    data,
    concluido: false,
    horarioSaida,
    localSaida,
    destino
  });

  alert("Compromisso adicionado!");
  listTasks();
}

// =============================
// Inicialização segura
// =============================
window.addEventListener("DOMContentLoaded", () => {
  const btnAddTask = document.getElementById("btnAddTask");
  const selectMes = document.getElementById("selectMes");
  const filtroStatus = document.getElementById("filtroStatus");
if (filtroStatus) {
  filtroStatus.addEventListener("change", listTasks);
}


  if (btnAddTask) btnAddTask.addEventListener("click", addTask);
  if (selectMes) selectMes.addEventListener("change", listTasks);

  // Selecionar mês atual
  const hoje = new Date();
  const nomeMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const mesAtual = nomeMeses[hoje.getMonth()] + hoje.getFullYear();
  const option = [...selectMes.options].find(opt => opt.value === mesAtual);
  if (option) selectMes.value = mesAtual;

  listTasks();
});


