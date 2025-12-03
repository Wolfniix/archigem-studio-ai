
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import clsx from 'clsx';

interface CameraState {
  yaw: number;
  pitch: number;
  zoom: number;
  panX?: number;
  panY?: number;
}

interface CameraStudioLabels {
  yaw: string;
  pitch: string;
  zoom: string;
  match: string;
  detecting: string;
  reset: string;
}

interface CameraStudioProps {
  value: CameraState;
  onChange: (value: CameraState) => void;
  onAutoDetect?: () => void;
  isDetecting?: boolean;
  labels?: CameraStudioLabels;
}

// ... existing interfaces ...
interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; }
interface Face { vertices: Point3D[]; color: string; normal?: Point3D; }
interface Object3D { faces: Face[]; }

export const CameraStudio: React.FC<CameraStudioProps> = ({ value, onChange, onAutoDetect, isDetecting, labels }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'orbit' | 'pan'>('orbit');
  const lastMousePos = useRef({ x: 0, y: 0 });

  const LABELS = labels || {
    yaw: "YAW ANGLE",
    pitch: "PITCH / TILT",
    zoom: "ZOOM LEVEL",
    match: "MATCH INPUT",
    detecting: "DETECTING ANGLE...",
    reset: "Reset View"
  };

  // ... existing variables ...
  const yaw = value?.yaw ?? 0;
  const pitch = value?.pitch ?? 0;
  const zoom = value?.zoom ?? 1;
  const panX = value?.panX ?? 0;
  const panY = value?.panY ?? 0;

  // ... existing scene definition ...
  const createBox = (x: number, y: number, z: number, w: number, h: number, d: number, color: string): Object3D => {
    const hw = w/2, hh = h/2, hd = d/2;
    const v = [
      { x: x-hw, y: y-hh, z: z-hd }, { x: x+hw, y: y-hh, z: z-hd },
      { x: x+hw, y: y+hh, z: z-hd }, { x: x-hw, y: y+hh, z: z-hd },
      { x: x-hw, y: y-hh, z: z+hd }, { x: x+hw, y: y-hh, z: z+hd },
      { x: x+hw, y: y+hh, z: z+hd }, { x: x-hw, y: y+hh, z: z+hd }
    ];
    return {
      faces: [
        { vertices: [v[0], v[1], v[2], v[3]], color },
        { vertices: [v[4], v[5], v[6], v[7]], color },
        { vertices: [v[0], v[3], v[7], v[4]], color },
        { vertices: [v[1], v[2], v[6], v[5]], color },
        { vertices: [v[0], v[1], v[5], v[4]], color },
        { vertices: [v[3], v[2], v[6], v[7]], color }
      ]
    };
  };

  const sceneObjects = React.useMemo(() => {
    return [
      createBox(0, -1.2, 0, 4.5, 0.4, 4.5, '#1a1d21'),
      createBox(-0.8, 0.5, -0.8, 1.2, 3.5, 1.2, '#adb5bd'),
      createBox(0.5, 0.2, 0.5, 3.2, 1.0, 1.8, '#343a40'),
      createBox(0.8, 0.75, 0.5, 2.8, 0.1, 2.0, '#e9ecef'),
      createBox(2.0, 0.2, 1.45, 0.1, 0.8, 0.1, '#D90429')
    ];
  }, []);

  // ... existing render loop ...
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);
    const radYaw = yaw * Math.PI / 180;
    const radPitch = pitch * Math.PI / 180;
    const transformPoint = (p: Point3D): Point3D => {
      let x = p.x - (panX * 0.05); let y = p.y - (panY * 0.05); let z = p.z;
      let tx = x * Math.cos(radYaw) - z * Math.sin(radYaw);
      let tz = x * Math.sin(radYaw) + z * Math.cos(radYaw);
      x = tx; z = tz;
      let ty = y * Math.cos(radPitch) - z * Math.sin(radPitch);
      tz = y * Math.sin(radPitch) + z * Math.cos(radPitch);
      y = ty; z = tz;
      return { x, y, z };
    };
    const project = (p: Point3D): Point2D => {
      const perspective = 6;
      const scale = Math.min(width, height) * 0.18 * zoom;
      const factor = perspective / (perspective - p.z);
      return { x: cx + p.x * scale * factor, y: cy - p.y * scale * factor };
    };
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    const gridSize = 8; const gridStep = 0.5;
    ctx.beginPath();
    for (let i = -gridSize; i <= gridSize; i++) {
        const x = i * gridStep;
        const p1 = transformPoint({ x: x, y: -1.4, z: -gridSize * gridStep });
        const p2 = transformPoint({ x: x, y: -1.4, z: gridSize * gridStep });
        if (p1.z < 3 && p2.z < 3) { const proj1 = project(p1); const proj2 = project(p2); ctx.moveTo(proj1.x, proj1.y); ctx.lineTo(proj2.x, proj2.y); }
        const p3 = transformPoint({ x: -gridSize * gridStep, y: -1.4, z: x });
        const p4 = transformPoint({ x: gridSize * gridStep, y: -1.4, z: x });
         if (p3.z < 3 && p4.z < 3) { const proj3 = project(p3); const proj4 = project(p4); ctx.moveTo(proj3.x, proj3.y); ctx.lineTo(proj4.x, proj4.y); }
    }
    ctx.stroke();
    let renderList: { poly: Point2D[], zDepth: number, color: string, normalZ: number }[] = [];
    sceneObjects.forEach(obj => {
      obj.faces.forEach(face => {
        const tfVerts = face.vertices.map(transformPoint);
        const v0 = tfVerts[0]; const v1 = tfVerts[1]; const v2 = tfVerts[2];
        const ax = v1.x - v0.x; const ay = v1.y - v0.y; const az = v1.z - v0.z;
        const bx = v2.x - v0.x; const by = v2.y - v0.y; const bz = v2.z - v0.z;
        const nx = ay * bz - az * by; const ny = az * bx - ax * bz; const nz = ax * by - ay * bx;
        if (nz > 0) {
           const avgZ = tfVerts.reduce((sum, v) => sum + v.z, 0) / tfVerts.length;
           const projVerts = tfVerts.map(project);
           const light = { x: 0.5, y: 1, z: 0.5 };
           const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
           const dot = (nx*light.x + ny*light.y + nz*light.z) / len;
           const brightness = 0.5 + Math.max(0, dot) * 0.5;
           renderList.push({ poly: projVerts, zDepth: avgZ, color: face.color, normalZ: brightness });
        }
      });
    });
    renderList.sort((a, b) => a.zDepth - b.zDepth);
    renderList.forEach(face => {
      ctx.beginPath();
      ctx.moveTo(face.poly[0].x, face.poly[0].y);
      for(let i=1; i<face.poly.length; i++) { ctx.lineTo(face.poly[i].x, face.poly[i].y); }
      ctx.closePath();
      ctx.fillStyle = face.color; ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${1 - face.normalZ})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5; ctx.stroke();
    });
    const center = project(transformPoint({ x: 0, y: 0, z: 0 }));
    ctx.fillStyle = '#D90429';
    ctx.beginPath(); ctx.arc(center.x, center.y, 2, 0, Math.PI*2); ctx.fill();
  }, [yaw, pitch, zoom, panX, panY, sceneObjects]);

  // ... existing interaction handlers ...
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (e.button === 2 || e.shiftKey) { setDragMode('pan'); } else { setDragMode('orbit'); }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    if (dragMode === 'orbit') {
        onChange({ yaw: yaw + dx * 0.5, pitch: Math.max(-90, Math.min(90, pitch + dy * 0.5)), zoom, panX, panY });
    } else {
        onChange({ yaw, pitch, zoom, panX: panX + dx * 0.05, panY: panY + dy * 0.05 });
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(3, zoom - e.deltaY * 0.001));
    onChange({ yaw, pitch, zoom: newZoom, panX, panY });
  };
  const handleStep = (axis: 'yaw' | 'pitch', amount: number) => {
    const newVal = axis === 'yaw' ? yaw + amount : pitch + amount;
    const clampedPitch = axis === 'pitch' ? Math.max(-90, Math.min(90, newVal)) : pitch;
    const finalYaw = axis === 'yaw' ? newVal : yaw;
    onChange({ yaw: finalYaw, pitch: clampedPitch, zoom, panX, panY });
  };
  const resetView = () => { onChange({ yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 }); };
  const getAIInterpretation = () => {
    let y = yaw % 360;
    if (y > 180) y -= 360; if (y < -180) y += 360;
    let dir = "FRONT";
    if (y > 20 && y <= 70) dir = "FRONT-RIGHT";
    else if (y > 70 && y <= 110) dir = "RIGHT SIDE";
    else if (y > 110 && y <= 160) dir = "REAR-RIGHT";
    else if (y < -20 && y >= -70) dir = "FRONT-LEFT";
    else if (y < -70 && y >= -110) dir = "LEFT SIDE";
    else if (y < -110 && y >= -160) dir = "REAR-LEFT";
    else if (Math.abs(y) > 160) dir = "REAR";
    return dir;
  };
  const handleInputChange = (key: keyof CameraState, strVal: string) => {
    let val = parseFloat(strVal);
    if (isNaN(val)) return;
    if (key === 'pitch') val = Math.max(-90, Math.min(90, val));
    if (key === 'zoom') val = Math.max(0.5, Math.min(3, val));
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-black rounded-xl border border-architect-800 p-1 relative overflow-hidden group">
        <canvas 
          ref={canvasRef}
          width={280}
          height={200}
          className={clsx("w-full h-[200px] rounded-lg touch-none", isDragging ? "cursor-grabbing" : "cursor-grab")}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onContextMenu={(e) => e.preventDefault()}
        />
        {isDetecting && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm">
             <div className="flex flex-col items-center">
                <Icons.Loader2 className="animate-spin text-architect-accent mb-2" size={24} />
                <span className="text-[9px] font-bold text-architect-200 tracking-widest">{LABELS.detecting}</span>
             </div>
          </div>
        )}
        <div className="absolute top-3 left-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col gap-1 text-[8px] text-architect-400 bg-black/60 p-1 rounded backdrop-blur-sm">
                <span>LMB: ORBIT</span><span>RMB: PAN</span><span>SCROLL: ZOOM</span>
            </div>
        </div>
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="bg-architect-accent/20 text-architect-accent text-[10px] font-bold px-2 py-1 rounded border border-architect-accent/50 animate-pulse shadow-[0_0_10px_rgba(217,4,41,0.4)]">{getAIInterpretation()}</span>
        </div>
        {onAutoDetect && !isDetecting && (
           <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onAutoDetect} className="bg-black/60 hover:bg-architect-accent border border-architect-700 hover:border-architect-accent text-architect-300 hover:text-white rounded p-1.5 backdrop-blur-sm transition-all shadow-lg flex items-center gap-2 group/btn" title="Match Camera to Input Image">
                 <Icons.ScanEye size={14} />
                 <span className="text-[9px] font-bold hidden group-hover/btn:inline pr-1">{LABELS.match}</span>
              </button>
           </div>
        )}
      </div>

      <div className="bg-architect-800/50 p-4 rounded-xl border border-architect-700 flex flex-col gap-4">
        <div className="flex justify-center items-center mb-1 bg-architect-900/50 p-2 rounded-lg border border-architect-800">
          <div className="flex items-center gap-6">
            <button className="p-1 hover:bg-architect-700 hover:text-white rounded text-architect-400 transition-colors" onClick={() => handleStep('yaw', -5)} title="-5°"><Icons.ChevronLeft size={16}/></button>
            <button className="p-1 hover:bg-architect-700 hover:text-white rounded text-architect-400 transition-colors" onClick={() => handleStep('pitch', 5)} title="+5°"><Icons.ChevronUp size={16}/></button>
            <button className="p-2 bg-architect-800 hover:bg-architect-accent hover:text-white rounded-md text-architect-accent border border-architect-700 hover:border-architect-accent transition-all shadow-lg" onClick={resetView} title={LABELS.reset}><Icons.RefreshCw size={14}/></button>
            <button className="p-1 hover:bg-architect-700 hover:text-white rounded text-architect-400 transition-colors" onClick={() => handleStep('pitch', -5)} title="-5°"><Icons.ChevronDown size={16}/></button>
            <button className="p-1 hover:bg-architect-700 hover:text-white rounded text-architect-400 transition-colors" onClick={() => handleStep('yaw', 5)} title="+5°"><Icons.ChevronRight size={16}/></button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-architect-300">
              <span className="font-bold tracking-wider">{LABELS.yaw}</span>
              <div className="relative">
                 <input type="number" value={Math.round(yaw)} onChange={(e) => handleInputChange('yaw', e.target.value)} className="bg-transparent text-right w-16 text-architect-accent font-mono focus:outline-none focus:border-b focus:border-architect-accent" />
                 <span className="absolute right-0 top-0 pointer-events-none text-architect-accent opacity-0">°</span>
              </div>
            </div>
            <input type="range" min="-180" max="180" value={yaw} onChange={(e) => onChange({ ...value, yaw: parseFloat(e.target.value) })} className="w-full h-1 bg-architect-700 rounded-lg appearance-none cursor-pointer accent-architect-accent" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-architect-300">
              <span className="font-bold tracking-wider">{LABELS.pitch}</span>
              <div className="relative">
                 <input type="number" value={Math.round(pitch)} onChange={(e) => handleInputChange('pitch', e.target.value)} className="bg-transparent text-right w-16 text-architect-accent font-mono focus:outline-none focus:border-b focus:border-architect-accent" />
              </div>
            </div>
            <input type="range" min="-90" max="90" value={pitch} onChange={(e) => onChange({ ...value, pitch: parseFloat(e.target.value) })} className="w-full h-1 bg-architect-700 rounded-lg appearance-none cursor-pointer accent-architect-accent" />
          </div>

          <div className="space-y-1">
             <div className="flex justify-between items-center text-xs text-architect-300">
              <span className="font-bold tracking-wider">{LABELS.zoom}</span>
              <div className="relative">
                 <input type="number" step="0.1" value={zoom.toFixed(1)} onChange={(e) => handleInputChange('zoom', e.target.value)} className="bg-transparent text-right w-16 text-architect-accent font-mono focus:outline-none focus:border-b focus:border-architect-accent" />
              </div>
            </div>
            <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={(e) => onChange({ ...value, zoom: parseFloat(e.target.value) })} className="w-full h-1 bg-architect-700 rounded-lg appearance-none cursor-pointer accent-architect-accent" />
          </div>
        </div>
      </div>
    </div>
  );
};