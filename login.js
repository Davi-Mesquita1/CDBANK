async function entrar() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('msg');

    try {
        const contas = await supabaseQuery('contas', 'GET');

        let contaEncontrada = null;

        for (let i = 0; i < contas.length; i++) {
            if (contas[i].email === email && contas[i].senha === senha) {
                contaEncontrada = contas[i];
                break;
            }
        }

        if (!contaEncontrada) {
            msg.textContent = 'Email ou senha incorretos';
            return;
        }

        sessionStorage.setItem('contaLogada', JSON.stringify(contaEncontrada));
        window.location.href = 'inicio.html';

    } catch (erro) {
        msg.textContent = 'Erro: ' + erro.message;
    }
}