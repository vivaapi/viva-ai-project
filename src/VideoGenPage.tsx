import React, { useState, useRef, useCallback } from 'react';
import { Card } from 'animal-island-ui';
import 'animal-island-ui/style';

// ===== 常量配置 =====
const VIDEO_MODELS = [
  { value: 'grok-imagine-1.0-video-apimart', label: 'Grok Video 3 M', desc: '高质量AI视频生成，支持文生视频和图生视频' },
  { value: 'grok-video-3', label: 'Grok Video 3 V', desc: '新一代视频生成，支持图生视频' },
  { value: 'grok-video-3-super', label: 'Grok Video 3 Y', desc: '高质量视频，仅支持10秒，16:9/9:16' },
  { value: 'happyhorse-1.0', label: 'HappyHorse 1.0', desc: '阿里云百炼，支持文生视频/图生视频/参考图生视频/视频编辑' },
  { value: 'doubao-seedance-2.0', label: 'Seedance 2.0', desc: '字节跳动Seedance，支持文生视频/图生视频/首尾帧控制/参考视频' },
];

// HappyHorse 专属配置
const HH_SIZES = [
  { value: '16:9', label: '16:9 横屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '1:1',  label: '1:1 正方形' },
  { value: '4:3',  label: '4:3 横版' },
  { value: '3:4',  label: '3:4 竖版' },
];
const HH_DURATIONS = [3,4,5,6,7,8,9,10,11,12,13,14,15];
const HH_MODES = [
  { value: 't2v', label: '✍️ 文生视频', desc: '纯文字描述生成' },
  { value: 'i2v', label: '🖼️ 图生视频', desc: '以首帧图为起始动起来' },
  { value: 'r2v', label: '📸 参考图生视频', desc: '多张参考图生成全新画面' },
  { value: 'edit', label: '🎬 视频编辑', desc: '对源视频改写/风格化' },
];

const GROK_SUPER_ASPECT_RATIOS = ['16:9', '9:16'];

const VIDEO_SIZES = [
  { value: '16:9', label: '16:9', desc: '横屏' },
  { value: '9:16', label: '9:16', desc: '竖屏' },
  { value: '1:1',  label: '1:1',  desc: '正方形' },
  { value: '3:2',  label: '3:2',  desc: '横屏宽' },
  { value: '2:3',  label: '2:3',  desc: '竖屏窄' },
];

const DURATION_OPTIONS = [6, 8, 10, 12, 15, 20, 25, 30];

// ===== 类型 =====
interface UploadedImage { id: string; file: File; url: string; name: string; }
interface RunningTask  { localId: string; taskId: string; status: string; }
interface VideoResult  { taskId: string; url: string; duration: number; size: string; modelLabel?: string; }
interface HistoryRecord {
  id: string;
  taskId: string;
  url: string;
  duration: number;
  size: string;
  modelLabel: string;
  createdAt: string; // ISO string
}

// ===== 本地存储 Key =====
const HISTORY_KEY = 'vivaai_video_history';
const MAX_HISTORY = 50;

function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(records: HistoryRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY)));
  } catch { /* 忽略 */ }
}

// ===== 主页面 =====
export default function VideoGenPage() {
  const [model, setModel]                 = useState('grok-imagine-1.0-video-apimart');
  const [prompt, setPrompt]               = useState('');
  const [size, setSize]                   = useState('16:9');
  const [duration, setDuration]           = useState(6);
  const [quality, setQuality]             = useState('480p');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging]       = useState(false);
  const [runningTasks, setRunningTasks]   = useState<RunningTask[]>([]);
  const [resultVideos, setResultVideos]   = useState<VideoResult[]>([]);
  const [errorMsg, setErrorMsg]           = useState('');
  const [previewImg, setPreviewImg]       = useState('');
  const [showPreview, setShowPreview]     = useState(false);
  const [activeTab, setActiveTab]         = useState<'generate'|'history'>('generate');
  const [history, setHistory]             = useState<HistoryRecord[]>(loadHistory);
  const [urlStatus, setUrlStatus]         = useState<Record<string, 'ok'|'expired'|'checking'>>({});

  // HappyHorse 专属状态
  const [hhMode, setHhMode]               = useState<'t2v'|'i2v'|'r2v'|'edit'>('t2v');
  const [hhFirstFrame, setHhFirstFrame]   = useState<UploadedImage | null>(null);
  const [hhRefImages, setHhRefImages]     = useState<UploadedImage[]>([]);
  const [hhVideoUrl, setHhVideoUrl]       = useState('');
  const [hhVideoStyleImgs, setHhVideoStyleImgs] = useState<UploadedImage[]>([]);
  const [hhAudioSetting, setHhAudioSetting] = useState<'auto'|'origin'>('auto');
  const [hhResolution, setHhResolution]   = useState<'720P'|'1080P'>('1080P');
  const [hhDuration, setHhDuration]       = useState(5);
  const [hhSize, setHhSize]               = useState('16:9');

  // Seedance 专属状态
  const [sdResolution, setSdResolution]   = useState<'420P'|'720P'|'1080P'>('720P');
  const [sdDuration, setSdDuration]       = useState(8);
  const [sdSize, setSdSize]               = useState('16:9');
  // Seedance 支持的宽高比（6选项）
  const SD_SIZES = [
    { value: '16:9', label: '16:9 横屏' }, { value: '9:16', label: '9:16 竖屏' },
    { value: '1:1',  label: '1:1 正方形' }, { value: '4:3',  label: '4:3 横版' },
    { value: '3:4',  label: '3:4 竖版' }, { value: '21:9', label: '21:9 超宽' },
  ];
  const [sdGenerateAudio, setSdGenerateAudio] = useState(true);
  const [sdReturnLastFrame, setSdReturnLastFrame] = useState(false);
  const [sdWebSearch, setSdWebSearch]     = useState(false);
  const [sdSeed, setSdSeed]               = useState('');
  const [sdFirstFrame, setSdFirstFrame]   = useState<UploadedImage | null>(null);
  const [sdFirstFrameUrl, setSdFirstFrameUrl] = useState('');
  const [sdLastFrame, setSdLastFrame]     = useState<UploadedImage | null>(null);
  const [sdLastFrameUrl, setSdLastFrameUrl] = useState('');
  const [sdRefVideoUrl, setSdRefVideoUrl] = useState('');
  const [sdRefAudioUrl, setSdRefAudioUrl] = useState('');
  const [sdRefVideoTooltip, setSdRefVideoTooltip] = useState(false);
  const [sdRefAudioTooltip, setSdRefAudioTooltip] = useState(false);
  const [sdFirstFrameDragging, setSdFirstFrameDragging] = useState(false);
  const [sdLastFrameDragging, setSdLastFrameDragging] = useState(false);

  const sdFirstFrameRef = useRef<HTMLInputElement>(null);
  const sdLastFrameRef  = useRef<HTMLInputElement>(null);
  const sdFirstFrameInputRef = useRef<HTMLInputElement>(null);
  const sdLastFrameInputRef  = useRef<HTMLInputElement>(null);

  const hhFirstFrameRef  = useRef<HTMLInputElement>(null);
  const hhRefImagesRef   = useRef<HTMLInputElement>(null);
  const hhStyleImgsRef   = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimers   = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const isGrokVideo3 = model === 'grok-video-3';
  const isGrokVideoSuper = model === 'grok-video-3-super';
  const isHappyHorse = model === 'happyhorse-1.0';
  const isSeedance = model === 'doubao-seedance-2.0';
  const hhCreditPerSec = hhResolution === '1080P' ? 4 : 2; // 待定，占位用
  const creditCost = isGrokVideo3 ? 28
    : isGrokVideoSuper ? (quality === '720p' ? 80 : 50)
    : isHappyHorse ? hhCreditPerSec * hhDuration
    : isSeedance ? 6 * sdDuration
    : 6 * duration;

  // ===== 图片压缩 & 上传图床 =====
  const resizeToBlob = (file: File, maxPx = 1024): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobUrl);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('图片加载失败')); };
      img.src = blobUrl;
    });

  const uploadToImagebed = async (file: File): Promise<string> => {
    const blob = await resizeToBlob(file);
    const fd = new FormData();
    fd.append('file', blob, file.name.replace(/\.[^.]+$/, '.jpg'));
    const res  = await fetch('https://imageproxy.zhongzhuan.chat/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.url) throw new Error('图床上传失败');
    return data.url;
  };

  // 组件卸载时清理所有轮询定时器，防止内存泄漏
  React.useEffect(() => {
    return () => {
      pollTimers.current.forEach(timer => clearInterval(timer));
      pollTimers.current.clear();
    };
  }, []);

  // ===== 图片上传逻辑 =====
  const addImages = useCallback((files: FileList | File[]) => {
    const arr       = Array.from(files);
    const remaining = 7 - uploadedImages.length;
    if (remaining <= 0) return;
    const toAdd = arr.slice(0, remaining).filter(f => f.type.startsWith('image/'));
    setUploadedImages(prev => [...prev, ...toAdd.map(f => ({
      id: Math.random().toString(36).slice(2), file: f,
      url: URL.createObjectURL(f), name: f.name,
    }))]);
  }, [uploadedImages.length]);

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  // ===== 轮询任务状态 =====
  const startPolling = (localId: string, tid: string, taskDuration: number, taskSize: string) => {
    const token = localStorage.getItem('access_token') || '';
    let elapsed = 0;
    const timer = setInterval(async () => {
      elapsed += 5;
      try {
        const res  = await fetch(`http://localhost:8000/api/tasks/${tid}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const st   = data.status;
        const statusText =
          st === 'in_progress' ? `生成中... ${data.progress ?? 0}%` :
          st === 'submitted'   ? '已提交，等待处理...' : st;

        setRunningTasks(prev => prev.map(t =>
          t.localId === localId ? { ...t, status: statusText } : t));

        if (st === 'completed') {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          const vids: string[] = data.videos || [];
          if (vids.length > 0) {
            const modelLabel = VIDEO_MODELS.find(m => m.value === model)?.label || model;
            setResultVideos(prev => [...prev, ...vids.map(url => ({
              taskId: tid, url, duration: taskDuration, size: taskSize, modelLabel,
            }))]);
          // 写入历史记录
          setHistory(prev => {
            const newRecords: HistoryRecord[] = vids.map(url => ({
              id: Math.random().toString(36).slice(2),
              taskId: tid,
              url,
              duration: taskDuration,
              size: taskSize,
              modelLabel,
              createdAt: new Date().toISOString(),
            }));
            const merged = [...newRecords, ...prev].slice(0, MAX_HISTORY);
            saveHistory(merged);
            return merged;
          });
          } else {
            setErrorMsg('视频生成完成但未返回视频链接，请稍后重试');
          }
        } else if (st === 'failed') {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          setErrorMsg(data.error || '视频生成失败，请重试');
        } else if (elapsed >= Math.max(300, taskDuration * 15)) {
          clearInterval(timer);
          pollTimers.current.delete(localId);
          setRunningTasks(prev => prev.filter(t => t.localId !== localId));
          setErrorMsg(`视频生成超时（${Math.round(Math.max(300, taskDuration * 15) / 60)}分钟），请重试`);
        }
      } catch { /* 网络错误忽略，继续轮询 */ }
    }, 5000);
    pollTimers.current.set(localId, timer);
  };

  // ===== 提交生成 =====
  const handleGenerate = async () => {
    if (!prompt.trim()) { setErrorMsg('请输入提示词'); return; }
    setErrorMsg('');
    const token   = localStorage.getItem('access_token') || 'dev-token';
    const localId = Math.random().toString(36).slice(2);
    setRunningTasks(prev => [...prev, { localId, taskId: '', status: '正在提交任务...' }]);

    try {
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        setRunningTasks(prev => prev.map(t =>
          t.localId === localId ? { ...t, status: '上传参考图中...' } : t));
        imageUrls = await Promise.all(uploadedImages.map(i => uploadToImagebed(i.file)));
      }

      const actualModel = isGrokVideo3 ? (duration === 10 ? 'grok-video-3-10s' : 'grok-video-3')
        : isGrokVideoSuper ? (quality === '720p' ? 'grok-imagine-1.0-video-super-720p' : 'grok-imagine-1.0-video-super')
        : model;

      let body: Record<string, unknown>;
      if (isSeedance) {
        // Seedance 专属参数构建
        body = {
          model: 'doubao-seedance-2.0',
          prompt: prompt.trim(),
          size: sdSize,
          duration: sdDuration,
          seedance_resolution: sdResolution,
          seedance_generate_audio: sdGenerateAudio,
        };
        if (sdFirstFrame) {
          setRunningTasks(prev => prev.map(t => t.localId === localId ? { ...t, status: '上传首帧图中...' } : t));
          const u = await uploadToImagebed(sdFirstFrame.file);
          body.seedance_first_frame_url = u;
        } else if (sdFirstFrameUrl.trim()) {
          body.seedance_first_frame_url = sdFirstFrameUrl.trim();
        }
        if (sdLastFrame) {
          const u = await uploadToImagebed(sdLastFrame.file);
          body.seedance_last_frame_url = u;
        } else if (sdLastFrameUrl.trim()) {
          body.seedance_last_frame_url = sdLastFrameUrl.trim();
        }
        if (sdRefVideoUrl.trim()) body.seedance_reference_video_url = sdRefVideoUrl.trim();
        if (sdRefAudioUrl.trim()) body.seedance_reference_audio_url = sdRefAudioUrl.trim();
        if (sdSeed.trim()) body.seedance_seed = parseInt(sdSeed.trim(), 10) || sdSeed.trim();
        if (sdReturnLastFrame) body.seedance_return_last_frame = true;
        if (sdWebSearch) body.seedance_web_search = true;
      } else if (isHappyHorse) {
        // HappyHorse 特殊参数构建
        body = {
          model: 'happyhorse-1.0',
          prompt: prompt.trim(),
          resolution: hhResolution,
          duration: hhDuration,
        };
        if (hhMode !== 'edit') body.size = hhSize;
        if (hhMode === 'i2v' && !hhFirstFrame) {
          throw new Error('图生视频模式下请上传首帧图片');
        }
        if (hhMode === 'i2v' && hhFirstFrame) {
          const u = await uploadToImagebed(hhFirstFrame.file);
          body.first_frame_image = u;
        } else if (hhMode === 'r2v' && hhRefImages.length > 0) {
          const urls = await Promise.all(hhRefImages.map(i => uploadToImagebed(i.file)));
          body.image_urls = urls;
        } else if (hhMode === 'edit') {
          if (!hhVideoUrl.trim()) throw new Error('请输入源视频链接');
          body.video_url = hhVideoUrl.trim();
          body.audio_setting = hhAudioSetting;
          if (hhVideoStyleImgs.length > 0) {
            const urls = await Promise.all(hhVideoStyleImgs.map(i => uploadToImagebed(i.file)));
            body.image_urls = urls;
          }
        }
      } else {
        body = { model: actualModel, prompt: prompt.trim(), size, duration, quality };
        if (imageUrls.length > 0) body.image_urls = imageUrls;
      }

      const res  = await fetch('http://localhost:8000/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const rawMsg: string = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || data);
        // 判断是否包含上游渠道/模型不可用信息，统一替换为友好提示
        const isChannelErr = /无可用渠道|distributor|request id|分组.*下模型|new_api_error/.test(rawMsg);
        const friendlyMsg = isChannelErr
          ? '该模型当前渠道暂时不可用，请稍后重试或切换其他模型'
          : rawMsg.replace(/\(request id:[^)）]*[)）]?/g, '').replace(/ViVa API 提交失败:\s*/g, '').trim() || '提交失败';
        throw new Error(friendlyMsg);
      }

      setRunningTasks(prev => prev.map(t =>
        t.localId === localId ? { ...t, taskId: data.task_id, status: '已提交，等待处理...' } : t));

      // 视频生成较慢，20s 后开始轮询
      const pollDuration = isHappyHorse ? hhDuration : isSeedance ? sdDuration : duration;
      const pollSize = isHappyHorse ? hhSize : isSeedance ? sdSize : size;
      setTimeout(() => startPolling(localId, data.task_id, pollDuration, pollSize), 20000);
    } catch (e: unknown) {
      setRunningTasks(prev => prev.filter(t => t.localId !== localId));
      setErrorMsg((e as Error).message || '提交失败，请检查网络');
    }
  };

  // ===== 下载视频 =====
  const downloadVideo = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ViVa_AI_video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank');
    }
  };

  // ===== 渲染 =====
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
          <span style={{ fontSize: 20, fontWeight: 800, color: '#794f27', cursor: 'pointer' }}
            onClick={() => window.location.href = '/'}>ViVa AI助手</span>
          <span style={{ color: '#c4b89e', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: 16, color: '#9f927d', fontWeight: 600 }}>🎬 AI 视频生成</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#e6f9f6', borderRadius: 20, padding: '4px 14px', color: '#19c8b9', fontWeight: 700, fontSize: 14 }}>
            ⚡ 积分余额: <span style={{ fontSize: 16 }}>500</span>
          </div>
          <button onClick={() => window.location.href = '/image'}
            style={{ background: '#f0e8d8', border: '1.5px solid #c4b89e', borderRadius: 20, padding: '5px 14px', color: '#794f27', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🎨 去生图
          </button>
        </div>
      </nav>

      {/* 主体 */}
      <div style={{ display: 'flex', gap: 24, padding: '28px 48px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ===== 左侧参数面板 ===== */}
        <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 模型选择 */}
          <Card color="app-blue" type="default">
            <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 12 }}>🎬 模型选择</div>
            <select
              value={model}
              onChange={e => {
                const v = e.target.value;
                setModel(v);
                if (v === 'grok-video-3') { setDuration(6); setQuality('480p'); }
                else if (v === 'grok-video-3-super') { setDuration(10); setSize('16:9'); setQuality('480p'); }
                else if (v === 'happyhorse-1.0') { setHhMode('t2v'); setHhResolution('1080P'); setHhDuration(5); setHhSize('16:9'); }
                else { setQuality('480p'); }
              }}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '2px solid #c4b89e', background: '#faf9f4',
                color: '#794f27', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {VIDEO_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 }}>
              {VIDEO_MODELS.find(m => m.value === model)?.desc}
            </div>
          </Card>

          {/* 参考图上传（非HappyHorse，非Seedance） */}
          {!isHappyHorse && !isSeedance && (
          <Card color="app-green" type="default" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 4 }}>
                🖼️ 参考图像 <span style={{ color: '#5c3d1e', fontWeight: 400, fontSize: 12 }}>（选填，最多7张，上传后宽高比自动匹配）</span>
              </div>
            </div>
            <div
              style={{
                margin: '0 16px 16px',
                border: `2px dashed ${isDragging ? '#19c8b9' : '#c4b89e'}`,
                borderRadius: 12, background: isDragging ? '#e6f9f6' : '#faf9f4',
                padding: '10px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) addImages(e.dataTransfer.files); }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
              <div style={{ color: '#794f27', fontWeight: 700, fontSize: 14 }}>点击或拖拽上传图片</div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files && addImages(e.target.files)} />
            </div>
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px 16px' }}>
                {uploadedImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 72, height: 72 }}>
                    <img src={img.url} alt={img.name}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #c4b89e', cursor: 'pointer' }}
                      onClick={() => { setPreviewImg(img.url); setShowPreview(true); }} />
                    <button onClick={() => removeImage(img.id)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#e05555', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          )}

          {/* Seedance 专属UI */}
          {isSeedance && (
          <Card color="app-green" type="default">
            {/* 首帧图（选填，有首帧=图生视频，无首帧=文生视频） */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 4 }}>🖼️ 首帧图片（选填）</div>
              <div style={{ color: '#9f927d', fontSize: 12, marginBottom: 8 }}>上传首帧图即为图生视频；不上传则为文生视频 {sdFirstFrame || sdFirstFrameUrl ? <span style={{ color: '#19c8b9', fontWeight: 700 }}>（已上传 1/1）</span> : null}</div>
              {sdFirstFrame ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <img src={sdFirstFrame.url} alt="首帧" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #19c8b9' }} />
                  <button onClick={() => setSdFirstFrame(null)}
                    style={{ background: '#f0e8d8', color: '#794f27', padding: '5px 12px', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ 移除</button>
                </div>
              ) : (
                <div
                  onClick={() => sdFirstFrameRef.current?.click()}
                  onDrop={e => { e.preventDefault(); setSdFirstFrameDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) setSdFirstFrame({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }); }}
                  onDragOver={e => { e.preventDefault(); setSdFirstFrameDragging(true); }}
                  onDragLeave={() => setSdFirstFrameDragging(false)}
                  style={{ border: `2px dashed ${sdFirstFrameDragging ? '#19c8b9' : '#c4b89e'}`, borderRadius: 10, padding: '10px', textAlign: 'center', cursor: 'pointer', background: sdFirstFrameDragging ? '#e6f9f6' : '#faf9f4', marginBottom: 6 }}>
                  <div style={{ fontSize: 18 }}>📁</div>
                  <div style={{ color: '#794f27', fontSize: 12, fontWeight: 600 }}>点击或拖拽上传首帧图</div>
                </div>
              )}
              <input ref={sdFirstFrameRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) { const f = e.target.files[0]; setSdFirstFrame({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }); } }} />
              <input ref={sdFirstFrameInputRef} value={sdFirstFrameUrl} onChange={e => setSdFirstFrameUrl(e.target.value)}
                placeholder="或输入图片URL"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginTop: 4 }} />
            </div>

            {/* 尾帧图（选填） */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, marginBottom: 4 }}>🎞 尾帧图片（选填，控制结尾画面）{sdLastFrame || sdLastFrameUrl ? <span style={{ color: '#19c8b9', fontWeight: 700, fontSize: 12, marginLeft: 4 }}>已上传 1/1</span> : null}</div>
              {sdLastFrame ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <img src={sdLastFrame.url} alt="尾帧" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid #c4b89e' }} />
                  <button onClick={() => setSdLastFrame(null)}
                    style={{ background: '#f0e8d8', color: '#794f27', padding: '5px 12px', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ 移除</button>
                </div>
              ) : (
                <div
                  onClick={() => sdLastFrameRef.current?.click()}
                  onDrop={e => { e.preventDefault(); setSdLastFrameDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) setSdLastFrame({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }); }}
                  onDragOver={e => { e.preventDefault(); setSdLastFrameDragging(true); }}
                  onDragLeave={() => setSdLastFrameDragging(false)}
                  style={{ border: `2px dashed ${sdLastFrameDragging ? '#19c8b9' : '#c4b89e'}`, borderRadius: 10, padding: '8px', textAlign: 'center', cursor: 'pointer', background: sdLastFrameDragging ? '#e6f9f6' : '#faf9f4', marginBottom: 6 }}>
                  <div style={{ color: '#794f27', fontSize: 12, fontWeight: 600 }}>点击或拖拽上传尾帧图</div>
                </div>
              )}
              <input ref={sdLastFrameRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) { const f = e.target.files[0]; setSdLastFrame({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }); } }} />
              <input ref={sdLastFrameInputRef} value={sdLastFrameUrl} onChange={e => setSdLastFrameUrl(e.target.value)}
                placeholder="或输入图片URL"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginTop: 4 }} />
            </div>

            {/* 参考视频 & 参考音频（选填） */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#794f27', fontSize: 13 }}>🎬 参考视频URL（选填）</span>
                <span
                  style={{ position: 'relative', cursor: 'pointer', fontSize: 14 }}
                  onMouseEnter={() => setSdRefVideoTooltip(true)}
                  onMouseLeave={() => setSdRefVideoTooltip(false)}
                >ℹ️
                  {sdRefVideoTooltip && (
                    <div style={{ position: 'absolute', left: 0, top: 22, zIndex: 100, background: '#fff7e6', border: '1.5px solid #c4b89e', borderRadius: 8, padding: '8px 12px', width: 240, fontSize: 11, color: '#794f27', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                      使用角色图像时，参考视频不可用。参考视频的分辨率须在 480p 到 720p 之间。
                    </div>
                  )}
                </span>
              </div>
              <input value={sdRefVideoUrl} onChange={e => setSdRefVideoUrl(e.target.value)}
                placeholder="https://...mp4"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#794f27', fontSize: 13 }}>🔊 参考音频URL（选填）</span>
                <span
                  style={{ position: 'relative', cursor: 'pointer', fontSize: 14 }}
                  onMouseEnter={() => setSdRefAudioTooltip(true)}
                  onMouseLeave={() => setSdRefAudioTooltip(false)}
                >ℹ️
                  {sdRefAudioTooltip && (
                    <div style={{ position: 'absolute', left: 0, top: 22, zIndex: 100, background: '#fff7e6', border: '1.5px solid #c4b89e', borderRadius: 8, padding: '8px 12px', width: 220, fontSize: 11, color: '#794f27', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                      使用角色图像时，参考音频不可用。
                    </div>
                  )}
                </span>
              </div>
              <input value={sdRefAudioUrl} onChange={e => setSdRefAudioUrl(e.target.value)}
                placeholder="https://...mp3"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </Card>
          )}

          {/* HappyHorse 专属UI */}
          {isHappyHorse && (
          <Card color="app-green" type="default">
            {/* 模式选择 */}
            <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 10 }}>🎯 生成模式</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {HH_MODES.map(m => (
                <div key={m.value} onClick={() => setHhMode(m.value as 't2v'|'i2v'|'r2v'|'edit')}
                  style={{
                    padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${hhMode === m.value ? '#19c8b9' : '#c4b89e'}`,
                    background: hhMode === m.value ? '#e6f9f6' : '#faf9f4',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13 }}>{m.label}</div>
                  <div style={{ color: '#9f927d', fontSize: 11, marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* 图生视频：首帧图 */}
            {hhMode === 'i2v' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🖼️ 首帧图片（必填，触发图生视频）</div>
                {hhFirstFrame ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={hhFirstFrame.url} alt="首帧"
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #19c8b9' }} />
                    <button onClick={() => setHhFirstFrame(null)}
                      style={{ background: '#f0e8d8', color: '#794f27', padding: '5px 12px', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ 移除</button>
                  </div>
                ) : (
                  <div onClick={() => hhFirstFrameRef.current?.click()}
                    style={{ border: '2px dashed #c4b89e', borderRadius: 10, padding: '12px', textAlign: 'center', cursor: 'pointer', background: '#faf9f4' }}>
                    <div style={{ fontSize: 20 }}>📁</div>
                    <div style={{ color: '#794f27', fontSize: 13, fontWeight: 600 }}>点击上传首帧图</div>
                  </div>
                )}
                <input ref={hhFirstFrameRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) { const f = e.target.files[0]; setHhFirstFrame({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }); } }} />
              </div>
            )}

            {/* 参考图生视频：1-9张参考图 */}
            {hhMode === 'r2v' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, marginBottom: 6 }}>📸 参考图（1-9张，必填）</div>
                <div onClick={() => hhRefImagesRef.current?.click()}
                  style={{ border: '2px dashed #c4b89e', borderRadius: 10, padding: '10px', textAlign: 'center', cursor: 'pointer', background: '#faf9f4', marginBottom: 8 }}>
                  <div style={{ fontSize: 18 }}>📁</div>
                  <div style={{ color: '#794f27', fontSize: 12, fontWeight: 600 }}>点击添加参考图（已{hhRefImages.length}/9张）</div>
                </div>
                <input ref={hhRefImagesRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files) { const files = Array.from(e.target.files).slice(0, 9 - hhRefImages.length); setHhRefImages(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }))]); } }} />
                {hhRefImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hhRefImages.map(img => (
                      <div key={img.id} style={{ position: 'relative', width: 60, height: 60 }}>
                        <img src={img.url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #c4b89e' }} />
                        <button onClick={() => setHhRefImages(prev => { const i = prev.find(x => x.id === img.id); if (i) URL.revokeObjectURL(i.url); return prev.filter(x => x.id !== img.id); })}
                          style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#e05555', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 900 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 视频编辑：视频URL + 风格参考图 + 音频设置 */}
            {hhMode === 'edit' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🎬 源视频链接（必填）</div>
                <input value={hhVideoUrl} onChange={e => setHhVideoUrl(e.target.value)}
                  placeholder="https://...mp4（3-60秒，≤100MB）"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, margin: '10px 0 6px' }}>🎨 风格参考图（选填，0-5张）</div>
                <div onClick={() => hhStyleImgsRef.current?.click()}
                  style={{ border: '2px dashed #c4b89e', borderRadius: 10, padding: '8px', textAlign: 'center', cursor: 'pointer', background: '#faf9f4', marginBottom: 8 }}>
                  <div style={{ color: '#794f27', fontSize: 12, fontWeight: 600 }}>点击添加风格参考图（{hhVideoStyleImgs.length}/5张）</div>
                </div>
                <input ref={hhStyleImgsRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files) { const files = Array.from(e.target.files).slice(0, 5 - hhVideoStyleImgs.length); setHhVideoStyleImgs(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name }))]); } }} />
                {hhVideoStyleImgs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {hhVideoStyleImgs.map(img => (
                      <div key={img.id} style={{ position: 'relative', width: 60, height: 60 }}>
                        <img src={img.url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #c4b89e' }} />
                        <button onClick={() => setHhVideoStyleImgs(prev => { const i = prev.find(x => x.id === img.id); if (i) URL.revokeObjectURL(i.url); return prev.filter(x => x.id !== img.id); })}
                          style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#e05555', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 900 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🔊 音频设置</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ value: 'auto', label: '自动生成音频' }, { value: 'origin', label: '保留原音轨' }].map(a => (
                    <div key={a.value} onClick={() => setHhAudioSetting(a.value as 'auto'|'origin')}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                        border: `2px solid ${hhAudioSetting === a.value ? '#19c8b9' : '#c4b89e'}`,
                        background: hhAudioSetting === a.value ? '#e6f9f6' : '#faf9f4', fontSize: 12, fontWeight: 700, color: '#794f27' }}>
                      {a.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          )}

          {/* 提示词 */}
          <Card color="app-yellow" type="default">
            <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 10 }}>✏️ 提示词</div>
            <textarea
              value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想要生成的视频内容，支持中英文&#10;例：一只猫在草地上奔跑，阳光明媚，慢镜头"
              style={{
                width: '100%', minHeight: 100, padding: '10px 12px', borderRadius: 10,
                border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27',
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Card>

          {/* Seedance 参数：宽高比 + 分辨率 + 时长 + 音频 + 种子 + 复选框 */}
          {isSeedance && (
          <Card color="app-yellow" type="default">
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>📐 宽高比</div>
                <select value={sdSize} onChange={e => setSdSize(e.target.value)}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {SD_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🎞 分辨率</div>
                <select value={sdResolution} onChange={e => setSdResolution(e.target.value as '420P'|'720P'|'1080P')}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {(['420P', '720P', '1080P'] as const).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>⏱ 时长</div>
                <select value={sdDuration} onChange={e => setSdDuration(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {Array.from({ length: 12 }, (_, i) => i + 4).map(d => (
                    <option key={d} value={d}>{d}秒</option>
                  ))}
                </select>
              </div>
            </div>
            {/* 音频 + 返回尾帧 + 联网搜索 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {[
                { state: sdGenerateAudio, setter: setSdGenerateAudio, label: '🔊 生成音频' },
                { state: sdReturnLastFrame, setter: setSdReturnLastFrame, label: '🎞 返回尾帧' },
                { state: sdWebSearch, setter: setSdWebSearch, label: '🌐 联网搜索' },
              ].map(({ state, setter, label }) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: '#794f27', fontSize: 13 }}>
                  <input type="checkbox" checked={state} onChange={e => (setter as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#19c8b9' }} />
                  {label}
                </label>
              ))}
            </div>
            {/* 随机种子 */}
            <div>
              <div style={{ fontWeight: 800, color: '#794f27', fontSize: 14, marginBottom: 6 }}>🎲 随机种子（选填）</div>
              <input value={sdSeed} onChange={e => setSdSeed(e.target.value)} placeholder="留空则随机，输入整数固定结果"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </Card>
          )}

          {/* 参数：宽高比 + 分辨率/画质 + 时长（非HappyHorse，非Seedance） */}
          {!isHappyHorse && !isSeedance && (
          <Card color="app-yellow" type="default">
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>📐 宽高比</div>
                <select value={size} onChange={e => setSize(e.target.value)}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {(isGrokVideoSuper
                    ? GROK_SUPER_ASPECT_RATIOS.map(v => ({ value: v, label: v, desc: v === '16:9' ? '横屏' : '竖屏' }))
                    : VIDEO_SIZES
                  ).map(s => (
                    <option key={s.value} value={s.value}>{s.label}{s.desc ? ' ' + s.desc : ''}</option>
                  ))}
                </select>
              </div>
              {!isGrokVideo3 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🎞 画质</div>
                <select value={quality} onChange={e => setQuality(e.target.value)}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="480p">标清 480p</option>
                  <option value="720p">高清 720p</option>
                </select>
              </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>⏱ 时长</div>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {(isGrokVideoSuper ? [10] : isGrokVideo3 ? [6, 10] : DURATION_OPTIONS).map(d => (
                    <option key={d} value={d}>{d}秒</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
          )}

          {/* HappyHorse 参数 */}
          {isHappyHorse && (
          <Card color="app-yellow" type="default">
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>📐 宽高比</div>
                <select value={hhSize} onChange={e => setHhSize(e.target.value)}
                  disabled={hhMode === 'i2v' || hhMode === 'edit'}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: (hhMode === 'i2v' || hhMode === 'edit') ? '#f0ece4' : '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: (hhMode === 'i2v' || hhMode === 'edit') ? 'not-allowed' : 'pointer', outline: 'none', fontFamily: 'inherit', opacity: (hhMode === 'i2v' || hhMode === 'edit') ? 0.5 : 1 }}>
                  {HH_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>🎞 分辨率</div>
                <select value={hhResolution} onChange={e => setHhResolution(e.target.value as '720P'|'1080P')}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="720P">720P</option>
                  <option value="1080P">1080P</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 13, marginBottom: 6 }}>⏱ 时长</div>
                <select value={hhDuration} onChange={e => setHhDuration(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '2px solid #c4b89e', background: '#faf9f4', color: '#794f27', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {HH_DURATIONS.map(d => (
                    <option key={d} value={d}>{d}秒</option>
                  ))}
                </select>
              </div>
            </div>
            {(hhMode === 'i2v' || hhMode === 'edit') && (
              <div style={{ color: '#9f927d', fontSize: 11, marginTop: 6 }}>图生视频/视频编辑模式下宽高比由输入媒体自动决定</div>
            )}
          </Card>
          )}

          {/* 生成按钮 */}
          <button onClick={handleGenerate}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'linear-gradient(135deg, #19c8b9, #6fba2c)',
              color: '#fff', fontWeight: 900, fontSize: 16, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            🎬 开始生成 · 消耗 {creditCost} 积分
            {runningTasks.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, opacity: 0.85 }}>
                ({runningTasks.length} 个任务生成中)
              </span>
            )}
          </button>

          {errorMsg && (
            <div style={{ background: '#fff0f0', border: '1.5px solid #ffb3b3', borderRadius: 10, padding: '10px 14px', color: '#e05555', fontSize: 13 }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* ===== 右侧结果面板 ===== */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'rgb(247,243,223)', borderRadius: 20,
            border: '2px solid #c4b89e', minHeight: 600,
            display: 'flex', flexDirection: 'column',
            alignItems: (resultVideos.length > 0 || runningTasks.length > 0) ? 'flex-start' : 'center',
            justifyContent: (resultVideos.length > 0 || runningTasks.length > 0) ? 'flex-start' : 'center',
            padding: 20,
          }}>
            {(resultVideos.length > 0 || runningTasks.length > 0) ? (
              <div style={{ width: '100%' }}>
                <div style={{ fontWeight: 800, color: '#794f27', fontSize: 15, marginBottom: 14 }}>
                  🎬 生成结果{' '}
                  <span style={{ fontSize: 13, color: '#9f927d', fontWeight: 400 }}>
                    共 {resultVideos.length} 个视频
                  </span>
                </div>

                {/* 进行中的任务 */}
                {runningTasks.length > 0 && (
                  <div style={{ marginBottom: resultVideos.length > 0 ? 20 : 0 }}>
                    {runningTasks.map(task => (
                      <div key={task.localId} style={{
                        background: '#e6f9f6', borderRadius: 12, padding: '14px 18px',
                        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14,
                        border: '1.5px solid #b2ede8',
                      }}>
                        <div style={{ fontSize: 32 }}>🎬</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#794f27', fontSize: 14 }}>AI 正在生成视频...</div>
                          <div style={{ color: '#19c8b9', fontSize: 12, marginTop: 3 }}>{task.status}</div>
                          <div style={{ color: '#9f927d', fontSize: 11, marginTop: 2 }}>视频生成约需 1-3 分钟，请耐心等待</div>
                        </div>
                        <div style={{ width: 120, height: 4, background: '#c8f0ec', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #19c8b9, #6fba2c)', borderRadius: 2, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 已完成的视频 */}
                {resultVideos.map((video, i) => (
                  <div key={video.taskId + i} style={{
                    background: '#fff', borderRadius: 16, border: '2px solid #c4b89e',
                    overflow: 'hidden', marginBottom: 20,
                  }}>
                    <video
                      src={video.url}
                      controls
                      style={{ width: '100%', display: 'block', maxHeight: 480, background: '#000' }}
                    />
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf9f4' }}>
                      <div style={{ color: '#9f927d', fontSize: 12 }}>
                        {video.size} · {video.duration}秒 · {video.modelLabel || VIDEO_MODELS.find(m => m.value === model)?.label || model}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => downloadVideo(video.url)}
                          style={{ background: '#f0e8d8', color: '#794f27', padding: '5px 14px', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ⬇ 下载
                        </button>
                        <button onClick={() => setResultVideos(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background: '#f0e8d8', color: '#794f27', padding: '5px 14px', borderRadius: 20, border: '1.5px solid #c4b89e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          🗑 删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9f927d' }}>
                <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.5 }}>🎬</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#c4b89e', marginBottom: 8 }}>
                  生成的视频将在这里显示
                </div>
                <div style={{ fontSize: 14 }}>在左侧填写提示词，点击"开始生成"按钮</div>
                <div style={{ fontSize: 12, marginTop: 8, color: '#c4b89e' }}>
                  视频生成约需 1-3 分钟，请耐心等待
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图片大图预览 */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}
          onClick={() => setShowPreview(false)}>
          <img src={previewImg} alt="preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}

