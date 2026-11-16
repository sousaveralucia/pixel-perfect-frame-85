export interface Section { id: number; title: string; blocking: boolean; items: string[] }
export const TRADE_CHECKLIST: Section[] = [
  { id: 1, title: "Modo CAÇA (antes do trade)", blocking: false, items: ["Preço na zona do HTF/MTF", "Sem notícia forte agora (ou decidi ficar de fora)", "Check emocional ok", "Não bati $200 nem levei 2 stops no dia"] },
  { id: 2, title: "Fluxo HTF > MTF", blocking: true, items: ["30m com direção definida", "15m alinhado", "5m zona e estrutura a favor", "Só a favor do fluxo, origem da fibo intacta"] },
  { id: 3, title: "Zona (HTF/MTF)", blocking: true, items: ["Fibo na perna de impulso correta", "Preço em desconto (compra) / prêmio (venda) além dos 50%", "OB coincidindo com 50/62/75/85/100%", "Liquidez varrida antes ou durante a entrada na zona"] },
  { id: 4, title: "Gatilho (LTF)", blocking: true, items: ["CHoCH do M1/M2 fechado na zona após CHoCH/BOS do MTF/HTF", "5m não está contra", "OB do LTF (M1, M2 ou M5 no máx.) do lado certo dos 50%", "Fibo do LTF do começo da perna ao topo do CHoCH", "Recuo a 75% ou 85% (62% e 50% não pego)"] },
  { id: 5, title: "Execução", blocking: true, items: ["Entrada no OB em 75% ou 85%", "Stop no começo da perna (folga de spread)", "Stop em pontos cabe na régua (OB não gigante)", "Mão padrão fixa", "Alvo mínimo 1:3 com espaço livre", "RR real ≥ 1:3 depois do spread"] },
  { id: 6, title: "Gestão", blocking: false, items: ["BOS confirmado = stop no breakeven", "Não mexo no stop antes do BOS", "Sem adicionar posição", "Fim em stop, BE ou alvo — sem fechar por medo"] },
  { id: 7, title: "Pós-trade", blocking: false, items: ["Print salvo", "Anotei hora, ativo, stop em pontos, RR e resultado", "Revisei qual item faltou", "Cumpri o plano"] },
];

export const SCAN_ITEMS = ["30m: direção e último BOS/CHoCH", "Fibo ativa traçada", "Origem intacta (senão RESET)", "Em que nível está o preço", "Alertas conferidos", "Houve CHoCH LTF na zona? (se sim, CAÇA)", "Notícia forte próxima?", "Estou calmo e sem pressa", "Atualizei o modo e anotei"];

export const THERMO = [{ k: "sono", l: "Sono e descanso" }, { k: "energia", l: "Energia" }, { k: "foco", l: "Foco" }, { k: "calma", l: "Calma (sem irritação)" }, { k: "plano", l: "Vontade de seguir o plano" }];
export const HONEST_Q = ["Raiva, ansiedade ou irritação por algo de fora?", "Preciso do lucro de hoje para uma conta?", "Quero recuperar prejuízo anterior?", "Estou eufórico por ganho recente?", "Dormi mal ou estou muito cansado?", "Fome, sede ou cafeína demais?"];

export const ROUTINE: Record<string, string[]> = {
  "Noite anterior": ["Dormir 7 a 8 h", "Sem gráfico na última hora", "Sem álcool nem refeição pesada", "Horário de acordar definido", "Mesa organizada"],
  "Manhã": ["Água", "Movimento físico", "Refeição equilibrada", "Cafeína moderada", "Sem redes nem discussões cedo", "Pendências resolvidas"],
  "Abertura": ["Calendário de notícias conferido", "30m dos dois ativos (fluxo e último BOS/CHoCH)", "Fibos ativas traçadas, origem intacta", "Alertas em 50/62/75/85% e na origem", "Modo de cada ativo definido", "Check emocional", "Intenção do dia escrita à mão", "Checklist e régua à vista"],
  "Durante": ["Scans no ritmo do modo", "Alerta tocou = abrir M5/M2/M1", "Respirar e levantar entre trades", "Sem conversar sobre mercado nem olhar outras contas"],
  "Fim do dia": ["Plataforma fechada", "Prints salvos e log de scans fechado", "Diário escrito", "Resultado e checklist anotados", "Plano de amanhã", "Atividade fora da tela"],
};

export const STEPS: { phase: string; n: number; title: string; text: string; blank: string }[] = [
  { phase: "LER", n: 1, title: "FLUXO", text: "30m, 15m e 5m na mesma direção. O último BOS/CHoCH define o lado.", blank: "30m, 15m e 5m na mesma ____. O último ____ define o lado." },
  { phase: "LER", n: 2, title: "FIBO", text: "Fibo na perna de impulso do HTF/MTF, da origem ao topo, logo após CHoCH ou BOS.", blank: "Fibo na perna de ____ do HTF/MTF, da ____ ao topo." },
  { phase: "LER", n: 3, title: "ZONA", text: "Preço volta ao desconto/prêmio em 50, 62, 75, 85 ou 100% com OB coincidindo.", blank: "Preço volta ao ____ em 50, 62, 75, 85 ou 100% com ____ coincidindo." },
  { phase: "GATILHO", n: 4, title: "VARREDURA", text: "Liquidez varrida antes ou durante a entrada na zona (pavio passa e fecha de volta).", blank: "____ varrida antes ou durante a entrada na zona." },
  { phase: "GATILHO", n: 5, title: "CHoCH LTF", text: "Candle FECHA além do último topo/fundo no M1/M2 dentro da zona. Pavio sozinho não vale.", blank: "Candle ____ além do último topo no M1/M2. ____ sozinho não vale." },
  { phase: "GATILHO", n: 6, title: "OB DO LTF", text: "OB de M1, M2 ou no máximo M5, do lado certo dos 50%.", blank: "OB de M1, M2 ou no máximo ____, do lado certo dos ____." },
  { phase: "EXECUTAR", n: 7, title: "ENTRADA", text: "Fibo da perna do LTF. Só entro em 75% ou 85% dentro do OB.", blank: "Só entro em ____ ou ____ dentro do OB." },
  { phase: "EXECUTAR", n: 8, title: "STOP", text: "No começo da perna do LTF com folga de spread. Cabe na régua. Mão fixa.", blank: "No ____ da perna do LTF. Cabe na ____." },
  { phase: "EXECUTAR", n: 9, title: "ALVO", text: "Mínimo 1:3. A 75% o 1:3 cai no topo da perna; a 85% cai antes.", blank: "Mínimo ____. A 75% o alvo cai no ____ da perna." },
  { phase: "GERIR", n: 10, title: "BOS = BE", text: "Candle fecha além do topo da perna → stop no breakeven. Antes disso não mexo.", blank: "Candle fecha além do topo → stop no ____." },
  { phase: "GERIR", n: 11, title: "RESET", text: "Rompeu a origem: nova fibo na perna que rompeu, espera recuo, novo CHoCH, volta ao passo 1.", blank: "Rompeu a ____: nova ____ na perna que rompeu." },
];

export const GLOSSARY: [string, string][] = [
  ["BOS", "Break of Structure — candle fecha além do último topo/fundo a favor da tendência."],
  ["CHoCH", "Change of Character — primeiro rompimento contra a estrutura anterior, sinal de virada."],
  ["Liquidez / Varredura", "Stops acumulados além de extremos; varredura = pavio passa do extremo e fecha de volta."],
  ["Order Block", "Último candle contrário antes do impulso que rompeu a estrutura."],
  ["Prêmio / Desconto", "Acima / abaixo dos 50% da perna. Compro no desconto, vendo no prêmio."],
  ["HTF / MTF / LTF", "30m / 15m e 5m / M2 e M1."],
  ["RESET", "Origem da perna rompida: arquivar fibo e traçar nova na nova tendência."],
];

export const PAUSE_PROTOCOL = ["Esconder o gráfico e levantar", "Respirar 4s / segura 4s / solta 6s — 5 vezes", "Beber água e olhar longe", "Nomear a emoção em voz baixa", "Voltar só com checklist 100%"];
export const COMMITMENTS = ["Cada trade pode dar stop e o risco já foi aceito", "O objetivo é executar o checklist, não ganhar $200", "Item desmarcado = não entro", "Não mexo no stop antes do BOS nem na mão", "$200 batidos ou 2 stops = encerro o dia"];

export function blockingComplete(checks: Record<string, boolean>): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  TRADE_CHECKLIST.filter(s => s.blocking).forEach(s => s.items.forEach((it, i) => { if (!checks[`${s.id}.${i}`]) missing.push(`S${s.id}: ${it}`); }));
  return { ok: missing.length === 0, missing };
}
