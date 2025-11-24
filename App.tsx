import React, { useState, useRef, useEffect } from 'react';
import { Gender, GenerationMode, HairstyleOption, HairColorOption } from './types';
import { HAIRSTYLES, HAIR_COLORS } from './constants';
import { generateHairstyle, fileToBase64 } from './services/geminiService';
import { Spinner } from './components/Spinner';
import { Button } from './components/Button';
import { Camera, Upload, Sparkles, RefreshCw, Download, User, Image as ImageIcon, Palette, Type, Scissors, Share, PlusSquare, X, Smartphone } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>(Gender.Female);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.Preset);
  
  const [selectedHairstyleId, setSelectedHairstyleId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('original');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Refs for file inputs
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Scroll to result when generated
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedImage && resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedImage]);

  // PWA Logic
  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capture install prompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, show guide
      setShowInstallModal(true);
    } else if (deferredPrompt) {
      // Android/Desktop supports programmatic install
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      // Fallback for situations where prompt isn't available but not iOS (e.g. inside in-app browsers)
      setShowInstallModal(true);
    }
  };

  // Handlers
  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSourceImage(file);
      setSourcePreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceImage(file);
      setReferencePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError("请先上传您的照片");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const sourceBase64 = await fileToBase64(sourceImage);
      let description = "";
      let referenceBase64 = undefined;

      const selectedColor = HAIR_COLORS.find(c => c.id === selectedColorId);
      const colorDesc = selectedColor && selectedColor.id !== 'original' 
        ? `, hair color should be ${selectedColor.description}` 
        : "";

      if (mode === GenerationMode.Preset) {
        if (!selectedHairstyleId) {
            throw new Error("请选择一个发型");
        }
        const style = HAIRSTYLES.find(h => h.id === selectedHairstyleId);
        description = `${style?.name}${colorDesc}`;
      } else if (mode === GenerationMode.Text) {
        if (!customPrompt.trim()) {
            throw new Error("请输入发型描述");
        }
        description = `${customPrompt}${colorDesc}`;
      } else if (mode === GenerationMode.Reference) {
        if (!referenceImage) {
            throw new Error("请上传参考发型图");
        }
        referenceBase64 = await fileToBase64(referenceImage);
        description = `match the hairstyle in the reference image${colorDesc}`;
      }

      const resultUrl = await generateHairstyle(sourceBase64, description, referenceBase64);
      setGeneratedImage(resultUrl);

    } catch (err: any) {
      setError(err.message || "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredHairstyles = HAIRSTYLES.filter(h => h.gender === gender);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 pb-20">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 safe-area-inset-top">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Scissors className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 truncate">
              AI 换发型大师
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Install Button - Only show if not already installed */}
             {!isStandalone && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">下载APP</span>
                  <span className="sm:hidden">APP</span>
                </button>
             )}

            <nav className="hidden md:flex gap-4 text-sm font-medium text-gray-500 border-l pl-4 ml-2">
              <span className="hover:text-indigo-600 cursor-pointer">首页</span>
              <span className="hover:text-indigo-600 cursor-pointer">发型库</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Section: Source Upload */}
        <section className="grid md:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            
            {/* Source Image Upload */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                1. 上传您的人物照
              </h2>
              <div 
                className={`relative border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center bg-gray-50 transition-colors
                  ${!sourcePreview ? 'border-indigo-200 hover:bg-indigo-50 cursor-pointer' : 'border-indigo-500'}`}
                onClick={() => !sourcePreview && sourceInputRef.current?.click()}
              >
                {sourcePreview ? (
                  <>
                    <img src={sourcePreview} alt="Source" className="h-full w-full object-contain rounded-lg" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); sourceInputRef.current?.click(); }}
                      className="absolute bottom-2 right-2 bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="text-gray-600 font-medium">点击上传或拖拽照片</p>
                    <p className="text-xs text-gray-400 mt-2">支持 JPG, PNG (建议正脸清晰照)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={sourceInputRef} 
                  onChange={handleSourceUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                2. 选择发型与颜色
              </h2>

              {/* Gender Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                {(['Female', 'Male'] as const).map((g) => (
                    <button
                        key={g}
                        onClick={() => setGender(g === 'Female' ? Gender.Female : Gender.Male)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                            (g === 'Female' && gender === Gender.Female) || (g === 'Male' && gender === Gender.Male)
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {g === 'Female' ? '女士 Female' : '男士 Male'}
                    </button>
                ))}
              </div>

              {/* Mode Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                    { id: GenerationMode.Preset, label: '热门发型', icon: <Scissors className="w-4 h-4" /> },
                    { id: GenerationMode.Text, label: '文字描述', icon: <Type className="w-4 h-4" /> },
                    { id: GenerationMode.Reference, label: '参考图', icon: <ImageIcon className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id)}
                        className={`flex-1 pb-3 pt-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            mode === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
              </div>

              {/* Mode Content */}
              <div className="min-h-[200px]">
                {mode === GenerationMode.Preset && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredHairstyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedHairstyleId(style.id)}
                        className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between h-20
                          ${selectedHairstyleId === style.id 
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                      >
                        <span className="text-xs font-bold text-indigo-600/80">{style.category}</span>
                        <span className="text-sm font-medium text-slate-700 truncate">{style.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {mode === GenerationMode.Text && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">描述您想要的发型</label>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            rows={4}
                            placeholder="例如：复古法式卷发，蓬松自然，不要刘海..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                        />
                    </div>
                )}

                {mode === GenerationMode.Reference && (
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-colors"
                        onClick={() => referenceInputRef.current?.click()}
                    >
                        {referencePreview ? (
                             <img src={referencePreview} alt="Ref" className="h-full w-full object-contain rounded-lg p-2" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">上传想模仿的发型图片</span>
                            </>
                        )}
                        <input type="file" ref={referenceInputRef} onChange={handleReferenceUpload} accept="image/*" className="hidden" />
                    </div>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">发色选择</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {HAIR_COLORS.map(color => (
                        <button
                            key={color.id}
                            onClick={() => setSelectedColorId(color.id)}
                            title={color.label}
                            className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 flex items-center justify-center
                                ${selectedColorId === color.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'border-gray-200'}`}
                            style={{ backgroundColor: color.value === 'transparent' ? 'white' : color.value }}
                        >
                            {color.value === 'transparent' && <span className="text-xs text-gray-400">/</span>}
                            {selectedColorId === color.id && (
                                <div className="w-2 h-2 bg-white rounded-full shadow-sm" style={{backgroundColor: color.value === '#e5e4e2' || color.value === 'white' || color.value === 'transparent' ? '#333' : 'white'}}></div>
                            )}
                        </button>
                    ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <Button 
                    fullWidth 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !sourceImage}
                >
                    {isGenerating ? (
                        <>
                            <Spinner />
                            正在设计中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            立即生成发型
                        </>
                    )}
                </Button>
                {error && (
                    <div className="mt-3 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">
                        <p className="text-red-600 mb-1">{error}</p>
                        {error.includes("API Key") && (
                             <a 
                               href="https://aistudio.google.com/app/apikey" 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-indigo-600 underline text-xs block mt-1 hover:text-indigo-800"
                             >
                               点击这里免费获取 Google Gemini API Key
                             </a>
                        )}
                    </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col gap-6">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full min-h-[500px] flex flex-col">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-500" />
                    生成效果
                </h2>
                
                <div 
                    ref={resultRef}
                    className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden group border border-slate-200"
                >
                    {isGenerating ? (
                        <div className="text-center space-y-4 p-8">
                             <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                                <Scissors className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
                             </div>
                             <div>
                                 <h3 className="text-lg font-medium text-indigo-900">AI 正在理发中...</h3>
                                 <p className="text-sm text-indigo-500/70">正在分析面部特征并融合发型</p>
                             </div>
                        </div>
                    ) : generatedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                            <img 
                                src={generatedImage} 
                                alt="Generated Hairstyle" 
                                className="max-h-[600px] max-w-full object-contain shadow-xl" 
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                    href={generatedImage} 
                                    download="hairstyle-makeover.png"
                                    className="bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all"
                                    title="下载图片"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 p-8">
                            <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-10 h-10 text-slate-400" />
                            </div>
                            <p>生成的效果图将在这里显示</p>
                        </div>
                    )}
                </div>

                {/* Comparison tip */}
                {generatedImage && (
                    <div className="mt-4 text-center text-xs text-gray-400">
                        AI 生成图片仅供参考，实际效果可能因光线和角度有所不同
                    </div>
                )}
             </div>
          </div>

        </section>
      </main>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowInstallModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">如何安装到手机桌面</h3>
              <button onClick={() => setShowInstallModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isIOS ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Share className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="pt-1">1. 点击浏览器底部的 <span className="font-bold text-gray-900">分享按钮</span></p>
                </div>
                <div className="w-px h-4 bg-gray-200 ml-6"></div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <PlusSquare className="w-5 h-5 text-gray-700" />
                  </div>
                  <p className="pt-1">2. 向下滑动并选择 <span className="font-bold text-gray-900">添加到主屏幕</span></p>
                </div>
              </div>
            ) : (
               <div className="space-y-4 text-center">
                  <p className="text-gray-600 mb-4">点击浏览器菜单（通常是右上角的三个点），然后选择 "安装应用" 或 "添加到主屏幕"。</p>
               </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button 
                onClick={() => setShowInstallModal(false)}
                className="text-indigo-600 font-medium text-sm hover:text-indigo-700"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;