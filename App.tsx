import React, { useState, useEffect, useRef, useLayoutEffect, PropsWithChildren, useMemo } from 'react';
import { getTools } from './constants';
import { ToolDefinition, GenerationState, ToolId, ToolOption, HistoryItem, CanvasConfig, AspectRatio, Resolution, Annotation, CropRect, FocusPoint, Language } from './types';
import * as GeminiService from './services/geminiService';
import { Icons } from './components/Icons';
import { CameraStudio } from './components/CameraStudio';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

// --- Translation Dictionary for App UI ---
const TRANSLATIONS = {
  en: {
    toolbox: "Toolbox",
    selectTool: "SELECT A TOOL",
    generate: "GENERATE",
    connectKey: "Connect Key",
    inputSource: "Input Source",
    uploadBase: "Upload Base Image",
    replace: "REPLACE",
    cropArea: "CROP AREA",
    clickFocus: "Click on Main Image to\nSet Focus Center",
    useMainView: "Use the Main Image View to\nSelect & Adjust Crop Area",
    optionalRefs: "Optional References",
    styleStrength: "STYLE STRENGTH",
    result: "Result",
    compare: "COMPARE",
    save: "Save",
    canvasConfig: "Canvas Config",
    recent: "Recent Generations",
    items: "ITEMS",
    noRecent: "No recent generations",
    waiting: "WAITING FOR INPUT",
    processing: "AI PROCESSING...",
    apiConfig: "API Config",
    before: "BEFORE",
    after: "AFTER",
    customPromptKey: "Custom Prompt",
    addDetails: "Add specific details, lighting, or atmosphere...",
    additionalPrompt: "Additional Prompt",
    zoom: "ZOOM"
  },
  vi: {
    toolbox: "Hộp công cụ",
    selectTool: "CHỌN CÔNG CỤ",
    generate: "TẠO ẢNH",
    connectKey: "Kết nối Key",
    inputSource: "Nguồn ảnh",
    uploadBase: "Tải ảnh gốc lên",
    replace: "THAY THẾ",
    cropArea: "VÙNG CẮT",
    clickFocus: "Nhấn vào ảnh chính để\nChọn điểm lấy nét",
    useMainView: "Dùng khung nhìn chính để\nChọn & Chỉnh vùng cắt",
    optionalRefs: "Tham khảo Tùy chọn",
    styleStrength: "CƯỜNG ĐỘ PHONG CÁCH",
    result: "Kết quả",
    compare: "SO SÁNH",
    save: "Lưu",
    canvasConfig: "Cấu hình Canvas",
    recent: "Lịch sử tạo",
    items: "MỤC",
    noRecent: "Chưa có lịch sử",
    waiting: "ĐANG CHỜ ĐẦU VÀO",
    processing: "AI ĐANG XỬ LÝ...",
    apiConfig: "Cấu hình API",
    before: "TRƯỚC",
    after: "SAU",
    customPromptKey: "Tùy chỉnh Prompt",
    addDetails: "Thêm chi tiết cụ thể, ánh sáng hoặc không khí...",
    additionalPrompt: "Prompt Bổ sung",
    zoom: "ZOOM"
  }
};

// --- Helper: FitToAspectContainer ---
const FitToAspectContainer = ({ ratio, children, className }: PropsWithChildren<{ ratio: number, className?: string }>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
     if (!containerRef.current) return;
     const update = () => {
        if (!containerRef.current) return;
        const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
        if (cw === 0 || ch === 0) return;
        let w = cw; let h = w / ratio;
        if (h > ch) { h = ch; w = h * ratio; }
        setDims({ w, h });
     };
     const ro = new ResizeObserver(update);
     ro.observe(containerRef.current);
     update();
     return () => ro.disconnect();
  }, [ratio]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden p-4">
       <div style={{ width: dims.w, height: dims.h }} className={clsx("relative shadow-2xl bg-black transition-all duration-300", className)}>
          {children}
       </div>
    </div>
  )
}

// --- Sidebar Item Component ---
interface ToolAccordionItemProps {
  tool: ToolDefinition;
  isSelected: boolean;
  onClick: () => void;
  optionsValue: { [key: string]: any };
  onOptionChange: (id: string, val: any) => void;
  onAutoDetectCamera?: () => void;
  isDetectingCamera?: boolean;
  inputImage: File | null; 
  lang: Language;
}

const ToolAccordionItem: React.FC<ToolAccordionItemProps> = ({ 
  tool, isSelected, onClick, optionsValue, onOptionChange, onAutoDetectCamera, isDetectingCamera, inputImage, lang
}) => {
  const Icon = Icons[tool.icon as keyof typeof Icons];
  const t = TRANSLATIONS[lang];

  return (
    <div className={clsx("border-b border-architect-800 transition-all duration-300 overflow-hidden", isSelected ? "bg-architect-800/40" : "hover:bg-architect-800/20")}>
      <button onClick={onClick} className={clsx("w-full flex items-center gap-3 p-4 transition-colors text-left", isSelected ? "text-white" : "text-architect-400 hover:text-architect-200")}>
        <div className={clsx("p-2 rounded-lg transition-colors", isSelected ? "bg-architect-accent text-white" : "bg-architect-800 text-architect-400")}>{Icon && <Icon size={18} />}</div>
        <span className="font-display font-medium text-sm tracking-wide uppercase flex-1">{tool.name}</span>
        <Icons.ChevronRight size={16} className={clsx("transition-transform duration-300", isSelected ? "rotate-90 text-architect-accent" : "")} />
      </button>

      {/* Expanded Content */}
      <div className={clsx("transition-all duration-300 ease-in-out px-4 overflow-hidden", isSelected ? "max-h-[800px] opacity-100 pb-6" : "max-h-0 opacity-0")}>
        <p className="text-xs text-architect-400 mb-6 leading-relaxed border-l-2 border-architect-700 pl-3">{tool.description}</p>
        <div className="space-y-5">
          {tool.options.map((opt) => (
            <div key={opt.id}>
              {opt.type === 'camera-studio' ? (
                <CameraStudio 
                  value={optionsValue[opt.id] || { yaw: 0, pitch: 0, zoom: 1 }}
                  onChange={(val) => onOptionChange(opt.id, val)}
                  onAutoDetect={onAutoDetectCamera}
                  isDetecting={isDetectingCamera}
                  labels={lang === 'vi' ? {
                    yaw: 'GÓC XOAY (YAW)', pitch: 'GÓC NGHIÊNG (PITCH)', zoom: 'MỨC ZOOM', match: 'KHỚP VỚI ẢNH', detecting: 'ĐANG PHÂN TÍCH...', reset: 'Đặt lại'
                  } : undefined}
                />
              ) : opt.type === 'crop-selector' ? (
                 <div className="bg-architect-900/50 p-3 rounded border border-architect-800 text-center">
                    <p className="text-[10px] text-architect-400 font-medium uppercase tracking-wider whitespace-pre-wrap">{t.useMainView}</p>
                    <div className="mt-2 flex justify-center text-architect-500"><Icons.ScanEye size={20} /></div>
                 </div>
              ) : opt.type === 'focus-point' ? (
                <div className="bg-architect-900/50 p-3 rounded border border-architect-800 text-center">
                   <p className="text-[10px] text-architect-400 font-medium uppercase tracking-wider whitespace-pre-wrap">{t.clickFocus}</p>
                   <div className="mt-2 flex justify-center text-architect-500"><Icons.ZoomIn size={20} /></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-architect-300 uppercase tracking-wider flex justify-between">
                    {opt.label}
                    {opt.suffix && optionsValue[opt.id] !== undefined && (<span className="text-architect-accent">{optionsValue[opt.id]}{opt.suffix}</span>)}
                  </label>
                  {opt.type === 'select' && (
                    <div className="relative">
                      <select className="w-full bg-architect-900 border border-architect-700 rounded-lg p-2.5 text-sm text-white appearance-none focus:border-architect-accent outline-none" value={optionsValue[opt.id] || opt.defaultValue} onChange={(e) => onOptionChange(opt.id, e.target.value)}>
                        {opt.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <Icons.ChevronDown className="absolute right-3 top-3 text-architect-500 pointer-events-none" size={14} />
                    </div>
                  )}
                  {opt.type === 'text' && (
                    <input type="text" className="w-full bg-architect-900 border border-architect-700 rounded-lg p-2.5 text-sm text-white focus:border-architect-accent outline-none placeholder-architect-600" value={optionsValue[opt.id] || opt.defaultValue} onChange={(e) => onOptionChange(opt.id, e.target.value)} />
                  )}
                  {opt.type === 'slider' && (
                    <input type="range" min={opt.min} max={opt.max} step={opt.step || 1} className="w-full h-1 bg-architect-700 rounded-lg appearance-none cursor-pointer accent-architect-accent" value={optionsValue[opt.id] !== undefined ? optionsValue[opt.id] : opt.defaultValue} onChange={(e) => onOptionChange(opt.id, Number(e.target.value))} />
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Additional Text Prompt */}
          <div className="space-y-2 pt-2 border-t border-architect-800">
             <label className="text-xs font-bold text-architect-300 uppercase tracking-wider">{t.additionalPrompt}</label>
             <textarea className="w-full bg-architect-900 border border-architect-700 rounded-lg p-3 text-xs text-white focus:border-architect-accent outline-none resize-none h-20 placeholder-architect-600" placeholder={t.addDetails} value={optionsValue['userPrompt'] || ''} onChange={(e) => onOptionChange('userPrompt', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ... WolfniixLogo ...
const WolfniixLogo = () => (
  <svg width="50" height="40" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D90429]">
    <path d="M2.38138 9.94723L25.0298 0L47.6781 9.94723L38.4526 19.3404L25.0298 39.9079L11.6069 19.3404L2.38138 9.94723Z" fill="currentColor" fillOpacity="0.1"/>
    <path d="M25.0298 0L47.6781 9.94723L35.797 22.0453L25.0298 39.9079V24.5772V0Z" fill="currentColor"/>
    <path d="M25.0297 39.9079L14.2626 22.0453L2.38135 9.94723L25.0297 0V24.5772V39.9079Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M14.2625 22.0453L25.0296 24.5772L35.7968 22.0453L47.678 9.94723L25.0296 0L2.38135 9.94723L14.2625 22.0453Z" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5"/>
  </svg>
);

interface NavbarProps { 
  onOpenKeys: () => void;
  customLogo: string | null;
  onUploadLogo: (file: File) => void;
  lang: Language;
  onLangChange: (l: Language) => void;
}

const Navbar = ({ onOpenKeys, customLogo, onUploadLogo, lang, onLangChange }: NavbarProps) => {
  const t = TRANSLATIONS[lang];
  return (
    <nav className="h-16 border-b border-architect-800 bg-architect-900 flex items-center justify-between px-6 fixed top-0 w-full z-50">
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-3 group cursor-pointer relative select-none" title="Click to replace logo">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && onUploadLogo(e.target.files[0])} />
          <div className="relative">
            {customLogo ? <img src={customLogo} alt="Wolfniix Logo" className="h-11 w-auto object-contain max-w-[100px]" /> : <WolfniixLogo />}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[1px] rounded pointer-events-none"><Icons.Upload size={16} className="text-white" /></div>
          </div>
        </label>
        <div className="h-8 w-px bg-architect-700/50"></div>
        <div className="flex flex-col justify-center -space-y-0.5">
           <span className="font-futura text-lg tracking-tight text-architect-200">
             <span className="font-light">Archi</span><span className="font-bold text-[#A61D40]">Gem</span>
           </span>
           <span className="text-[9px] text-architect-500 font-futura tracking-[0.2em] uppercase">Studio</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="flex items-center bg-architect-900 border border-architect-700 rounded-full p-0.5">
           <button onClick={() => onLangChange('en')} className={clsx("w-8 h-6 flex items-center justify-center rounded-full transition-all text-sm", lang === 'en' ? "bg-architect-700 shadow" : "opacity-50 hover:opacity-100")}>🇺🇸</button>
           <button onClick={() => onLangChange('vi')} className={clsx("w-8 h-6 flex items-center justify-center rounded-full transition-all text-sm", lang === 'vi' ? "bg-architect-700 shadow" : "opacity-50 hover:opacity-100")}>🇻🇳</button>
        </div>
        <button onClick={onOpenKeys} className="text-[10px] font-medium text-architect-400 hover:text-white flex items-center gap-1 border border-architect-700 rounded-full px-3 py-1 hover:border-architect-500 transition-colors uppercase tracking-wider">
          <Icons.Sparkles size={10} /><span>{t.apiConfig}</span>
        </button>
      </div>
    </nav>
  );
}

// ... CompareSlider ...
const CompareSlider = ({ before, after, lang }: { before: string; after: string; lang: Language }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];
  const handleMouseMove = (e: React.MouseEvent) => { if (!containerRef.current) return; const rect = containerRef.current.getBoundingClientRect(); setPosition(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))); };
  const handleTouchMove = (e: React.TouchEvent) => { if (!containerRef.current) return; const rect = containerRef.current.getBoundingClientRect(); setPosition(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100))); };
  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden group cursor-col-resize z-10" onMouseMove={(e) => e.buttons === 1 && handleMouseMove(e)} onTouchMove={handleTouchMove}>
      <img src={after} alt="Result" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt="Input" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded backdrop-blur-md shadow-lg">{t.before}</div>
      </div>
      <div className="absolute top-4 right-4 bg-architect-accent/90 text-white text-[9px] font-bold px-2 py-1 rounded backdrop-blur-md pointer-events-none shadow-lg">{t.after}</div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-architect-accent rounded-full border-2 border-white flex items-center justify-center shadow-xl"><Icons.MoveHorizontal size={16} className="text-white" /></div>
      </div>
    </div>
  );
};

// ... ImageUpload (Add lang prop) ...
interface ImageUploadProps {
  image: File | null;
  onImageChange: (file: File) => void;
  onRemove?: () => void;
  label?: string;
  small?: boolean;
  cropRect?: CropRect;
  onCropChange?: (rect: CropRect) => void;
  targetRatio?: number;
  focusPoint?: FocusPoint;
  onFocusChange?: (pt: FocusPoint) => void;
  zoomLevel?: number;
  lang: Language;
}
const ImageUpload: React.FC<ImageUploadProps> = ({ image, onImageChange, onRemove, label, small=false, cropRect, onCropChange, targetRatio, focusPoint, onFocusChange, zoomLevel, lang }) => {
  const t = TRANSLATIONS[lang];
  const defaultLabel = t.uploadBase;
  // ... existing refs/logic ...
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ active: boolean, mode: string, startX: number, startY: number, startRect: any, startFocus: any }>({ active: false, mode: 'move', startX: 0, startY: 0, startRect: {}, startFocus: {} });
  const [naturalSize, setNaturalSize] = useState<{w: number, h: number} | null>(null);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files[0]) onImageChange(e.dataTransfer.files[0]); };
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  const handleMouseDown = (e: React.MouseEvent, mode: string) => { if (!cropRect && !focusPoint) return; e.stopPropagation(); e.preventDefault(); dragRef.current = { active: true, mode, startX: e.clientX, startY: e.clientY, startRect: cropRect ? {...cropRect} : {x:0,y:0,w:0,h:0}, startFocus: focusPoint ? {...focusPoint} : {x:50,y:50} }; };
  const handleImageClick = (e: React.MouseEvent) => { if (focusPoint && onFocusChange && containerRef.current) { const rect = containerRef.current.getBoundingClientRect(); const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)); const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)); onFocusChange({ x: xPct, y: yPct }); } };
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active || !containerRef.current) return;
      const { startX, startY, startRect, startFocus, mode } = dragRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - startX) / rect.width) * 100;
      const deltaY = ((e.clientY - startY) / rect.height) * 100;
      if (mode === 'focus' && onFocusChange) { onFocusChange({ x: Math.max(0, Math.min(100, startFocus.x + deltaX)), y: Math.max(0, Math.min(100, startFocus.y + deltaY)) }); return; }
      if (cropRect && onCropChange) {
        let newRect = { ...startRect };
        const imgRatio = rect.width / rect.height; const ratioFactor = imgRatio / (targetRatio || 1);
        if (mode === 'move') { newRect.x += deltaX; newRect.y += deltaY; } else {
          if (mode === 'n' || mode === 's') { 
              newRect.y += deltaY; newRect.h -= deltaY;
              if (mode === 's') { newRect.y = startRect.y; newRect.h = startRect.h + deltaY; }
              const newW = newRect.h / ratioFactor;
              newRect.x = startRect.x - (newW - startRect.w) / 2;
              newRect.w = newW;
          } else if (mode === 'e' || mode === 'w') {
              newRect.x += deltaX; newRect.w -= deltaX;
              if (mode === 'e') { newRect.x = startRect.x; newRect.w = startRect.w + deltaX; }
              const newH = newRect.w * ratioFactor;
              newRect.y = startRect.y - (newH - startRect.h) / 2;
              newRect.h = newH;
          } else {
             if (mode.includes('e')) newRect.w += deltaX; if (mode.includes('s')) newRect.h += deltaY; if (mode.includes('w')) { newRect.x += deltaX; newRect.w -= deltaX; } if (mode.includes('n')) { newRect.y += deltaY; newRect.h -= deltaY; }
             if (targetRatio) { if (mode === 'n' || mode === 's') { newRect.w = newRect.h / ratioFactor; newRect.x = startRect.x - (newRect.w - startRect.w) / 2; } else { newRect.h = newRect.w * ratioFactor; if (mode.includes('n')) newRect.y = startRect.y + (startRect.h - newRect.h); else if (!mode.includes('s')) newRect.y = startRect.y - (newRect.h - startRect.h) / 2; } }
          }
        }
        if (newRect.w < 5) newRect.w = 5; if (newRect.h < 5) newRect.h = 5; if (targetRatio) { if (mode === 'n' || mode === 's') newRect.w = newRect.h / ratioFactor; else newRect.h = newRect.w * ratioFactor; }
        if (newRect.x < 0) newRect.x = 0; if (newRect.y < 0) newRect.y = 0; if (newRect.x + newRect.w > 100) newRect.x = 100 - newRect.w; if (newRect.y + newRect.h > 100) newRect.y = 100 - newRect.h;
        onCropChange(newRect);
      }
    };
    const handleWindowMouseUp = () => { dragRef.current.active = false; };
    if (cropRect || focusPoint) { window.addEventListener('mousemove', handleWindowMouseMove); window.addEventListener('mouseup', handleWindowMouseUp); }
    return () => { window.removeEventListener('mousemove', handleWindowMouseMove); window.removeEventListener('mouseup', handleWindowMouseUp); };
  }, [cropRect, onCropChange, targetRatio, focusPoint, onFocusChange]);
  
  return (
    <div className={clsx("relative w-full h-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center bg-architect-900/30 overflow-hidden", image ? "border-architect-600" : "border-architect-700 hover:border-architect-500 hover:bg-architect-800/30 cursor-pointer")} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      {!image ? ( <> <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => e.target.files && e.target.files[0] && onImageChange(e.target.files[0])} /> <div className="flex flex-col items-center text-architect-400 gap-2 pointer-events-none p-2"> <div className={clsx("rounded-full bg-architect-800 flex items-center justify-center", small ? "w-8 h-8" : "w-10 h-10")}> <Icons.Upload size={small ? 14 : 18} /> </div> {!small && <div className="text-center"><p className="font-medium text-architect-200 text-xs uppercase tracking-wide">{label || defaultLabel}</p></div>} </div> </> ) : (
        <div className="relative w-full h-full flex items-center justify-center p-2">
           <div className="relative shadow-2xl" style={{ aspectRatio: naturalSize ? `${naturalSize.w} / ${naturalSize.h}` : 'auto', maxHeight: '100%', maxWidth: '100%' }} ref={containerRef} onClick={focusPoint ? handleImageClick : undefined}>
              <img ref={imgRef} src={URL.createObjectURL(image)} alt="Preview" className={clsx("w-full h-full object-contain block", focusPoint ? "cursor-crosshair" : "")} onLoad={onImageLoad} />
              {!cropRect && !focusPoint && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => e.target.files && e.target.files[0] && onImageChange(e.target.files[0])} />}
              {focusPoint && zoomLevel && ( <> <div className="absolute w-6 h-6 -ml-3 -mt-3 cursor-move z-30 flex items-center justify-center" style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }} onMouseDown={(e) => handleMouseDown(e, 'focus')}> <div className="w-1 h-3 bg-architect-accent absolute"></div> <div className="w-3 h-1 bg-architect-accent absolute"></div> <div className="w-full h-full border border-white rounded-full opacity-50"></div> </div> <div className="absolute rounded-full border-2 border-architect-accent border-dashed pointer-events-none z-20 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%`, width: `${100 / zoomLevel}%`, aspectRatio: '1/1', transform: 'translate(-50%, -50%)' }} /> <div className="absolute top-2 left-2 bg-architect-accent/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded z-30"> {t.zoom}: {zoomLevel.toFixed(1)}x </div> </> )}
              {cropRect && ( <div className="absolute border-2 border-architect-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move z-20" style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%`, }} onMouseDown={(e) => handleMouseDown(e, 'move')}> <div className="absolute inset-0 flex flex-col pointer-events-none"> <div className="flex-1 border-b border-white/20"></div> <div className="flex-1 border-b border-white/20"></div> <div className="flex-1"></div> </div> <div className="absolute inset-0 flex pointer-events-none"> <div className="flex-1 border-r border-white/20"></div> <div className="flex-1 border-r border-white/20"></div> <div className="flex-1"></div> </div> <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-architect-accent border border-white rounded-full cursor-nw-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'nw')} /> <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-architect-accent border border-white rounded-full cursor-ne-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'ne')} /> <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-architect-accent border border-white rounded-full cursor-sw-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'sw')} /> <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-architect-accent border border-white rounded-full cursor-se-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'se')} /> <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-white/80 rounded-full cursor-n-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'n')} /> <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-white/80 rounded-full cursor-s-resize z-30" onMouseDown={(e) => handleMouseDown(e, 's')} /> <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.5 h-3 bg-white/80 rounded-full cursor-w-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'w')} /> <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1.5 h-3 bg-white/80 rounded-full cursor-e-resize z-30" onMouseDown={(e) => handleMouseDown(e, 'e')} /> <div className="absolute -top-6 left-0 bg-architect-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded"> {t.cropArea} </div> </div> )}
              {!cropRect && !focusPoint && ( <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none"> <p className="opacity-0 hover:opacity-100 text-white font-bold tracking-wider bg-black/50 rounded-full backdrop-blur-sm text-[10px] px-3 py-1"> {t.replace} </p> </div> )}
              {onRemove && ( <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-2 right-2 w-5 h-5 bg-architect-accent text-white rounded-full flex items-center justify-center z-40 hover:bg-architect-accent-pressed shadow-md"> <Icons.X size={12} /> </button> )}
           </div>
        </div>
      )}
    </div>
  );
};

const CanvasToolbar = ({ config, onChange, lang }: { config: CanvasConfig, onChange: (cfg: CanvasConfig) => void, lang: Language }) => {
  const t = TRANSLATIONS[lang];
  const ratios: AspectRatio[] = ['Original', '1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '3:2', '2:3'];
  const resolutions: Resolution[] = ['Standard', 'HD', 'FHD', '2K', '4K', '8K'];
  const RatioIcon = ({ ratio }: { ratio: AspectRatio }) => {
    let w = 'w-3', h = 'h-3'; if (ratio === '4:3' || ratio === '3:2') { w = 'w-4'; h = 'h-3'; } if (ratio === '16:9' || ratio === '21:9') { w = 'w-5'; h = 'h-3'; } if (ratio === '3:4' || ratio === '2:3') { w = 'w-3'; h = 'h-4'; } if (ratio === '9:16') { w = 'w-3'; h = 'h-5'; }
    if (ratio === 'Original') return <div className="w-4 h-4 border border-current rounded-[1px] flex items-center justify-center"><div className="w-2 h-2 bg-current opacity-50"></div></div>;
    return <div className={`border-[1.5px] border-current rounded-[1px] ${w} ${h}`} />;
  };
  return (
    <div className="h-16 flex-none bg-[#0e1012] border-t border-architect-800 flex items-center px-6 gap-6 overflow-x-auto no-scrollbar">
       <div className="flex-none text-[10px] font-bold text-architect-500 uppercase tracking-widest whitespace-nowrap">{t.canvasConfig}</div>
       <div className="flex items-center gap-2"> {ratios.map(r => ( <button key={r} onClick={() => onChange({ ...config, ratio: r })} className={clsx("h-9 px-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all min-w-[50px]", config.ratio === r ? "bg-architect-accent border-architect-accent text-white shadow-lg shadow-architect-accent/20 hover:bg-architect-accent-pressed" : "bg-architect-900 border-architect-700 text-architect-400 hover:border-architect-500 hover:text-white")}> <RatioIcon ratio={r} /><span className="text-[9px] font-mono leading-none">{r === 'Original' ? 'ORIG' : r}</span> </button> ))} </div>
       <div className="w-px h-8 bg-architect-800 flex-none mx-2"></div>
       <div className="flex items-center gap-2"> {resolutions.map(res => ( <button key={res} onClick={() => onChange({ ...config, resolution: res })} className={clsx("h-9 px-3 rounded-lg border text-[10px] font-bold tracking-wider transition-all whitespace-nowrap", config.resolution === res ? "bg-architect-accent border-architect-accent text-white shadow-lg shadow-architect-accent/20 hover:bg-architect-accent-pressed" : "bg-architect-900 border-architect-700 text-architect-400 hover:border-architect-500 hover:text-white")}>{res}</button> ))} </div>
    </div>
  );
};

const RecentHistory = ({ history, onSelect, lang }: { history: HistoryItem[], onSelect: (item: HistoryItem) => void, lang: Language }) => {
  const t = TRANSLATIONS[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => { if (scrollRef.current) scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' }); };
  return (
    <div className="h-44 border-t border-architect-800 bg-[#0e1012] flex flex-col relative group/container">
       <div className="px-6 py-3 flex items-center justify-between border-b border-architect-800/50 bg-architect-900/30"> <h3 className="text-[10px] font-bold text-architect-400 uppercase tracking-widest flex items-center gap-2"><Icons.History size={12} className="text-architect-500" />{t.recent}</h3> <span className="text-[10px] text-architect-600 font-mono tracking-wider">{history.length} {t.items}</span> </div>
       <div className="flex-1 relative flex items-center overflow-hidden">
          <div className="absolute left-4 top-0 bottom-0 flex items-center z-20"><button onClick={() => scroll('left')} className="w-10 h-10 bg-[#0e1012] border border-architect-700 rounded-full flex items-center justify-center shadow-lg text-architect-400 transition-all hover:scale-105 active:scale-95 hover:bg-architect-accent hover:border-architect-accent hover:text-white active:bg-architect-accent-pressed"><Icons.ChevronLeft size={20} /></button></div>
          <div ref={scrollRef} className="flex-1 flex gap-4 overflow-x-auto px-16 py-4 no-scrollbar h-full items-center scroll-smooth">
             {history.length === 0 ? <div className="w-full flex justify-center items-center text-architect-700 gap-2"><span className="text-xs uppercase tracking-widest">{t.noRecent}</span></div> : history.map((item) => ( <div key={item.id} className="flex-shrink-0 relative group cursor-pointer h-24 w-36 rounded-lg overflow-hidden border border-architect-800 bg-architect-900 shadow-md hover:border-architect-accent transition-all duration-300 hover:scale-105" onClick={() => onSelect(item)}> <img src={item.url} alt="History" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icons.Maximize size={16} className="text-white drop-shadow-md" /></div> </div> ))} <div className="w-12 flex-shrink-0"></div>
          </div>
          <div className="absolute right-4 top-0 bottom-0 flex items-center z-20"><button onClick={() => scroll('right')} className="w-10 h-10 bg-[#0e1012] border border-architect-700 rounded-full flex items-center justify-center shadow-lg text-architect-400 transition-all hover:scale-105 active:scale-95 hover:bg-architect-accent hover:border-architect-accent hover:text-white active:bg-architect-accent-pressed"><Icons.ChevronRight size={20} /></button></div>
       </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  // Use useMemo to get translated tools based on lang
  const currentTools = useMemo(() => getTools(lang), [lang]);
  const t = TRANSLATIONS[lang];

  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(currentTools[0]);
  const [toolValues, setToolValues] = useState<{[key: string]: any}>({});
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [refImages, setRefImages] = useState<(File | null)[]>([null, null, null]);
  const [referenceWeight, setReferenceWeight] = useState<number>(50);
  const [inputImageDims, setInputImageDims] = useState<{ width: number; height: number } | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [recentResults, setRecentResults] = useState<HistoryItem[]>([]);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({ ratio: 'Original', resolution: 'Standard' });
  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('custom_wolfniix_logo'));
  const [isDetectingCamera, setIsDetectingCamera] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({ isLoading: false, resultUrl: null, resultText: null, annotations: undefined, error: null });
  const [isCompareMode, setIsCompareMode] = useState(false);

  useEffect(() => { GeminiService.checkApiKey().then(setApiKeyReady); }, []);
  // Initialize defaults when tool changes, but be careful with language switch preservation
  // We should check ID instead of object reference to preserve selection across language changes
  useEffect(() => { 
    if (!selectedTool) return;
    const defaults: any = {}; 
    selectedTool.options.forEach(opt => { 
      // Preserve existing values if they exist, otherwise use default
      if (toolValues[opt.id] === undefined) {
         defaults[opt.id] = opt.defaultValue; 
      }
    }); 
    // Merge defaults only if missing
    setToolValues(prev => ({ ...prev, ...defaults }));
  }, [selectedTool]);

  // Update selectedTool reference when tools change (language switch)
  useEffect(() => {
     if (selectedTool) {
        const found = currentTools.find(t => t.id === selectedTool.id);
        if (found) setSelectedTool(found);
     }
  }, [currentTools]);

  const handleToolChange = (tool: ToolDefinition) => { if (selectedTool?.id === tool.id) { setSelectedTool(null); } else { setSelectedTool(tool); } };
  const handleOptionChange = (id: string, val: any) => { setToolValues(prev => ({ ...prev, [id]: val })); };

  // ... helpers (getEffectiveAspectRatio, getNumericAspectRatio, calculateCropFromFocus, handleAutoDetectCamera, etc.) ...
  // Re-pasting critical helpers to ensure context
  const getEffectiveAspectRatio = (config: CanvasConfig, imgDims: { width: number, height: number } | null): string => {
      if (config.ratio === 'Original' && imgDims) {
          const r = imgDims.width / imgDims.height;
          const supported = [{ id: '1:1', val: 1 }, { id: '4:3', val: 4/3 }, { id: '3:4', val: 3/4 }, { id: '16:9', val: 16/9 }, { id: '9:16', val: 9/16 }];
          return supported.reduce((prev, curr) => (Math.abs(curr.val - r) < Math.abs(prev.val - r) ? curr : prev)).id;
      }
      switch (config.ratio) { case '21:9': return '16:9'; case '3:2': return '4:3'; case '2:3': return '3:4'; case 'Original': return '1:1'; default: return config.ratio; }
  };
  const getNumericAspectRatio = (ratio: AspectRatio, inputWidth?: number, inputHeight?: number): number => {
      if (ratio === 'Original' && inputWidth && inputHeight) return inputWidth / inputHeight;
      switch (ratio) { case '1:1': return 1; case '4:3': return 4/3; case '3:4': return 3/4; case '16:9': return 16/9; case '9:16': return 9/16; case '21:9': return 21/9; case '3:2': return 3/2; case '2:3': return 2/3; default: return 1; }
  };
  const calculateCropFromFocus = (pt: FocusPoint, zoom: number, targetRatio: number, imgW: number, imgH: number): CropRect => {
     let wPct = 100 / zoom; const imgRatio = imgW / imgH; let hPct = wPct * imgRatio / targetRatio;
     if (hPct > 100) { hPct = 100; wPct = 100 * targetRatio / imgRatio; }
     let x = pt.x - (wPct / 2); let y = pt.y - (hPct / 2);
     if (x < 0) x = 0; if (y < 0) y = 0; if (x + wPct > 100) x = 100 - wPct; if (y + hPct > 100) y = 100 - hPct;
     return { x, y, w: wPct, h: hPct };
  }
  const handleAutoDetectCamera = async () => { if (!inputImage) return; if (!apiKeyReady) { await GeminiService.promptApiKeySelection(); setApiKeyReady(await GeminiService.checkApiKey()); if (!(await GeminiService.checkApiKey())) return; } setIsDetectingCamera(true); try { const pose = await GeminiService.estimateCameraPose(inputImage); setToolValues(prev => ({ ...prev, cameraControl: { ...prev.cameraControl, yaw: pose.yaw, pitch: pose.pitch } })); } catch (err) { console.error(err); } finally { setIsDetectingCamera(false); } };
  const handleApiKeyConfig = async () => { await GeminiService.promptApiKeySelection(); setApiKeyReady(await GeminiService.checkApiKey()); };
  const handleLogoUpload = (file: File) => { const r = new FileReader(); r.onload = (e) => { const res = e.target?.result as string; setCustomLogo(res); localStorage.setItem('custom_wolfniix_logo', res); }; r.readAsDataURL(file); };
  const handleImageSet = (file: File) => { setInputImage(file); const img = new Image(); img.onload = () => setInputImageDims({ width: img.width, height: img.height }); img.src = URL.createObjectURL(file); };
  const handleRefImageSet = (i: number, f: File) => { const n = [...refImages]; n[i] = f; setRefImages(n); };
  const handleRefImageRemove = (i: number) => { const n = [...refImages]; n[i] = null; setRefImages(n); };
  const handleDownload = async () => { if (generationState.resultUrl && !generationState.annotations) { const link = document.createElement('a'); link.href = generationState.resultUrl; link.download = `archigem-render-${Date.now()}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); return; } };
  
  const calculateCameraDescription = (yaw: number, pitch: number, zoom: number): string => { 
      // Logic same as previous, just keep english for prompt
      let y = yaw % 360; if (y > 180) y -= 360; if (y < -180) y += 360;
      let horizontalDesc = "";
      if (Math.abs(y) <= 20) horizontalDesc = "DIRECT FRONTAL FACADE. The camera is perfectly centered on the front elevation.";
      else if (y > 20 && y <= 70) horizontalDesc = "FRONT-RIGHT CORNER 3/4 VIEW. Show the main facade and the RIGHT side facade.";
      else if (y > 70 && y <= 110) horizontalDesc = "RIGHT SIDE ELEVATION. Pure profile view of the RIGHT side of the building.";
      else if (y > 110 && y <= 160) horizontalDesc = "REAR-RIGHT CORNER. View from the back-right.";
      else if (y < -20 && y >= -70) horizontalDesc = "FRONT-LEFT CORNER 3/4 VIEW. Show the main facade and the LEFT side facade.";
      else if (y < -70 && y >= -110) horizontalDesc = "LEFT SIDE ELEVATION. Pure profile view of the LEFT side of the building.";
      else if (y < -110 && y >= -160) horizontalDesc = "REAR-LEFT CORNER. View from the back-left.";
      else horizontalDesc = "DIRECT REAR FACADE. View of the back of the building.";
      let verticalDesc = "";
      if (pitch > 60) verticalDesc = "TOP-DOWN PLAN VIEW. Map-like perspective looking straight down.";
      else if (pitch > 15) verticalDesc = "HIGH-ANGLE AERIAL / BIRD'S EYE VIEW. Camera is elevated, looking down.";
      else if (pitch < -15) verticalDesc = "LOW-ANGLE WORM'S EYE VIEW. Camera is on the ground looking up dramatically.";
      else verticalDesc = "EYE-LEVEL / STREET VIEW. Standard human perspective.";
      let lensDesc = "Standard 50mm lens.";
      if (zoom < 0.8) lensDesc = "Wide-angle 24mm lens. Expansive field of view.";
      if (zoom > 1.5) lensDesc = "Telephoto 85mm lens. Compressed depth.";
      return `Target Camera Position: ${horizontalDesc} ${verticalDesc} ${lensDesc}`;
  };

  const handleGenerate = async () => {
    if (!selectedTool) return;
    if (!apiKeyReady) { await handleApiKeyConfig(); if (!(await GeminiService.checkApiKey())) return; }
    if (!inputImage) { setGenerationState(prev => ({ ...prev, error: "Please upload an image first." })); return; }
    setGenerationState({ isLoading: true, resultUrl: null, resultText: null, annotations: undefined, error: null });
    
    let finalPrompt = selectedTool.promptTemplate;
    Object.keys(toolValues).forEach(key => { 
        const val = toolValues[key]; 
        if (typeof val !== 'object') { 
            let replacement = String(val); 
            // Localized Custom Prompt Check
            if (replacement === t.customPromptKey || replacement === 'Custom Prompt') replacement = 'custom requirements specified below'; 
            finalPrompt = finalPrompt.replace(`\${${key}}`, replacement); 
        } 
    });
    
    if (toolValues['cameraControl'] && selectedTool.id === ToolId.CAMERA_ANGLE) { 
        const cam = toolValues['cameraControl']; 
        const instruction = calculateCameraDescription(cam.yaw, cam.pitch, cam.zoom); 
        finalPrompt = finalPrompt.replace('${cameraInstruction}', instruction).replace('${viewpointInstruction}', instruction); 
    }
    
    finalPrompt = finalPrompt.replace(/\$\{\w+\}/g, ''); 
    if (toolValues['userPrompt'] && !selectedTool.promptTemplate.includes('${userPrompt}')) finalPrompt += ` ${toolValues['userPrompt']}`; 
    finalPrompt = finalPrompt.replace('${userPrompt}', toolValues['userPrompt'] || '');
    
    const activeRefs = refImages.filter(img => img !== null) as File[];
    let effectiveCrop = toolValues['cropRegion'];
    if (selectedTool.id === ToolId.CLOSE_UP_RENDER && toolValues['focusPoint'] && toolValues['zoomLevel'] && inputImageDims) {
        const pt = toolValues['focusPoint'] as FocusPoint; const zoom = toolValues['zoomLevel'] as number; const targetRatio = getNumericAspectRatio(canvasConfig.ratio, inputImageDims.width, inputImageDims.height);
        effectiveCrop = calculateCropFromFocus(pt, zoom, targetRatio, inputImageDims.width, inputImageDims.height);
    }
    
    try {
      const result = await GeminiService.generateArchitectureOutput(selectedTool, inputImage, finalPrompt, canvasConfig, activeRefs, referenceWeight, effectiveCrop);
      const newState: GenerationState = { isLoading: false, resultUrl: result.imageUrl || null, resultText: result.text || null, annotations: result.annotations, error: null };
      if (result.annotations && !result.imageUrl) newState.resultUrl = URL.createObjectURL(inputImage);
      setGenerationState(newState);
      if (newState.resultUrl) { setRecentResults(prev => [{ id: Date.now().toString(), url: newState.resultUrl!, timestamp: Date.now(), tool: selectedTool.name, annotations: newState.annotations }, ...prev]); }
    } catch (err: any) { setGenerationState({ isLoading: false, resultUrl: null, error: err.message || "An unexpected error occurred." }); }
  };

  const getNumericEffectiveRatio = (): number => { const ratioStr = getEffectiveAspectRatio(canvasConfig, inputImageDims); const [w, h] = ratioStr.split(':').map(Number); return w / h; };
  const showCropEditor = selectedTool?.options.some(o => o.type === 'crop-selector') && inputImage;
  const showFocusEditor = selectedTool?.options.some(o => o.type === 'focus-point') && inputImage;
  const cropOptionId = selectedTool?.options.find(o => o.type === 'crop-selector')?.id;
  const focusOptionId = selectedTool?.options.find(o => o.type === 'focus-point')?.id;
  const zoomOptionId = selectedTool?.options.find(o => o.id === 'zoomLevel')?.id;
  const showCompareButton = (selectedTool?.id === ToolId.SKETCH_TO_IMAGE || selectedTool?.id === ToolId.IMAGE_TO_SKETCH) && generationState.resultUrl && inputImage;

  return (
    <div className="h-screen flex flex-col font-sans text-architect-100 bg-[#0a0a0a] overflow-hidden">
      <Navbar onOpenKeys={handleApiKeyConfig} customLogo={customLogo} onUploadLogo={handleLogoUpload} lang={lang} onLangChange={setLang} />
      <main className="flex-1 flex pt-16 h-full overflow-hidden">
        <aside className="w-[300px] flex-none flex flex-col border-r border-architect-800 bg-architect-900/50 backdrop-blur-sm z-20 shadow-2xl h-full">
          <div className="p-4 border-b border-architect-800 bg-architect-900/80"><h2 className="text-[10px] font-bold text-architect-500 uppercase tracking-widest">{t.toolbox}</h2></div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {currentTools.map((tool) => (
              <ToolAccordionItem
                key={tool.id} tool={tool} isSelected={selectedTool?.id === tool.id} onClick={() => handleToolChange(tool)}
                optionsValue={toolValues} onOptionChange={handleOptionChange}
                onAutoDetectCamera={selectedTool?.id === ToolId.CAMERA_ANGLE ? handleAutoDetectCamera : undefined}
                isDetectingCamera={isDetectingCamera}
                inputImage={inputImage}
                lang={lang}
              />
            ))}
          </div>
          <div className="p-4 border-t border-architect-800 bg-architect-900/80">
             {!apiKeyReady ? (
                <button onClick={handleApiKeyConfig} className="w-full py-3 bg-architect-700 hover:bg-architect-600 text-white rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2"><Icons.Sparkles size={16} /> {t.connectKey}</button>
             ) : (
                <button onClick={handleGenerate} disabled={!selectedTool || generationState.isLoading || !inputImage} className={clsx("w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg", !selectedTool || generationState.isLoading || !inputImage ? "bg-architect-800 text-architect-500 cursor-not-allowed" : "bg-architect-accent hover:bg-architect-accent-pressed text-white shadow-architect-accent/20 active:bg-architect-accent-pressed")}>{generationState.isLoading ? <Icons.Loader2 className="animate-spin" size={18} /> : !selectedTool ? t.selectTool : <><Icons.Sparkles size={18} /> {t.generate}</>}</button>
             )}
             {generationState.error && <div className="mt-2 text-[10px] text-red-400 text-center leading-tight">{generationState.error}</div>}
          </div>
        </aside>
        <div className="flex-1 flex flex-col bg-[#121416] relative min-w-0">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
             <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-architect-800/50 min-h-0 gap-4">
                <div className="flex-[2] flex flex-col min-h-0">
                  <div className="flex-none flex items-center justify-between mb-3"><h3 className="text-[10px] font-bold text-architect-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-architect-600"></span> {t.inputSource}</h3></div>
                  <div className="flex-1 bg-architect-900/20 border border-architect-800 rounded-xl overflow-hidden relative shadow-inner min-h-0">
                     <ImageUpload 
                        image={inputImage} onImageChange={handleImageSet} onRemove={() => { setInputImage(null); setInputImageDims(null); }} 
                        label={t.uploadBase} lang={lang}
                        cropRect={showCropEditor && cropOptionId ? (toolValues[cropOptionId] || selectedTool?.options.find(o=>o.id === cropOptionId)?.defaultValue) : undefined}
                        onCropChange={showCropEditor && cropOptionId ? (rect) => handleOptionChange(cropOptionId, rect) : undefined}
                        focusPoint={showFocusEditor && focusOptionId ? (toolValues[focusOptionId] || selectedTool?.options.find(o=>o.id === focusOptionId)?.defaultValue) : undefined}
                        onFocusChange={showFocusEditor && focusOptionId ? (pt) => handleOptionChange(focusOptionId, pt) : undefined}
                        zoomLevel={showFocusEditor && zoomOptionId ? (toolValues[zoomOptionId] || 2.5) : undefined}
                        targetRatio={inputImageDims ? getNumericAspectRatio(canvasConfig.ratio, inputImageDims.width, inputImageDims.height) : undefined}
                     />
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                   <div className="flex-none flex items-center justify-between mb-3">
                     <h3 className="text-[10px] font-bold text-architect-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-architect-500"></span> {t.optionalRefs}</h3>
                     <div className="flex items-center gap-2 group relative">
                        <span className="text-[9px] text-architect-500">{t.styleStrength}</span>
                        <input type="range" min="0" max="100" value={referenceWeight} onChange={(e) => setReferenceWeight(parseInt(e.target.value))} className="w-20 h-1 bg-architect-800 rounded-lg appearance-none cursor-pointer accent-architect-accent" />
                        <span className="text-[9px] font-mono text-architect-accent w-6">{referenceWeight}%</span>
                     </div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
                    {[0, 1, 2].map(idx => (<ImageUpload key={idx} image={refImages[idx]} onImageChange={(file) => handleRefImageSet(idx, file)} onRemove={() => handleRefImageRemove(idx)} label="" small={true} lang={lang} />))}
                  </div>
                </div>
             </div>
             <div className="flex-1 p-6 flex flex-col min-h-0">
                <div className="flex-none flex items-center justify-between mb-3">
                   <div className="flex items-center gap-4">
                     <h3 className="text-[10px] font-bold text-architect-400 uppercase tracking-widest flex items-center gap-2"><span className={clsx("w-1.5 h-1.5 rounded-full", generationState.resultUrl || generationState.resultText ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-architect-600")}></span> {t.result}</h3>
                     {showCompareButton && (
                        <button onClick={() => setIsCompareMode(!isCompareMode)} className={clsx("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded transition-all", isCompareMode ? "bg-architect-accent text-white shadow-lg shadow-architect-accent/20 hover:bg-architect-accent-pressed active:bg-architect-accent-pressed" : "bg-architect-800 text-architect-400 hover:text-white")}>
                          <Icons.Compare size={12} /> {t.compare}
                        </button>
                     )}
                   </div>
                   {generationState.resultUrl && <button onClick={handleDownload} className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-architect-400 hover:text-white transition-colors bg-architect-800/50 px-2 py-1 rounded"><Icons.Download size={12} /> {t.save}</button>}
                </div>
                <div className="flex-1 bg-architect-900/20 border border-architect-800 rounded-xl overflow-hidden relative flex flex-col items-center justify-center shadow-inner min-h-0">
                   <FitToAspectContainer ratio={getNumericEffectiveRatio()}>
                       {!generationState.resultText && !generationState.isLoading && (
                            <div className="absolute inset-0 border-2 border-dashed border-architect-accent/60 pointer-events-none z-30">
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="bg-architect-900/80 px-2 py-1 text-[9px] text-architect-500 rounded font-mono border border-architect-800 backdrop-blur-md">
                                  {canvasConfig.ratio === 'Original' ? 'ORIGINAL' : canvasConfig.ratio}
                                </span>
                              </div>
                            </div>
                        )}
                       {isCompareMode && generationState.resultUrl && inputImage ? (
                          <div className="w-full h-full z-10">
                            <CompareSlider before={URL.createObjectURL(inputImage)} after={generationState.resultUrl} lang={lang} />
                          </div>
                       ) : (
                         <>
                            {generationState.isLoading && (
                              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                                  <div className="relative"><div className="w-12 h-12 border-2 border-architect-800 border-t-architect-accent rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Icons.Sparkles size={16} className="text-white animate-pulse" /></div></div>
                                  <p className="mt-3 text-xs font-medium text-architect-200 tracking-wider animate-pulse">{t.processing}</p>
                              </div>
                            )}
                            {generationState.resultUrl ? (
                                <img src={generationState.resultUrl} alt="Render Result" className="w-full h-full object-cover" />
                            ) : generationState.resultText ? (
                                <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar bg-[#121416]">
                                    <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{generationState.resultText}</ReactMarkdown></div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-20 select-none bg-[#0e1012]">
                                    <Icons.LayoutTemplate size={40} className="mx-auto mb-3" />
                                    <p className="font-display text-sm tracking-widest">{!selectedTool ? t.selectTool : t.waiting}</p>
                                </div>
                            )}
                         </>
                       )}
                   </FitToAspectContainer>
                </div>
             </div>
          </div>
          <CanvasToolbar config={canvasConfig} onChange={setCanvasConfig} lang={lang} />
          <div className="flex-none"><RecentHistory history={recentResults} onSelect={(item) => { setGenerationState(prev => ({ ...prev, resultUrl: item.url, resultText: null, annotations: item.annotations })); setIsCompareMode(false); }} lang={lang} /></div>
        </div>
      </main>
    </div>
  );
}