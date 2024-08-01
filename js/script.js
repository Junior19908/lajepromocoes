import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, getDocs, query, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

    const firebaseConfig = {
        apiKey: "AIzaSyCTqcruhPW_9cxOl0pmLD3MFdiIbhnv-Fg",
        authDomain: "rozeildoloja.firebaseapp.com",
        projectId: "rozeildoloja",
        storageBucket: "rozeildoloja.appspot.com",
        messagingSenderId: "742008859338",
        appId: "1:742008859338:web:8b2f2478c48b21cc5b2233",
        measurementId: "G-42T167DSHG"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const salesCollection = collection(db, "sales");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const salesForm = document.getElementById("salesForm");
    const content = document.getElementById("content");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const tablesContainer = document.getElementById("tablesContainer");

    loginButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            loginError.textContent = error.message;
        }
    });

    registerButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            registerError.textContent = error.message;
        }
    });

    salesForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const productName = document.getElementById("productName").value;
        const compradorName = document.getElementById("compradorName").value;
        const cartaoName = document.getElementById("cartaoName").value;
        const storeName = document.getElementById("storeName").value;
        const quantity = document.getElementById("quantity").value;
        const price = parseFloat(document.getElementById("price").value);
        const saleDate = document.getElementById("saleDate").value;
        const numInstallments = parseInt(document.getElementById("numInstallments").value);
        const installmentsPaid = parseInt(document.getElementById("installmentsPaid").value);
        const profitMargin = parseFloat(document.getElementById("profitMargin").value);

        const total = price * quantity;
        const profitAmount = total * (profitMargin / 100);
        const installmentAmount = total / numInstallments;
        const installmentAmountWithProfit = (total + profitAmount) / numInstallments;

        try {
            await addDoc(salesCollection, {
                productName,
                compradorName,
                cartaoName,
                storeName,
                quantity,
                price,
                saleDate,
                numInstallments,
                installmentsPaid,
                profitMargin,
                installmentAmount,
                installmentAmountWithProfit,
                total,
                installments: Array(numInstallments).fill(false),
                timestamp: new Date()
            });
            salesForm.reset();
        } catch (error) {
            console.error("Erro ao adicionar a venda:", error);
        }
    });

    window.toggleInstallmentPaid = async (saleId, installmentIndex) => {
        const saleRef = doc(db, "sales", saleId);
        const saleDoc = await getDocs(query(salesCollection));
        const saleData = saleDoc.docs.find(doc => doc.id === saleId).data();
        const installments = saleData.installments;
        installments[installmentIndex] = !installments[installmentIndex];

        try {
            await updateDoc(saleRef, { installments });
        } catch (error) {
            console.error("Erro ao atualizar a parcela:", error);
        }
    };

    // Função para formatar números como moeda BRL
const formatCurrencyBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const renderSales = (sales) => {
    tablesContainer.innerHTML = "";
    let totalSales = 0;
    let totalSold = 0;

    // Agrupa vendas por produto
    const productGroups = sales.reduce((acc, sale) => {
        if (!acc[sale.productName]) {
            acc[sale.productName] = [];
        }
        acc[sale.productName].push(sale);
        return acc;
    }, {});

    for (const [productName, salesList] of Object.entries(productGroups)) {
        const tableDiv = document.createElement("div");
        tableDiv.className = "product-table";

        const tableTitle = document.createElement("h2");
        tableTitle.className = "table-title";
        tableTitle.textContent = productName;
        tableDiv.appendChild(tableTitle);

        const table = document.createElement("table");
        table.className = "salesTable";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Cartão</th>
                    <th>Comprador</th>
                    <th>Loja</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço</th>
                    <th>Total</th>
                    <th>Parcela</th>
                    <th>Valor da Parcela</th>
                    <th>Valor com Lucro</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="7"><strong><center>Totais:</center></strong></td>
                    <td id="totalAmount"></td>
                    <td id="totalPaid"></td>
                    <td id="totalUnpaid"></td>
                    <td id="totalWithProfit"></td>
                    <td></td>
                </tr>
            </tfoot>
        `;
        const tbody = table.querySelector("tbody");
        const tfoot = table.querySelector("tfoot");

        let productTotal = 0;
        let productPaid = 0;
        let productUnpaid = 0;

        salesList.forEach((sale, saleIndex) => {
            const totalInstallments = sale.numInstallments;
            sale.installments.forEach((isPaid, installmentIndex) => {
                const tr = document.createElement("tr");
                tr.className = isPaid ? 'paid' : '';
                tr.innerHTML = `
                    <td>${sale.saleDate}</td>
                    <td>${sale.cartaoName}</td>
                    <td>${sale.compradorName}</td>
                    <td>${sale.storeName}</td>
                    <td>${sale.productName}</td>
                    <td>${sale.quantity}</td>
                    <td>${formatCurrencyBRL(sale.price)}</td>
                    <td>${formatCurrencyBRL(sale.total)}</td>
                    <td>${installmentIndex + 1}/${totalInstallments}</td>
                    <td>${formatCurrencyBRL(sale.installmentAmount)}</td>
                    <td>${formatCurrencyBRL(sale.installmentAmountWithProfit)}</td>
                    <td><button onclick="toggleInstallmentPaid('${sale.id}', ${installmentIndex})">${isPaid ? 'Pago' : 'Pendente'}</button></td>
                `;
                tbody.appendChild(tr);
                productTotal += sale.installmentAmountWithProfit;
                if (isPaid) {
                    productPaid += sale.installmentAmountWithProfit;
                } else {
                    productUnpaid += sale.installmentAmountWithProfit;
                }
            });
            totalSales += sale.total;
            totalSold += sale.price;
        });

        // Atualiza os totais no rodapé da tabela
        tfoot.querySelector("#totalAmount").textContent = formatCurrencyBRL(productTotal);
        tfoot.querySelector("#totalPaid").textContent = formatCurrencyBRL(productPaid);
        tfoot.querySelector("#totalUnpaid").textContent = formatCurrencyBRL(productUnpaid);
        tfoot.querySelector("#totalWithProfit").textContent = formatCurrencyBRL(productTotal);

        tableDiv.appendChild(table);
        tablesContainer.appendChild(tableDiv);
    }

    document.getElementById("totalVendas").textContent = formatCurrencyBRL(totalSales);
    document.getElementById("totalVendido").textContent = formatCurrencyBRL(totalSold);
};


    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginForm.classList.add("hidden");
            registerForm.classList.add("hidden");
            content.classList.remove("hidden");

            onSnapshot(query(salesCollection), (snapshot) => {
                const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderSales(sales);
            });
        } else {
            loginForm.classList.remove("hidden");
            content.classList.add("hidden");
        }
    });