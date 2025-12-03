
import React from 'react';
import { 
  PenTool, Image, LayoutTemplate, Sparkles, Camera, 
  Home, Armchair, Maximize, Layers, MessageSquare, FileImage,
  Upload, Download, X, AlertCircle, CheckCircle, ChevronRight, Loader2,
  ChevronLeft, ChevronUp, ChevronDown, RefreshCw, History, PanelTop,
  Cpu, Zap, ScanEye, ZoomIn, GitCompare, MoveHorizontal
} from 'lucide-react';

export const Icons = {
  PenTool, Image, LayoutTemplate, Sparkles, Camera, 
  Home, Armchair, Maximize, Layers, MessageSquare, FileImage,
  Upload, Download, X, AlertCircle, CheckCircle, ChevronRight, Loader2,
  ChevronLeft, ChevronUp, ChevronDown, RefreshCw, History, PanelTop,
  Cpu, Zap, ScanEye, ZoomIn, Compare: GitCompare, MoveHorizontal
};

export type IconName = keyof typeof Icons;
