import React, { useState, useEffect } from 'react';
import { Button, Card, Divider, Footer, Switch } from 'animal-island-ui';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

const features = [
  { icon: '🖼️', title: 'AI生图', desc: '支持GPT-Image-2、 Gemini-3.1-Flash-Image、Gemini-3-Pro-Image 等顶级模型', tag: '热门', path: '/image', gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8f0e4 100%)', border: '#19c8b9' },
  { icon: '🎬', title: 'AI生视频', desc: '支持Veo 3.1、 Grok 3、Happy Horse-1.0、Seedance 2.0、Omni Flash 等主流模型', tag: '新品', path: '/video', gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', border: '#f06292' },
  { icon: '🎵', title: 'AI配乐', desc: '为视频/图片智能匹配背景音乐，多种曲风一键生成', tag: '开发中', path: '/music', gradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', border: '#ce93d8' },
  { icon: '🎤', title: 'AI配音', desc: '多种音色可选，文字转自然语音，支持多语言', tag: '开发中', path: '/tts', gradient: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)', border: '#4dd0e1' },
];

const plans = [
  { name: '体验版', monthlyPrice: 18, yearlyPrice: 172, yearlyCredits: 2160, credits: 180, features: ['180积分/月', '无积分赠送', '积分有效期1个月', '客服支持'], yearlyFeatures: ['2160积分/年', '无积分赠送', '积分有效期12个月', '客服支持'], highlight: false, color: '#f9f7ef' },
  { name: '专业版', monthlyPrice: 48, yearlyPrice: 460, yearlyCredits: 6336, credits: 528, features: ['528积分/月', '赠送10%', '积分有效期1个月', '客服支持'], yearlyFeatures: ['6336积分/年', '赠送10%', '积分有效期12个月', '客服支持'], highlight: true, color: '#e8fdf8' },
  { name: '企业版', monthlyPrice: 188, yearlyPrice: 1805, yearlyCredits: 27324, credits: 2277, features: ['2277积分/月', '赠送15%', '积分有效期2个月', '客服支持'], yearlyFeatures: ['27324积分/年', '赠送15%', '积分有效期12个月', '客服支持'], highlight: false, color: '#f0f4ff' },
];

const faqs = [
  { q: '积分可以退款吗？', a: '7天内未使用可全额退款。' },
  { q: '价格贵吗？', a: '源头供应，同品质全网最低。' },
  { q: '模型是最新的吗？', a: '同步官网更新。' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCs, setShowCs] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    if (token && userInfo) {
      setUser(JSON.parse(userInfo));
      fetchCredits(token);
    }
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function fetchCredits(token: string) {
    try {
      const r = await fetch(`${API_BASE}/api/user/credits`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.credits !== undefined) setCredits(d.credits);
    } catch {}
  }

  async function sendCode() {
    if (!phone || phone.length !== 11) { setError('请输入正确的手机号'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const d = await r.json();
      if (d.success) { setCodeSent(true); setCountdown(60); const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000); }
      else setError(d.message || '发送失败');
    } catch { setError('网络错误'); } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!phone || !password) { setError('请填写手机号和密码'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) });
      const d = await r.json();
      if (d.access_token || d.token) {
        const token = d.access_token || d.token;
        const userInfo = d.user_info || d.user;
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        setUser(userInfo); setCredits(userInfo.credits || 0);
        setShowLogin(false); setPhone(''); setPassword(''); setError('');
      } else setError(d.detail || d.message || '登录失败');
    } catch { setError('网络错误'); } finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!phone || !password) { setError('请填写手机号和密码'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) });
      const d = await r.json();
      if (d.access_token || d.token) {
        const token = d.access_token || d.token;
        const userInfo = d.user_info || d.user;
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        setUser(userInfo); setCredits(userInfo.credits || 0);
        setShowRegister(false); setPhone(''); setPassword(''); setError('');
      } else setError(d.detail || d.message || '注册失败');
    } catch { setError('网络错误'); } finally { setLoading(false); }
  }

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('userInfo');
    setUser(null); setCredits(0);
  }

  const navStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 100,
    background: scrolled ? 'rgba(248,248,240,0.92)' : '#f8f8f0',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    borderBottom: scrolled ? '1px solid #e8e4d0' : '1px solid transparent',
    padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* 导航 */}
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src='https://api.apifox.com/api/v1/projects/7991410/resources/658368/image-preview' alt='ViVa AI' style={{ height: 44, width: 44, objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: 24, color: '#794f27', letterSpacing: 1 }}>ViVa AI助手</span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href='#features' style={{ color: '#794f27', textDecoration: 'none', fontSize: 16, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { (e.target as HTMLElement).style.background='#e8f5f3'; (e.target as HTMLElement).style.color='#19c8b9'; }} onMouseLeave={e => { (e.target as HTMLElement).style.background='transparent'; (e.target as HTMLElement).style.color='#794f27'; }}>功能</a>
          <a href='#pricing' style={{ color: '#794f27', textDecoration: 'none', fontSize: 16, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { (e.target as HTMLElement).style.background='#e8f5f3'; (e.target as HTMLElement).style.color='#19c8b9'; }} onMouseLeave={e => { (e.target as HTMLElement).style.background='transparent'; (e.target as HTMLElement).style.color='#794f27'; }}>定价</a>
          <a href='#gallery' style={{ color: '#794f27', textDecoration: 'none', fontSize: 16, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { (e.target as HTMLElement).style.background='#e8f5f3'; (e.target as HTMLElement).style.color='#19c8b9'; }} onMouseLeave={e => { (e.target as HTMLElement).style.background='transparent'; (e.target as HTMLElement).style.color='#794f27'; }}>案例</a>
          <a href='#faq' style={{ color: '#794f27', textDecoration: 'none', fontSize: 16, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s, color 0.15s' }} onMouseEnter={e => { (e.target as HTMLElement).style.background='#e8f5f3'; (e.target as HTMLElement).style.color='#19c8b9'; }} onMouseLeave={e => { (e.target as HTMLElement).style.background='transparent'; (e.target as HTMLElement).style.color='#794f27'; }}>FAQ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#794f27', background: '#fff8e7', padding: '4px 12px', borderRadius: 20, border: '1px solid #e8d5a0' }}>
                💰 {credits} 积分
              </span>
              <Button size='small' variant='ghost' onClick={() => navigate('/image')} style={{ fontSize: 16 }}>开始创作</Button>
              <Button size='small' variant='outline' onClick={handleLogout} style={{ fontSize: 16 }}>退出</Button>
            </>
          ) : (
            <>
              <Button variant='ghost' onClick={() => { setShowLogin(true); setError(''); }} style={{ fontSize: 15, fontWeight: 600 }}>登录</Button>
              <Button onClick={() => { setShowRegister(true); setError(''); }} style={{ fontSize: 15, fontWeight: 700 }}>免费注册</Button>
            </>
          )}
        </div>
      </nav>

      {/* 系统通知区 */}
      <section style={{
        padding: '10px 48px',
        background: '#fff8e7',
        borderBottom: '1px solid #e8d5a0',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }}>📢</span>
          <span style={{ fontSize: 14, color: '#794f27', fontWeight: 500 }}>
            系统公告：新用户注册即送10积分，AI生图、AI生视频功能已全面上线！
          </span>
          <span style={{ fontSize: 12, color: '#9f927d' }}>2026-05-22</span>
        </div>
      </section>

      {/* Hero区 */}
      <section style={{
        padding: '60px 48px 50px',
        background: 'linear-gradient(135deg, #f8f8f0 0%, #e8fdf8 40%, #fff8e7 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 20, left: '10%', fontSize: 40, opacity: 0.15, pointerEvents: 'none' }}>🌸</div>
        <div style={{ position: 'absolute', top: 60, right: '8%', fontSize: 50, opacity: 0.12, pointerEvents: 'none' }}>⭐</div>
        <div style={{ position: 'absolute', bottom: 30, left: '5%', fontSize: 35, opacity: 0.1, pointerEvents: 'none' }}>🍃</div>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'inline-block', background: 'linear-gradient(90deg, #19c8b9, #794f27)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 20, fontWeight: 800, padding: '6px 22px', border: '2px solid #19c8b9', borderRadius: 24, letterSpacing: 1 }}>
            专注稳定生图 / 生视频
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#794f27', lineHeight: 1.2, margin: 0 }}>
            用AI释放你的创意
          </h1>
          {/* 核心优势条 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(90deg, #19c8b9 0%, #2cd9c8 100%)',
            color: '#fff', padding: '8px 20px', borderRadius: 40,
            boxShadow: '0 6px 18px rgba(25,200,185,0.3)',
            fontSize: 14, fontWeight: 600
          }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <span>源头供应 · 官方兜底 · 成功率 99%</span>
          </div>
        </div>
      </section>

      <Divider type='leaf' style={{ margin: 0 }} />

      {/* 功能区 */}
      <section id='features' style={{ padding: '48px 48px 68px', background: '#f8f8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, maxWidth: 1100, margin: '0 auto' }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: '#fff', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                padding: 0, borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex', minHeight: 180
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(-6px)'; el.style.boxShadow=`0 18px 44px ${f.border}40`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 4px 20px rgba(0,0,0,0.06)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform='scale(0.98)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-6px)'; }}
                onClick={() => {
                  if (!user) { setShowRegister(true); return; }
                  if (f.tag === '开发中') { alert('该功能正在开发中，敬请期待！'); return; }
                  navigate(f.path);
                }}>
                {/* 左侧图标区 */}
                <div style={{
                  flex: '0 0 140px', background: f.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: f.border, opacity: 0.25, filter: 'blur(12px)' }} />
                  <div style={{ fontSize: 56, position: 'relative', zIndex: 1 }}>{f.icon}</div>
                </div>
                {/* 右侧内容区 */}
                <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 22, color: '#3d2a14' }}>{f.title}</span>
                    {f.tag && <span style={{ fontSize: 11, background: f.tag === '开发中' ? '#999' : f.border, color: '#fff', padding: '3px 10px', borderRadius: 10, fontWeight: 700 }}>{f.tag}</span>}
                  </div>
                  <p style={{ color: '#6b5a47', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                  {f.tag !== '开发中' && <div style={{ marginTop: 14, fontSize: 13, color: f.border, fontWeight: 700 }}>立即体验 →</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider type='leaf' style={{ margin: 0 }} />

      {/* 定价区 */}
      <section id='pricing' style={{ padding: '68px 48px', background: 'rgb(247,243,223)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 6 }}>💰 简单透明的定价</h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
            <span style={{ color: !yearlyBilling ? '#794f27' : '#9f927d', fontWeight: !yearlyBilling ? 700 : 400, fontSize: 14 }}>按月付</span>
            <Switch checked={yearlyBilling} onChange={setYearlyBilling} size='small' />
            <span style={{ color: yearlyBilling ? '#794f27' : '#9f927d', fontWeight: yearlyBilling ? 700 : 400, fontSize: 14 }}>
              按年付
              <span style={{ fontSize: 11, color: '#19c8b9', marginLeft: 6, fontWeight: 800 }}>省20%</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {plans.map(p => (
              <Card key={p.name} style={{
                background: p.color,
                border: p.highlight ? '2px solid #19c8b9' : '1px solid #e8e4d0',
                position: 'relative', padding: 28
              }}>
                {p.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#19c8b9', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 16px', borderRadius: 20 }}>最受欢迎</div>}
                <div style={{ fontWeight: 800, fontSize: 18, color: '#794f27', marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#19c8b9' }}>¥{yearlyBilling ? p.yearlyPrice : p.monthlyPrice}</span>
                  <span style={{ fontSize: 13, color: '#9f927d' }}>{yearlyBilling ? '/年' : '/月'}</span>
                </div>
                {yearlyBilling && <div style={{ fontSize: 12, color: '#19c8b9', marginBottom: 16 }}>月均 ¥{(p.yearlyPrice / 12).toFixed(1)} · 共 {p.yearlyCredits} 积分/年</div>}
                {!yearlyBilling && <div style={{ height: 20, marginBottom: 16 }} />}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                  {(yearlyBilling ? p.yearlyFeatures : p.features).map(feat => (
                    <li key={feat} style={{ padding: '5px 0', fontSize: 13, color: '#794f27', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#19c8b9' }}>✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Button fullWidth onClick={() => user ? undefined : setShowRegister(true)}>立即订购</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider type='leaf' style={{ margin: 0 }} />

      {/* 优秀案例区 */}
      <section id='gallery' style={{ padding: '68px 48px', background: '#f4f9f8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 8 }}>🖼️ 精选生成案例</h2>
          <p style={{ textAlign: 'center', color: '#9f927d', marginBottom: 40, fontSize: 15 }}>点击案例，即可用相同提示词一键生成同款</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { prompt: '赛博朋克城市夜景，霓虹灯倒影在雨后街道，高细节，电影感光影，4K', bg: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2a1b3d 100%)', emoji: '🌃', label: '赛博朋克', accent: '#00d4ff' },
              { prompt: '一只橘猫坐在樱花树下，水彩画风格，柔和色调，温馨氛围，日式插画', bg: 'linear-gradient(135deg, #fce4ec 0%, #fff3e0 100%)', emoji: '🌸', label: '日式水彩', accent: '#f48fb1' },
              { prompt: '未来科技感机器人，金属质感，蓝色能量光效，概念艺术，超写实渲染', bg: 'linear-gradient(135deg, #0a1628 0%, #1a237e 100%)', emoji: '🤖', label: '科技概念', accent: '#448aff' },
              { prompt: '古风山水，云雾缭绕，远山如黛，泼墨写意画，高清，中国风', bg: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', emoji: '🏔️', label: '国风山水', accent: '#66bb6a' },
              { prompt: '极简主义海报，几何抽象，莫兰迪色系，现代设计感，高端简洁', bg: 'linear-gradient(135deg, #ede7f6 0%, #e8eaf6 100%)', emoji: '🎨', label: '极简抽象', accent: '#b39ddb' },
              { prompt: '魔幻森林，发光蘑菇，精灵光点，梦幻氛围，奇幻插画，超详细', bg: 'linear-gradient(135deg, #1b5e20 0%, #0d47a1 100%)', emoji: '🌲', label: '奇幻魔法', accent: '#7c4dff' },
            ].map((item, idx) => (
              <div key={idx}
                onClick={() => {
                  if (!user) { setShowRegister(true); return; }
                  navigate(`/image?prompt=${encodeURIComponent(item.prompt)}`);
                }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.transform='translateY(-6px)'; el.style.boxShadow='0 16px 40px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform='translateY(0)'; el.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'; }}
                style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>
                {/* 图片区：圆角统一在外层容器控制，背景渐变作为内容背景 */}
                <div style={{ height: 200, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 80 }}>{item.emoji}</div>
                  {/* 底部渐变遮罩，让深色背景柔和过渡到白色信息区 */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: 'linear-gradient(transparent, rgba(0,0,0,0.25))' }} />
                  {/* 标签角标 */}
                  <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700, color: item.accent, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {item.label}
                  </div>
                </div>
                {/* 信息区：独立白色背景，彻底隔离深色图片背景 */}
                <div style={{ padding: '16px 18px 18px', background: '#fff' }}>
                  <div style={{ fontSize: 12, color: '#9f927d', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>{item.prompt}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.accent, fontSize: 13, fontWeight: 700 }}>
                    <span>✨</span> 点击生成同款
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider type='leaf' style={{ margin: 0 }} />

      {/* FAQ */}
      <section id='faq' style={{ padding: '68px 48px', background: '#f8f8f0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 36 }}>❓ 常见问题</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, idx) => (
              <details key={idx} style={{ background: '#fff', borderRadius: 12, padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <summary style={{ padding: '18px 22px', fontSize: 16, fontWeight: 700, color: '#794f27', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {f.q}
                  <span style={{ fontSize: 12, color: '#19c8b9', transition: 'transform 0.2s' }}>▼</span>
                </summary>
                <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#9f927d', lineHeight: 1.8 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer appName='ViVa AI助手' slogan='一站式AI创作平台' />

      {/* 浮动客服按钮 */}
      <button
        onClick={() => setShowCs(true)}
        title="联系客服"
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 500,
          width: 56, height: 56, borderRadius: '50%',
          background: '#28B894',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(40,184,148,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(40,184,148,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(40,184,148,0.35)'; }}
      >
        <span style={{ fontSize: 26 }}>💬</span>
      </button>

      {/* 客服弹窗 */}
      {showCs && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowCs(false); }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px',
            maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCs(false)}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: '50%',
                background: '#e53e3e', color: '#fff', border: 'none',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 2px 8px rgba(229,62,62,0.3)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >✕</button>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#794f27' }}>联系客服 09:00-21:00</h3>

            <img
              src="https://api.apifox.com/api/v1/projects/7991410/resources/658671/image-preview"
              alt="客服二维码"
              style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid #f0f0f0' }}
            />
          </div>
        </div>
      )}

      {/* 登录/注册面板 - 直接内嵌，无动画 */}
      {(showLogin || showRegister) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowLogin(false); setShowRegister(false); setError(''); } }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '40px 36px',
            width: 420, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            {/* 关闭按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#794f27' }}>
                {showLogin ? '欢迎回来' : '创建账号'}
              </h2>
              <button onClick={() => { setShowLogin(false); setShowRegister(false); setError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 24, color: '#9f927d', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                ×
              </button>
            </div>

            {/* 切换标签 */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #f0ebe0' }}>
              <button onClick={() => { setShowLogin(true); setShowRegister(false); setError(''); }}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', background: 'none',
                  fontSize: 15, fontWeight: showLogin ? 700 : 400,
                  color: showLogin ? '#19c8b9' : '#9f927d',
                  borderBottom: showLogin ? '2px solid #19c8b9' : '2px solid transparent',
                  marginBottom: -2, cursor: 'pointer', transition: 'none'
                }}>
                登录
              </button>
              <button onClick={() => { setShowLogin(false); setShowRegister(true); setError(''); }}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', background: 'none',
                  fontSize: 15, fontWeight: showRegister ? 700 : 400,
                  color: showRegister ? '#19c8b9' : '#9f927d',
                  borderBottom: showRegister ? '2px solid #19c8b9' : '2px solid transparent',
                  marginBottom: -2, cursor: 'pointer', transition: 'none'
                }}>
                注册
              </button>
            </div>

            {showLogin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#794f27', fontWeight: 600, marginBottom: 8, display: 'block' }}>手机号</label>
                  <input placeholder='请输入手机号' value={phone} onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', height: 48, padding: '0 16px', border: '1px solid #e8e4d0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#794f27', fontWeight: 600, marginBottom: 8, display: 'block' }}>密码</label>
                  <input placeholder='请输入密码' type='password' value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', height: 48, padding: '0 16px', border: '1px solid #e8e4d0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {error && <div style={{ color: '#e53e3e', fontSize: 13, background: '#fff5f5', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
                <button onClick={handleLogin} disabled={loading}
                  style={{
                    width: '100%', height: 48, background: loading ? '#ccc' : '#19c8b9', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}>
                  {loading ? '登录中...' : '登 录'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#794f27', fontWeight: 600, marginBottom: 8, display: 'block' }}>手机号</label>
                  <input placeholder='请输入手机号' value={phone} onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', height: 48, padding: '0 16px', border: '1px solid #e8e4d0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#794f27', fontWeight: 600, marginBottom: 8, display: 'block' }}>设置密码</label>
                  <input placeholder='请设置6位以上密码' type='password' value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', height: 48, padding: '0 16px', border: '1px solid #e8e4d0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {error && <div style={{ color: '#e53e3e', fontSize: 13, background: '#fff5f5', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
                <button onClick={handleRegister} disabled={loading}
                  style={{
                    width: '100%', height: 48, background: loading ? '#ccc' : '#19c8b9', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}>
                  {loading ? '注册中...' : '注 册'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}