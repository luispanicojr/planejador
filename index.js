import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Scale, 
  Utensils, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Calendar,
  ChevronRight,
  Info,
  Sparkles,
  BrainCircuit,
  Dumbbell,
  ChefHat,
  Loader2,
  X,
  Menu
} from 'lucide-react';

const App = () => {
  // --- API Key (Injetada pelo ambiente) ---
  const apiKey = ""; 

  // --- Estados (Dados do Usuário) ---
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75); // kg
  const [height, setHeight] = useState(175); // cm
  const [activityLevel, setActivityLevel] = useState(1.55);
  const [goal, setGoal] = useState(0); // 0 = manter, -500 = perder, +500 = ganhar

  // --- Estados (Controle da Dieta) ---
  const [proteinRatio, setProteinRatio] = useState(2.0); // g/kg
  const [fatPercent, setFatPercent] = useState(25); // %

  // --- Estados (IA) ---
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState(null); // 'diet' or 'coach'

  // --- Resultados Calculados ---
  const [results, setResults] = useState({
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    macros: { p: 0, f: 0, c: 0 }, // gramas
    cals: { p: 0, f: 0, c: 0 }    // calorias
  });

  // --- Effect: Realiza os cálculos sempre que um input muda ---
  useEffect(() => {
    // 1. TMB (Mifflin-St Jeor)
    let bmrCalc = (10 * weight) + (6.25 * height) - (5 * age);
    bmrCalc += gender === 'male' ? 5 : -161;

    // 2. TDEE (Gasto Total)
    const tdeeCalc = bmrCalc * activityLevel;

    // 3. Alvo Calórico
    const targetCalc = tdeeCalc + goal;

    // 4. Macros
    // Proteína: Baseada no peso (g/kg)
    const proteinGrams = weight * proteinRatio;
    const proteinCals = proteinGrams * 4;

    // Gordura: Baseada na porcentagem calórica
    const fatCals = targetCalc * (fatPercent / 100);
    const fatGrams = fatCals / 9;

    // Carbo: O restante
    let remainingCals = targetCalc - (proteinCals + fatCals);
    if (remainingCals < 0) remainingCals = 0;
    const carbGrams = remainingCals / 4;

    setResults({
      bmr: Math.round(bmrCalc),
      tdee: Math.round(tdeeCalc),
      targetCalories: Math.round(targetCalc),
      macros: {
        p: Math.round(proteinGrams),
        f: Math.round(fatGrams),
        c: Math.round(carbGrams)
      },
      cals: {
        p: Math.round(proteinCals),
        f: Math.round(fatCals),
        c: Math.round(remainingCals)
      }
    });
  }, [gender, age, weight, height, activityLevel, goal, proteinRatio, fatPercent]);

  // --- Função para Chamar o Gemini ---
  const callGemini = async (mode) => {
    setAiLoading(true);
    setAiMode(mode);
    setAiModalOpen(true);
    setAiResponse(null);

    const goalLabel = goal < 0 ? "Perda de Gordura Agressiva" : goal > 0 ? "Ganho de Massa Muscular" : "Manutenção de Peso";
    const activityLabel = activityLevel < 1.4 ? "Sedentário/Leve" : activityLevel > 1.7 ? "Atleta/Muito Ativo" : "Moderado";

    let prompt = "";

    if (mode === 'diet') {
      prompt = `Você é um nutricionista de elite. Crie um exemplo de cardápio diário (Café da Manhã, Almoço, Lanche, Jantar) para uma pessoa com as seguintes metas EXATAS:
      - Calorias Totais: ${results.targetCalories} kcal
      - Proteína: ${results.macros.p}g
      - Gordura: ${results.macros.f}g
      - Carboidratos: ${results.macros.c}g
      
      O objetivo é ${goalLabel}. Sugira alimentos limpos e saudáveis. Seja direto, use formatação de lista e emojis para cada refeição. Não faça introduções longas.`;
    } else if (mode === 'coach') {
      prompt = `Você é um treinador físico experiente. Analise este perfil:
      - Nível de Atividade Atual: ${activityLabel}
      - Objetivo: ${goalLabel}
      - TMB: ${results.bmr} kcal
      
      Dê 3 conselhos estratégicos curtos e diretos sobre treino (musculação vs cardio) e recuperação para otimizar os resultados dessa pessoa específica. Use um tom motivador e profissional.`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiResponse(text || "Não foi possível gerar a resposta. Tente novamente.");
    } catch (error) {
      console.error("Erro na IA:", error);
      setAiResponse("Desculpe, o serviço de IA está indisponível no momento. Verifique sua conexão.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- Componentes de UI Auxiliares ---
  
  const Card = ({ children, className = "" }) => (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg ${className}`}>
      {children}
    </div>
  );

  const Label = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs font-bold uppercase tracking-wider select-none">
      {Icon && <Icon size={14} className="text-blue-500" />}
      {text}
    </div>
  );

  const InputGroup = ({ label, value, onChange, type = "number", suffix }) => (
    <div className="flex flex-col">
      <label className="text-[10px] text-zinc-500 mb-1 ml-1 font-bold uppercase tracking-wider select-none">{label}</label>
      <div className="relative active:scale-[0.98] transition-transform duration-100">
        <input
          type={type}
          inputMode="decimal" // Abre teclado numérico no celular
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium text-lg"
        />
        {suffix && <span className="absolute right-4 top-3.5 text-zinc-600 text-sm select-none">{suffix}</span>}
      </div>
    </div>
  );

  // Formata o texto da IA para exibir quebras de linha
  const FormatAIResponse = ({ text }) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <p key={i} className={`mb-2 text-sm leading-relaxed ${line.startsWith('-') || line.startsWith('*') ? 'ml-4' : ''}`}>
        {line.replace(/\*\*/g, '')}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500 selection:text-white pb-safe-area-bottom touch-manipulation">
      {/* Importando Montserrat via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Montserrat', sans-serif; -webkit-tap-highlight-color: transparent; }
        /* Utilitário para Safe Area do iPhone (Notch) */
        .pb-safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .pt-safe-area-top { padding-top: env(safe-area-inset-top, 20px); }
      `}</style>

      {/* Header Mobile-First */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-20 pt-safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
              <Activity size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Meta<span className="text-blue-500">Flux</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold bg-zinc-800 px-2 py-1 rounded-full text-zinc-400 flex items-center gap-1 border border-zinc-700/50">
              <span>v2.1</span>
              <Sparkles size={8} className="text-yellow-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Card de Calorias (O mais importante no topo) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-1 shadow-2xl shadow-blue-900/20 active:scale-[0.99] transition-transform duration-200">
          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-[20px] p-5 h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-blue-400 font-bold text-[10px] tracking-widest uppercase">Meta Diária</span>
                <div className="text-5xl font-extrabold text-white mt-1 tracking-tighter">
                  {results.targetCalories}
                </div>
                <span className="text-sm font-medium text-zinc-400">kcal</span>
              </div>
              {/* Mini Gráfico Visual */}
              <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 flex items-center justify-center">
                 <TrendingUp size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-xs border-t border-zinc-700/50 pt-3">
              <div>
                <p className="text-zinc-500 mb-0.5">Basal (TMB)</p>
                <p className="font-mono text-zinc-300 text-sm">{results.bmr}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 mb-0.5">Gasto Total</p>
                <p className="font-mono text-zinc-300 text-sm">{results.tdee}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Inputs (Agrupados para mobile) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1">
            <span className="w-1 h-5 bg-blue-600 rounded-full block"></span>
            Configuração
          </h2>
          
          <Card>
            {/* Gênero */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-4 select-none">
              <button 
                onClick={() => setGender('male')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${gender === 'male' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                Masculino
              </button>
              <button 
                onClick={() => setGender('female')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${gender === 'female' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                Feminino
              </button>
            </div>

            {/* Dados Biométricos */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="col-span-2">
                 <InputGroup label="Idade" value={age} onChange={setAge} suffix="anos" />
               </div>
               <InputGroup label="Peso" value={weight} onChange={setWeight} suffix="kg" />
               <InputGroup label="Altura" value={height} onChange={setHeight} suffix="cm" />
            </div>

            {/* Nível Atividade */}
            <div className="mb-1">
               <label className="text-[10px] text-zinc-500 mb-1 ml-1 font-bold uppercase tracking-wider select-none">Nível de Atividade</label>
               <select 
                  value={activityLevel} 
                  onChange={(e) => setActivityLevel(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none text-sm font-medium"
               >
                  <option value={1.2}>Sedentário (Escritório)</option>
                  <option value={1.375}>Leve (1-3 dias)</option>
                  <option value={1.55}>Moderado (3-5 dias)</option>
                  <option value={1.725}>Intenso (6-7 dias)</option>
                  <option value={1.9}>Atleta (2x ao dia)</option>
               </select>
            </div>
          </Card>
        </section>

        {/* Objetivo (Botões Grandes para Toque) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1">
             <span className="w-1 h-5 bg-green-500 rounded-full block"></span>
             Objetivo
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: -500, label: 'Perder', icon: TrendingDown, color: 'text-red-400', border: 'border-red-900/30' },
              { val: 0, label: 'Manter', icon: Scale, color: 'text-blue-400', border: 'border-blue-900/30' },
              { val: 500, label: 'Ganhar', icon: TrendingUp, color: 'text-green-400', border: 'border-green-900/30' }
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setGoal(opt.val)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 active:scale-95 ${
                  goal === opt.val 
                    ? 'bg-zinc-100 text-black border-white shadow-lg shadow-white/10' 
                    : `bg-zinc-900 border-zinc-800 text-zinc-500 ${opt.color} hover:bg-zinc-800`
                }`}
              >
                <opt.icon size={20} className={`mb-1 ${goal === opt.val ? 'text-black' : opt.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Macros (Sliders Otimizados) */}
        <section className="space-y-4">
            <Card className="border-t-4 border-t-zinc-700 pb-6">
              <h3 className="text-base font-bold mb-6 text-zinc-100 flex items-center gap-2">
                 <Utensils size={16} className="text-zinc-400" />
                 Distribuição de Macros
              </h3>

              {/* Sliders Container */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-blue-400">PROT</span>
                    <span className="text-blue-400 font-mono text-sm font-bold bg-blue-400/10 px-2 rounded">{proteinRatio} g/kg</span>
                  </div>
                  <input 
                    type="range" min="1.2" max="3.5" step="0.1" 
                    value={proteinRatio} 
                    onChange={(e) => setProteinRatio(e.target.value)}
                    className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-yellow-500">GORD</span>
                    <span className="text-yellow-500 font-mono text-sm font-bold bg-yellow-500/10 px-2 rounded">{fatPercent}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="50" step="5" 
                    value={fatPercent} 
                    onChange={(e) => setFatPercent(e.target.value)}
                    className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 touch-none"
                  />
                </div>
              </div>

              {/* Barras de Progresso Visuais */}
              <div className="mt-8 space-y-3">
                 {/* Proteína */}
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 w-12 font-bold">PROT</span>
                    <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${(results.cals.p / results.targetCalories) * 100}%` }}></div>
                    </div>
                    <span className="font-mono text-zinc-200 w-16 text-right">{results.macros.p}g</span>
                 </div>
                 {/* Gordura */}
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 w-12 font-bold">GORD</span>
                    <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-yellow-500" style={{ width: `${fatPercent}%` }}></div>
                    </div>
                    <span className="font-mono text-zinc-200 w-16 text-right">{results.macros.f}g</span>
                 </div>
                 {/* Carbo */}
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 w-12 font-bold">CARB</span>
                    <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500" style={{ width: `${(results.cals.c / results.targetCalories) * 100}%` }}></div>
                    </div>
                    <span className="font-mono text-zinc-200 w-16 text-right">{results.macros.c}g</span>
                 </div>
              </div>
            </Card>
        </section>

        {/* AI Buttons - Estilo "Card de Ação" */}
        <section className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => callGemini('diet')}
            className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 active:bg-zinc-800"
          >
             <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-indigo-900/20 to-transparent"></div>
             <div className="bg-zinc-800 p-3 rounded-xl text-indigo-400 group-active:scale-90 transition-transform">
               <ChefHat size={20} />
             </div>
             <div className="text-left z-10">
               <h4 className="font-bold text-zinc-100 text-sm">Gerar Cardápio</h4>
               <p className="text-[10px] text-zinc-500 mt-0.5">Criar dieta baseada em {results.targetCalories} kcal</p>
             </div>
             <ChevronRight className="ml-auto text-zinc-600" size={18} />
          </button>

          <button 
            onClick={() => callGemini('coach')}
            className="relative overflow-hidden group bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 active:bg-zinc-800"
          >
             <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-purple-900/20 to-transparent"></div>
             <div className="bg-zinc-800 p-3 rounded-xl text-purple-400 group-active:scale-90 transition-transform">
               <Dumbbell size={20} />
             </div>
             <div className="text-left z-10">
               <h4 className="font-bold text-zinc-100 text-sm">Coach de Treino</h4>
               <p className="text-[10px] text-zinc-500 mt-0.5">Dicas estratégicas para seu perfil</p>
             </div>
             <ChevronRight className="ml-auto text-zinc-600" size={18} />
          </button>
        </section>

        {/* Ciclo de Carbo (Simplificado para Mobile) */}
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 px-1">
              <span className="w-1 h-5 bg-purple-500 rounded-full block"></span>
              Ciclo Semanal
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 min-w-max">
                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => {
                  const isHigh = [0, 2, 4].includes(i); // Seg, Qua, Sex
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold">{d}</span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border ${
                        isHigh 
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}>
                        {isHigh ? 'HI' : 'LO'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 text-[10px] justify-center border-t border-zinc-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-zinc-400">Alto: <span className="text-zinc-200 font-mono">{Math.round(results.macros.c * 1.2)}g</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                  <span className="text-zinc-400">Baixo: <span className="text-zinc-200 font-mono">{Math.round(results.macros.c * 0.7)}g</span></span>
                </div>
              </div>
          </div>
        </section>

      </main>

      {/* Espaço extra no final para scroll confortável */}
      <div className="h-20"></div>

      {/* MODAL FULLSCREEN PARA MOBILE */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md pt-safe-area-top">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {aiMode === 'diet' ? <ChefHat size={20} className="text-indigo-500"/> : <Dumbbell size={20} className="text-purple-500"/>}
                {aiMode === 'diet' ? 'Seu Cardápio' : 'Seu Treino'}
              </h3>
              <button 
                onClick={() => setAiModalOpen(false)}
                className="bg-zinc-800 p-2 rounded-full active:bg-zinc-700"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="flex-1 overflow-y-auto p-5 pb-20">
              {aiLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <Loader2 size={48} className="animate-spin text-blue-500" />
                  <p className="text-sm font-medium animate-pulse">Consultando IA...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                   <FormatAIResponse text={aiResponse} />
                </div>
              )}
            </div>

            {/* Ação Fixa no Rodapé */}
            {!aiLoading && (
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur pb-safe-area-bottom absolute bottom-0 w-full">
                <button 
                   onClick={() => callGemini(aiMode)}
                   className="w-full py-3.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <Sparkles size={16} />
                  Gerar Novamente
                </button>
              </div>
            )}
        </div>
      )}

    </div>
  );
};

export default App;
