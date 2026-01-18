
import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  image: string | null;
}

interface QuizData {
  [theme: string]: Question[];
}

const DEFAULT_DATA: QuizData = {
  "Сигналы": [
    {
      id: "1",
      question: "Какой из перечисленных сигналов является детерминированным?",
      options: ["Белый шум", "Гармоническое колебание", "Атмосферная помеха", "Тепловой шум"],
      answer: "Гармоническое колебание",
      image: null
    }
  ],
  "Z-преобразование": [
    {
      id: "2",
      question: "Где расположены полюса устойчивой LTI-системы на Z-плоскости?",
      options: ["Вне единичного круга", "Внутри единичного круга", "На бесконечности"],
      answer: "Внутри единичного круга",
      image: "https://picsum.photos/seed/dsp1/600/400"
    }
  ]
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'quiz' | 'admin'>('home');
  const [data, setData] = useState<QuizData>(DEFAULT_DATA);
  const [currentTheme, setCurrentTheme] = useState<string>("");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Admin state
  const [adminTheme, setAdminTheme] = useState("");
  const [newQ, setNewQ] = useState<Omit<Question, 'id'>>({
    question: "", options: ["", "", "", ""], answer: "", image: null
  });

  useEffect(() => {
    // Load data from localStorage
    const saved = localStorage.getItem('tcos_quiz_data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data");
      }
    }

    // Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  const saveData = (updated: QuizData) => {
    setData(updated);
    localStorage.setItem('tcos_quiz_data', JSON.stringify(updated));
  };

  const startQuiz = (theme: string) => {
    setCurrentTheme(theme);
    setQIndex(0);
    setScore(0);
    setFinished(false);
    setView('quiz');
  };

  const handleAnswer = (option: string) => {
    const currentQ = data[currentTheme][qIndex];
    if (option === currentQ.answer) setScore(s => s + 1);
    
    if (qIndex + 1 < data[currentTheme].length) {
      setQIndex(qIndex + 1);
    } else {
      setFinished(true);
    }
  };

  const addQuestion = () => {
    if (!adminTheme || !newQ.question || !newQ.answer) {
      alert("Заполните тему, вопрос и правильный ответ!");
      return;
    }
    const updated = { ...data };
    if (!updated[adminTheme]) updated[adminTheme] = [];
    
    const questionWithId: Question = { ...newQ, id: Date.now().toString() };
    updated[adminTheme].push(questionWithId);
    saveData(updated);
    setNewQ({ question: "", options: ["", "", "", ""], answer: "", image: null });
    alert("Вопрос добавлен!");
  };

  const deleteTheme = (theme: string) => {
    if (confirm(`Удалить тему "${theme}" и все вопросы в ней?`)) {
      const updated = { ...data };
      delete updated[theme];
      saveData(updated);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col max-w-lg mx-auto bg-slate-900 text-white select-none">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          ТЦОС Квиз
        </h1>
        <button 
          onClick={() => setView(view === 'admin' ? 'home' : 'admin')}
          className="bg-slate-800 px-4 py-1.5 rounded-full text-sm border border-slate-700 active:scale-95 transition-all"
        >
          {view === 'admin' ? '🏠 Главная' : '⚙️ Админ'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {view === 'home' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-slate-400 text-sm px-1">Выберите тему для обучения:</p>
            {Object.keys(data).length === 0 && (
              <div className="text-center py-10 text-slate-500 italic">Темы еще не добавлены</div>
            )}
            {Object.keys(data).map(theme => (
              <div key={theme} className="relative group">
                <button
                  onClick={() => startQuiz(theme)}
                  className="w-full p-5 bg-slate-800 rounded-2xl border border-slate-700 text-left hover:border-blue-500 transition-all flex justify-between items-center active:bg-slate-700"
                >
                  <div>
                    <div className="font-bold text-lg">{theme}</div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                      {data[theme].length} вопросов
                    </div>
                  </div>
                  <div className="text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {view === 'quiz' && !finished && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
               <span className="truncate max-w-[150px]">{currentTheme}</span>
               <span className="bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">{qIndex + 1} / {data[currentTheme].length}</span>
            </div>

            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                style={{ width: `${((qIndex + 1) / data[currentTheme].length) * 100}%` }}
              />
            </div>

            {data[currentTheme][qIndex].image && (
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black">
                <img 
                  src={data[currentTheme][qIndex].image!} 
                  alt="Question illustration" 
                  className="w-full h-auto max-h-56 object-contain"
                />
              </div>
            )}

            <div className="text-xl font-semibold text-slate-100 leading-snug">
              {data[currentTheme][qIndex].question}
            </div>

            <div className="grid gap-3">
              {data[currentTheme][qIndex].options.filter(o => o.trim() !== "").map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-left hover:bg-slate-700 active:bg-blue-600 active:border-blue-400 active:scale-[0.98] transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'quiz' && finished && (
          <div className="text-center space-y-8 py-10 animate-in zoom-in-95 duration-300">
            <div className="relative inline-block">
              <div className="text-7xl animate-bounce">🏆</div>
              <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full -z-10"></div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white">Тест окончен!</h2>
              <div className="mt-2 text-slate-400">{currentTheme}</div>
            </div>
            <div className="text-6xl font-black text-emerald-400">
              {score} <span className="text-2xl text-slate-500 font-normal">/ {data[currentTheme].length}</span>
            </div>
            <button
              onClick={() => setView('home')}
              className="w-full p-4 bg-blue-600 rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all"
            >
              Вернуться в меню
            </button>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-6 pb-10 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">⚡️</span>
              <p className="text-xs text-blue-200">
                Добавляйте новые вопросы. Данные сохраняются в памяти устройства. 
                Для переноса в бота скопируйте JSON ниже.
              </p>
            </div>

            <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-lg text-emerald-400">Добавить вопрос</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Тема</label>
                <input 
                  value={adminTheme} 
                  onChange={e => setAdminTheme(e.target.value)}
                  placeholder="Напр.: Спектральный анализ"
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Текст вопроса</label>
                <textarea 
                  value={newQ.question} 
                  onChange={e => setNewQ({...newQ, question: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm h-20 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {newQ.options.map((opt, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Вариант {idx+1}</label>
                    <input 
                      value={opt} 
                      onChange={e => {
                        const opts = [...newQ.options];
                        opts[idx] = e.target.value;
                        setNewQ({...newQ, options: opts});
                      }}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-sm focus:border-blue-400 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 text-emerald-500">Правильный ответ</label>
                <input 
                  value={newQ.answer} 
                  onChange={e => setNewQ({...newQ, answer: e.target.value})}
                  placeholder="В точности как один из вариантов"
                  className="w-full bg-slate-900 border border-emerald-500/50 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">URL изображения (необяз.)</label>
                <input 
                  value={newQ.image || ""} 
                  onChange={e => setNewQ({...newQ, image: e.target.value || null})}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <button 
                onClick={addQuestion}
                className="w-full bg-emerald-600 p-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-emerald-900/20"
              >
                💾 Сохранить вопрос
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-400 px-1">Управление темами</h3>
              {Object.keys(data).map(t => (
                <div key={t} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-medium">{t}</span>
                  <button 
                    onClick={() => deleteTheme(t)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg active:scale-90 transition-all"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-black p-4 rounded-2xl border border-slate-800">
               <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">JSON Экспорт (для bot.py)</h3>
               <pre className="text-[10px] font-mono text-blue-300 overflow-x-auto p-2 bg-slate-900/50 rounded-lg max-h-40">
                 {JSON.stringify(data, null, 2)}
               </pre>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                   alert("JSON скопирован!");
                 }}
                 className="mt-3 text-[10px] bg-slate-700 px-3 py-1 rounded-full text-slate-300"
               >
                 Копировать всё
               </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-6 text-center text-slate-600 text-[10px] uppercase tracking-widest pb-4">
        TCOS Quiz v1.2 &bull; 2024
      </footer>
    </div>
  );
};

export default App;
