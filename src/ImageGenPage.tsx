import React, { useState, useRef, useCallback } from 'react';
import { Card } from 'animal-island-ui';
import 'animal-island-ui/style';

// ===== 常量配置 =====
const MODELS = [
  { value: 'gpt-image-2', label: 'GPT-Image-2 标准版', desc: '高性价比渠道，稳定性跟随市场变化' },
  { value: 'gpt-image-2-official', label: 'GPT-Image-2 官方版', desc: '官方99%稳定渠道，支持质量选择' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini-3-pro-image 标准版', desc: '高性价比渠道，稳定性跟随市场变化' },
  { value: 'gemini-3-pro-image-preview-official', label: 'Gemini-3-pro-image 官方版', desc: '官方99%稳定渠道' },
  { value: 'gemini-3.1-flash-image-preview', label: 'Gemini-3.1-flash-image 标准版', desc: '高性价比渠道，支持Google搜索增强' },
  { value: 'gemini-3.1-flash-image-preview-official', label: 'Gemini-3.1-flash-image 官方版', desc: '官方渠道，支持Google搜索增强' },
];

const GEMINI_PRO_ASPECT_RATIOS = [
  '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9',
];

const GEMINI_FLASH_ASPECT_RATIOS = [
  '1:1', '2:3', '3:2', '1:4', '4:1', '3:4', '4:3', '4:5', '5:4', '1:8', '8:1', '9:16', '16:9', '21:9',
];

const QUALITY_OPTIONS = [
  { value: 'low',    label: '快速',   desc: '约30s' },
  { value: 'medium', label: '均衡',   desc: '约60s' },
  { value: 'high',   label: '高质量', desc: '60-130s' },
];

const RESOLUTIONS = [
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
];

const ASPECT_RATIOS = [
  '9:16', '16:9', '1:1', '1:2', '2:1', '1:3', '3:1',
  '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:21', '21:9',
];

const STANDARD_CREDIT_COST: Record<string, number> = {
  '1k': 6, '2k': 12, '4k': 19,
};

const GEMINI_CREDIT_COST: Record<string, Record<string, number>> = {
  'gemini-3-pro-image-preview':                    { '1k': 42,  '2k': 42,  '4k': 52  },
  'gemini-3-pro-image-preview-official':           { '1k': 112, '2k': 112, '4k': 202 },
  'gemini-3.1-flash-image-preview':               { '1k': 32,  '2k': 42,  '4k': 63  },
  'gemini-3.1-flash-image-preview-official':      { '1k': 56,  '2k': 85,  '4k': 127 },
};

const OFFICIAL_CREDIT_COST: Record<string, Record<string, Record<string, number>>> = {
  low: {
    '1:1':  { '1k': 5,  '2k': 10, '4k': 17 },
    '1:2':  { '1k': 4,  '2k': 5,  '4k': 8  },
    '2:1':  { '1k': 4,  '2k': 5,  '4k': 8  },
    '1:3':  { '1k': 4,  '2k': 5,  '4k': 8  },
    '3:1':  { '1k': 4,  '2k': 5,  '4k': 8  },
    '2:3':  { '1k': 4,  '2k': 6,  '4k': 12 },
    '3:2':  { '1k': 4,  '2k': 6,  '4k': 12 },
    '3:4':  { '1k': 4,  '2k': 6,  '4k': 13 },
    '4:3':  { '1k': 4,  '2k': 6,  '4k': 13 },
    '4:5':  { '1k': 4,  '2k': 10, '4k': 14 },
    '5:4':  { '1k': 4,  '2k': 10, '4k': 14 },
    '9:16': { '1k': 4,  '2k': 5,  '4k': 10 },
    '16:9': { '1k': 4,  '2k': 5,  '4k': 10 },
    '9:21': { '1k': 4,  '2k': 4,  '4k': 6  },
    '21:9': { '1k': 4,  '2k': 4,  '4k': 6  },
  },
  medium: {
    '1:1':  { '1k': 45,  '2k': 90,  '4k': 150 },
    '1:2':  { '1k': 30,  '2k': 41,  '4k': 68  },
    '2:1':  { '1k': 30,  '2k': 41,  '4k': 68  },
    '1:3':  { '1k': 14,  '2k': 25,  '4k': 34  },
    '3:1':  { '1k': 14,  '2k': 25,  '4k': 34  },
    '2:3':  { '1k': 35,  '2k': 47,  '4k': 100 },
    '3:2':  { '1k': 35,  '2k': 47,  '4k': 100 },
    '3:4':  { '1k': 31,  '2k': 56,  '4k': 110 },
    '4:3':  { '1k': 31,  '2k': 56,  '4k': 110 },
    '4:5':  { '1k': 38,  '2k': 84,  '4k': 120 },
    '5:4':  { '1k': 38,  '2k': 84,  '4k': 120 },
    '9:16': { '1k': 28,  '2k': 36,  '4k': 84  },
    '16:9': { '1k': 28,  '2k': 36,  '4k': 84  },
    '9:21': { '1k': 24,  '2k': 33,  '4k': 53  },
    '21:9': { '1k': 24,  '2k': 33,  '4k': 53  },
  },
  high: {
    '1:1':  { '1k': 177, '2k': 360, '4k': 598 },
    '1:2':  { '1k': 119, '2k': 163, '4k': 272 },
    '2:1':  { '1k': 119, '2k': 163, '4k': 272 },
    '1:3':  { '1k': 54,  '2k': 100, '4k': 134 },
    '3:1':  { '1k': 54,  '2k': 100, '4k': 134 },
    '2:3':  { '1k': 139, '2k': 185, '4k': 396 },
    '3:2':  { '1k': 139, '2k': 185, '4k': 396 },
    '3:4':  { '1k': 122, '2k': 224, '4k': 449 },
    '4:3':  { '1k': 122, '2k': 224, '4k': 449 },
    '4:5':  { '1k': 154, '2k': 338, '4k': 479 },
    '5:4':  { '1k': 154, '2k': 338, '4k': 479 },
    '9:16': { '1k': 109, '2k': 143, '4k': 336 },
    '16:9': { '1k': 109, '2k': 143, '4k': 336 },
    '9:21': { '1k': 93,  '2k': 127, '4k': 207 },
    '21:9': { '1k': 93,  '2k': 127, '4k': 207 },
  },
};

// ===== 类型 =====
interface UploadedImage {
  id: string;
  file: File;
  url: string;    // 本地预览 URL
  name: string;
}

interface GenerateResult {
  task_id: string;
  status: string;
  images: string[];
  credit_cost: number;
}

// ===== 主页面组件 =====
export default function ImageGenPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [model, setModel] = useState('gpt-image-2-official');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('1k');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [isDragging, setIsDragging] = useState(false);
  const [runningTasks, setRunningTasks] = useState<Array<{localId: string; taskId: string; status: string}>>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewImg, setPreviewImg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [quality, setQuality] = useState('low');
  const [numImages, setNumImages] = useState(1);
  const [fallback, setFallback] = useState(false);
  const [googleSearch, setGoogleSearch] = useState(false);
  const [googleImageSearch, setGoogleImageSearch] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // 组件卸载时清理所有轮询定时器，防止内存泄漏
  React.useEffect(() => {
    return () => {
      pollTimers.current.forEach(timer => clearInterval(timer));
      pollTimers.current.clear();
    };
  }, []);

  // ===== 图片上传逻辑 =====
  // 压缩图片为 Blob（两个模型统一上传图床使用）
  const resizeToBlob = (file: File, maxPx = 1024): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(blobUrl);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('压缩失败'));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('图片加载失败')); };
      img.src = blobUrl;
    });

  // 上传图片到图床，返回公网URL（官方版图生图专用）
  const uploadToImagebed = async (file: File): Promise<string> => {
    const blob = await resizeToBlob(file);
    const formData = new FormData();
    formData.append('file', blob, file.name.replace(/\.[^.]+$/, '.jpg'));
    const token = localStorage.getItem('access_token') || '';
    const res = await fetch('http://localhost:8000/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('图床上传失败');
    const data = await res.json();
    if (!data.url) throw new Error('图床上传失败：无URL');
    return data.url;
  };

  const addImages = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const maxImgs = model.startsWith('gemini') ? 5 : 16;
    const remaining = maxImgs - uploadedImages.length;
    if (remaining <= 0) return;
    const toAdd = arr.slice(0, remaining).filter(f => f.type.startsWith('image/'));
    const newImgs: UploadedImage[] = toAdd.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setUploadedImages(prev => [...prev, ...newImgs]);
  }, [uploadedImages.length, model]);

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addImages(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  // ===== 生成逻辑 =====
  const startPolling = (localId: string, tid: string, useFallback = false, origPrompt = '', origSize = '9:16', origResolution = '1k') => {
    const token = localStorage.getItem('access_token') || '';
    let elapsed = 0;
    const timer = setInterval(async () => {
      elapsed += 4;
      try {
        const res = await fetch(`http://localhost:8000/api/tasks/${tid}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const st = data.status;
        const statusText = st === 'in_progress' ? `生成中... ${data.progress ?? 0}%` : st === 'submitted' ? '已提交，等待处理...' : st;
        setRunningTasks(prev => prev.map(t => t.localId === localId ? { ...t, status: statusText } : t));
        if (st === 'completed') {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          setResultImages(prev => [...prev, ...(data.images || [])]);
        } else if (st === 'failed') {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          if (useFallback) {
            setRunningTasks(prev => prev.map(t => t.localId === localId ? { ...t, status: '标准版失败，切换官方版重试...' } : t));
            try {
              const retryRes = await fetch('http://localhost:8000/api/generate/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  model: 'gpt-image-2-official',
                  prompt: origPrompt,
                  size: origSize,
                  resolution: origResolution,
                  quality: 'medium',
                  n: 1,
                  output_format: 'png',
                }),
              });
              const retryData = await retryRes.json();
              if (retryRes.ok) {
                setRunningTasks(prev => prev.map(t => t.localId === localId ? { ...t, taskId: retryData.task_id, status: '官方版已提交...' } : t));
                setTimeout(() => startPolling(localId, retryData.task_id, false, origPrompt, origSize, origResolution), 15000);
              } else {
                setRunningTasks(prev => prev.filter(t => t.localId !== localId));
                setErrorMsg('官方版重试失败，请稍后再试');
              }
            } catch {
              setRunningTasks(prev => prev.filter(t => t.localId !== localId));
              setErrorMsg('官方版重试失败，请稍后再试');
            }
          } else {
            setRunningTasks(prev => prev.filter(t => t.localId !== localId));
            setErrorMsg(data.error || '生成失败，请重试');
          }
        } else if (elapsed >= 1550) {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          setErrorMsg('生成超时，请重试');
        }
      } catch {
        // 网络错误忽略，继续轮询
      }
    }, 4000);
    pollTimers.current.set(localId, timer);
  };

  const toggleSelect = (idx: number) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const batchDownload = () => {
    Array.from(selectedImages).forEach((idx, order) => {
      setTimeout(() => {
        downloadImage(resultImages[idx], `ViVa_AI_${Date.now()}_${idx + 1}.png`);
      }, order * 500);
    });
  };

  const batchDelete = () => {
    setResultImages(prev => prev.filter((_, i) => !selectedImages.has(i)));
    setSelectedImages(new Set());
    setIsSelectMode(false);
  };

  const sendToReference = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `generated_${Date.now()}.png`, { type: blob.type || 'image/png' });
      const localUrl = URL.createObjectURL(file);
      // 【Qclaw修改】修复：使用动态 maxRefImages 而非写死的16
      setUploadedImages(prev => {
        if (prev.length >= maxRefImages) return prev;
        return [...prev, { id: Math.random().toString(36).slice(2), file, url: localUrl, name: file.name }];
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // silently fail
    }
  };

  // ===== 计算变量（提前定义，供 handleGenerate 及渲染使用）=====
  const isGeminiModel = model.startsWith('gemini');
  const isFlashModel = model.startsWith('gemini-3.1-flash');
  const isOfficialModel = model.endsWith('-official');
  const maxRefImages = isGeminiModel ? 10 : 16;
  const currentAspectRatios = isFlashModel ? GEMINI_FLASH_ASPECT_RATIOS : (isGeminiModel ? GEMINI_PRO_ASPECT_RATIOS : ASPECT_RATIOS);
  const creditCostPerImage = isGeminiModel
    ? (GEMINI_CREDIT_COST[model]?.[resolution] ?? 0)
    : (isOfficialModel
      ? (OFFICIAL_CREDIT_COST[quality]?.[aspectRatio]?.[resolution] ?? 0)
      : (STANDARD_CREDIT_COST[resolution] ?? 0));
  const creditCost = creditCostPerImage * numImages;
  const officialFallbackCost = (!isOfficialModel && fallback)
    ? (isGeminiModel
      ? (GEMINI_CREDIT_COST[model + '-official']?.[resolution] ?? 0) * numImages
      : (OFFICIAL_CREDIT_COST['medium']?.[aspectRatio]?.[resolution] ?? 0) * numImages)
    : 0;

  const handleGenerate = async () => {
    if (!prompt.trim()) { setErrorMsg('请输入提示词'); return; }
    setErrorMsg('');

    const token = localStorage.getItem('access_token') || 'dev-token';

    // 参考图只上传一次，所有任务共用
    let sharedImageUrls: string[] = [];
    if (uploadedImages.length > 0) {
      const uploadId = '__upload__' + Math.random().toString(36).slice(2);
      setRunningTasks(prev => [...prev, { localId: uploadId, taskId: '', status: '上传参考图中...' }]);
      try {
        sharedImageUrls = await Promise.all(uploadedImages.map(i => uploadToImagebed(i.file)));
      } catch {
        setRunningTasks(prev => prev.filter(t => t.localId !== uploadId));
        setErrorMsg('参考图上传失败，请重试');
        return;
      }
      setRunningTasks(prev => prev.filter(t => t.localId !== uploadId));
    }

    // 每张图独立提交一个任务（n=1），避免多图返回格式不一致
    for (let i = 0; i < numImages; i++) {
      const localId = Math.random().toString(36).slice(2);
      setRunningTasks(prev => [...prev, { localId, taskId: '', status: '正在提交任务...' }]);

      (async () => {
        try {
          const body: Record<string, unknown> = {
            model,
            prompt: prompt.trim(),
            size: aspectRatio,
            resolution,
            quality: isOfficialModel ? quality : undefined,
            n: 1,
            output_format: 'png',
          };
          if (sharedImageUrls.length > 0) body.image_urls = sharedImageUrls;
          if ((isGeminiModel || model === 'gpt-image-2') && !isOfficialModel && fallback) {
            body.official_fallback = true;
          }
          if (isFlashModel && googleSearch) body.google_search = true;
          if (isFlashModel && googleImageSearch) body.google_image_search = true;

          const res = await fetch('http://localhost:8000/api/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });
          const data: GenerateResult = await res.json();
          if (!res.ok) throw new Error((data as unknown as { detail: string }).detail || '提交失败');

          setRunningTasks(prev => prev.map(t => t.localId === localId
            ? { ...t, taskId: data.task_id, status: '已提交，等待处理...' }
            : t));
          setTimeout(() => startPolling(localId, data.task_id,
            fallback && !isOfficialModel && !isGeminiModel,
            prompt.trim(), aspectRatio, resolution), 15000);
        } catch (e: unknown) {
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          setErrorMsg((e as Error).message || '提交失败，请检查网络');
        }
      })();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f0', fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>

      {/* 顶部导航 */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px', background: 'rgb(247,243,223)',
        borderBottom: '2px solid #c4b89e', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌿</span>
          <span
            style={{ fontSize: 20, fontWeight: 800, color: '#794f27', cursor: 'pointer' }}
            onClick={() => window.location.href = '/'}
          >ViVa AI助手</span>
          <span style={{ color: '#c4b89e', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: 16, color: '#9f927d', fontWeight: 600 }}>🎨 AI 文生图 / 图生图</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#e6f9f6', borderRadius: 20, padding: '4px 14px',
            color: '#19c8b9', fontWeight: 700, fontSize: 14,
          }}>
            ⚡ 积分余额: <span style={{ fontSize: 16 }}>500</span>
          </div>
          <button onClick={() => window.location.href = '/video'}
            style={{ background: '#f0e8d8', border: '1.5px solid #c4b89e', borderRadius: 20, padding: '5px 14px', color: '#794f27', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🎬 去生视频
          </button>
        </div>
      </nav>

      {/* 主体：左侧参数 + 右侧结果 */}
      <div style={{ display: 'flex', gap: 24, padding: '28px 48px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ===== 左侧：参数面板 ===== */}
        <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 模型选择 */}
          <Card color="app-blue" type="default">
            <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 12 }}>
              🤖 模型选择
            </div>
            <select
              value={model}
              onChange={e => {
                const v = e.target.value;
                setModel(v);
                setFallback(false);
                setGoogleSearch(false);
                setGoogleImageSearch(false);
                if (v === 'gpt-image-2') { setNumImages(1); }
                if (v !== 'gpt-image-2-official' && numImages > 4) setNumImages(4);
                const isFlash = v.startsWith('gemini-3.1-flash');
                const isGemini = v.startsWith('gemini');
                const validRatios = isFlash ? GEMINI_FLASH_ASPECT_RATIOS : (isGemini ? GEMINI_PRO_ASPECT_RATIOS : ASPECT_RATIOS);
                if (!validRatios.includes(aspectRatio)) setAspectRatio('1:1');
              }}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '2px solid #c4b89e', background: '#faf9f4',
                color: '#794f27', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 }}>
              {MODELS.find(m => m.value === model)?.desc}
            </div>
            {!isOfficialModel && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}
                onClick={() => setFallback(v => !v)}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${fallback ? '#19c8b9' : '#c4b89e'}`,
                  background: fallback ? '#19c8b9' : '#faf9f4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {fallback && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: '#794f27', fontWeight: 600 }}>官方渠道兜底</span>
              </div>
            )}
            {isFlashModel && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => { const v = !googleSearch; setGoogleSearch(v); if (!v) setGoogleImageSearch(false); }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${googleSearch ? '#19c8b9' : '#c4b89e'}`,
                    background: googleSearch ? '#19c8b9' : '#faf9f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {googleSearch && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#794f27', fontWeight: 600 }}>🔍 Google 文字搜索增强</span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => { const v = !googleImageSearch; setGoogleImageSearch(v); if (v) setGoogleSearch(true); }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${googleImageSearch ? '#19c8b9' : '#c4b89e'}`,
                    background: googleImageSearch ? '#19c8b9' : '#faf9f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {googleImageSearch && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#794f27', fontWeight: 600 }}>🖼 Google 图片搜索增强</span>
                </div>
              </div>
            )}
          </Card>

          {/* 参考图上传区域 */}
          <Card color="app-green" type="default" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 4 }}>
                🖼️ 参考图像 <span style={{ color: '#5c3d1e', fontWeight: 400, fontSize: 12 }}>（选填，最多{maxRefImages}张）</span>
              </div>
            </div>

            {/* 拖拽上传区 */}
            <div
              style={{
                margin: '0 16px 16px',
                border: `2px dashed ${isDragging ? '#19c8b9' : '#c4b89e'}`,
                borderRadius: 12,
                background: isDragging ? '#e6f9f6' : '#faf9f4',
                padding: '10px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
              <div style={{ color: '#794f27', fontWeight: 700, fontSize: 14 }}>点击或拖拽上传图片</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files && addImages(e.target.files)}
              />
            </div>

            {/* 已上传图片预览 */}
            {uploadedImages.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                padding: '12px 16px 16px',
              }}>
                {uploadedImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 72, height: 72 }}>
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: 72, height: 72, objectFit: 'cover',
                        borderRadius: 8, border: '2px solid #c4b89e',
                        cursor: 'pointer',
                      }}
                      onClick={() => { setPreviewImg(img.url); setShowPreview(true); }}
                    />
                    <button
                      onClick={() => removeImage(img.id)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#e05a5a', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 提示词 */}
          <Card color="app-orange" type="default">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 800, color: '#794f27', fontSize: 15 }}>✍️ 提示词</span>
              <button
                title="AI一键优化提示词（即将上线）"
                style={{
                  background: '#e6f9f6', border: '1.5px solid #19c8b9',
                  borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
                  color: '#19c8b9', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ✨ AI优化 <span style={{ fontSize: 10, color: '#9f927d' }}>即将上线</span>
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想生成的图像，支持中英文。例如：夕阳下的樱花树，唯美插画风格，高饱和色彩"
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                borderRadius: 10, border: '2px solid #c4b89e',
                padding: '10px 12px', fontSize: 14, color: '#794f27',
                background: '#faf9f4', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
            <div style={{ textAlign: 'right', color: '#9f927d', fontSize: 12, marginTop: 4 }}>
              {prompt.length} 字符
            </div>
          </Card>

          {/* 分辨率 + 宽高比 + 生成数量（同一排下拉框） */}
          <Card color="app-yellow" type="default">
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 14, marginBottom: 8 }}>📐 宽高比</div>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '2px solid #c4b89e', background: '#faf9f4',
                    color: '#794f27', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  {currentAspectRatios.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 14, marginBottom: 8 }}>🔍 分辨率</div>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '2px solid #c4b89e', background: '#faf9f4',
                    color: '#794f27', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  {RESOLUTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 14, marginBottom: 8 }}>🖼 生成数量</div>
                <select
                  value={numImages}
                  onChange={e => setNumImages(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '2px solid #c4b89e', background: '#faf9f4',
                    color: '#794f27', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  {model !== 'gpt-image-2'
                    ? [1, 2, 3, 4].map(n => <option key={n} value={n}>{n}张</option>)
                    : <option value={1}>1张</option>
                  }
                </select>
              </div>
            </div>
          </Card>

          {/* Quality 选择器（仅 GPT-Image-2 官方版） */}
          {model === 'gpt-image-2-official' && (
            <Card color="app-green" type="default">
              <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 12 }}>
                ✨ 生成质量
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {QUALITY_OPTIONS.map(q => (
                  <div
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: 10,
                      border: `2px solid ${quality === q.value ? '#19c8b9' : '#c4b89e'}`,
                      background: quality === q.value ? '#e6f9f6' : '#faf9f4',
                      textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#794f27', fontSize: 14 }}>{q.label}</div>
                    <div style={{ color: '#9f927d', fontSize: 11, marginTop: 2 }}>{q.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}


          {/* 生成按钮 */}
          <div style={{ marginTop: 4 }}>
            {errorMsg && (
              <div style={{
                background: '#fff0f0', border: '1.5px solid #e05a5a',
                borderRadius: 10, padding: '8px 14px', color: '#e05a5a',
                fontSize: 13, marginBottom: 10,
              }}>⚠️ {errorMsg}</div>
            )}
            <button
              onClick={handleGenerate}
              style={{
                width: '100%', padding: '14px 0',
                borderRadius: 24, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg, #19c8b9 0%, #6fba2c 100%)',
                color: '#fff', fontSize: 17, fontWeight: 900,
                letterSpacing: 1, boxShadow: '0 4px 16px rgba(25,200,185,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <span>🚀 开始生成 · 消耗 {!isOfficialModel && fallback ? `${creditCost}-${officialFallbackCost}` : creditCost} 积分</span>
              {runningTasks.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, opacity: 0.85 }}>({runningTasks.length} 个任务生成中)</span>
              )}
            </button>
          </div>
        </div>

        {/* ===== 右侧：生成结果 ===== */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'rgb(247,243,223)', borderRadius: 20,
            border: '2px solid #c4b89e', minHeight: 600,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: (resultImages.length > 0 || runningTasks.length > 0) ? 'flex-start' : 'center',
            padding: '16px 32px 32px',
          }}>
            {(resultImages.length > 0 || runningTasks.length > 0) ? (
              <div style={{ width: '100%' }}>
                {/* 进行中的任务 */}
                {runningTasks.length > 0 && (
                  <div style={{ marginBottom: resultImages.length > 0 ? 16 : 0 }}>
                    {runningTasks.map(task => (
                      <div key={task.localId} style={{
                        background: '#e6f9f6', borderRadius: 12, padding: '12px 16px',
                        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
                        border: '1.5px solid #b2ede8',
                      }}>
                        <div style={{ fontSize: 28 }}>🎨</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#794f27', fontSize: 14 }}>AI 正在创作中...</div>
                          <div style={{ color: '#19c8b9', fontSize: 12, marginTop: 2 }}>{task.status}</div>
                        </div>
                        <div style={{ width: 120, height: 4, background: '#c8f0ec', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #19c8b9, #6fba2c)', borderRadius: 2, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* 标题 + 工具栏 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15 }}>
                    ✨ 生成结果 <span style={{ fontSize: 12, color: '#9f927d', fontWeight: 400 }}>共 {resultImages.length} 张</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setIsSelectMode(v => !v); setSelectedImages(new Set()); }}
                      style={{ padding: '5px 14px', borderRadius: 20, border: `2px solid ${isSelectMode ? '#19c8b9' : '#c4b89e'}`, background: isSelectMode ? '#e6f9f6' : '#faf9f4', color: isSelectMode ? '#19c8b9' : '#794f27', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >{isSelectMode ? '退出选择' : '☑ 多选'}</button>
                    {isSelectMode && (
                      <>
                        <button
                          onClick={() => setSelectedImages(new Set(resultImages.map((_, i) => i)))}
                          style={{ padding: '5px 14px', borderRadius: 20, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >全选</button>
                        <button
                          onClick={() => setSelectedImages(new Set())}
                          style={{ padding: '5px 14px', borderRadius: 20, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >取消全选</button>
                        {selectedImages.size > 0 && (
                          <>
                            <button
                              onClick={batchDownload}
                              style={{ padding: '5px 14px', borderRadius: 20, border: 'none', background: '#19c8b9', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >⬇ 下载({selectedImages.size})</button>
                            <button
                              onClick={batchDelete}
                              style={{ padding: '5px 14px', borderRadius: 20, border: 'none', background: '#ff6b6b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >🗑 删除({selectedImages.size})</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* 图片网格 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 14,
                  maxHeight: resultImages.length > 4 ? 680 : undefined,
                  overflowY: resultImages.length > 4 ? 'auto' : 'visible',
                  paddingRight: 2,
                }}>
                  {resultImages.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: 14, overflow: 'hidden',
                        border: `2px solid ${isSelectMode && selectedImages.has(i) ? '#19c8b9' : '#c4b89e'}`,
                        boxShadow: isSelectMode && selectedImages.has(i) ? '0 0 0 3px rgba(25,200,185,0.25)' : '0 4px 16px rgba(121,79,39,0.1)',
                        background: '#fff', transition: 'all 0.15s',
                        gridColumn: resultImages.length === 1 ? 'span 2' : undefined,
                      }}
                    >
                      {/* 固定 1:1 比例的图片区域，任何比例的图都以相同大小显示 */}
                      <div
                        style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => isSelectMode ? toggleSelect(i) : (setPreviewImg(url), setShowPreview(true))}
                      >
                        {isSelectMode && (
                          <div
                            style={{
                              position: 'absolute', top: 10, left: 10, zIndex: 10,
                              width: 22, height: 22, borderRadius: 6,
                              border: `2px solid ${selectedImages.has(i) ? '#19c8b9' : 'rgba(255,255,255,0.9)'}`,
                              background: selectedImages.has(i) ? '#19c8b9' : 'rgba(255,255,255,0.75)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }}
                            onClick={e => { e.stopPropagation(); toggleSelect(i); }}
                          >
                            {selectedImages.has(i) && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                          </div>
                        )}
                        {isSelectMode && selectedImages.has(i) && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(25,200,185,0.1)', zIndex: 5, pointerEvents: 'none' }} />
                        )}
                        <img
                          src={url}
                          alt={`生成图片 ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            const retries = parseInt(img.dataset.retries || '0');
                            if (retries < 4) {
                              img.dataset.retries = String(retries + 1);
                              setTimeout(() => {
                                img.src = url + (url.includes('?') ? '&' : '?') + '_r=' + Date.now();
                              }, 3000);
                            }
                          }}
                        />
                      </div>
                      {!isSelectMode && (
                        <div style={{ display: 'flex', gap: 6, padding: '10px', background: '#faf9f4' }}>
                          <button
                            onClick={() => downloadImage(url, `ViVa_AI_${Date.now()}_${i + 1}.png`)}
                            style={{ flex: 1, background: '#f0e8d8', color: '#794f27', padding: '5px 0', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >⬇ 下载</button>
                          <button
                            onClick={() => sendToReference(url)}
                            style={{ flex: 1, background: '#f0e8d8', color: '#794f27', padding: '5px 0', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >✏️ 编辑</button>
                          <button
                            onClick={() => { setPreviewImg(url); setShowPreview(true); }}
                            style={{ flex: 1, background: '#f0e8d8', color: '#794f27', padding: '5px 0', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >🔍 大图</button>
                          <button
                            onClick={() => { setResultImages(prev => prev.filter((_, idx) => idx !== i)); setSelectedImages(new Set()); }}
                            style={{ flex: 1, background: '#f0e8d8', color: '#794f27', padding: '5px 0', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >🗑 删除</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9f927d' }}>
                <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.5 }}>🖼️</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#c4b89e', marginBottom: 8 }}>
                  生成结果将在这里显示
                </div>
                <div style={{ fontSize: 14 }}>
                  在左侧填写提示词，点击"开始生成"按钮
                </div>
              </div>
            )}
          </div>

          {/* 历史记录占位 */}
          <div style={{
            marginTop: 20, background: 'rgb(247,243,223)', borderRadius: 16,
            border: '2px solid #c4b89e', padding: '16px 20px',
          }}>
            <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 8 }}>
              🕐 最近生成记录
            </div>
            <div style={{ color: '#9f927d', fontSize: 13 }}>
              登录后查看你的创作历史记录
            </div>
          </div>
        </div>
      </div>

      {/* 图片大图预览 Modal */}
      {showPreview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'pointer',
          }}
          onClick={() => setShowPreview(false)}
        >
          <img
            src={previewImg}
            alt="预览"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setShowPreview(false)}
            style={{
              position: 'fixed', top: 20, right: 24,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              color: '#fff', fontSize: 20, cursor: 'pointer',
            }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
