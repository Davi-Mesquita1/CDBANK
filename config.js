// CONFIGURAÇÃO DO SUPABASE - COLOQUE SEUS DADOS AQUI
const SUPABASE_URL = 'https://doiktbahouvvwdlegucb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_asvJSctLxcTTRDHHlmOE0A_gmSkdKmo';

async function supabaseQuery(tabela, metodo, dados = null, id = null) {
    let url = `${SUPABASE_URL}/rest/v1/${tabela}`;
    if (id) url += `?id=eq.${id}`;

    const options = {
        method: metodo,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };

    if (dados) {
        options.body = JSON.stringify(dados);
    }

    try {
        const resposta = await fetch(url, options);
        const resultado = await resposta.json();

        if (Array.isArray(resultado)) {
            return resultado;
        } else if (resultado && typeof resultado === 'object') {
            return [resultado];
        } else {
            return [];
        }

    } catch (erro) {
        console.error('Erro na requisição:', erro);
        return [];
    }
}