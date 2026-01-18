
import React, { useState, useEffect } from 'react';

// Types
interface Question {
  question: string;
  type: 'binary' | 'multiple_choice';
  options: string[];
  answer: string;
  image: string | null;
}

interface QuizData {
  [theme: string]: Question[];
}

const INITIAL_DATA: QuizData = {
    "Сигналы": [
        {
            "question": "Какой из перечисленных сигналов является детерминированным?",
            "type": "multiple_choice",
            "options": ["Белый шум", "Гармоническое колебание", "Атмосферная помеха", "Тепловой шум"],
            "answer": "Гармоническое колебание",
            "image": null
        },
        {
            "question": "При дискретизации сигнала частота Найквиста равна:",
            "type": "multiple_choice",
            "options": ["Половине частоты дискретизации", "Двойной частоте дискретизации", "Максимальной частоте спектра", "Единичной частоте"],
            "answer": "Половине частоты дискретизации",
            "image": "https://picsum.photos/seed/signals1/600/400"
        }
    ]
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'quiz' | 'admin'>('home');
  const [data, setData] = useState<QuizData>(INITIAL_DATA);
  const [currentTheme, setCurrentTheme] = useState<string>("");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Admin State
  const [editingTheme, setEditingTheme] = useState<string>("");
  const [newQ, setNewQ] = useState<Question>({
    question: "", type: "multiple_choice", options: ["", ""], answer: "", image: null
  });

  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

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
    if (!editingTheme || !newQ.question || !newQ.answer) return;
    const updated = { ...data };
    if (!updated[editingTheme]) updated[editingTheme] = [];
    updated[editingTheme].push(newQ);
    setData(updated);
    setNewQ({ question: "", type: "multiple_choice", options: ["", ""], answer: "", image: null });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-400">ТЦОС Квиз</h1>
        <button 
          onClick={() => setView(view === 'admin' ? 'home' : 'admin')}
          className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-700 hover:bg-slate-700"
        >
          {view === 'admin' ? 'На главную' : 'Админ'}
        </button>
      </div>

      {/* Home View */}
      {view === 'home' && (
        <div className="space-y-4">
          <p className="text-slate-400">Выберите тему для начала тестирования:</p>
          {Object.keys(data).map(theme => (
            <button
              key={theme}
              onClick={() => startQuiz(theme)}
              className="w-full p-4 bg-slate-800 rounded-xl border border-slate-700 text-left hover:border-blue-500 transition-all flex justify-between items-center"
            >
              <span className="font-semibold">{theme}</span>
              <span className="text-xs text-slate-500">{data[theme].length} вопр.</span>
            </button>
          ))}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800 rounded-xl text-sm italic text-blue-200">
            Этот Mini App позволяет проходить тесты и управлять вопросами в режиме реального времени.
          </div>
        </div>
      )}

      {/* Quiz View */}
      {view === 'quiz' && !finished && (
        <div className="space-y-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
             <span>Тема: {currentTheme}</span>
             <span>{qIndex + 1} / {data[currentTheme].length}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${((qIndex + 1) / data[currentTheme].length) * 100}%` }}
            />
          </div>

          {data[currentTheme][qIndex].image && (
            <img src={data[currentTheme][qIndex].image!} alt="Question" className="w-full h-48 object-cover rounded-xl border border-slate-700 mb-4" />
          )}

          <h2 className="text-xl font-medium leading-relaxed">
            {data[currentTheme][qIndex].question}
          </h2>

          <div className="grid gap-3">
            {data[currentTheme][qIndex].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-left hover:bg-slate-700 active:scale-[0.98] transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Finish View */}
      {view === 'quiz' && finished && (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-bold">Результат</h2>
          <div className="text-5xl font-extrabold text-emerald-400">
            {score} / {data[currentTheme].length}
          </div>
          <p className="text-slate-400">
             {score === data[currentTheme].length ? "Идеально! Вы мастер ТЦОС." : "Хорошая работа! Попробуйте другие темы."}
          </p>
          <button
            onClick={() => setView('home')}
            className="w-full p-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
          >
            Вернуться в меню
          </button>
        </div>
      )}

      {/* Admin View */}
      {view === 'admin' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-xl font-bold flex items-center gap-2">
             <span>🛠</span> Панель управления
          </h2>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Тема (существующая или новая)</label>
              <input 
                value={editingTheme} 
                onChange={e => setEditingTheme(e.target.value)}
                placeholder="Например: Фильтры"
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Текст вопроса</label>
              <textarea 
                value={newQ.question} 
                onChange={e => setNewQ({...newQ, question: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm h-20 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Варианты (через запятую)</label>
              <input 
                value={newQ.options.join(", ")} 
                onChange={e => setNewQ({...newQ, options: e.target.value.split(",").map(s => s.trim())})}
                placeholder="Вариант 1, Вариант 2"
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Правильный ответ</label>
              <input 
                value={newQ.answer} 
                onChange={e => setNewQ({...newQ, answer: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">URL изображения (необяз.)</label>
              <input 
                value={newQ.image || ""} 
                onChange={e => setNewQ({...newQ, image: e.target.value || null})}
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button 
              onClick={addQuestion}
              className="w-full bg-emerald-600 p-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors"
            >
              Добавить вопрос
            </button>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
             <h3 className="text-sm font-bold mb-2">Экспорт данных</h3>
             <p className="text-xs text-slate-500 mb-4">Скопируйте этот объект в quiz_data.py:</p>
             <pre className="text-[10px] bg-black p-2 rounded overflow-x-auto text-emerald-500 max-h-40">
               {JSON.stringify(data, null, 2)}
             </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
