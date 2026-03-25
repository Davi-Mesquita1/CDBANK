let conta = JSON.parse(sessionStorage.getItem("contaLogada"));

if (!conta) {
  alert("Faça login primeiro");
  window.location.href = "index.html";
}

document.getElementById("nome").textContent = conta.nome;
document.getElementById("email").textContent = conta.email;
atualizarSaldo();

// ─── Confirmação de senha ─────────────────────────────────────────────────────

let _acaoAposSenha = null;

// Abre o modal de senha e salva a ação a executar depois
function pedirSenha(acao) {
  _acaoAposSenha = acao;
  document.getElementById("inputSenhaConfirm").value = "";
  document.getElementById("msgSenhaModal").textContent = "";
  document.getElementById("modalSenha").classList.add("aberto");
  document.getElementById("inputSenhaConfirm").focus();
}

// Fecha o modal sem fazer nada
function cancelarSenha() {
  _acaoAposSenha = null;
  document.getElementById("modalSenha").classList.remove("aberto");
}

// Valida a senha e executa a ação se correta
async function confirmarSenha() {
  const senhaDigitada = document.getElementById("inputSenhaConfirm").value;
  const msg = document.getElementById("msgSenhaModal");

  if (!senhaDigitada) {
    msg.style.color = "red";
    msg.textContent = "Digite sua senha";
    return;
  }

  const contas = await supabaseQuery("contas", "GET");
  const contaAtual = contas.find((c) => c.id === conta.id);

  if (!contaAtual || contaAtual.senha !== senhaDigitada) {
    msg.style.color = "red";
    msg.textContent = "Senha incorreta";
    return;
  }

  // Senha correta: fecha o modal e executa a operação pendente
  document.getElementById("modalSenha").classList.remove("aberto");
  if (_acaoAposSenha) {
    _acaoAposSenha();
    _acaoAposSenha = null;
  }
}

// Confirma com Enter enquanto o modal estiver aberto
document.addEventListener("keydown", (e) => {
  const modalAberto = document.getElementById("modalSenha").classList.contains("aberto");
  if (e.key === "Enter" && modalAberto) confirmarSenha();
});

// ─── Usuários ─────────────────────────────────────────────────────────────────

async function abrirListaUsuarios() {
  document.getElementById("modalUsuarios").style.display = "flex";
  const contas = await supabaseQuery("contas", "GET");
  const lista = document.getElementById("listaUsuarios");

  let html =
    '<table class="tabela-usuarios"><thead><tr><th>Nome</th><th>Saldo</th><th>Limite</th></tr></thead><tbody>';

  for (let i = 0; i < contas.length; i++) {
    html +=
      "<tr><td>" + contas[i].nome +
      "</td><td>R$ " + parseFloat(contas[i].saldo).toFixed(2) +
      "</td><td>R$ " + parseFloat(contas[i].limite || 0).toFixed(2) +
      "</td></tr>";
  }

  lista.innerHTML = html + "</tbody></table>";
}

function fecharListaUsuarios() {
  document.getElementById("modalUsuarios").style.display = "none";
}

// ─── Saldo ────────────────────────────────────────────────────────────────────

async function atualizarSaldo() {
  try {
    const contas = await supabaseQuery("contas", "GET");

    for (let i = 0; i < contas.length; i++) {
      if (contas[i].id === conta.id) {
        conta = contas[i];
        sessionStorage.setItem("contaLogada", JSON.stringify(conta));
        document.getElementById("saldo").textContent = parseFloat(conta.saldo).toFixed(2);
        document.getElementById("limite").textContent = parseFloat(conta.limite || 0).toFixed(2);
        break;
      }
    }

    carregarHistorico();
  } catch (erro) {
    console.error("Erro ao atualizar:", erro);
  }
}

// ─── Depósito ─────────────────────────────────────────────────────────────────

async function depositar() {
  const input = document.getElementById("valorDep");
  const valor = parseFloat(input.value);
  const msg = document.getElementById("msgDep");

  if (!valor || valor <= 0) {
    msg.style.color = "red";
    msg.textContent = "Valor inválido";
    return;
  }

  try {
    await supabaseQuery("contas", "PATCH", { saldo: parseFloat(conta.saldo) + valor }, conta.id);
    await supabaseQuery("transacoes", "POST", { conta_id: conta.id, tipo: "deposito", valor });

    msg.style.color = "green";
    msg.textContent = "Depósito: R$ " + valor.toFixed(2);
    input.value = "";
    atualizarSaldo();
  } catch (erro) {
    msg.style.color = "red";
    msg.textContent = "Erro no depósito";
  }
}

// ─── Saque ────────────────────────────────────────────────────────────────────

function sacar() {
  const input = document.getElementById("valorSaq");
  const valor = parseFloat(input.value);
  const msg = document.getElementById("msgSaq");

  if (!valor || valor <= 0) {
    msg.style.color = "red";
    msg.textContent = "Valor inválido";
    return;
  }

  // Acima de R$100 exige senha antes de continuar
  if (valor > 100) {
    pedirSenha(() => executarSaque(valor, input, msg));
    return;
  }

  executarSaque(valor, input, msg);
}

async function executarSaque(valor, input, msg) {
  const saldoAtual = parseFloat(conta.saldo);
  const limiteAtual = parseFloat(conta.limite || 0);

  // Saldo insuficiente: tenta usar o limite
  if (valor > saldoAtual) {
    const falta = valor - saldoAtual;

    if (falta > limiteAtual) {
      msg.style.color = "red";
      msg.textContent = "Saldo e limite insuficientes";
      return;
    }

    if (!confirm(`Saldo insuficiente. Usar R$ ${falta.toFixed(2)} do limite?`)) return;

    try {
      await supabaseQuery("contas", "PATCH", { saldo: 0, limite: limiteAtual - falta }, conta.id);
      await supabaseQuery("transacoes", "POST", {
        conta_id: conta.id,
        tipo: "saque",
        valor,
        descricao: `Limite utilizado: R$ ${falta.toFixed(2)}`,
      });

      msg.style.color = "green";
      msg.textContent = `Saque: R$ ${valor.toFixed(2)} (R$ ${falta.toFixed(2)} do limite)`;
      input.value = "";
      atualizarSaldo();
    } catch (erro) {
      msg.style.color = "red";
      msg.textContent = "Erro no saque";
    }

    return;
  }

  // Saldo suficiente: saque normal
  try {
    await supabaseQuery("contas", "PATCH", { saldo: saldoAtual - valor }, conta.id);
    await supabaseQuery("transacoes", "POST", { conta_id: conta.id, tipo: "saque", valor });

    msg.style.color = "green";
    msg.textContent = "Saque: R$ " + valor.toFixed(2);
    input.value = "";
    atualizarSaldo();
  } catch (erro) {
    msg.style.color = "red";
    msg.textContent = "Erro no saque";
  }
}

// ─── Transferência ────────────────────────────────────────────────────────────

function transferir() {
  const emailInput = document.getElementById("emailTransf");
  const valorInput = document.getElementById("valorTransf");
  const msg = document.getElementById("msgTransf");

  const emailDestino = emailInput.value.trim().toLowerCase();
  const valor = parseFloat(valorInput.value);

  if (!emailDestino) {
    msg.style.color = "red";
    msg.textContent = "Informe o e-mail do destinatário";
    return;
  }

  if (emailDestino === conta.email.toLowerCase()) {
    msg.style.color = "red";
    msg.textContent = "Não é possível transferir para si mesmo";
    return;
  }

  if (!valor || valor <= 0) {
    msg.style.color = "red";
    msg.textContent = "Valor inválido";
    return;
  }

  // Acima de R$100 exige senha antes de continuar
  if (valor > 100) {
    pedirSenha(() => executarTransferencia(emailDestino, valor, emailInput, valorInput, msg));
    return;
  }

  executarTransferencia(emailDestino, valor, emailInput, valorInput, msg);
}

async function executarTransferencia(emailDestino, valor, emailInput, valorInput, msg) {
  const saldoAtual = parseFloat(conta.saldo);
  const limiteAtual = parseFloat(conta.limite || 0);

  try {
    const contas = await supabaseQuery("contas", "GET");
    const destino = contas.find((c) => c.email.toLowerCase() === emailDestino);

    if (!destino) {
      msg.style.color = "red";
      msg.textContent = "Conta destinatária não encontrada";
      return;
    }

    // Saldo insuficiente: tenta usar o limite
    if (valor > saldoAtual) {
      const falta = valor - saldoAtual;

      if (falta > limiteAtual) {
        msg.style.color = "red";
        msg.textContent = "Saldo e limite insuficientes";
        return;
      }

      if (!confirm(`Saldo insuficiente. Usar R$ ${falta.toFixed(2)} do limite?`)) return;

      await supabaseQuery("contas", "PATCH", { saldo: 0, limite: limiteAtual - falta }, conta.id);
      await supabaseQuery("contas", "PATCH", { saldo: parseFloat(destino.saldo) + valor }, destino.id);
      await supabaseQuery("transacoes", "POST", {
        conta_id: conta.id,
        tipo: "transferencia_enviada",
        valor,
        descricao: `Para: ${destino.email} | Limite utilizado: R$ ${falta.toFixed(2)}`,
      });
      await supabaseQuery("transacoes", "POST", {
        conta_id: destino.id,
        tipo: "transferencia_recebida",
        valor,
        descricao: "De: " + conta.email,
      });

    } else {
      // Saldo suficiente: transferência normal
      await supabaseQuery("contas", "PATCH", { saldo: saldoAtual - valor }, conta.id);
      await supabaseQuery("contas", "PATCH", { saldo: parseFloat(destino.saldo) + valor }, destino.id);
      await supabaseQuery("transacoes", "POST", {
        conta_id: conta.id,
        tipo: "transferencia_enviada",
        valor,
        descricao: "Para: " + destino.email,
      });
      await supabaseQuery("transacoes", "POST", {
        conta_id: destino.id,
        tipo: "transferencia_recebida",
        valor,
        descricao: "De: " + conta.email,
      });
    }

    msg.style.color = "green";
    msg.textContent = `Transferência de R$ ${valor.toFixed(2)} enviada para ${destino.nome}`;
    emailInput.value = "";
    valorInput.value = "";
    atualizarSaldo();

  } catch (erro) {
    console.error("Erro na transferência:", erro);
    msg.style.color = "red";
    msg.textContent = "Erro ao realizar transferência";
  }
}

// ─── Histórico ────────────────────────────────────────────────────────────────

async function carregarHistorico() {
  try {
    const transacoes = await supabaseQuery("transacoes", "GET");
    const minhas = transacoes.filter((t) => t.conta_id === conta.id);
    const div = document.getElementById("historico");

    if (minhas.length === 0) {
      div.innerHTML = "<p>Sem movimentações</p>";
      return;
    }

    minhas.sort((a, b) => new Date(b.data) - new Date(a.data));

    let html = "";
    for (const t of minhas) {
      const descricao = t.descricao ? " - " + t.descricao : "";
      html +=
        "<p>" + t.tipo.replace("_", " ").toUpperCase() +
        " - R$ " + parseFloat(t.valor).toFixed(2) +
        descricao +
        " - " + new Date(t.data).toLocaleString("pt-BR") +
        "</p>";
    }

    div.innerHTML = html;
  } catch (erro) {
    console.error("Erro no histórico:", erro);
  }
}

// ─── Sair ─────────────────────────────────────────────────────────────────────

function sair() {
  sessionStorage.removeItem("contaLogada");
  window.location.href = "index.html";
}

setInterval(atualizarSaldo, 5000);