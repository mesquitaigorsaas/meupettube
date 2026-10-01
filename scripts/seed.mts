/**
 * Dados de demonstração. Uso: npm run seed
 * ATENÇÃO: apaga TODOS os dados do banco em DATABASE_URL e recria a demo.
 * Todas as pessoas e canais aqui são fictícios.
 */
import postgres from "postgres";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Miniaturas dos vídeos de demonstração vão junto com o site (public/demo).
const THUMBS = path.join(process.cwd(), "public", "demo");
fs.rmSync(THUMBS, { recursive: true, force: true });
fs.mkdirSync(THUMBS, { recursive: true });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada (.env.local).");
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

/** Mesma interface usada antes com o SQLite: `?` vira $1, $2… */
const toPg = (q: string) => {
  let n = 0;
  return q.replace(/\?/g, () => `$${++n}`);
};
type P = string | number | null;
const db = {
  prepare: (q: string) => ({
    run: (...p: P[]) => sql.unsafe(toPg(q), p),
    get: async (...p: P[]) => (await sql.unsafe(toPg(q), p))[0],
  }),
  exec: (q: string) => sql.unsafe(q),
};

// Apaga os dados atuais (a estrutura das tabelas fica no Supabase — veja supabase/migrations).
await db.exec(`TRUNCATE users, sessions, verification_requests, verification_events, settings, videos, videos_fts, comments,
  comment_likes, likes, follows, saves, history, notifications, reports, admin_actions CASCADE`);

const id = (n = 8) => randomBytes(n).toString("base64url");
const hash = (p: string) => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(p, salt, 64).toString("hex")}`;
};
const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString().replace(/\.\d{3}Z$/, "Z");
const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

/* ---------------- Usuários ---------------- */

type U = { key: string; name: string; handle: string; email: string; type: "viewer" | "student" | "professional" | "related"; role?: "admin"; specialty?: string; bio?: string; location?: string; instagram?: string; daysAgo: number };

const USERS: U[] = [
  { key: "admin", name: "Equipe PetTube", handle: "pettube", email: "admin@pettube.com", type: "professional", role: "admin", specialty: "Curadoria da comunidade", bio: "Conta oficial da equipe. Diretrizes, novidades e destaques da comunidade.", location: "Belo Horizonte, MG", daysAgo: 120 },
  { key: "renata", name: "Dra. Renata Viana", handle: "dra.renata.vet", email: "renata@demo.com", type: "professional", specialty: "Clínica geral de cães e gatos", bio: "Médica veterinária há 12 anos. Aqui eu respondo as dúvidas que mais ouço no consultório, sem complicar.", location: "Belo Horizonte, MG", instagram: "dra.renata.vet", daysAgo: 110 },
  { key: "bruno", name: "Bruno Adestra", handle: "bruno.adestra", email: "bruno@demo.com", type: "professional", specialty: "Adestramento positivo", bio: "Adestrador há 9 anos. Reforço positivo, paciência e muito petisco. Mostro treinos reais, com erros e acertos.", location: "São Paulo, SP", instagram: "bruno.adestra", daysAgo: 95 },
  { key: "camila", name: "Camila Groomer", handle: "camila.tosa", email: "camila@demo.com", type: "professional", specialty: "Banho e tosa na tesoura", bio: "Groomer apaixonada por tesoura. Tosa bebê, tosa japonesa e muito carinho na mesa.", location: "Curitiba, PR", daysAgo: 80 },
  { key: "mia", name: "Gatil Casa da Mia", handle: "casadamia", email: "mia@demo.com", type: "professional", specialty: "Comportamento felino", bio: "Tutora de 7 gatos e consultora de comportamento felino. Enriquecimento ambiental, adaptação e convivência.", location: "Porto Alegre, RS", daysAgo: 70 },
  { key: "petlar", name: "Pet Shop Lar Feliz", handle: "petshop.larfeliz", email: "larfeliz@demo.com", type: "related", specialty: "Pet shop de bairro", bio: "Pet shop de bairro com banho e tosa, rações e acessórios. Dicas rápidas do balcão para o seu dia a dia.", location: "Belo Horizonte, MG", daysAgo: 45 },
  { key: "julia", name: "Júlia Vet", handle: "julia.vetestudante", email: "julia@demo.com", type: "student", specialty: "Estudante de Medicina Veterinária", bio: "7º período de Veterinária. Documentando estágio, plantões e o que aprendo com os pacientes.", location: "Recife, PE", daysAgo: 30 },
  { key: "otavio", name: "Otávio Aves", handle: "otavio.aves", email: "otavio@demo.com", type: "student", specialty: "Estudante — aves e silvestres", bio: "Estudante de Zootecnia, criador de calopsitas. Cuidado com aves, alimentação e viveiros.", location: "Campinas, SP", daysAgo: 12 },
  { key: "lucas", name: "Lucas Moreira", handle: "lucasm", email: "lucas@demo.com", type: "viewer", daysAgo: 20 },
  { key: "carla", name: "Carla Souza", handle: "carla.s", email: "carla@demo.com", type: "viewer", daysAgo: 8 },
  { key: "joao", name: "João Pereira", handle: "joaopereira", email: "joao@demo.com", type: "viewer", daysAgo: 3 },
];

const users: Record<string, string> = {};
const insUser = db.prepare(`INSERT INTO users (id, email, password_hash, name, handle, bio, specialty, location, instagram, role, member_type, verification_status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const pw = hash("pettube123");
for (const u of USERS) {
  users[u.key] = id();
  await insUser.run(
    users[u.key], u.email, pw, u.name, u.handle, u.bio ?? "", u.specialty ?? "", u.location ?? "", u.instagram ?? "",
    u.role ?? "user", u.type, u.type === "viewer" ? "none" : "verified", ago(u.daysAgo * 24),
  );
}

/* ---------------- Miniaturas SVG ---------------- */

// Fundo, fundo escuro, destaque — tons usados em miniaturas do YouTube.
const PALETTES = [
  ["#0F0F0F", "#272727", "#FF0000"],
  ["#CC0000", "#7A0000", "#FFFFFF"],
  ["#065FD4", "#03357A", "#FFD400"],
  ["#272727", "#0F0F0F", "#FFD400"],
  ["#FF4E45", "#B3150D", "#FFFFFF"],
  ["#1F1F1F", "#3D3D3D", "#3EA6FF"],
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(text: string, max = 20) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 3);
}

/** Patinha (almofada + 4 dedos) centrada em (x, y). */
function paw(x: number, y: number, s: number, fill: string, op: number, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${op}">
    <ellipse cx="0" cy="22" rx="34" ry="28"/><ellipse cx="-38" cy="-14" rx="13" ry="17"/><ellipse cx="-14" cy="-38" rx="13" ry="17"/>
    <ellipse cx="14" cy="-38" rx="13" ry="17"/><ellipse cx="38" cy="-14" rx="13" ry="17"/></g>`;
}

function thumb(text: string, label: string, i: number) {
  const [a, b, c] = PALETTES[i % PALETTES.length];
  const lines = wrap(text.toUpperCase());
  const art =
    `<circle cx="1020" cy="370" r="240" fill="${c}" opacity=".14"/>` +
    paw(1020, 360, 3.2, "#FFFFFF", 0.9, -12) +
    paw(840, 590, 1.1, c, 0.55, 20) +
    paw(1180, 140, 0.9, c, 0.5, -30);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  ${art}
  <rect x="70" y="120" width="140" height="10" rx="5" fill="#FF0000"/>
  <text x="70" y="95" font-family="Arial, Helvetica, sans-serif" font-size="30" letter-spacing="6" fill="${c}" opacity=".95">${esc(label.toUpperCase())}</text>
  ${lines.map((l, k) => `<text x="70" y="${230 + k * 92}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="80" fill="#FFFFFF">${esc(l)}</text>`).join("")}
  <text x="70" y="660" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="8" fill="#FFFFFF" opacity=".6">PETTUBE</text>
</svg>`;
}

/* ---------------- Vídeos ---------------- */

type V = { key: string; by: string; title: string; thumbText: string; cat: string; hours: number; views: number; dur: number; desc: string; tags: string; tech?: Record<string, string>; parent?: string };

const VIDEOS: V[] = [
  { key: "r1", by: "renata", title: "5 sinais de que seu cão está com dor (e quase ninguém percebe)", thumbText: "Seu cão está com dor?", cat: "saude", hours: 20, views: 18400, dur: 742, desc: "Lamber a pata, mudar a postura, ficar mais quieto… Mostro os sinais que mais vejo no consultório e quando é hora de procurar o veterinário.\n\nEste vídeo não substitui uma consulta.", tags: "saúde, dor, cachorro, sinais", tech: { especie: "Cão", dica: "Mudança de comportamento é sinal de alerta" } },
  { key: "r2", by: "renata", title: "Calendário de vacinas do filhote: o que tomar e quando", thumbText: "Vacinas do filhote", cat: "saude", hours: 70, views: 25600, dur: 1104, desc: "V8 ou V10, antirrábica, gripe, giárdia: explico a ordem, os intervalos e por que não pode passear antes da hora.", tags: "vacina, filhote, V10, antirrábica", tech: { especie: "Cão", idade: "45 dias a 4 meses", dica: "Só passear depois do protocolo completo" } },
  { key: "r3", by: "renata", title: "Gato bebendo pouca água? Testei 4 truques em casa", thumbText: "Gato bebe pouca água?", cat: "gatos", hours: 150, views: 14200, dur: 868, desc: "Fonte, potes espalhados, sachê, cubo de gelo com petisco. Mostro o que funcionou com meus pacientes e com a minha gata.", tags: "gato, hidratação, fonte, rins", tech: { especie: "Gato", nome_pet: "Amora", produtos: "Fonte de água elétrica" } },
  { key: "b1", by: "bruno", title: "Ensinei meu cão a não puxar a guia em 7 dias", thumbText: "Parar de puxar a guia", cat: "adestramento", hours: 36, views: 31200, dur: 956, desc: "Diário de treino, dia a dia, com reforço positivo. Sem enforcador e sem gritaria.", tags: "adestramento, guia, passeio, reforço positivo", tech: { especie: "Cão", raca: "Border collie", idade: "1 ano", dica: "Pare quando a guia esticar" } },
  { key: "b2", by: "bruno", title: "Meu cachorro late para tudo. O que eu faço?", thumbText: "Latido excessivo", cat: "adestramento", hours: 12, views: 2880, dur: 245, desc: "Dúvida real de seguidor: o cão late para qualquer barulho do corredor. Alguém já passou por isso? Vou responder nos comentários e em vídeo.", tags: "dúvida, latido, comportamento" },
  { key: "b3", by: "bruno", title: "Truque do 'fica': o passo a passo que ninguém ensina direito", thumbText: "Comando fica", cat: "adestramento", hours: 220, views: 19400, dur: 734, desc: "Distância, duração e distração: as 3 regras para o 'fica' funcionar de verdade.", tags: "comando, fica, truque, obediência", tech: { especie: "Cão", raca: "SRD", dica: "Aumente uma coisa de cada vez" } },
  { key: "c1", by: "camila", title: "Tosa bebê no shih tzu: do começo ao fim", thumbText: "Tosa bebê shih tzu", cat: "banho-e-tosa", hours: 90, views: 22600, dur: 1015, desc: "Banho, secagem, máquina e acabamento na tesoura. Com calma e sem estressar o pet.", tags: "tosa bebê, shih tzu, banho e tosa, tesoura", tech: { especie: "Cão", raca: "Shih tzu", porte: "Pequeno", produtos: "Shampoo neutro, condicionador" } },
  { key: "c2", by: "camila", title: "Por que seu pet não pode secar sozinho depois do banho", thumbText: "Secagem é tudo", cat: "banho-e-tosa", hours: 300, views: 8700, dur: 540, desc: "Fungo, dermatite e mau cheiro: o que acontece quando o pelo fica úmido. E como secar em casa do jeito certo.", tags: "banho, secagem, pele, dermatite", tech: { local: "Em casa", dica: "Secador morno, nunca quente" } },
  { key: "m1", by: "mia", title: "Como apresentar um gato novo para o gato da casa", thumbText: "Gato novo em casa", cat: "gatos", hours: 30, views: 12100, dur: 1480, desc: "Quarto separado, troca de cheiros, comida dos dois lados da porta. O passo a passo que uso com os meus 7 gatos.", tags: "gatos, adaptação, convivência, comportamento", tech: { especie: "Gato", dica: "Sem pressa: a apresentação leva semanas" } },
  { key: "m2", by: "mia", title: "Enriquecimento ambiental barato: 6 ideias com papelão", thumbText: "Brinquedos de papelão", cat: "diversao", hours: 500, views: 16900, dur: 903, desc: "Caixa de petisco, túnel, arranhador e caça ao tesouro. Tudo com o que você já tem em casa.", tags: "enriquecimento ambiental, gatos, brinquedo, faça você mesmo" },
  { key: "p1", by: "petlar", title: "Como escolher a ração certa para o seu cão", thumbText: "Qual ração escolher?", cat: "caes", hours: 60, views: 6980, dur: 612, desc: "Porte, idade e atividade: o que olhar na embalagem e as perguntas que mais ouvimos no balcão.", tags: "ração, alimentação, cachorro, pet shop", tech: { especie: "Cão", dica: "Troque a ração aos poucos, em 7 dias" } },
  { key: "j1", by: "julia", title: "Um dia de estágio na clínica veterinária", thumbText: "Um dia de estágio", cat: "saude", hours: 8, views: 2420, dur: 480, desc: "Da triagem ao pós-operatório: como é a rotina de uma estudante no estágio.", tags: "estudante, veterinária, estágio, rotina" },
  { key: "o1", by: "otavio", title: "Calopsita: o que pode e o que não pode comer", thumbText: "O que a calopsita come", cat: "aves", hours: 18, views: 4760, dur: 655, desc: "Frutas, legumes, sementes e os alimentos proibidos. Monto o prato da Lua ao vivo.", tags: "calopsita, aves, alimentação", tech: { especie: "Calopsita", nome_pet: "Lua", idade: "2 anos" } },
  { key: "o2", by: "otavio", title: "Coelho em apartamento: montei o espaço do zero", thumbText: "Coelho em apartamento", cat: "pequenos", hours: 110, views: 3240, dur: 611, desc: "Cercadinho, feno à vontade, caixa de areia e o que não pode ficar ao alcance.", tags: "coelho, roedores, apartamento", tech: { especie: "Coelho", porte: "Pequeno" } },
  // Respostas em vídeo
  { key: "resp1", by: "renata", parent: "b2", title: "Resposta: latido excessivo pode ser dor ou ansiedade", thumbText: "Latido? Pode ser saúde", cat: "saude", hours: 6, views: 940, dur: 290, desc: "Respondendo ao Bruno: antes de treinar, vale descartar dor e problemas de audição. Explico como.", tags: "resposta, latido, ansiedade, saúde" },
  { key: "resp2", by: "julia", parent: "r2", title: "Acompanhei a vacinação de um filhote no estágio", thumbText: "Vacinei um filhote", cat: "saude", hours: 40, views: 1300, dur: 520, desc: "Vi o vídeo da Dra. Renata e mostro como foi a primeira dose de um filhote na clínica do estágio.", tags: "resposta, vacina, filhote, estágio", tech: { especie: "Cão", idade: "45 dias" } },
  { key: "resp3", by: "petlar", parent: "b1", title: "Testamos o treino da guia com a Pipoca, cliente do pet shop", thumbText: "Testamos o treino da guia", cat: "adestramento", hours: 16, views: 610, dur: 410, desc: "Seguimos o passo a passo do Bruno com a Pipoca, uma vira-lata que vem toda semana. Olha no que deu depois de 5 dias.", tags: "resposta, guia, SRD" },
];

const videos: Record<string, string> = {};
const insVideo = db.prepare(`INSERT INTO videos (id, user_id, title, description, category, tags, thumb_key, duration, tech, parent_id, views, likes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insFts = db.prepare("INSERT INTO videos_fts (id, title, description, tags, tech, channel) VALUES (?, ?, ?, ?, ?, ?)");
const CAT_LABEL: Record<string, string> = { caes: "Cães", gatos: "Gatos", aves: "Aves", pequenos: "Roedores e coelhos", exoticos: "Peixes e exóticos", saude: "Saúde", adestramento: "Adestramento", "banho-e-tosa": "Banho e tosa", diversao: "Diversão" };

for (const [i, v] of VIDEOS.entries()) {
  const vid = id();
  videos[v.key] = vid;
  const thumbKey = `/demo/${v.key}.svg`;
  fs.writeFileSync(path.join(THUMBS, `${v.key}.svg`), thumb(v.thumbText, CAT_LABEL[v.cat] ?? "", i));
  const tech = JSON.stringify(v.tech ?? {});
  await insVideo.run(vid, users[v.by], v.title, v.desc, v.cat, v.tags, thumbKey, v.dur, tech, v.parent ? videos[v.parent] : null, v.views, Math.round(v.views * (0.04 + Math.random() * 0.05)), ago(v.hours));
  const u = USERS.find((x) => x.key === v.by)!;
  await insFts.run(vid, v.title, v.desc, v.tags.replace(/,/g, " "), Object.values(v.tech ?? {}).join(" "), `${u.name} ${u.handle}`);
}
await db.exec("UPDATE videos SET responses_count = (SELECT COUNT(*) FROM videos r WHERE r.parent_id = videos.id)");

/* ---------------- Seguidores ---------------- */

const FOLLOWS: [string, string[]][] = [
  ["lucas", ["renata", "bruno", "camila", "petlar"]],
  ["carla", ["bruno", "mia", "renata"]],
  ["joao", ["renata"]],
  ["julia", ["renata", "bruno", "mia", "otavio"]],
  ["otavio", ["renata", "mia", "julia"]],
  ["renata", ["bruno", "mia", "camila"]],
  ["bruno", ["renata", "camila", "julia"]],
  ["camila", ["renata", "petlar"]],
  ["mia", ["renata", "bruno"]],
  ["petlar", ["camila", "renata"]],
];
const insFollow = db.prepare("INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)");
for (const [who, list] of FOLLOWS) for (const t of list) await insFollow.run(users[who], users[t], ago(rand(10, 900)));
// Seguidores "externos" simulados para dar escala aos números
const extra: Record<string, number> = { renata: 21800, bruno: 34100, camila: 15400, mia: 9300, petlar: 2100, julia: 410, otavio: 180, admin: 1500 };
await db.exec(`UPDATE users SET
  followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id)`);
for (const [k, n] of Object.entries(extra)) await db.prepare("UPDATE users SET followers_count = followers_count + ? WHERE id = ?").run(n, users[k]);

/* ---------------- Comentários ---------------- */

const insComment = db.prepare("INSERT INTO comments (id, video_id, user_id, parent_id, body, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
async function comment(video: string, by: string, body: string, hours: number, parent?: string, likes = rand(0, 40)) {
  const cid = id();
  await insComment.run(cid, videos[video], users[by], parent ?? null, body, likes, ago(hours));
  return cid;
}

const c1 = await comment("r2", "otavio", "E para gato, o calendário é parecido? Vou adotar uma filhote mês que vem.", 60, undefined, 34);
await comment("r2", "renata", "@otavio.aves é parecido, mas com a V4 ou V5 felina. Vou fazer um vídeo só sobre gatos!", 58, c1, 51);
await comment("r2", "mia", "Por favor faz! É a pergunta que mais recebo também.", 55, c1, 12);
await comment("r2", "julia", "Salvei para revisar antes da prova de imunologia. Obrigada!", 40, undefined, 8);
const c2 = await comment("r2", "lucas", "Meu filhote pode ir na casa da minha mãe antes de completar as vacinas?", 30, undefined, 5);
await comment("r2", "camila", "@lucasm no colo e sem contato com outros cães costuma ser tranquilo, mas confirma com o seu vet.", 28, c2, 9);

const c3 = await comment("b2", "renata", "Antes de qualquer treino, vale um check-up. Já atendi cão que latia muito por dor no ouvido.", 10, undefined, 27);
await comment("b2", "bruno", "@dra.renata.vet ótimo ponto, vou colocar isso no próximo vídeo. Obrigado!", 9, c3, 6);
await comment("b2", "otavio", "Aqui ajudou deixar um som ambiente ligado quando a gente sai.", 8, undefined, 4);
await comment("b2", "mia", "Com gato é parecido: barulho de corredor estressa muito. Enriquecimento ajuda.", 7, undefined, 11);

await comment("r1", "bruno", "Muito importante. Muita gente acha que é 'manha' e é dor.", 18, undefined, 14);
await comment("r1", "carla", "Minha cachorra lambia a pata o tempo todo e eu nem imaginava. Obrigada!", 15, undefined, 3);
await comment("b1", "petlar", "Testamos com a Pipoca aqui do pet shop e postamos como resposta em vídeo!", 39, undefined, 19);
await comment("b1", "camila", "A diferença do dia 1 para o dia 7 ficou absurda.", 120, undefined, 7);
await comment("c1", "petlar", "Que acabamento! Vou mostrar para a nossa equipe de tosa.", 80, undefined, 44);
await comment("c1", "joao", "Quanto tempo leva em média uma tosa bebê dessa?", 50, undefined, 2);
await comment("m1", "renata", "Que didática! Vou indicar para os tutores do consultório.", 25, undefined, 9);
await comment("m2", "otavio", "Fiz a caixa de petisco para o coelho e ele amou também.", 80, undefined, 13);
await comment("j1", "renata", "Que bom ver estudante mostrando a rotina real. Continua postando!", 7, undefined, 22);
await comment("o1", "mia", "Não sabia que abacate era proibido para aves. Salvei!", 10, undefined, 6);

await db.exec(`UPDATE comments SET replies_count = (SELECT COUNT(*) FROM comments r WHERE r.parent_id = comments.id)`);
await db.exec(`UPDATE videos SET comments_count = (SELECT COUNT(*) FROM comments c WHERE c.video_id = videos.id)`);

/* ---------------- Curtidas, salvos, histórico ---------------- */

const insLike = db.prepare("INSERT INTO likes (user_id, video_id) VALUES (?, ?) ON CONFLICT DO NOTHING");
const insHist = db.prepare("INSERT INTO history (user_id, video_id, watched_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING");
for (const u of ["lucas", "carla", "joao", "julia", "otavio"]) {
  for (const v of Object.keys(videos)) {
    if (Math.random() < 0.35) await insLike.run(users[u], videos[v]);
    if (Math.random() < 0.5) await insHist.run(users[u], videos[v], ago(rand(1, 200)));
  }
}
await db.prepare("INSERT INTO saves (user_id, video_id) VALUES (?, ?)").run(users.lucas, videos.r2);
await db.prepare("INSERT INTO saves (user_id, video_id) VALUES (?, ?)").run(users.lucas, videos.b1);

/* ---------------- Verificação e moderação (exemplos para o painel) ---------------- */

// Solicitações pendentes: a análise automática roda quando um admin abre a fila (Admin → Verificações).
const insVerif = db.prepare(
  `INSERT INTO verification_requests (id, user_id, type, data, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending_review', ?, ?, ?)`,
);
const verifRequests: [string, string, Record<string, string>, number][] = [
  [
    "lucas",
    "professional",
    {
      nome: "Lucas Moreira",
      cidade: "Contagem, MG, Brasil",
      profissao: "Adestrador",
      especialidade: "Cães reativos e filhotes",
      empresa: "Escola Pata Amiga",
      cargo: "Adestrador",
      experiencia: "6 anos",
      instagram: "@lucas.adestra",
      website: "www.pataamiga.com.br",
      adicionais: "Atendo em domicílio e em turmas de socialização aos sábados.",
    },
    20,
  ],
  ["carla", "student", { nome: "Carla Souza", instituicao: "PUC Minas", curso: "Medicina Veterinária", cidade: "Belo Horizonte" }, 5],
  [
    "joao",
    "related",
    {
      nome: "João Pereira",
      cidade: "Ponta Grossa, PR, Brasil",
      profissao: "Pet shop e hotel para cães",
      empresa: "Hotelzinho Patas Felizes",
      cargo: "Proprietário",
      relacao: "Tenho um pet shop com hotel e creche para cães. Quero mostrar a rotina dos hóspedes e dicas de cuidado.",
      website: "www.patasfelizes.com.br",
    },
    2,
  ],
];
for (const [who, type, data, hours] of verifRequests) {
  const vid = id();
  await insVerif.run(vid, users[who], type, JSON.stringify(data), ago(hours), ago(hours), ago(hours));
  await db.prepare("INSERT INTO verification_events (id, request_id, actor_id, event, reason, created_at) VALUES (?, ?, ?, 'submitted', 'Solicitação enviada.', ?)").run(
    id(),
    vid,
    users[who],
    ago(hours),
  );
  await db.prepare("UPDATE users SET verification_status = 'pending' WHERE id = ?").run(users[who]);
}

await db.prepare(`INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, created_at) VALUES (?, ?, 'comment', ?, 'spam', ?, ?)`).run(
  id(),
  users.camila,
  ((await db.prepare("SELECT id FROM comments WHERE body LIKE 'Quanto tempo leva%'").get()) as { id: string }).id,
  "Exemplo de denúncia para testar o painel.",
  ago(2),
);

/* ---------------- Notificações ---------------- */

const insNotif = db.prepare("INSERT INTO notifications (id, user_id, actor_id, type, video_id, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
await insNotif.run(id(), users.bruno, users.renata, "video_response", videos.resp1, "Meu cachorro late para tudo. O que eu faço?", ago(6));
await insNotif.run(id(), users.renata, users.julia, "video_response", videos.resp2, "Calendário de vacinas do filhote: o que tomar e quando", ago(40));
await insNotif.run(id(), users.renata, users.julia, "follow", null, "", ago(30));
await insNotif.run(id(), users.lucas, users.renata, "new_video", videos.r1, "", ago(20));

console.log(`✔ Banco recriado: ${USERS.length} usuários, ${VIDEOS.length} vídeos.`);
console.log("  Senha de todas as contas de demonstração: pettube123");
console.log("  admin@pettube.com (admin) · renata@demo.com (profissional) · julia@demo.com (estudante) · lucas@demo.com · carla@demo.com · joao@demo.com (membros com verificação pendente)");

await sql.end();
