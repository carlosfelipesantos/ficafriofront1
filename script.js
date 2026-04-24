const API_URL = 'https://ficafrio-api.onrender.com/api';

let services = [];
let clientes = [];
let currentScreen = 'home';
let servicePhotoBase64 = null;
let clientPhotoBase64 = null;


// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadServices();
    loadClientes();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 60000);


    //  Corrige scroll travado em todos os modais
document.addEventListener('hidden.bs.modal', function() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
});

});



// ==================== NAVEGAÇÃO ====================
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const screen = item.dataset.screen;
            changeScreen(screen);
        });
    });
}

function changeScreen(screen) {
    currentScreen = screen;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screen === 'home') {
        document.getElementById('homeScreen').classList.add('active');
        loadHomeData();
    } else if (screen === 'services') {
        document.getElementById('servicesScreen').classList.add('active');
        displayAllServices(services);
    } else if (screen === 'new') {
        document.getElementById('newServiceScreen').classList.add('active');
        limparFormularioServico();
    } else if (screen === 'clientes') {
        document.getElementById('clientesScreen').classList.add('active');
        loadClientes();
    } else if (screen === 'financial') {
        document.getElementById('financialScreen').classList.add('active');
        loadFinancialReport('daily');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.screen === screen) item.classList.add('active');
    });
}

function abrirNovoServico() { changeScreen('new'); }
function voltarInicio() { changeScreen('home'); }
function verTodosServicos() { changeScreen('services'); }

// ==================== DATA E HORA ====================
function updateDateTime() {
    const now = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dataFormatada = `${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
    document.getElementById('currentDate').innerHTML = `<i class="far fa-calendar-alt"></i> ${dataFormatada}`;
}

// ==================== EVENT LISTENERS ====================
// ==================== FUNÇÃO DEBOUNCE (FORA DO SETUPEVENTLISTENERS) ====================
// ==================== FUNÇÃO DEBOUNCE ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const form = document.getElementById('serviceForm');
    if (form) form.addEventListener('submit', saveService);
    
    const warrantyCheck = document.getElementById('hasWarranty');
    if (warrantyCheck) warrantyCheck.addEventListener('change', toggleWarranty);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filterServices);
    
    const searchClienteInput = document.getElementById('searchClienteInput');
    if (searchClienteInput) searchClienteInput.addEventListener('input', filtrarClientes);
    
    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) clienteForm.addEventListener('submit', salvarCliente);
    
    const phoneField = document.getElementById('phone');
    if (phoneField) phoneField.addEventListener('blur', buscarClientePorTelefone);
    
    const selectCliente = document.getElementById('selectCliente');
    if (selectCliente) {
        selectCliente.addEventListener('change', function() {
            const clienteFields = document.getElementById('clienteFields');
            if (!clienteFields) return;
            if (this.value) {
                clienteFields.style.display = 'none';
                const cliente = clientes.find(c => c.id == this.value);
                if (cliente) {
                    document.getElementById('clientName').value = cliente.nome;
                    document.getElementById('phone').value = cliente.telefone;
                    document.getElementById('address').value = cliente.endereco;
                }
            } else {
                clienteFields.style.display = 'block';
                document.getElementById('clientName').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('address').value = '';
            }
        });
    }

    //  Botões de período com debounce (apenas uma vez)
    //  Botões de período - sem debounce (mais rápido)
// Dentro de setupEventListeners, após os botões de período, adicione:

// Mostrar/esconder seletores conforme o período
// Dentro de setupEventListeners, configure os botões de período
const periodBtns = document.querySelectorAll('.period-btn-modern');

periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const period = btn.dataset.period;

        document.querySelectorAll('.period-btn-modern').forEach(b => {
            b.classList.remove('active');
        });

        btn.classList.add('active');

        loadFinancialReport(period);
    });
});
    
  
}

// ==================== BUSCAR CLIENTE POR TELEFONE ====================
async function buscarClientePorTelefone() {
    const telefone = document.getElementById('phone').value;
    if (telefone.length < 10) return;
    try {
        const response = await fetch(`${API_URL}/Clientes/search/${telefone}`);
        const clientesEncontrados = await response.json();
        if (clientesEncontrados.length > 0) {
            const cliente = clientesEncontrados[0];
            // ALERT removido: não pergunta mais, apenas carrega os dados
            console.log(`Cliente ${cliente.nome} encontrado. Dados carregados.`);
            document.getElementById('clientName').value = cliente.nome;
            document.getElementById('address').value = cliente.endereco;
        }
    } catch (error) {
        console.error('Erro na busca do cliente:', error);
    }
}

// ==================== SERVIÇOS ====================
async function loadServices() {
   
    try {
        const response = await fetch(`${API_URL}/Services`);
        services = await response.json();
          console.log('Serviços carregados com gastos:', services.map(s => ({ id: s.id, gastos: s.gastos })));
        displayAllServices(services);
        updateRecentServices();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        services = [];
        updateRecentServices();
        updateStats();
    }
   
}

function updateStats() {
    const totalServicos = services.length;
    const totalClientesUnicos = new Set(services.map(s => s.telefoneCliente)).size;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    // Filtrar serviços do mês atual
    const monthServices = services.filter(s => {
        const serviceDate = new Date(s.dataServico);
        return serviceDate >= startOfMonth && serviceDate <= endOfMonth;
    });
    
    // Calcular faturamento do mês (apenas serviços concluídos)
    const monthRevenue = monthServices
        .filter(s => s.status === 'Completo')
        .reduce((sum, s) => sum + s.valor, 0);
    
    //  Calcular gastos do mês usando os gastos carregados nos serviços
    let monthExpenses = 0;
    for (const service of monthServices) {
        if (service.gastos && service.gastos.length > 0) {
            monthExpenses += service.gastos.reduce((sum, g) => sum + g.valor, 0);
        }
    }
    
    // Calcular lucro real (faturamento - gastos)
    const monthProfit = monthRevenue - monthExpenses;
    
    // Atualizar os cards da tela inicial
    const weekRevenueEl = document.getElementById('weekRevenue');
    if (weekRevenueEl) weekRevenueEl.innerHTML = formatCurrency(monthProfit);
    
    const weekExpensesEl = document.getElementById('weekExpenses');
    if (weekExpensesEl) weekExpensesEl.innerHTML = monthServices.length;
    
    const weekProfitEl = document.getElementById('weekProfit');
    if (weekProfitEl) weekProfitEl.innerHTML = totalClientesUnicos;
}

async function loadHomeData() {
    await loadServices();
}

function updateRecentServices() {
    const container = document.getElementById('recentServicesList');
    if (!services.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-tools" style="font-size:64px;margin-bottom:20px;color:#ddd;"></i>
            <h4>Nenhum serviço cadastrado ainda</h4>
            <p>Clique no botão "Novo Serviço" para começar</p>
        </div>`;
        return;
    }
    
    const recent = [...services].sort((a, b) => new Date(b.dataServico) - new Date(a.dataServico)).slice(0, 5);
    container.innerHTML = recent.map(service => {
        // Calcular gastos e lucro
        const totalGastos = service.gastos && service.gastos.length > 0 
            ? service.gastos.reduce((sum, g) => sum + g.valor, 0) 
            : 0;
        const lucro = service.valor - totalGastos;
        
        return `
            <div class="service-item" onclick="showServiceDetails(${service.id})">
                <div class="service-info">
                    <h4>${service.nomeCliente} ${service.fotoServico ? '📷' : ''}</h4>
                    <p>${service.descricaoServico.substring(0, 40)}${service.descricaoServico.length > 40 ? '...' : ''}</p>
                    <small>📅 ${new Date(service.dataServico).toLocaleDateString()}</small>
                </div>
                <div class="service-value">
                    <div class="amount">💰 ${formatCurrency(service.valor)}</div>
                    <div style="font-size: 11px; color: #dc3545;">💸 Gastos: ${formatCurrency(totalGastos)}</div>
                    <div style="font-size: 11px; color: #28a745;">📈 Lucro: ${formatCurrency(lucro)}</div>
                    <div class="status" style="background:${getStatusColor(service.status)};color:white;padding:4px 8px;border-radius:10px;margin-top:5px;">${getStatusText(service.status)}</div>
                </div>
            </div>
        `;
    }).join('');
}
function displayAllServices(servicesArray) {
    const container = document.getElementById('allServicesList');
    if (!servicesArray.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-tools" style="font-size:64px;margin-bottom:20px;"></i>
            <h4>Nenhum serviço cadastrado</h4>
            <p>Clique em "Novo" para adicionar</p>
        </div>`;
        return;
    }
    
    container.innerHTML = servicesArray.map(service => `
        <div class="service-item" onclick="showServiceDetails(${service.id})">
            <div class="service-info">
                <h4>${service.nomeCliente} ${service.fotoServico ? '📷' : ''}</h4>
                <p>📞 ${service.telefoneCliente}</p>
                <p>📅 ${new Date(service.dataServico).toLocaleDateString()}</p>
            </div>
            <div class="service-value">
                <div class="amount">${formatCurrency(service.valor)}</div>
                <div class="status" style="background:${getStatusColor(service.status)};color:white;padding:4px 8px;border-radius:10px;margin-top:5px;">${getStatusText(service.status)}</div>
            </div>
        </div>
    `).join('');
}

function filterServices() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = services.filter(s => s.nomeCliente.toLowerCase().includes(term));
    displayAllServices(filtered);
}

function limparFormularioServico() {
    document.getElementById('serviceForm')?.reset();
    // Limpar os gastos dinâmicos
    const expenseContainer = document.getElementById('expenseContainer');
    if (expenseContainer) expenseContainer.innerHTML = '';
    document.getElementById('hasExpense').checked = false;
    document.getElementById('expenseContainer').style.display = 'none';
    document.getElementById('addExpenseBtn').style.display = 'none';
    // Reset garantia
    document.getElementById('hasWarranty').checked = false;
    document.getElementById('warrantyEnd').style.display = 'none';
     initStatusButtons();
   
     const clienteFields = document.getElementById('clienteFields');
    if (clienteFields) clienteFields.style.display = 'block';
    const selectCliente = document.getElementById('selectCliente');
    if (selectCliente) selectCliente.value = '';
   
}

async function saveService(event) {
    event.preventDefault();

    // Coletar gastos dos campos dinâmicos
    const gastos = [];
    const expenseItems = document.querySelectorAll('#expenseContainer .expense-item');
    expenseItems.forEach(item => {
        const desc = item.querySelector('input[type="text"]').value;
        const valor = parseFloat(item.querySelector('input[type="number"]').value);
        if (desc && !isNaN(valor) && valor > 0) {
            gastos.push({ descricao: desc, valor: valor });
        }
    });

    // Dados do serviço (vindos do formulário)
    const nomeCliente = document.getElementById('clientName').value;
    const telefoneCliente = document.getElementById('phone').value;
    const endereco = document.getElementById('address').value;
    const descricao = document.getElementById('problemDesc').value;
    const valor = parseFloat(document.getElementById('amount').value);
    const dataServico = document.getElementById('serviceDate').value;
    const status = document.getElementById('status').value;
    const temGarantia = document.getElementById('hasWarranty').checked;
    const fimGarantia = temGarantia ? document.getElementById('warrantyEnd').value : null;

    let clienteId = null;

    console.log('Enviando foto?', servicePhotoBase64 ? 'SIM' : 'NÃO');
console.log('Tamanho da foto:', servicePhotoBase64?.length || 0);

    // 1. Verificar se foi selecionado um cliente existente
    const selectCliente = document.getElementById('selectCliente');
    if (selectCliente && selectCliente.value) {
        clienteId = parseInt(selectCliente.value);
    } else {
        // 2. Criar novo cliente (sem enviar Id)
        const novoCliente = {
            Nome: nomeCliente,
            Telefone: telefoneCliente,
            Endereco: endereco
        };
        try {
            const resCliente = await fetch(`${API_URL}/Clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoCliente)
            });
            if (!resCliente.ok) throw new Error('Erro ao criar cliente');
            const clienteCriado = await resCliente.json();
            clienteId = clienteCriado.id;
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            return;
        }
    }

    // 3. Montar objeto do serviço (NÃO envia objeto Cliente aninhado)
    const service = {
        NomeCliente: nomeCliente,
        TelefoneCliente: telefoneCliente,
        Endereco: endereco,
        DescricaoServico: descricao,
        Valor: valor,
        DataServico: dataServico,
        Status: status,
        TemGarantia: temGarantia,
        FimGarantia: fimGarantia,
        ClienteId: clienteId,
        FotoServico: servicePhotoBase64 

    };

    const btnSubmit = event.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btnSubmit.disabled = true;

    try {
        const response = await fetch(`${API_URL}/Services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro do servidor:', errorText);
            throw new Error('Erro ao salvar serviço');
        }
        const savedService = await response.json();


// Salvar gastos
if (gastos.length > 0) {
    for (const gasto of gastos) {
        const gastoData = {
            ServiceId: savedService.id,
            TipoDeGasto: gasto.descricao,
            Descricacao: gasto.descricao,
            Valor: gasto.valor,
            DataGasto: new Date().toISOString()
        };
        console.log('Enviando gasto:', gastoData);
        
        const gastoResponse = await fetch(`${API_URL}/Gastos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gastoData)
        });
        
        if (!gastoResponse.ok) {
            const errorText = await gastoResponse.text();
            console.error('Erro ao salvar gasto:', errorText);
        } else {
            console.log('✅ Gasto salvo com sucesso!');
        }
    }
}
        console.log('✅ Serviço e gastos salvos com sucesso!');
        document.getElementById('serviceForm').reset();
        limparFormularioServico();
        await loadServices();
        await loadClientes();
        changeScreen('home');
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}

// Exibir detalhes do serviço
async function showServiceDetails(id) {
    console.log('Abrindo detalhes do serviço ID:', id);  //  Verificar se o ID vem correto
    
    try {
        const [serviceRes, gastosRes] = await Promise.all([
            fetch(`${API_URL}/Services/${id}`),
            fetch(`${API_URL}/Gastos/service/${id}`)
        ]);
        const service = await serviceRes.json();
        const gastosLista = await gastosRes.json();
        
        console.log('Serviço carregado, ID:', service.id);  //  Verificar ID do serviço
        
        const totalGastos = gastosLista.reduce((sum, g) => sum + g.valor, 0);
        const lucroReal = service.valor - totalGastos;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h6>📋 Informações do Cliente</h6>
            <p><strong>Nome:</strong> ${service.nomeCliente}<br>
            <strong>Telefone:</strong> ${service.telefoneCliente}<br>
            <strong>Endereço:</strong> ${service.endereco}</p>
            
            <h6>🔧 Detalhes do Serviço</h6>
            <p><strong>Problema:</strong> ${service.descricaoServico}<br>
            <strong>Valor:</strong> ${formatCurrency(service.valor)}<br>
            <strong>Data:</strong> ${new Date(service.dataServico).toLocaleDateString()}<br>
            <strong>Status:</strong> ${getStatusText(service.status)}</p>
            
            ${service.fotoServico ? `
            <h6>📸 Foto do Serviço</h6>
            <img src="${service.fotoServico}" style="width: 100%; border-radius: 10px; margin-bottom: 10px;">
            ` : ''}

            <h6>💰 Gastos do Serviço</h6>
            ${gastosLista.length ? gastosLista.map(g => `
                <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;">
                    <span>${g.descricacao}</span>
                    <span style="color:#dc3545;">${formatCurrency(g.valor)}</span>
                </div>
            `).join('') : '<p>Nenhum gasto registrado</p>'}
            <div style="margin-top:10px;padding-top:10px;border-top:2px solid #ddd;font-weight:bold;">
                <div style="display:flex;justify-content:space-between;">
                    <span>Total de gastos:</span>
                    <span style="color:#dc3545;">${formatCurrency(totalGastos)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:5px;">
                    <span>💰 Lucro real:</span>
                    <span style="color:${lucroReal >= 0 ? '#28a745' : '#dc3545'};">${formatCurrency(lucroReal)}</span>
                </div>
            </div>
            
            ${service.temGarantia ? `
            <h6>🛡️ Garantia</h6>
            <p><strong>Início:</strong> ${new Date(service.dataServico).toLocaleDateString()}<br>
            <strong>Fim:</strong> ${service.fimGarantia ? new Date(service.fimGarantia).toLocaleDateString() : '-'}<br>
            <strong>Status:</strong> ${isInWarranty(service) ? '✅ Dentro da garantia' : '⚠️ Garantia expirada'}</p>
            ` : '<p>❌ Sem garantia</p>'}
            
            <hr>
            <div class="d-grid gap-2">
                <button class="btn btn-danger" onclick="deletarServico(${service.id})">🗑️ Excluir Serviço</button>
            </div>
        `;
        
        const modalElement = document.getElementById('serviceModal');
        const modal = new bootstrap.Modal(modalElement);
        
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        document.body.classList.remove('modal-open');
        
        modal.show();
        
        modalElement.addEventListener('hidden.bs.modal', function() {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
        }, { once: true });  //  Adiciona { once: true } para executar apenas uma vez
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
    }
}

async function deletarServico(id) {
    console.log('Tentando excluir serviço ID:', id);  //  Verificar o ID recebido
    
    if (!id || id === 'undefined') {
        console.error('ID inválido para exclusão');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/Services/${id}`, { method: 'DELETE' });
        if (response.ok) {
            console.log('✅ Serviço excluído com sucesso!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
            if (modal) modal.hide();
            
            // Força restauração do scroll
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            
            await loadServices();
            await loadClientes();
            if (currentScreen === 'services') displayAllServices(services);
        } else {
            console.error('❌ Erro ao excluir serviço, status:', response.status);
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
    }
}
// ==================== CLIENTES ====================
async function loadClientes() {
    try {
        const response = await fetch(`${API_URL}/Clientes`);
        clientes = await response.json();
        displayClientes(clientes);
        popularSelectClientes(); // já deve existir
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        clientes = [];
    }
}

function displayClientes(clientesList) {
    const container = document.getElementById('clientesList');
    if (!clientesList.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-users" style="font-size:64px;margin-bottom:20px;color:#ddd;"></i>
            <h4>Nenhum cliente cadastrado</h4>
            <p>Clique em "Novo Cliente" para adicionar</p>
        </div>`;
        return;
    }
    container.innerHTML = clientesList.map(cli => `
        <div class="cliente-card" onclick="verDetalhesCliente(${cli.id})">
            <h4>${cli.nome}</h4>
            <div class="cliente-info"><i class="fas fa-phone"></i> ${cli.telefone}</div>
            <div class="cliente-info"><i class="fas fa-map-marker-alt"></i> ${cli.endereco}</div>
            <div class="servicos-count"><i class="fas fa-tools"></i> ${cli.servicos?.length || 0} serviços</div>
        </div>
    `).join('');
}

function abrirFormCliente(cliente = null) {
    document.getElementById('clienteId').value = cliente?.id || '';
    document.getElementById('clienteNome').value = cliente?.nome || '';
    document.getElementById('clienteTelefone').value = cliente?.telefone || '';
    document.getElementById('clienteEndereco').value = cliente?.endereco || '';
    document.getElementById('clienteModalTitle').innerText = cliente ? 'Editar Cliente' : 'Novo Cliente';
    new bootstrap.Modal(document.getElementById('clienteModal')).show();
}

async function salvarCliente(event) {
    event.preventDefault();
    const cliente = {
        id: parseInt(document.getElementById('clienteId').value) || 0,
        nome: document.getElementById('clienteNome').value,
        telefone: document.getElementById('clienteTelefone').value,
        endereco: document.getElementById('clienteEndereco').value,
    };
    
    const btn = event.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;
    
    try {
        let response;
        if (cliente.id === 0) {
            response = await fetch(`${API_URL}/Clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
        } else {
            response = await fetch(`${API_URL}/Clientes/${cliente.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
        }
        if (response.ok || response.status === 204) {
            console.log('✅ Cliente salvo com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
            await loadClientes();
        } else {
            console.error('❌ Erro ao salvar cliente');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
    }
}

async function verDetalhesCliente(id) {
    try {
        const response = await fetch(`${API_URL}/Clientes/${id}`);
        const cliente = await response.json();
        const servicosHtml = cliente.servicos?.length ? cliente.servicos.map(s => `
            <div class="servico-item-cliente" onclick="verServicoCliente(${s.id})" style="cursor:pointer;background:#f8f9fa;padding:10px;border-radius:10px;margin-bottom:10px;">
                <strong>📅 ${new Date(s.dataServico).toLocaleDateString()}</strong>
                <p>${s.descricaoServico.substring(0, 80)}</p>
                <div class="d-flex justify-content-between">
                    <span>Valor: ${formatCurrency(s.valor)}</span>
                    <span class="status-badge" style="background:${getStatusColor(s.status)};color:white;padding:2px 8px;border-radius:10px;">${getStatusText(s.status)}</span>
                </div>
            </div>
        `).join('') : '<p>Nenhum serviço realizado para este cliente</p>';
        
        document.getElementById('clienteDetalhesBody').innerHTML = `
            <div class="mb-3">
                <h6>📋 Informações</h6>
                <p><strong>Nome:</strong> ${cliente.nome}<br>
                <strong>Telefone:</strong> ${cliente.telefone}<br>
                <strong>Endereço:</strong> ${cliente.endereco}<br>
                <strong>Cliente desde:</strong> ${new Date(cliente.dataCadastro).toLocaleDateString()}</p>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6>🔧 Serviços Realizados (${cliente.servicos?.length || 0})</h6>
                    <button class="btn btn-sm btn-primary" onclick="novoServicoParaCliente(${cliente.id})">
                        <i class="fas fa-plus"></i> Novo Serviço
                    </button>
                </div>
                ${servicosHtml}
            </div>
            
            <div class="d-grid gap-2">
                <button class="btn btn-warning" onclick="editarCliente(${cliente.id})">
                    <i class="fas fa-edit"></i> Editar Cliente
                </button>
                <button class="btn btn-danger" onclick="deletarCliente(${cliente.id})">
                    <i class="fas fa-trash"></i> Excluir Cliente
                </button>
            </div>
        `;
        new bootstrap.Modal(document.getElementById('clienteDetalhesModal')).show();
    } catch (error) {
        console.error('Erro ao carregar detalhes do cliente:', error);
    }
}

function novoServicoParaCliente(clienteId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    if (modal) modal.hide();
    fetch(`${API_URL}/Clientes/${clienteId}`)
        .then(res => res.json())
        .then(cliente => {
            document.getElementById('clientName').value = cliente.nome;
            document.getElementById('phone').value = cliente.telefone;
            document.getElementById('address').value = cliente.endereco;
            changeScreen('new');
        });
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
        if (modal) modal.hide();
        abrirFormCliente(cliente);
    }
}

async function deletarCliente(id) {
    // Confirm removido
    try {
        const response = await fetch(`${API_URL}/Clientes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            console.log('✅ Cliente excluído com sucesso!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
            if (modal) modal.hide();
            await loadClientes();
        } else {
            console.error('❌ Não é possível excluir cliente que possui serviços');
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
    }
}

function verServicoCliente(servicoId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    if (modal) modal.hide();
    showServiceDetails(servicoId);
}

function filtrarClientes() {
    const term = document.getElementById('searchClienteInput').value.toLowerCase();
    //  Remove caracteres não numéricos para comparar telefone
    const termNumerico = term.replace(/\D/g, '');
    
    const filtered = clientes.filter(c => {
        const telefoneNumerico = c.telefone.replace(/\D/g, '');
        return c.nome.toLowerCase().includes(term) || 
               c.telefone.toLowerCase().includes(term) ||
               telefoneNumerico.includes(termNumerico);
    });
    displayClientes(filtered);
}

// ==================== FINANCEIRO ====================
const financialCache = {};

async function loadFinancialReport(period) {
    if (loadFinancialReport.loading) return;
    loadFinancialReport.loading = true;
    
    try {
        const revenueEl = document.getElementById('financeRevenue');
        const expensesEl = document.getElementById('financeExpenses');
        const profitEl = document.getElementById('financeProfit');
        
        if (revenueEl) revenueEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (expensesEl) expensesEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (profitEl) profitEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Buscar os dados financeiros da API
        const response = await fetch(`${API_URL}/Services/financial/${period}`);
        const data = await response.json();
    
        //  Buscar todos os serviços para calcular gastos corretamente
        const servicesResponse = await fetch(`${API_URL}/Services`);
        const allServices = await servicesResponse.json();
        
        // Calcular gastos totais do período
        let totalGastos = 0;
        let totalFaturamento = 0;
        let totalServicos = 0;
        let totalConcluidos = 0;
        
        const hoje = new Date();
        let startDate, endDate;
        
        switch(period) {
            case 'daily':
                startDate = new Date(hoje.setHours(0,0,0,0));
                endDate = new Date(hoje.setHours(23,59,59,999));
                break;
            case 'weekly':
                startDate = new Date(hoje);
                startDate.setDate(hoje.getDate() - hoje.getDay() + 1);
                startDate.setHours(0,0,0,0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23,59,59,999);
                break;
            case 'monthly':
                startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                endDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                endDate.setHours(23,59,59,999);
                break;
            case 'yearly':
                startDate = new Date(hoje.getFullYear(), 0, 1);
                endDate = new Date(hoje.getFullYear(), 11, 31);
                endDate.setHours(23,59,59,999);
                break;
            default:
                startDate = new Date(hoje.setHours(0,0,0,0));
                endDate = new Date(hoje.setHours(23,59,59,999));
        }
        
        // Filtrar serviços do período
        const servicosDoPeriodo = allServices.filter(s => {
            const dataServico = new Date(s.dataServico);
            return dataServico >= startDate && dataServico <= endDate;
        });
        
        // Calcular totais
        servicosDoPeriodo.forEach(servico => {
            totalServicos++;
            if (servico.status === 'Completo') {
                totalConcluidos++;
                totalFaturamento += servico.valor;
                // Somar gastos do serviço
                if (servico.gastos && servico.gastos.length > 0) {
                    totalGastos += servico.gastos.reduce((sum, g) => sum + g.valor, 0);
                }
            }
        });
        
        const lucroReal = totalFaturamento - totalGastos;
        
        // Atualizar os cards
        if (revenueEl) revenueEl.innerHTML = formatCurrency(totalFaturamento);
        if (expensesEl) expensesEl.innerHTML = formatCurrency(totalGastos);
        if (profitEl) profitEl.innerHTML = formatCurrency(lucroReal);
        
        // Atualizar detalhes
        const detailsContainer = document.getElementById('financialDetails');
        if (detailsContainer) {
            const pendingServices = totalServicos - totalConcluidos;
            detailsContainer.innerHTML = `
                <div class="detail-item"><span>📊 Total de Serviços</span><span>${totalServicos}</span></div>
                <div class="detail-item"><span>✅ Serviços Concluídos</span><span class="completed">${totalConcluidos}</span></div>
                <div class="detail-item"><span>⏳ Serviços Pendentes</span><span class="pending">${pendingServices}</span></div>
                <div class="detail-item"><span>📅 Período</span><span>${getPeriodText(period)}</span></div>
            `;
            if (period === 'daily') {
                detailsContainer.innerHTML += `<div class="detail-item"><span>📆 Data</span><span>${new Date().toLocaleDateString()}</span></div>`;
            }
        }
        
        // Marcar botão ativo
        document.querySelectorAll('.period-btn-modern').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            }
        });
        
        // Carregar lista de serviços do período
        await carregarServicosDoPeriodo(period);
        
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        const revenueEl = document.getElementById('financeRevenue');
        const expensesEl = document.getElementById('financeExpenses');
        const profitEl = document.getElementById('financeProfit');
        if (revenueEl) revenueEl.innerHTML = formatCurrency(0);
        if (expensesEl) expensesEl.innerHTML = formatCurrency(0);
        if (profitEl) profitEl.innerHTML = formatCurrency(0);
        
        const detailsContainer = document.getElementById('financialDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar dados financeiros</div>';
        }
    } finally {
        loadFinancialReport.loading = false;
    }
}

//  Nova função: Carregar serviços do período selecionado
async function carregarServicosDoPeriodo(period) {
    try {
        const hoje = new Date();
        let startDate, endDate;
        
        switch(period) {
            case 'daily':
                startDate = new Date(hoje.setHours(0,0,0,0));
                endDate = new Date(hoje.setHours(23,59,59,999));
                break;
            case 'weekly':
                startDate = new Date(hoje);
                startDate.setDate(hoje.getDate() - hoje.getDay() + 1);
                startDate.setHours(0,0,0,0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23,59,59,999);
                break;
            case 'monthly':
                startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                endDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                endDate.setHours(23,59,59,999);
                break;
            case 'yearly':
                startDate = new Date(hoje.getFullYear(), 0, 1);
                endDate = new Date(hoje.getFullYear(), 11, 31);
                endDate.setHours(23,59,59,999);
                break;
            default:
                startDate = new Date(hoje.setHours(0,0,0,0));
                endDate = new Date(hoje.setHours(23,59,59,999));
        }
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const response = await fetch(`${API_URL}/Services/period?start=${startStr}&end=${endStr}`);
        const servicosDoPeriodo = await response.json();
        
        exibirListaServicosFaturamento(servicosDoPeriodo, period);
        
    } catch (error) {
        console.error('Erro ao carregar serviços do período:', error);
    }
}

//  Nova função: Exibir lista de serviços que compõem o faturamento
function exibirListaServicosFaturamento(servicos, period) {
    const container = document.getElementById('listaFaturamentoContainer');
    if (!container) return;
    
    const tituloPeriodo = getPeriodText(period);
    const servicosConcluidos = servicos.filter(s => s.status === 'Completo');
    const totalFaturamento = servicosConcluidos.reduce((sum, s) => sum + s.valor, 0);
    const totalGastos = servicosConcluidos.reduce((sum, s) => {
        const gastosServico = s.gastos?.reduce((gSum, g) => gSum + g.valor, 0) || 0;
        return sum + gastosServico;
    }, 0);
    const totalLucro = totalFaturamento - totalGastos;
    
    if (servicosConcluidos.length === 0) {
        container.innerHTML = `
            <div class="lista-faturamento">
                <div class="lista-header">
                    <h4>📋 Serviços que compõem o faturamento (${tituloPeriodo})</h4>
                    <span class="total-periodo">Total: ${formatCurrency(totalFaturamento)}</span>
                </div>
                <div class="lista-vazia">
                    <i class="fas fa-chart-line"></i>
                    <p>Nenhum serviço concluído neste período</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="lista-faturamento">
            <div class="lista-header">
                <h4>📋 Serviços que compõem o faturamento (${tituloPeriodo})</h4>
                <div class="totais-periodo">
                    <span class="total-faturamento">💰 Faturamento: ${formatCurrency(totalFaturamento)}</span>
                    <span class="total-gastos">💸 Gastos: ${formatCurrency(totalGastos)}</span>
                    <span class="total-lucro">📈 Lucro: ${formatCurrency(totalLucro)}</span>
                </div>
            </div>
            <div class="lista-itens">
    `;
    
    servicosConcluidos.forEach(servico => {
        const totalGastosServico = servico.gastos?.reduce((sum, g) => sum + g.valor, 0) || 0;
        const lucroServico = servico.valor - totalGastosServico;
        
        html += `
            <div class="item-faturamento" onclick="showServiceDetails(${servico.id})">
                <div class="item-info">
                    <div class="item-cliente">${servico.nomeCliente}</div>
                    <div class="item-descricao">${servico.descricaoServico.substring(0, 50)}${servico.descricaoServico.length > 50 ? '...' : ''}</div>
                    <div class="item-data">📅 ${new Date(servico.dataServico).toLocaleDateString()}</div>
                </div>
                <div class="item-valores">
                    <div class="item-valor">💰 ${formatCurrency(servico.valor)}</div>
                    <div class="item-gastos">💸 Gastos: ${formatCurrency(totalGastosServico)}</div>
                    <div class="item-lucro">📈 Lucro: ${formatCurrency(lucroServico)}</div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}



function getInicioPeriodo(period, date) {
    switch(period) {
        case 'daily':
            return new Date(date.setHours(0,0,0,0));
        case 'weekly':
            const start = new Date(date);
            start.setDate(date.getDate() - date.getDay() + 1);
            start.setHours(0,0,0,0);
            return start;
        case 'monthly':
            return new Date(date.getFullYear(), date.getMonth(), 1);
        case 'yearly':
            return new Date(date.getFullYear(), 0, 1);
        default:
            return new Date(date.setHours(0,0,0,0));
    }
}

function getFimPeriodo(period, date) {
    switch(period) {
        case 'daily':
            return new Date(date.setHours(23,59,59,999));
        case 'weekly':
            const end = new Date(date);
            end.setDate(date.getDate() - date.getDay() + 7);
            end.setHours(23,59,59,999);
            return end;
        case 'monthly':
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        case 'yearly':
            return new Date(date.getFullYear(), 11, 31);
        default:
            return new Date(date.setHours(23,59,59,999));
    }
}

function updateFinancialUI(data, period) {
    const revenueEl = document.getElementById('financeRevenue');
    const expensesEl = document.getElementById('financeExpenses');
    const profitEl = document.getElementById('financeProfit');
    
    if (revenueEl) revenueEl.innerHTML = formatCurrency(data.revenue);
    if (expensesEl) expensesEl.innerHTML = formatCurrency(data.expenses);
    if (profitEl) profitEl.innerHTML = formatCurrency(data.profit);
    
    const detailsContainer = document.getElementById('financialDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="detail-item"><span>📊 Total de Serviços</span><span>${data.totalServices || 0}</span></div>
            <div class="detail-item"><span>✅ Serviços Concluídos</span><span class="completed">${data.completedServices || 0}</span></div>
            <div class="detail-item"><span>⏳ Serviços Pendentes</span><span class="pending">${(data.totalServices || 0) - (data.completedServices || 0)}</span></div>
            <div class="detail-item"><span>📅 Período</span><span>${getPeriodText(period)}</span></div>
        `;
        if (period === 'daily') {
            detailsContainer.innerHTML += `<div class="detail-item"><span>📆 Data</span><span>${new Date().toLocaleDateString()}</span></div>`;
        }
    }
    
    document.querySelectorAll('.period-btn-modern').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
}




// ==================== UTILITÁRIOS ====================
function isInWarranty(service) {
    if (!service.temGarantia || !service.fimGarantia) return false;
    return new Date() <= new Date(service.fimGarantia);
}

function getStatusText(status) {
    const map = { 'Pendente': '⏳ Pendente', 'EmProgresso': '⚙️ Em Andamento', 'Completo': '✅ Concluído' };
    return map[status] || status;
}

function getStatusColor(status) {
    const map = { 'Pendente': '#ffc107', 'EmProgresso': '#17a2b8', 'Completo': '#28a745' };
    return map[status] || '#666';
}

function getPeriodText(period) {
    const map = { 'daily': 'Hoje', 'weekly': 'Esta Semana', 'monthly': 'Este Mês', 'yearly': 'Este Ano' };
    return map[period] || period;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

// Função para definir o status
function setStatus(statusValue) {
    document.getElementById('status').value = statusValue;
    const btnPendente = document.getElementById('statusPendente');
    const btnConcluido = document.getElementById('statusConcluido');
    if (statusValue === 'Pendente') {
        btnPendente.classList.add('active');
        btnConcluido.classList.remove('active');
    } else {
        btnConcluido.classList.add('active');
        btnPendente.classList.remove('active');
    }
}

function initStatusButtons() {
    const statusAtual = document.getElementById('status').value;
    setStatus(statusAtual);
}

// Garantia
function toggleWarranty() {
    const checkbox = document.getElementById("hasWarranty");
    const dateField = document.getElementById("warrantyEnd");
    dateField.style.display = checkbox.checked ? "block" : "none";
}

// Gastos do serviço
function toggleExpense() {
    const checkbox = document.getElementById("hasExpense");
    const container = document.getElementById("expenseContainer");
    const btn = document.getElementById("addExpenseBtn");
    if (checkbox.checked) {
        container.style.display = "block";
        btn.style.display = "block";
        if (container.innerHTML === "") addExpense();
    } else {
        container.style.display = "none";
        btn.style.display = "none";
        container.innerHTML = "";
    }
}

function addExpense() {
    const container = document.getElementById("expenseContainer");
    const div = document.createElement("div");
    div.classList.add("expense-item");
    div.innerHTML = `
        <input type="text" placeholder="Peças, Gasolina, etc">
        <input type="number" placeholder="R$">
        <button type="button" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
}



// Popular select de clientes
function popularSelectClientes() {
    const select = document.getElementById('selectCliente');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Selecione um cliente --</option>';
    clientes.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.id}">${cliente.nome} - ${cliente.telefone}</option>`;
    });
}

// Carregar dados do cliente selecionado
function carregarClienteSelecionado() {
    const select = document.getElementById('selectCliente');
    const clienteId = parseInt(select.value);
    
    if (!clienteId) {
        console.warn('Selecione um cliente primeiro');
        return;
    }
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
        document.getElementById('clientName').value = cliente.nome;
        document.getElementById('phone').value = cliente.telefone;
        document.getElementById('address').value = cliente.endereco;
    }
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            servicePhotoBase64 = e.target.result;
            console.log('Foto capturada, tamanho:', servicePhotoBase64.length);
            const preview = document.getElementById('photoPreview');
            const img = document.getElementById('photoPreviewImg');
            if (img) img.src = servicePhotoBase64;
            if (preview) preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        console.log('Nenhum arquivo selecionado');
    }
}

function removerFoto() {
    const preview = document.getElementById('photoPreview');
    const photoInput = document.getElementById('servicePhoto');
    if (preview) preview.style.display = 'none';
    if (photoInput) photoInput.value = '';
}


// ==================== NAVEGAÇÃO DOS CARDS ====================
function irParaFinanceiro() {
    changeScreen('financial');
    // Opcional: recarregar o relatório do período atual
    const activePeriod = document.querySelector('.period-btn-modern.active')?.dataset.period || 'monthly';
    loadFinancialReport(activePeriod);
}

function irParaServicos() {
    changeScreen('services');
}

function irParaClientes() {
    changeScreen('clientes');
}


// ==================== SELETOR DE MÊS/ANO ====================
let mesSelecionado = new Date().getMonth();
let anoSelecionado = new Date().getFullYear();

function popularAnos() {
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - 5;
    const anoFim = anoAtual + 1;
    
    const yearSelect = document.getElementById('yearSelect');
    const yearOnlySelect = document.getElementById('yearOnlySelect');
    
    if (yearSelect) {
        yearSelect.innerHTML = '';
        for (let i = anoInicio; i <= anoFim; i++) {
            yearSelect.innerHTML += `<option value="${i}" ${i === anoAtual ? 'selected' : ''}>${i}</option>`;
        }
    }
    
    if (yearOnlySelect) {
        yearOnlySelect.innerHTML = '';
        for (let i = anoInicio; i <= anoFim; i++) {
            yearOnlySelect.innerHTML += `<option value="${i}" ${i === anoAtual ? 'selected' : ''}>${i}</option>`;
        }
    }
}

function aplicarFiltroMes() {
    const mes = parseInt(document.getElementById('monthSelect').value);
    const ano = parseInt(document.getElementById('yearSelect').value);
    
    mesSelecionado = mes;
    anoSelecionado = ano;
    
    // Calcular datas do mês selecionado
    const startDate = new Date(ano, mes, 1);
    const endDate = new Date(ano, mes + 1, 0);
    
    carregarRelatorioPorPeriodo(startDate, endDate, `Mês de ${getNomeMes(mes)}/${ano}`);
}

function aplicarFiltroAno() {
    const ano = parseInt(document.getElementById('yearOnlySelect').value);
    anoSelecionado = ano;
    
    const startDate = new Date(ano, 0, 1);
    const endDate = new Date(ano, 11, 31);
    
    carregarRelatorioPorPeriodo(startDate, endDate, `Ano de ${ano}`);
}

function getNomeMes(mes) {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes];
}

async function carregarRelatorioPorPeriodo(startDate, endDate, tituloPeriodo) {
    try {
        // Mostrar loading
        const revenueEl = document.getElementById('financeRevenue');
        const expensesEl = document.getElementById('financeExpenses');
        const profitEl = document.getElementById('financeProfit');
        
        if (revenueEl) revenueEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (expensesEl) expensesEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (profitEl) profitEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Buscar serviços do período
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const response = await fetch(`${API_URL}/Services/period?start=${startStr}&end=${endStr}`);
        const servicos = await response.json();
        
        // Calcular totais
        let totalFaturamento = 0;
        let totalGastos = 0;
        let totalServicos = 0;
        let totalConcluidos = 0;
        
        servicos.forEach(servico => {
            totalServicos++;
            if (servico.status === 'Completo') {
                totalConcluidos++;
                totalFaturamento += servico.valor;
                if (servico.gastos && servico.gastos.length > 0) {
                    totalGastos += servico.gastos.reduce((sum, g) => sum + g.valor, 0);
                }
            }
        });
        
        const lucroReal = totalFaturamento - totalGastos;
        
        // Atualizar cards
        if (revenueEl) revenueEl.innerHTML = formatCurrency(totalFaturamento);
        if (expensesEl) expensesEl.innerHTML = formatCurrency(totalGastos);
        if (profitEl) profitEl.innerHTML = formatCurrency(lucroReal);
        
        // Atualizar detalhes
        const detailsContainer = document.getElementById('financialDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="detail-item"><span>📊 Total de Serviços</span><span>${totalServicos}</span></div>
                <div class="detail-item"><span>✅ Serviços Concluídos</span><span class="completed">${totalConcluidos}</span></div>
                <div class="detail-item"><span>⏳ Serviços Pendentes</span><span class="pending">${totalServicos - totalConcluidos}</span></div>
                <div class="detail-item"><span>📅 Período</span><span>${tituloPeriodo}</span></div>
            `;
        }
        
        // Exibir lista de serviços
        exibirListaServicosFaturamentoPersonalizada(servicos, tituloPeriodo, totalFaturamento, totalGastos, lucroReal);
        
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
    }
}

function exibirListaServicosFaturamentoPersonalizada(servicos, tituloPeriodo, totalFaturamento, totalGastos, totalLucro) {
    const container = document.getElementById('listaFaturamentoContainer');
    if (!container) return;
    
    const servicosConcluidos = servicos.filter(s => s.status === 'Completo');
    
    if (servicosConcluidos.length === 0) {
        container.innerHTML = `
            <div class="lista-faturamento">
                <div class="lista-header">
                    <h4>📋 Serviços que compõem o faturamento (${tituloPeriodo})</h4>
                    <div class="totais-periodo">
                        <span class="total-faturamento">💰 Faturamento: ${formatCurrency(totalFaturamento)}</span>
                        <span class="total-gastos">💸 Gastos: ${formatCurrency(totalGastos)}</span>
                        <span class="total-lucro">📈 Lucro: ${formatCurrency(totalLucro)}</span>
                    </div>
                </div>
                <div class="lista-vazia">
                    <i class="fas fa-chart-line"></i>
                    <p>Nenhum serviço concluído neste período</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="lista-faturamento">
            <div class="lista-header">
                <h4>📋 Serviços que compõem o faturamento (${tituloPeriodo})</h4>
                <div class="totais-periodo">
                    <span class="total-faturamento">💰 Faturamento: ${formatCurrency(totalFaturamento)}</span>
                    <span class="total-gastos">💸 Gastos: ${formatCurrency(totalGastos)}</span>
                    <span class="total-lucro">📈 Lucro: ${formatCurrency(totalLucro)}</span>
                </div>
            </div>
            <div class="lista-itens">
    `;
    
    servicosConcluidos.forEach(servico => {
        const totalGastosServico = servico.gastos?.reduce((sum, g) => sum + g.valor, 0) || 0;
        const lucroServico = servico.valor - totalGastosServico;
        
        html += `
            <div class="item-faturamento" onclick="showServiceDetails(${servico.id})">
                <div class="item-info">
                    <div class="item-cliente">${servico.nomeCliente}</div>
                    <div class="item-descricao">${servico.descricaoServico.substring(0, 50)}${servico.descricaoServico.length > 50 ? '...' : ''}</div>
                    <div class="item-data">📅 ${new Date(servico.dataServico).toLocaleDateString()}</div>
                </div>
                <div class="item-valores">
                    <div class="item-valor">💰 ${formatCurrency(servico.valor)}</div>
                    <div class="item-gastos">💸 Gastos: ${formatCurrency(totalGastosServico)}</div>
                    <div class="item-lucro">📈 Lucro: ${formatCurrency(lucroServico)}</div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}