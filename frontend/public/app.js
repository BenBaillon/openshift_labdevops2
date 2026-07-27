let appConfig = null;

async function loadConfig() {
  const response = await fetch("/config");

  if (!response.ok) {
    throw new Error("Impossible de charger la configuration du frontend");
  }

  appConfig = await response.json();

  document.getElementById("frontend-version").textContent = appConfig.frontendVersion;
  document.getElementById("environment").textContent = appConfig.environment;
  document.getElementById("backend-url").textContent = appConfig.backendUrl;
}

async function checkBackendHealth() {
  const statusElement = document.getElementById("backend-status");

  try {
    const response = await fetch(`${appConfig.backendUrl}/health`);

    if (!response.ok) {
      throw new Error(`Backend healthcheck failed with status ${response.status}`);
    }

    const data = await response.json();

    statusElement.textContent = `${data.status} - ${data.service}`;
    statusElement.className = "status status-ok";
  } catch (error) {
    statusElement.textContent = "Backend inaccessible";
    statusElement.className = "status status-ko";
    showError(error.message);
  }
}

async function loadBackendVersion() {
  try {
    const response = await fetch(`${appConfig.backendUrl}/api/version`);

    if (!response.ok) {
      throw new Error(`Impossible de récupérer la version backend. HTTP ${response.status}`);
    }

    const data = await response.json();

    document.getElementById("backend-name").textContent = data.name;
    document.getElementById("backend-version").textContent = data.version;
    document.getElementById("backend-message").textContent = data.message;
  } catch (error) {
    document.getElementById("backend-name").textContent = "Erreur";
    document.getElementById("backend-version").textContent = "Erreur";
    document.getElementById("backend-message").textContent = "Backend inaccessible";
    showError(error.message);
  }
}

async function loadProducts() {
  const productsElement = document.getElementById("products");

  try {
    productsElement.textContent = "Chargement des produits...";

    const response = await fetch(`${appConfig.backendUrl}/api/products`);

    if (!response.ok) {
      throw new Error(`Impossible de récupérer les produits. HTTP ${response.status}`);
    }

    const data = await response.json();

    productsElement.innerHTML = "";

    data.items.forEach((product) => {
      const item = document.createElement("div");
      item.className = "product-card";

      item.innerHTML = `
        <div>
          <h3>${product.name}</h3>
          <p>Produit n°${product.id}</p>
        </div>
        <strong>${product.price.toFixed(2)} €</strong>
      `;

      productsElement.appendChild(item);
    });
  } catch (error) {
    productsElement.textContent = "Impossible de charger les produits";
    showError(error.message);
  }
}

function showError(message) {
  const errorBox = document.getElementById("error-box");
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  const errorBox = document.getElementById("error-box");
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

async function refresh() {
  clearError();

  await checkBackendHealth();
  await loadBackendVersion();
  await loadProducts();
}

document.getElementById("refresh-button").addEventListener("click", refresh);

async function start() {
  try {
    await loadConfig();
    await refresh();
  } catch (error) {
    showError(error.message);
  }
}

start();