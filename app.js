// RotaAcessível - funções de busca, cadastro e avaliações
// RotaAcessível — demonstração acadêmica, com dados locais do navegador.

// A lista começa vazia. Os locais são cadastrados pelos usuários.
const locaisPadrao = [];

const nomesRecursos={rampa:'Rampa de acesso',banheiro:'Banheiro adaptado',vaga:'Vaga reservada','sem-degraus':'Entrada sem degraus'};

const chaveLocais='rotaAcessivelLocais', chaveAvaliacoes='rotaAcessivelAvaliacoes';

const escapar=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function lerJSON(chave,padrao){try{const x=JSON.parse(localStorage.getItem(chave));return x??padrao}catch{return padrao}}

function obterLocais() {
    let locais = lerJSON(chaveLocais, []);
    if (!Array.isArray(locais)) locais = [];

    // Remove os antigos locais fictícios, sem apagar os cadastros reais.
    const atualizados = locais.filter(local => !local.exemplo);
    if (atualizados.length !== locais.length) {
        localStorage.setItem(chaveLocais, JSON.stringify(atualizados));
    }
    return atualizados;
}

function excluirLocal(id) {
    if (!confirm('Deseja excluir este estabelecimento?')) return;

    const locais = obterLocais().filter(local => String(local.id) !== String(id));
    const avaliacoes = obterAvaliacoes();
    delete avaliacoes[id];

    try {
        localStorage.setItem(chaveLocais, JSON.stringify(locais));
        localStorage.setItem(chaveAvaliacoes, JSON.stringify(avaliacoes));
        filtrarLocais();
    } catch (erro) {
        alert('Não foi possível excluir o estabelecimento.');
    }
}

function obterAvaliacoes(){const x=lerJSON(chaveAvaliacoes,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}

function notaLocal(id){const aval=obterAvaliacoes()[id]||[];return aval.length?(aval.reduce((s,a)=>s+Number(a.nota),0)/aval.length).toFixed(1).replace('.',',')+' ⭐':'Ainda sem avaliações'}

function renderizarCards(lista) {
    const container = document.getElementById('listaEstabelecimentos');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p class="sem-locais">Nenhum estabelecimento encontrado. Cadastre um local para começar.</p>';
        return;
    }

    container.innerHTML = lista.map(local => `
        <article class="card">
            <button class="btn-excluir" type="button" data-excluir="${escapar(local.id)}"
                aria-label="Excluir ${escapar(local.nome)}" title="Excluir estabelecimento">×</button>
            ${local.foto
                ? `<img class="card-photo" src="${escapar(local.foto)}" alt="Foto de ${escapar(local.nome)}">`
                : '<div class="card-placeholder" aria-hidden="true">♿</div>'}
            <div class="card-body">
                <span class="category">${escapar(local.categoria)}</span>
                <h3>${escapar(local.nome)}</h3>
                <p>📍 ${escapar(local.endereco)}</p>
                <p><strong>${notaLocal(local.id)}</strong></p>
                <div class="tags">
                    ${(local.recursos || []).map(recurso =>
                        `<span class="tag">${escapar(nomesRecursos[recurso] || recurso)}</span>`
                    ).join('')}
                </div>
            </div>
            <a href="detalhe.html?id=${encodeURIComponent(local.id)}" class="btn card-button">Ver detalhes</a>
        </article>
    `).join('');

    container.querySelectorAll('[data-excluir]').forEach(botao => {
        botao.addEventListener('click', () => excluirLocal(botao.dataset.excluir));
    });
}

function filtrarLocais(){const busca=document.getElementById('campoBusca');if(!busca)return;const termo=busca.value.toLocaleLowerCase('pt-BR').trim();const filtros=[...document.querySelectorAll('.filtros input:checked')].map(x=>x.value);renderizarCards(obterLocais().filter(l=>(l.nome+' '+l.categoria+' '+l.endereco).toLocaleLowerCase('pt-BR').includes(termo)&&filtros.every(r=>(l.recursos||[]).includes(r))))}

function comprimirImagem(arquivo){return new Promise((resolve,reject)=>{if(!arquivo)return resolve('');if(!['image/jpeg','image/png','image/webp'].includes(arquivo.type))return reject(new Error('Formato de imagem não aceito.'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Imagem inválida.'));img.onload=()=>{const fator=Math.min(1,700/img.width);const c=document.createElement('canvas');c.width=Math.round(img.width*fator);c.height=Math.round(img.height*fator);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.65))};img.src=reader.result};reader.readAsDataURL(arquivo)})}

function configurarCadastro(){const form=document.getElementById('formCadastro');if(!form)return;const input=document.getElementById('fotoLocal');input.addEventListener('change',()=>{const f=input.files[0],box=document.getElementById('previewContainer'),img=document.getElementById('previewFoto');if(!f){box.hidden=true;img.removeAttribute('src');return}if(!f.type.startsWith('image/')){box.hidden=true;return}const url=URL.createObjectURL(f);img.onload=()=>URL.revokeObjectURL(url);img.src=url;box.hidden=false});form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{const foto=await comprimirImagem(input.files[0]);const locais=obterLocais();locais.push({id:Date.now(),nome:document.getElementById('nomeLocal').value.trim(),categoria:document.getElementById('categoriaLocal').value,endereco:document.getElementById('enderecoLocal').value.trim(),recursos:[...form.querySelectorAll('input[name="recurso"]:checked')].map(x=>x.value),foto});localStorage.setItem(chaveLocais,JSON.stringify(locais));alert('Local cadastrado neste navegador!');location.href='index.html'}catch(err){alert('Não foi possível salvar: '+(err.name==='QuotaExceededError'?'armazenamento cheio. Tente uma imagem menor.':err.message))}finally{btn.disabled=false}})}

function carregarDetalhes(){const nome=document.getElementById('detalheNome');if(!nome)return;const id=new URLSearchParams(location.search).get('id');const local=obterLocais().find(l=>String(l.id)===id);if(!local){nome.textContent='Estabelecimento não encontrado';document.getElementById('formAvaliacao').hidden=true;return}nome.textContent=local.nome;document.getElementById('detalheEndereco').textContent=local.categoria+' • '+local.endereco;const img=document.getElementById('detalheFoto');if(local.foto){img.src=local.foto;img.alt='Foto de '+local.nome;img.hidden=false}const ul=document.getElementById('detalheRecursos');ul.innerHTML=(local.recursos||[]).length?(local.recursos||[]).map(r=>`<li>✓ ${escapar(nomesRecursos[r]||r)}</li>`).join(''):'<li>Nenhum recurso informado.</li>';function atualizar(){const aval=obterAvaliacoes()[id]||[];document.getElementById('detalheNota').textContent=notaLocal(id);document.getElementById('listaComentarios').innerHTML=aval.length?aval.map(a=>`<div class="comentario-item"><strong>Visitante (${escapar(a.nota)} ⭐)</strong><p>${escapar(a.texto)}</p></div>`).join(''):'<p class="muted">Ainda não há avaliações para este local.</p>'}atualizar();document.getElementById('formAvaliacao').addEventListener('submit',e=>{e.preventDefault();const nota=Number(document.getElementById('notaUsuario').value),texto=document.getElementById('comentarioUsuario').value.trim();const dados=obterAvaliacoes();dados[id]??=[];dados[id].push({nota,texto:texto||'Avaliação sem comentário.'});try{localStorage.setItem(chaveAvaliacoes,JSON.stringify(dados));e.target.reset();atualizar();alert('Avaliação salva neste navegador!')}catch{alert('Não foi possível salvar a avaliação.')}})}

document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('campoBusca')){document.getElementById('campoBusca').addEventListener('input',filtrarLocais);filtrarLocais()}configurarCadastro();carregarDetalhes()});
