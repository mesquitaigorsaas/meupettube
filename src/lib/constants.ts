export const CATEGORIES = [
  { slug: "caes", name: "Cães" },
  { slug: "gatos", name: "Gatos" },
  { slug: "aves", name: "Aves" },
  { slug: "pequenos", name: "Roedores e coelhos" },
  { slug: "exoticos", name: "Peixes e exóticos" },
  { slug: "saude", name: "Saúde" },
  { slug: "adestramento", name: "Adestramento" },
  { slug: "banho-e-tosa", name: "Banho e tosa" },
  { slug: "diversao", name: "Diversão" },
  { slug: "outros", name: "Outros" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string | null | undefined) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? "Outros";
}

export const MEMBER_TYPES = {
  viewer: "Membro",
  student: "Estudante verificado",
  professional: "Profissional pet verificado",
  related: "Empresa pet verificada",
} as const;

export type MemberType = keyof typeof MEMBER_TYPES;

/** Tipos de membro que podem criar canal e publicar. */
export const PUBLISHER_TYPES = ["professional", "student", "related"] as const;

export function isPublisherType(t: string | null | undefined) {
  return (PUBLISHER_TYPES as readonly string[]).includes(t ?? "");
}

/**
 * Status de verificação do usuário.
 * Equivalência com a especificação: none=UNVERIFIED, pending=PENDING_REVIEW, under_review=UNDER_REVIEW,
 * needs_info=MORE_INFORMATION_REQUIRED, verified=VERIFIED, rejected=REJECTED, review=REVIEW_REQUIRED.
 * SUSPENDED é o status da conta (users.status), independente da verificação.
 */
export const VERIFICATION_STATUS = {
  none: "Não verificado",
  pending: "Aguardando análise",
  under_review: "Em análise pela equipe",
  needs_info: "Precisa de mais informações",
  verified: "Verificado",
  rejected: "Recusado",
  review: "Revisão necessária",
} as const;

export type VerificationStatus = keyof typeof VERIFICATION_STATUS;

export const VERIFICATION_TYPES = {
  professional: "Profissional pet",
  student: "Estudante",
  related: "Pet shop / empresa pet",
} as const;

export type VerificationType = keyof typeof VERIFICATION_TYPES;

export const AI_STATUS = {
  high_confidence: "Alta confiança",
  medium_confidence: "Média confiança",
  low_confidence: "Baixa confiança",
  inconsistent: "Inconsistente — revisão",
} as const;

export type AiStatus = keyof typeof AI_STATUS;

export const REPORT_REASONS = {
  spam: "Spam",
  fraude: "Fraude",
  assedio: "Assédio",
  ilegal: "Conteúdo ilegal",
  ofensivo: "Conteúdo ofensivo",
  conta_falsa: "Conta falsa",
  manipulacao: "Manipulação",
  fora_do_tema: "Não relacionado à proposta da plataforma",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

/** Campos técnicos opcionais que o criador pode informar em cada vídeo. */
export const TECH_FIELDS = [
  { key: "especie", label: "Espécie", placeholder: "Ex.: Cão, gato, calopsita" },
  { key: "raca", label: "Raça", placeholder: "Ex.: Shih tzu, SRD" },
  { key: "idade", label: "Idade do pet", placeholder: "Ex.: 3 anos" },
  { key: "porte", label: "Porte", placeholder: "Ex.: Pequeno, médio, grande" },
  { key: "nome_pet", label: "Nome do pet", placeholder: "Ex.: Thor" },
  { key: "produtos", label: "Produtos usados", placeholder: "Ex.: Shampoo neutro, petisco natural" },
  { key: "local", label: "Local", placeholder: "Ex.: Em casa, parque, clínica" },
  { key: "dica", label: "Dica principal", placeholder: "O que você quer que as pessoas lembrem" },
  { key: "observacoes", label: "Observações", placeholder: "Qualquer detalhe que ajude" },
] as const;

export type TechInfo = Partial<Record<(typeof TECH_FIELDS)[number]["key"], string>>;

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB por vídeo (limite do plano grátis do Supabase Storage)
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Campos do formulário de verificação por tipo de candidato.
 * O campo "evidence" indica o grupo de evidência (usado pelos provedores em lib/verification).
 * Nenhum documento é obrigatório de início: a análise pede mais informações só quando necessário.
 */
export type VerificationField = {
  key: string;
  label: string;
  required?: boolean;
  long?: boolean;
  placeholder?: string;
  evidence: "identity" | "location" | "professional" | "business" | "academic" | "online" | "other";
};

const COMMON_ONLINE: VerificationField[] = [
  { key: "instagram", label: "Seu perfil do Instagram", placeholder: "@seuperfil", evidence: "online" },
  { key: "website", label: "Site profissional", placeholder: "www.seupetshop.com.br", evidence: "online" },
  { key: "outros_perfis", label: "Outros perfis profissionais", placeholder: "LinkedIn, TikTok, YouTube…", evidence: "online" },
];

export const VERIFICATION_FIELDS: Record<VerificationType, VerificationField[]> = {
  professional: [
    { key: "nome", label: "Nome profissional", required: true, evidence: "identity" },
    { key: "cidade", label: "Cidade / estado / país", required: true, placeholder: "Belo Horizonte, MG, Brasil", evidence: "location" },
    { key: "profissao", label: "Profissão", required: true, placeholder: "Veterinário, adestrador, groomer, criador…", evidence: "professional" },
    { key: "especialidade", label: "Especialidade", placeholder: "Felinos, comportamento, tosa na tesoura…", evidence: "professional" },
    { key: "empresa", label: "Clínica / empresa onde atua", required: true, evidence: "business" },
    { key: "cargo", label: "Cargo", placeholder: "Veterinário responsável, proprietário, tosador…", evidence: "business" },
    { key: "experiencia", label: "Tempo de experiência", required: true, placeholder: "Ex.: 6 anos", evidence: "professional" },
    ...COMMON_ONLINE,
    { key: "portfolio", label: "Portfólio", placeholder: "Link para fotos, trabalhos, matérias…", evidence: "online" },
    { key: "adicionais", label: "Informações adicionais", long: true, evidence: "other" },
  ],
  student: [
    { key: "nome", label: "Nome completo", required: true, evidence: "identity" },
    { key: "instituicao", label: "Instituição de ensino", required: true, evidence: "academic" },
    { key: "curso", label: "Nome do curso", required: true, placeholder: "Medicina Veterinária, Zootecnia, Técnico em Banho e Tosa…", evidence: "academic" },
    { key: "area", label: "Área", placeholder: "Veterinária, zootecnia, comportamento animal…", evidence: "academic" },
    { key: "periodo", label: "Período / módulo", evidence: "academic" },
    { key: "cidade", label: "Cidade", required: true, evidence: "location" },
    { key: "matricula", label: "Matrícula ou identificação estudantil", evidence: "academic" },
    ...COMMON_ONLINE,
    { key: "adicionais", label: "Informações adicionais", long: true, evidence: "other" },
  ],
  related: [
    { key: "nome", label: "Nome profissional", required: true, evidence: "identity" },
    { key: "cidade", label: "Cidade / estado / país", required: true, evidence: "location" },
    { key: "profissao", label: "Área de atuação", required: true, placeholder: "Pet shop, rações, acessórios, ONG, hotel para pets…", evidence: "professional" },
    { key: "empresa", label: "Empresa", required: true, evidence: "business" },
    { key: "cargo", label: "Cargo", evidence: "business" },
    { key: "relacao", label: "Qual a relação do seu trabalho com o mundo pet?", required: true, long: true, evidence: "professional" },
    { key: "experiencia", label: "Tempo de experiência", evidence: "professional" },
    ...COMMON_ONLINE,
    { key: "adicionais", label: "Informações adicionais", long: true, evidence: "other" },
  ],
};

/** @ que ninguém pode usar (rotas do site e nome da marca). */
export const RESERVED_HANDLES = new Set(["admin", "studio", "me", "watch", "feed", "api", "media", "login", "signup", "pettube", "pet", "suporte"]);
