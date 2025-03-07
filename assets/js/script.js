// Normaliza un nombre: minúsculas y sin acentos
function normalizeName(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }
  
  // Divide y ordena las palabras de un nombre, tratando guiones como espacios
  function splitAndSort(name) {
    const normalized = normalizeName(name).replace(/-/g, " ") // Reemplaza guiones por espacios
    return normalized
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .sort() // Divide en palabras, filtra vacías y ordena
  }
  
  // Determina si dos nombres coinciden
  function namesMatch(name1, name2) {
    const words1 = splitAndSort(name1)
    const words2 = splitAndSort(name2)
  
    // Encuentra palabras coincidentes
    const exactMatches = words1.filter((word) => words2.includes(word))
  
    // Si hay al menos 2 coincidencias exactas, los nombres coinciden
    return exactMatches.length >= 2
  }
  
  // Procesa el CSV y extrae los participantes
  function processCSV(csvData) {
    const lines = csvData.trim().split("\n")
    const participantData = lines.slice(4) // Saltar encabezados
  
    const participantsMap = new Map()
  
    participantData.forEach((line) => {
      const values = line.split(",")
      const participant = {
        name: values[0],
        duration: Number.parseInt(values[4]),
      }
  
      if (participantsMap.has(participant.name)) {
        participantsMap.get(participant.name).duration += participant.duration
      } else {
        participantsMap.set(participant.name, participant)
      }
    })
  
    return Array.from(participantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }
  
  // Muestra los participantes en la tabla
  function displayParticipants(participants) {
    const tbody = document.getElementById("participantsTable")
    tbody.innerHTML = ""
  
    let assistantCount = 0
    let nonAssistantCount = 0
  
    participants.forEach((participant) => {
      const hours = (participant.duration / 60).toFixed(2)
      const isAssistant = hours > 0.75
  
      if (isAssistant) {
        assistantCount++
      } else {
        nonAssistantCount++
      }
  
      const row = document.createElement("tr")
      row.className = isAssistant ? "bg-green-50" : ""
      row.innerHTML = `
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${participant.name}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${hours}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAssistant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                      ${isAssistant ? "Sí" : "No"}
                  </span>
              </td>
          `
      tbody.appendChild(row)
    })
  
    // Actualizar contadores
    document.getElementById("totalParticipants").textContent = participants.length
    document.getElementById("totalAssistants").textContent = assistantCount
    document.getElementById("totalNonAssistants").textContent = nonAssistantCount
  }
  
  // Inicializar la interfaz
  document.addEventListener("DOMContentLoaded", () => {
    // Configurar el botón de selección de archivo
    document.getElementById("fileSelectButton").addEventListener("click", () => {
      document.getElementById("csvFileInput").click()
    })
  
    // Mostrar el nombre del archivo seleccionado
    document.getElementById("csvFileInput").addEventListener("change", (event) => {
      const file = event.target.files[0]
      if (file) {
        document.getElementById("selectedFileName").textContent = file.name
  
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const csvData = e.target.result
            const processedData = processCSV(csvData)
            displayParticipants(processedData)
            const assistants = processedData.filter((p) => p.duration / 60 > 0.75).map((p) => p.name)
            window.assistantsList = assistants
          }
          reader.readAsText(file)
        } else {
          alert("Por favor, sube un archivo CSV válido.")
        }
      }
    })
  
    // Generar código para la consola
    document.getElementById("generateCodeButton").addEventListener("click", () => {
      if (!window.assistantsList) {
        alert("Primero sube y procesa un archivo CSV.")
        return
      }
      const assistants = window.assistantsList
      const code = `
  (function() {
      const assistants = ${JSON.stringify(assistants)};
      const normalizeName = ${normalizeName.toString()};
      const splitAndSort = ${splitAndSort.toString()};
      const namesMatch = ${namesMatch.toString()};
  
      const rows = document.querySelectorAll('#eventModal tbody tr');
      const unmatchedAssistants = new Set(assistants); // Conjunto para nombres no encontrados
  
      rows.forEach(row => {
          const nameElement = row.querySelector('td p');
          if (nameElement) {
              const platformName = nameElement.textContent.trim();
              assistants.forEach(assistant => {
                  if (namesMatch(platformName, assistant)) {
                      const checkbox = row.querySelector('.attendance');
                      if (checkbox && !checkbox.disabled) {
                          checkbox.checked = true;
                      }
                      // Eliminar el nombre del conjunto si se encontró coincidencia
                      unmatchedAssistants.delete(assistant);
                  }
              });
          }
      });
  
      // Mostrar en consola los nombres no encontrados
      console.log('Nombres no encontrados:', unmatchedAssistants.size);
      console.log('Lista de nombres no encontrados:');
      unmatchedAssistants.forEach(name => console.log(name));
  })();`
      document.getElementById("consoleCode").value = code
    })
  
    // Configurar la funcionalidad de copiar al portapapeles
    document.getElementById("copyButton").addEventListener("click", () => {
      const codeTextarea = document.getElementById("consoleCode")
      codeTextarea.select()
      document.execCommand("copy")
  
      // Mostrar notificación
      const notification = document.getElementById("copyNotification")
      notification.classList.remove("hidden")
      setTimeout(() => {
        notification.classList.add("hidden")
      }, 2000)
    })
  
    // Configurar la funcionalidad de copiar al hacer clic en el textarea
    document.getElementById("consoleCode").addEventListener("click", () => {
      if (document.getElementById("consoleCode").value.trim() !== "") {
        document.getElementById("copyButton").click()
      }
    })
  })
  
  