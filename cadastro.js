async function cadastrar() {
    let limite = document.getElementById('valorLim').value
    let saldo = document.getElementById('valorDep').value;
    let email = document.getElementById('email').value.trim();
    let senha = document.getElementById('senha').value;
    let nome = document.getElementById('nome').value.trim();
    let msg = document.getElementById('msg');
    let cpf = document.getElementById('cpf').value;


    if (!email || !senha || !nome || !cpf) {
        msg.textContent = 'Preencha todos os campos';
        return;
    }

    if (saldo === null ){
        saldo = 0;
    }

    if (limite === null){
        limite = 0
    }

    try {
        const contas = await supabaseQuery('contas', 'GET');

        for (let i = 0; i < contas.length; i++) {
            if (contas[i].cpf === cpf && contas[i].email === email){
                alert('Email e cpf já existentes');
                return
            }
            else if (contas[i].email === email) {
                alert ('Este email já existe');
                return;
            }
            else if (contas[i].cpf === cpf){
             alert('CPF já cadastrado');
             return;
            }

        }

        cpf = cpf.replace(/[^\d]/g, '');



        if (cpf.length !== 11) {
            alert('CPF inválido: deve conter exatamente 11 dígitos.');
            return
        }

        if (senha.length < 8){
            alert('a senha deve conter no mínimo 9 caracteres')
            return
        }

        let confirmar = document.getElementById("confirmesenha").value;


        if (senha !== confirmar) {
        alert("As senhas não coincidem");
        return;
        }


        const resultado = await supabaseQuery('contas', 'POST', {
            email: email,
            senha: senha,
            nome: nome,
            saldo: saldo,
            cpf: cpf,
            limite: limite
        });

        if (resultado.length > 0) {

            const usuario = resultado[0]

            sessionStorage.setItem("contaLogada", JSON.stringify(usuario));
            window.location.href = 'inicio.html'

        } else {
            alert = 'Erro ao cadastrar';
        }

    } catch (erro) {
        msg.textContent = 'Erro: ' + erro.message;
    }
}