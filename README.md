# Acervo Lula e Data2Comms — guia de manutenção

Revisado em **17/10/2026**, confrontando código, histórico Git e conversas locais. Estado de referência do conteúdo: `6ba71af`. Este documento registra comportamentos existentes e limites conhecidos; não transforma decisões antigas em autorização para novas mudanças.

## Leia antes de editar

- **A fonte única é este repositório, `rennanmetsi-gif/data2commsfinal`, branch `main`.** Ele serve ao Acervo e ao site institucional. Uma mudança aqui pode afetar os dois domínios.
- **`rennanmetsi-gif/acervolula-site` contém somente a automação de deploy.** Não copie o site para lá nem edite páginas nesse repositório.
- A home na raiz (`/`) é o **site institucional da Data2Comms**. O Acervo Lula possui deploy dedicado em `acervolula.com.br` (publicado via workflow em `acervolula-site`). A rota legada `/home-antiga/` redireciona para a raiz.
- O site é **Jekyll + HTML/CSS/JavaScript**, sem aplicação Node ou banco de eventos conectado à agenda. O formulário envia ao Google Apps Script; publicar um ato continua sendo uma etapa editorial separada.
- Há vários clones locais e cópias antigas em `work/`. Identifique o remoto, confira alterações locais e atualize a branch antes de trabalhar. Data da pasta e “memória” de conversa não provam que a cópia está atualizada.
- Preserve dados de produção: não publique atos fictícios, não apague linhas da planilha para testar, não inclua credenciais nem exportações de submissões no Git.

## Mapa dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `_includes/links-page.html` | Documento completo do Acervo: head, CSS, cards, agenda, filtros, formulário, compartilhamento e GA4; concentra a maior parte da lógica |
| `index.html`, `links.html`, `links-lula.html` | Entradas Jekyll que incluem o mesmo arquivo; rotas `/`, `/links/` e `/links-lula/` |
| `assets/js/acervo-municipios-ibge.js` | Base de municípios usada na busca por cidade |
| `assets/js/acervo-notificacoes.js` | Preferências locais, central de avisos e consulta de novidades |
| `assets/css/acervo-notificacoes.css` | Visual da central de avisos |
| `acervo-notificacoes-sw.js` | Service worker de notificações, sem cache offline implementado |
| `acervo-manifest.webmanifest` | Manifesto para instalação/abertura como aplicativo |
| `assets/images/acervo-lula-og.jpg` | Preview social do Acervo, declarado como 1200 × 630 |
| `index.html`, `_includes/header.html`, `_includes/footer.html` | Página e navegação institucionais |
| `home-antiga.html` | Redirecionamento legado para a home da agência |
| `_imprensa/`, `_layouts/press.html`, `imprensa.html` | Área de imprensa da agência; permanece ativa |
| `_config.yml`, `Gemfile`, `CNAME`, `robots.txt` | Jekyll, dependências e configuração do domínio de origem |
| `_data/agenda-removidos-2026-10-12.json` | Registro histórico de remoções; não é a base ativa da agenda |

## Publicação: dois repositórios, dois destinos

```text
data2commsfinal/main ── GitHub Pages ── www.data2comms.com.br
          │
          └── workflow em acervolula-site ── Jekyll ── acervolula.com.br
```

O workflow `.github/workflows/acervolula-pages-deploy.yml`, no repositório **acervolula-site**, baixa `data2commsfinal/main`, substitui o `CNAME` no checkout de build, usa Ruby 3.2, executa `bundle exec jekyll build` e envia `_site` ao Pages. Dispara por push em `acervolula-site/main`, execução manual ou cron `*/5 * * * *`. O cron depende da disponibilidade do GitHub e **não garante atualização em cinco minutos**. A concorrência cancela uma execução anterior do mesmo grupo.

Para publicar conteúdo:

1. Confira `git status`, remoto e diferenças em relação a `origin/main`; preserve alterações de outras pessoas.
2. Edite e valide **na fonte**, faça commit e envie a `data2commsfinal/main` conforme o fluxo autorizado da tarefa.
3. Para atualizar o Acervo imediatamente, dispare manualmente **Publicar Acervo Lula** em Actions de `acervolula-site`. Commit nesse repo também dispara o fluxo, mas não é necessário usar o README como botão de deploy.
4. Acompanhe o resultado do Pages dos dois destinos. Push aceito não comprova publicação.
5. Confira no endereço público o conteúdo específico alterado. O hash do deploy pertence ao repo de automação; sozinho não identifica qual commit da fonte foi compilado. Consulte o checkout/log do workflow.

**Não altere o `CNAME` ou a URL global da fonte para acervolula.com.br:** a agência usa a mesma fonte. `_config.yml` mantém `url: https://www.data2comms.com.br`; a personalização do segundo domínio acontece no workflow e no head do Acervo.

### SEO, previews e ícones

- O include do Acervo declara canonical, `og:url`, imagem social e compartilhamentos apontando para **https://acervolula.com.br/**, mesmo quando acessado pela Data2Comms.
- O favicon do Acervo é um SVG embutido no próprio head: estrela vermelha com “13”. O `favicon.ico` institucional é separado. Trocar só o ICO não altera esse ícone do Acervo.
- O preview é um JPG público com URL absoluta e parâmetro de versão. Preserve metadados Open Graph/Twitter no HTML inicial; robôs de preview não dependem do JavaScript da página.
- O `robots.txt` libera explicitamente leitores de preview da Meta. O workflow do Acervo gera seu próprio robots e sitemap contendo somente a raiz; injeta `noindex,follow` nos demais HTMLs. Não transfira essa restrição para toda a agência.
- As três entradas do Acervo têm `sitemap: false` na fonte. Não remova isso sem revisar os dois sitemaps e os canonicals.
- Cache de navegador e de plataforma social pode manter preview/favicon antigo. Antes de refazer código, confira a resposta publicada e o URL da imagem.

## Navegação e interface

As quatro áreas são `#digital` (grupos), `#videos` (bancos de vídeos e conteúdos), `#ferramentas` (apps) e `#presencial` (atos). Esses IDs também sustentam filtros, notificações e Analytics.

O início do include remove hashes dessas quatro seções em visita/recarga e reposiciona no topo; outros hashes são preservados, assim como a navegação de retorno. Não “corrija” esse reset sem considerar a intenção original.

Os CTAs flutuantes de submissão e compartilhamento têm regras de visibilidade e de colisão com navegação/controles. Houve regressões em celular e tablet: preservar área tocável, texto legível, safe areas e acesso aos filtros. A expansão da agenda fica **depois** da lista, não embaixo do botão flutuante.

**O HTML cru não conta toda a história:** um script no fim da página substitui o card `.is-censored` pelo Porta-Voz do Lula, acrescenta Mulheres com Lula se ausente e padroniza ícones de WhatsApp. Verifique HTML e DOM final antes de editar links ou remover esse trecho. Canais foram reabilitados após suspensão; não restaure avisos antigos sem conferir a situação.

## Agenda presencial: contrato dos cards e regras escondidas

Os eventos publicados são cards estáticos dentro de `#presencial-events`, no include. Não são lidos automaticamente da planilha. `#student-agenda`, se existir, é incorporada à lista principal pelo JavaScript; a agenda visível é única.

Modelo de estrutura (substitua todos os dados por informações verificadas):

```html
<a class="link" data-state="SP" href="https://exemplo.org/convocacao"
   target="_blank" rel="noopener noreferrer">
  <span class="card-icon resource-emoji">📅</span>
  <span class="link-copy">
    <span class="link-meta">SP · Cidade · caminhada</span>
    <strong>20/10, 19h30 — Ponto de encontro</strong>
    <span class="link-description">Descrição verificada, sem inventar detalhes.</span>
  </span>
  <span class="arrow">↗</span>
</a>
```

- Preserve `data-state`, `.link-copy`, `.link-meta`, `strong` e as separações **`·`** e **` — `**. O parser extrai cidade, categoria, data, hora e local desse texto; classe visual sozinha não basta.
- `enhanceAgendaCards()` transforma o card, cria datasets e selo da data; usa “Ver evento” para Instagram e “Ver fonte” para outros destinos. Após a transformação, o título e o meta no DOM são diferentes da fonte.
- **O ano 2026 está fixo no parser.** Intervalos como `20–21/10` são reconhecidos; outra campanha/ano exige revisão explícita.
- Cards são ordenados por data e minuto de início. Aliases em `canonicalCity()` corrigem grafias históricas; não elimine a normalização sem avaliar filtros e conteúdo existente.
- A referência temporal é **America/Sao_Paulo para todos os atos**, inclusive outros fusos e Exterior. Não assumir conversão por município.
- Evento com dia e hora recebe “Possivelmente acontecendo agora” entre início e início + **240 minutos**; após isso fica expirado e sai dos resultados. Não é leitura do horário real de encerramento, mesmo que o texto informe outro fim.
- Cards cujo último dia já passou são removidos **do DOM na carga**, permanecendo no HTML-fonte. Não confundir HTML antigo com ato ainda visível.
- A agenda atualiza status/filtros a cada minuto e ao voltar à aba. Intervalos e cards sem hora não têm exatamente a mesma expiração dos atos com início único.
- Os filtros de estado, cidade e data se combinam; o calendário destaca disponibilidade. A busca usa a base IBGE e também permite chegar a cidades sem eventos, com convite para submissão.
- A listagem mostra **10 por vez**, com “Ver mais”, “Ver todos” e recolhimento. Alterar filtro reinicia a expansão. O total encontrado não é necessariamente a quantidade renderizada visível.
- O processamento roda também no evento `load`, para normalizar cards adicionados durante a montagem. Não remova essa segunda passagem como duplicação sem conferir as inserções tardias.
- Datas do formulário são fixas de **15 a 25/10/2026**; isso não constitui um calendário permanente. Ao ampliar período, revise select, textos, calendário, parser e expiração juntos.

### Curadoria e duplicatas

Submissão ou resultado de coleta é **candidato**, não confirmação. Confira convocação pública, imagem/legenda, ano, cidade, local e horário. Não complete lacunas por suposição nem trate data importada como prova.

A mesma publicação pode conter vários atos: **não deduplicar só por URL, perfil ou imagem**. Compare também cidade, dia, hora e ponto de encontro. Por outro lado, publicações distintas podem divulgar o mesmo evento.

Na auditoria BoraLula de 17/10 foram examinados 2.744 registros e incluídas 121 mobilizações; foram descartados espelhos com datas inconsistentes e atividades fora do recorte solicitado naquele lote (panfletagem isolada, oficinas e shows). Esse histórico não é uma regra universal para toda futura pauta: confirme o recorte da tarefa.

Há correções e cancelamentos posteriores às coletas. Exemplo: `6ba71af` retirou o ato de 18/10 do Anhangabaú. Não reintroduza eventos cancelados copiando lote, backup ou resumo antigo; consulte o histórico do card e a divulgação atual.

## Formulário e backend externo

Três etapas: dados essenciais; descrição opcional; **link público obrigatório**. Campos obrigatórios: `local`, `cidade`, `estado`, `data`, `horario`, `link`. `website` é honeypot e deve permanecer vazio. Exterior usa `EX`.

O endpoint em produção é a variável `formEndpoint` do include, com URL de implantação Google Apps Script terminada em `/exec`. Os dois domínios usam o mesmo endpoint e a mesma planilha **“Submissões de atos presenciais”**, aba conhecida como **Página1**. A cópia do backend consultada usa `getSheets()[0]`: reordenar abas pode mudar o destino da gravação.

- Horários como `19`, `1930`, `930`, `19:30`, `19h30` são normalizados para `HH:mm`; `25:90` é recusado. Preserve entrada de texto com teclado numérico e normalização, inclusive para navegadores internos.
- O link é normalizado (adiciona HTTPS se ausente) e validado no frontend e no servidor. Imagem não substitui o link obrigatório.
- O envio usa `URLSearchParams`/POST. Sucesso só aparece com HTTP válido e JSON **`ok: true`**. **Não reintroduzir `mode: 'no-cors'` nem mostrar sucesso sem resposta legível.**
- O Apps Script não é publicado pelo Jekyll. Alterar apenas HTML não corrige validação no servidor, e editar um `.gs` local não atualiza a implantação.
- A última alteração de backend comprovada pelo histórico é a **versão 2**, mantendo a mesma URL; não confundir essa evidência de 12/10 com auditoria ao vivo da versão atual.
- A cópia local revisada contém lock, defesa contra fórmulas na planilha, validação de link/horário e gravação com status `Pendente`. Mantém suporte legado a imagem (JPEG/PNG/WebP até 3 MB, pasta Drive via `UPLOAD_FOLDER_ID`), embora o formulário atual não ofereça upload.
- A coluna **Origem é fixa como `data2comms.com.br`** no backend revisado, inclusive para envios do Acervo. Não serve para separar historicamente os dois domínios.
- Há registros históricos sem link anteriores à correção: ausência de link não prova bug novo. Memórias antigas que descrevem comprovação opcional estão superadas.

**Lacuna de versionamento:** o código Apps Script está fora deste repo. A cópia usada nesta revisão estava em `work/Code.gs` da tarefa local de 12/10 “Corrigir horário no formulário de At”. Antes de alterar backend, recupere a fonte da implantação ativa no editor Apps Script e confira divergências; não publique uma cópia antiga automaticamente. IDs privados da planilha, dados submetidos e credenciais não devem ir para o README.

## Notificações: o que existe de fato

Preferências, snapshot e avisos ficam no `localStorage`, nas chaves `acervo-lula-notify-prefs-v1`, `acervo-lula-notify-snapshot-v1` e `acervo-lula-notify-alerts-v1`. São separados por navegador e origem; preferências da Data2Comms não migram automaticamente para o domínio Acervo.

O script verifica novidades ao visitar e por consulta da home a cada **4 minutos** com a página aberta. O coletor de cards desse módulo consulta `#digital`, `#ferramentas` e `#presencial`; não presumir cobertura de vídeos só porque há essa seção na navegação.

O service worker tem handlers de push/clique, mas **envio remoto com navegador fechado exige backend, VAPID e registro de assinaturas que não estão implementados neste repositório**. Permissão concedida, manifesto e service worker registrados não comprovam Web Push completo nem funcionamento offline.

A solicitação de permissão deve partir do clique do usuário; preserve esse gesto direto, sem colocar tarefas assíncronas antes dele. Navegadores internos e armazenamento bloqueado exigem tratamento de indisponibilidade.

## Analytics: preservar os nomes e a privacidade

O Acervo usa a propriedade Data2Comms **GA4 `G-C3ZTDYFHLT`**. Instrumentação e listeners estão no include; dependem dos IDs/classes e em alguns casos da ordem dos handlers e de `MutationObserver`. A existência do código não comprova configuração de dimensões personalizadas ou recepção atual no painel.

| Área | Eventos principais |
|---|---|
| Navegação | `section_view`, `section_navigation`, `scroll_depth` |
| Recursos | `group_click`, `resource_click`, `mobilization_click` |
| Agenda | `filter_apply`, `filter_clear`, `filter_no_results`, `agenda_expand`, `date_unavailable_view`, `city_unavailable_view`, `city_unavailable_submit`, `city_unavailable_dismiss` |
| Compartilhamento | `share_start`, `share_whatsapp`, `share_copy_link` |
| Formulário | `form_open`, `form_step_view`, `form_step_complete`, `form_back`, `form_validation_error`, `form_submit_attempt`, `form_submit_success`, `form_submit_error`, `form_abandon` |
| Avisos | `notification_center_open`, `notification_permission_start`, `notification_permission_result`, `notification_preference_change` |
| Qualidade | `web_vital`, `site_error`, `resource_load_error` |

Categorias de seção: `mobilizacao_digital`, `videos_conteudos`, `apps_ferramentas`, `mobilizacao_presencial`. Os recursos usam parâmetros como `resource_name`, `resource_category`, `resource_type`, `card_position`, `destination_domain`; atos podem incluir estado, cidade e data públicos.

**Não enviar conteúdo digitado, descrição, contato, link submetido ou dados pessoais ao GA4.** O funil mede etapas, quantidade de campos, duração e tipo de erro. Renomear eventos/parâmetros quebra comparabilidade com relatórios anteriores; coordenar qualquer migração e verificar dimensões no GA4.

## Convivência com a agência

Blog e Editorial foram **ocultados, preservando as fontes**, em `dbc9c5d`. `_config.yml` desativa a saída da coleção blog e exclui páginas/editorias e `_posts`/`_blog` do build. Menu, rodapé e blocos da home antiga também foram ajustados. **Não reativar para “consertar” links ou limpeza de configuração**, nem apagar o acervo histórico como se fosse lixo. Imprensa, serviços, sobre e contato são outra área e permanecem ativos.

## Coletor Instagram e fluxo de entrada

O **Coletor Instagram — Acervo Lula** é um app local separado, não um serviço do site. Arquiva mídia, legenda, perfil, data/hora e URL de posts recebidos em DM; não valida eventos nem publica.

No histórico local, sua fonte está em `work/instagram_collector` da tarefa de 11/10 “Extrair eventos da DM do Instagram”. Usa o Chrome já autenticado via AppleScript, exige a conversa correta aberta e permissões de automação. Saída padrão: `~/Documents/Acervo Lula/Coletas Instagram`; estado SQLite em `~/Library/Application Support/Coletor Instagram Acervo Lula`. Esses caminhos pertencem à instalação local e precisam ser confirmados em outra máquina.

A deduplicação da coleta por post não substitui deduplicação de eventos. Leia mídias e `metadata.json`, revise carrosséis e legendas e só depois inclua cards verificados. `--demo` não é coleta real. Não instalar o coletor dentro do build nem presumir integração automática DM → planilha → agenda.

## Validação proporcional antes de entregar

Para documentação: revisar diferenças, conferir caminhos e afirmações contra a fonte e executar `git diff --check`. Não é necessário gravar submissões ou alterar backend.

Para código/páginas:

```sh
bundle install
bundle exec jekyll build
bundle exec jekyll serve
```

Execute na **fonte** (o repo de deploy não tem Gemfile). O workflow do Acervo usa Ruby 3.2; a máquina local precisa de ambiente compatível. Abrir o HTML diretamente não processa os includes Jekyll.

Conforme a mudança, confira: rotas compartilhadas; DOM final após scripts; filtros combinados e sem resultado; dez cards/expansão; datas e expiração no fuso de referência; formulário e falha do servidor; menus e CTAs em celular/tablet; preview social e eventos GA4 sem dados preenchidos. Não anuncie teste físico ou envio completo que não tenha ocorrido.

No histórico de 12/10, entradas inválidas foram testadas no endpoint sem criar linhas; um envio válido fictício completo em produção não foi feito. Isso é evidência histórica, não teste executado a cada manutenção. Em produção, prefira submissões reais autorizadas ou ambiente separado para testar gravação.

## Evidência e manutenção deste guia

Referências de mudanças: `5edaf69` (formulário/validação), `56cd942` (GA4), `2d4fc23` (favicon/compartilhamento), `ac6a100` (eventos distintos da mesma fonte), `28fc1c1` (filtros/expansão), `dbc9c5d` (ocultação editorial), `99cadf0` e `c532c57` (auditoria BoraLula), `6ba71af` (cancelamento).

Esta revisão conferiu código e histórico dos dois repositórios, a memória local de projetos de 15/10 e os chats de formulário, Analytics, curadoria e remoção editorial. Não é garantia de recuperar toda conversa já existente nem auditoria ao vivo de Apps Script, DNS, GA4 ou permissões externas. Quando uma regra mudar, atualize este README no mesmo trabalho e separe estado atual de evidência histórica.
