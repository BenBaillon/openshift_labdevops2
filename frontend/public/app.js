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

async function loadOrders() {
  const ordersElement = document.getElementById("orders");
  const storagePathElement = document.getElementById("orders-storage-path");

  try {
    ordersElement.textContent = "Chargement des commandes...";

    const response = await fetch(`${appConfig.backendUrl}/api/orders`);

    if (!response.ok) {
      throw new Error(`Impossible de récupérer les commandes. HTTP ${response.status}`);
    }

    const data = await response.json();

    storagePathElement.textContent = data.storagePath || "Non renseigné";
    ordersElement.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      ordersElement.innerHTML = `
        <div class="empty-state">
          Aucune commande enregistrée.
        </div>
      `;
      return;
    }

    data.items.forEach((order) => {
      const item = document.createElement("div");
      item.className = "order-card";

      item.innerHTML = `
        <div>
          <h3>${order.product}</h3>
          <p>Commande ${order.id}</p>
          <p>Créée le ${formatDate(order.createdAt)}</p>
        </div>
        <strong>x${order.quantity}</strong>
      `;

      ordersElement.appendChild(item);
    });
  } catch (error) {
    ordersElement.textContent = "Impossible de charger les commandes";
    document.getElementById("orders-storage-path").textContent = "Erreur";
    showError(error.message);
  }
}

async function createOrder(event) {
  event.preventDefault();
  clearError();

  const product = document.getElementById("order-product").value;
  const quantity = Number(document.getElementById("order-quantity").value || 1);

  try {
    const response = await fetch(`${appConfig.backendUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product,
        quantity
      })
    });

    if (!response.ok) {
      throw new Error(`Impossible de créer la commande. HTTP ${response.status}`);
    }

    await loadOrders();
  } catch (error) {
    showError(error.message);
  }
}

async function clearOrders() {
  clearError();

  try {
    const response = await fetch(`${appConfig.backendUrl}/api/orders`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(`Impossible de supprimer les commandes. HTTP ${response.status}`);
    }

    await loadOrders();
  } catch (error) {
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

function formatDate(value) {
  if (!value) {
    return "date inconnue";
  }

  return new Date(value).toLocaleString("fr-FR");
}

async function refresh() {
  clearError();

  await checkBackendHealth();
  await loadBackendVersion();
  await loadProducts();
  await loadOrders();
}

document.getElementById("refresh-button").addEventListener("click", refresh);
document.getElementById("refresh-orders-button").addEventListener("click", loadOrders);
document.getElementById("clear-orders-button").addEventListener("click", clearOrders);
document.getElementById("order-form").addEventListener("submit", createOrder);

async function start() {
  try {
    await loadConfig();
    await refresh();
  } catch (error) {
    showError(error.message);
  }
}

start();