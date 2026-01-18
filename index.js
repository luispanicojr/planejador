import React, { useState, useEffect } from 'react';
import { Search, Gift, Check, Phone, Share2, Home, Sparkles, Lock, User, Palette } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const NewHomeApp = () => {
  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hostNumber, setHostNumber] = useState('5514996367709');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [takenItems, setTakenItems] = useState({}); 

  // Lista de Itens (Apenas Texto)
  const allItems = [
    "Abridor de latas/garrafas", "Açucareiro e Saleiro", "Assadeira de vidro", "Avental", 
    "Colheres de silicone", "Concha e Escumadeira", "Conjunto de copos", "Potes herméticos",
    "Conjunto de xícaras", "Descanso de panela", "Escorredor de louça", "Escorredor de macarrão",
    "Espátula de bolo", "Faca de corte", "Faca de pão", "Formas de gelo", "Frigideira",
    "Jarra para suco", "Jogo de talheres", "Luva térmica", "Panos de prato", "Peneira",
    "Porta-temperos", "Ralador", "Tábua de corte", "Balde plástico", "Bacia plástica",
    "Cesto roupa suja", "Cesto prendedores", "Esfregão/Mop", "Flanelas", "Lixeira pia",
    "Lixeira grande", "Pá de lixo", "Panos de chão", "Pregadores", "Rodo", "Vassoura",
    "Cabides", "Escova sanitária", "Toalhas de banho", "Toalhas de rosto", "Jogo de lençol",
    "Fronhas", "Lixeira banheiro", "Porta-escova dentes", "Tapete banheiro", "Capacho",
    "Extensão elétrica", "Tesoura multiuso"
  ];

  // 1. Autenticação Anônima
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Sincronização em Tempo Real (Ouvir quais itens foram tomados)
  useEffect(() => {
    if (!user) return;

    // Conecta à coleção pública 'gifts'
    const giftsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'gifts');
    
    const unsubscribe = onSnapshot(giftsCollection, (snapshot) => {
      const itemsData = {};
      snapshot.forEach((doc) => {
        itemsData[doc.id] = doc.data();
      });
      setTakenItems(itemsData);
    }, (error) => {
      console.error("Erro ao buscar itens:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Função auxiliar para criar ID seguro para o Firestore
  const sanitizeId = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  };

  const filteredItems = allItems.filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedItem || !user) return;
    
    const itemId = sanitizeId(selectedItem);

    // Verifica se já não pegaram enquanto o usuário escolhia
    if (takenItems[itemId]) {
      alert("Ops! Alguém acabou de escolher este item. Por favor, escolha outro.");
      setSelectedItem(null);
      return;
    }

    try {
      // 1. Salva no banco de dados como "Tomado"
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gifts', itemId), {
        taken: true,
        takenBy: user.uid,
        timestamp: Date.now()
      });

      // 2. Abre o WhatsApp
      const message = `Olá! Confirmo minha presença no Chá de Casa Nova da Nícia e do Luis e levarei o item: *${selectedItem}* (Cor: Cinza/Preto) `;
      const whatsappUrl = `https://wa.me/${hostNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Limpa seleção
      setSelectedItem(null);

    } catch (error) {
      console.error("Erro ao reservar item:", error);
      alert("Houve um erro ao confirmar. Tente novamente.");
    }
  };

  const isItemTaken = (item) => {
    const id = sanitizeId(item);
    return takenItems[id]?.taken === true;
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 pb-12 pt-20">
      
      {/* Barra Fixa no Topo (Botão Confirmar) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-md border-b border-orange-100 px-4 py-3 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2">
           <div className="bg-orange-500 text-white p-1.5 rounded-lg">
             <Home size={18} />
           </div>
           <span className="font-bold text-gray-700 text-sm sm:text-base">Lista de Presentes</span>
        </div>

        {selectedItem ? (
           <button 
             onClick={handleConfirm}
             className="bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-pulse"
           >
             <Share2 size={16} />
             Confirmar no Zap
           </button>
        ) : (
          <div className="text-xs text-gray-400 font-medium px-2">
            Escolha um item 👇
          </div>
        )}
      </div>

      {/* Header Visual com Foto do Casal */}
      <header className="mx-4 mt-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white pt-8 pb-10 px-4 rounded-3xl shadow-lg relative overflow-hidden mb-6">
        
        {/* Ícone de fundo decorativo */}
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
          <Sparkles size={100} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* FOTO DO CASAL (Ícone Redondo) */}
          <div className="w-28 h-28 rounded-full border-4 border-white/90 shadow-2xl overflow-hidden mb-4 bg-white transform hover:scale-105 transition-transform duration-300">
            <img 
              /* TROQUE O LINK ABAIXO PELO LINK DA SUA FOTO REAL */
              src="https://prnt.sc/Vks3kFadND4T" 
              alt="Foto do Casal" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display='none'; 
                // Fallback se a imagem falhar
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>'
              }}
            />
          </div>

          <h1 className="text-3xl font-bold mb-1 text-shadow-sm text-center leading-tight">Chá de Casa Nova</h1>
          <p className="text-orange-100 text-sm text-center font-medium">Ajude a montar nosso cantinho! 🏠❤️</p>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-2xl mx-auto px-4 relative z-20">
        
        {/* Informações dos Anfitriões */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Card Nícia */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mb-2 text-pink-500">
              <User size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Nícia</h3>
            <p className="text-xs text-gray-500 mt-1">A Noiva 👰‍♀️</p>
          </div>

          {/* Card Luís */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-500">
              <User size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Luís</h3>
            <p className="text-xs text-gray-500 mt-1">O Noivo 🤵‍♂️</p>
          </div>
        </div>

        {/* Card Paleta de Cores */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-l-gray-800 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2.5 rounded-full text-gray-600">
              <Palette size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-sm">Paleta dos Itens</h3>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Preferência por estas cores</p>
            </div>
          </div>
          
          <div className="flex gap-3 pr-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white shadow-sm ring-1 ring-gray-100"></div>
              <span className="text-[10px] text-gray-500 font-medium">Cinza</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white shadow-sm ring-1 ring-gray-100"></div>
              <span className="text-[10px] text-gray-500 font-medium">Preto</span>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white p-2 rounded-2xl shadow-sm mb-6 flex items-center border border-orange-100 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
          <Search className="text-gray-400 ml-3" size={20} />
          <input 
            type="text"
            placeholder="Buscar item..."
            className="w-full p-3 outline-none bg-transparent placeholder-gray-400 text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Configuração (Telefone) */}
        <div className="text-center mb-6">
           <button 
             onClick={() => setIsSettingsOpen(!isSettingsOpen)}
             className="text-xs text-gray-400 hover:text-orange-500 underline flex items-center justify-center gap-1 mx-auto"
           >
             {isSettingsOpen ? 'Fechar Configurações' : '⚙️ Configurar Telefone'}
           </button>
           {isSettingsOpen && (
              <div className="mt-2 bg-white p-3 rounded-xl border border-gray-200 inline-block text-left w-full max-w-xs shadow-sm">
                <label className="text-[10px] uppercase font-bold text-gray-500">WhatsApp do Anfitrião</label>
                <div className="flex items-center bg-gray-50 border rounded mt-1 overflow-hidden">
                  <Phone size={14} className="ml-2 text-gray-400"/>
                  <input 
                    type="text" 
                    value={hostNumber} 
                    onChange={(e) => setHostNumber(e.target.value)}
                    className="w-full bg-transparent p-2 text-sm outline-none"
                    placeholder="5511999999999"
                  />
                </div>
              </div>
           )}
        </div>

        {/* Grid de Itens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map((item, index) => {
            const taken = isItemTaken(item);
            const isSelected = selectedItem === item;

            return (
              <div 
                key={index}
                onClick={() => !taken && setSelectedItem(isSelected ? null : item)}
                className={`
                  relative p-4 rounded-xl flex flex-col items-center justify-center text-center h-32 transition-all duration-200 select-none
                  ${taken 
                    ? 'bg-gray-50 border-2 border-dashed border-gray-200 cursor-not-allowed opacity-60 grayscale' 
                    : isSelected
                      ? 'bg-orange-100 border-2 border-orange-500 shadow-md transform scale-[1.02] cursor-pointer'
                      : 'bg-white border border-orange-50 hover:border-orange-200 hover:shadow-sm cursor-pointer'
                  }
                `}
              >
                {/* Badge de Status */}
                {taken && (
                  <div className="absolute top-2 right-2 bg-gray-400 text-white rounded-full p-1">
                    <Lock size={12} />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm animate-bounce">
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
                
                {taken ? (
                   <span className="mb-2 text-gray-400 font-bold text-xs uppercase bg-gray-200 px-2 py-1 rounded">Reservado</span>
                ) : (
                   <Gift 
                    className={`mb-2 transition-colors ${isSelected ? 'text-orange-500' : 'text-gray-300'}`} 
                    size={28} 
                  />
                )}
                
                <span className={`text-sm font-medium leading-tight ${taken ? 'text-gray-400 line-through decoration-gray-400' : isSelected ? 'text-orange-800' : 'text-gray-600'}`}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default NewHomeApp;
