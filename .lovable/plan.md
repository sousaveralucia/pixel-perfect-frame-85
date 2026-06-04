## Gate de Operação Diário — Plano de Implementação

Objetivo: tornar o **Check-In Pré Mercado** obrigatório em dias úteis (Seg–Sex), bloquear todas as áreas operacionais até sua conclusão, resetar tudo automaticamente às 00:00 GMT-3, exigir **Check-Out Pós Mercado** ao final, manter histórico e cruzar com performance.

---

### 1. Banco de dados (migrations)

**Tabela `daily_validations` (já existe)** — adicionar colunas:
- `checkin_completed_at timestamptz`
- `checkout_completed_at timestamptz`
- `emotional_state text` (calmo, focado, ansioso, irritado, frustrado, sobrecarregado, confiante…)
- `mental_clarity int` (1–10)
- `physical_state text`
- `sleep_hours numeric`
- `hydration text` (low/medium/high)
- `daily_intention text`
- `readiness_score int` (0–100, calculado)
- `day_result numeric` (preenchido no check-out)
- `trades_count int`
- `performance_score int`
- `checkout_notes text`
- `lockout_until timestamptz` (proteção: stop diário, 3 losses, meta)

GRANTs já existentes mantidos.

---

### 2. Lógica temporal (GMT-3)

Util `src/lib/dailyGate.ts`:
- `getTradingDate()` — retorna `YYYY-MM-DD` no fuso America/Sao_Paulo (GMT-3, sem DST oficial).
- `isWeekday(date)` — Seg–Sex.
- `msUntilNextReset()` — ms até 00:00 GMT-3.
- `calcReadinessScore(checkin)` — fórmula ponderada (emocional 30%, clareza 25%, sono 20%, hidratação 10%, físico 15%).

O “dia” em todo o sistema passa a usar `getTradingDate()` em vez de `toISOString().split('T')[0]`.

---

### 3. Contexto global `DailyGateContext`

`src/contexts/DailyGateContext.tsx`:
- Carrega `daily_validations` do dia atual (tradingDate) por usuário+conta.
- Expõe:
  - `status: "not_started" | "checked_in" | "trading" | "closed" | "weekend" | "locked_out"`
  - `isOperationAllowed: boolean`
  - `checkin`, `checkout`, `readinessScore`
  - `lockoutUntil`
  - `refresh()`, `setCheckin()`, `setCheckout()`, `triggerLockout(reason)`
- Timer interno: ao detectar virada de dia (GMT-3), faz `refresh()` automático → status volta a `not_started` (ou `weekend`).
- Em fim de semana: `status = "weekend"`, `isOperationAllowed = true` apenas para leitura (consulta).

Adicionar `<DailyGateProvider>` em `App.tsx` dentro de `AccountProvider`.

---

### 4. Status bar global

`src/components/DailyStatusBar.tsx` fixa no topo de `Home`:
- 🔴 Dia não iniciado
- 🟡 Check-In realizado
- 🟢 Operação liberada (após primeiro trade ou botão "Iniciar Operação")
- 🔵 Dia encerrado (após check-out)
- ⚪ Fim de semana (modo consulta)
- 🔒 Bloqueado até 00:00 GMT-3 (com countdown)

---

### 5. Gate de bloqueio

`src/components/OperationGate.tsx`:
- Wrapper que, se `!isOperationAllowed && !isReadOnlyTab`, renderiza tela de bloqueio com mensagem padrão e CTA "Ir para Check-In".
- Aplicar em tabs: Dashboard, Registrar Trade, Diário, Análises, Relatórios, Estatísticas, Galeria, Notas.
- Fim de semana: libera apenas tabs de consulta (Relatórios, Histórico, Estudos).

Editar `src/pages/Home.tsx` para envolver o `<TabsContent>` operacionais com `<OperationGate>`.

---

### 6. Check-In Pré Mercado (expandir `DailyValidation.tsx`)

Adicionar formulário extra após validação básica:
- Estado emocional (chips)
- Clareza mental (slider 1–10)
- Estado físico (chips)
- Horas de sono (input)
- Hidratação (low/medium/high)
- Intenção do dia (textarea)
- Botão "Concluir Check-In" → calcula `readiness_score`, salva `checkin_completed_at`, atualiza contexto.
- Alerta automático se emoção negativa + score < 60.

---

### 7. Check-Out Pós Mercado

`src/components/DailyCheckout.tsx`:
- Aparece quando `status === "trading"` e usuário clica "Encerrar Dia" ou ao fim do pregão.
- Mostra resumo: trades do dia, P&L, winrate.
- Campos: notas, lições, performance_score auto-calculado (resultado + aderência ao plano).
- Botão "Concluir Check-Out" → status = "closed".

---

### 8. Histórico de Preparação

`src/components/PreparationHistory.tsx`:
- Lista todos os `daily_validations` com check-in completo.
- Colunas conforme especificado (data, emocional, clareza, físico, sono, hidratação, intenção, readiness, resultado, trades, performance).
- Filtros por mês e busca por estado emocional.

`src/components/PsychPerformanceReport.tsx`:
- Cruza check-in × resultados:
  - Winrate por estado emocional
  - Lucro médio por estado emocional
  - Correlação sono × resultado (scatter)
  - Correlação hidratação × resultado
  - Correlação clareza mental × resultado
  - Melhor/pior estado emocional

Adicionar nova aba "Preparação" na navegação (`Home.tsx` + `MobileNav.tsx`).

---

### 9. Lockout (proteção diária)

No `useTradeJournalUnified` (ou onde resultado é gravado):
- Após salvar trade, recomputar: se `losses >= 3` OU `wins >= 2` (meta) OU stop diário → `triggerLockout()` que grava `lockout_until = próximo 00:00 GMT-3` em `daily_validations`.
- `DailyGateContext` lê `lockout_until`; se `now < lockout_until`, força `status = "locked_out"` mesmo em check-in válido.
- Mensagem de bloqueio com countdown até 00:00 GMT-3.

---

### Arquivos a criar
- `src/lib/dailyGate.ts`
- `src/contexts/DailyGateContext.tsx`
- `src/components/DailyStatusBar.tsx`
- `src/components/OperationGate.tsx`
- `src/components/DailyCheckout.tsx`
- `src/components/PreparationHistory.tsx`
- `src/components/PsychPerformanceReport.tsx`
- Migration ampliando `daily_validations`

### Arquivos a editar
- `src/App.tsx` (provider)
- `src/pages/Home.tsx` (status bar + gates + nova aba)
- `src/components/MobileNav.tsx` (nova aba)
- `src/components/DailyValidation.tsx` (formulário expandido + readiness)
- `src/components/TradeJournalEnhanced.tsx` (lockout trigger no save)

---

### Notas técnicas
- GMT-3 fixo (sem DST) usando offset manual ou `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`.
- Reset não precisa de cron — é puramente client-side via `setInterval` que recalcula `tradingDate` e refaz fetch.
- Bloqueio é client-side (UX); RLS continua protegendo dados. Não adiciona enforcement server-side de horário (fora do escopo declarado).

Confirme para eu implementar.