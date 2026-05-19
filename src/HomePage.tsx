import React, { useState, useEffect } from 'react';
import {
  Button, Card, Tabs, Divider, Footer, Typewriter, Modal, Input, Collapse, Switch
} from 'animal-island-ui';
import 'animal-island-ui/style';
import type { TabItem } from 'animal-island-ui';

const APP_NAME = 'ViVa AI助手';
const APP_SLOGAN = '一站式 AI 创作平台';
const API_BASE = 'http://localhost:8000';

const features = [
  { icon: '🎨', title: 'AI 文生图', desc: '输入文字描述，秒级生成高质量图片，支持多种艺术风格', color: 'app-green' as const, tab: 'image', cost: 2, unit: '积分/张', badge: '热门' },
  { icon: '🖼️', title: 'AI 图生图', desc: '上传参考图，智能融合风格，一键生成同风格高质量变体', color: 'app-blue' as const, tab: 'image', cost: 3, unit: '积分/张', badge: '' },
  { icon: '🎬', title: 'AI 图生视频', desc: '将静态图片转化为流畅自然的动态视频，多种运动效果', color: 'app-orange' as const, tab: 'video', cost: 20, unit: '积分/段', badge: '新上线' },
  { icon: '✍️', title: 'AI 文生视频', desc: '输入文字脚本，AI全自动生成短视频，支持字幕与配音', color: 'app-red' as const, tab: 'video', cost: 25, unit: '积分/段', badge: '' },
  { icon: '🎵', title: 'AI 配乐生成', desc: '智能生成背景音乐与音效，多种风格，支持时长定制', color: 'app-yellow' as const, tab: 'audio', cost: 5, unit: '积分/首', badge: '' },
  { icon: '🗣️', title: 'AI 文字配音', desc: '将文字转为自然语音，多种音色可选，情感表达逼真', color: 'app-purple' as const, tab: 'audio', cost: 3, unit: '积分/分钟', badge: '' },
];

const plans = [
  {
    name: '体验版', price: 19, period: '/月', credits: 100,
    desc: '适合个人尝鲜', color: 'app-green' as const, hot: false,
    items: ['文生图 约50张', '图生视频 约5段', 'AI配音 约20分钟', '基础客服支持'],
  },
  {
    name: '专业版', price: 49, period: '/月', credits: 300,
    desc: '适合设计师/创作者', color: 'app-blue' as const, hot: true,
    items: ['文生图 约200张', '图生视频 约30段', 'AI配音 约100分钟', '优先队列处理', '在线客服'],
  },
  {
    name: '企业版', price: 199, period: '/月', credits: 1500,
    desc: '适合团队与企业', color: 'app-orange' as const, hot: false,
    items: ['文生图 无限张', '图生视频 约300段', '全功能无限制', 'API接口调用', '专属客服'],
  },
];

const tabs: TabItem[] = [
  { key: 'all', label: '🌟 全部' },
  { key: 'image', label: '🎨 图片' },
  { key: 'video', label: '🎬 视频' },
  { key: 'audio', label: '🎵 音频' },
];

const faqs = [
  { key: '1', label: '积分是如何消耗的？', children: '每次生成内容消耗对应积分：文生图约2积分/张，图生视频约20积分/段，AI配音约3积分/分钟。积分永久有效，不会过期。' },
  { key: '2', label: '注册后有免费积分可以使用吗？', children: '注册即送20积分，可免费体验约10张文生图或1段AI配音，无需充值即可开始创作！' },
  { key: '3', label: '支持哪些格式输出？', children: '图片支持 JPG、PNG、WebP，最高 2048×2048；视频支持 MP4，最高 1080P；音频支持 MP3、WAV 格式。' },
  { key: '4', label: '生成的内容可以商用吗？', children: '专业版及以上用户生成的内容可用于商业用途，体验版仅限个人非商业使用。详见用户协议。' },
  { key: '5', label: '如何联系客服？', children: '可通过平台内在线客服联系我们，专业版以上用户享有优先响应。也可发邮件至 support@chuanghui.ai。' },
];

const stats = [
  { num: '10万+', label: '注册用户' },
  { num: '500万+', label: '已生成作品' },
  { num: '99.9%', label: '服务可用率' },
  { num: '6种', label: 'AI创作能力' },
];

interface UserInfo {
  id: number;
  phone: string;
  credits: number;
  nickname?: string;
}

type ModalType = 'login' | 'register' | null;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [modal, setModal] = useState<ModalType>(null);
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ phone: '', code: '', password: '' });
  const [regCodeCountdown, setRegCodeCountdown] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_info');
    if (token && savedUser) {
      try { setUserInfo(JSON.parse(savedUser)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (regCodeCountdown > 0) {
      const t = setTimeout(() => setRegCodeCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [regCodeCountdown]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const filteredFeatures = activeTab === 'all' ? features : features.filter(f => f.tab === activeTab);
  const getPrice = (base: number) => yearlyBilling ? Math.round(base * 0.8) : base;

  const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) { setLoginError('请输入手机号和密码'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginForm.phone, password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.detail || '登录失败，请检查手机号或密码'); return; }
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user_info));
      setUserInfo(data.user_info);
      setModal(null);
      setLoginForm({ phone: '', password: '' });
    } catch {
      setLoginError('网络错误，请检查后端服务是否启动');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regForm.phone) { setRegError('请输入手机号'); return; }
    if (!regForm.code) { setRegError('请输入验证码'); return; }
    if (!regForm.password || regForm.password.length < 8) { setRegError('密码至少8位'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regForm.phone, code: regForm.code, password: regForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.detail || '注册失败，请重试'); return; }
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user_info));
      setUserInfo(data.user_info);
      setModal(null);
      setRegForm({ phone: '', code: '', password: '' });
    } catch {
      setRegError('网络错误，请检查后端服务是否启动');
    } finally {
      setRegLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!regForm.phone || regForm.phone.length < 11) { setRegError('请输入正确的手机号'); return; }
    setRegError('');
    setRegCodeCountdown(60);
    try {
      await fetch(`${API_BASE}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regForm.phone }),
      });
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setUserInfo(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f0', fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>

      {/* 顶部导航 */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px', background: 'rgb(247,243,223)',
        borderBottom: '2px solid #c4b89e', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(121,79,39,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>🌿</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#794f27', letterSpacing: 1 }}>{APP_NAME}</span>
          <span style={{
            fontSize: 10, color: '#19c8b9', marginLeft: 2, padding: '2px 8px',
            background: '#e6f9f6', borderRadius: 20, border: '1px solid #19c8b9', fontWeight: 800, letterSpacing: 1,
          }}>BETA</span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Button type="text" onClick={() => scrollTo('features')}>功能</Button>
          <Button type="text" onClick={() => scrollTo('pricing')}>定价</Button>
          <Button type="text" onClick={() => scrollTo('faq')}>FAQ</Button>
          <div style={{ width: 1, height: 20, background: '#c4b89e', margin: '0 8px' }} />
          {userInfo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: '#e6f9f6', border: '1.5px solid #19c8b9',
                borderRadius: 20, padding: '4px 14px', color: '#19c8b9', fontWeight: 800, fontSize: 13,
              }}>
                {'💎 '}{userInfo.credits ?? 0}{' 积分'}
              </div>
              <div style={{
                background: 'rgb(247,243,223)', border: '1.5px solid #c4b89e',
                borderRadius: 20, padding: '4px 14px', color: '#794f27', fontWeight: 700, fontSize: 13,
              }}>
                {'📱 '}{userInfo.phone ? userInfo.phone.slice(-4).padStart(userInfo.phone.length, '*') : ''}
              </div>
              <Button type="text" onClick={() => { window.location.href = '/image'; }}>🎨 开始创作</Button>
              <Button type="text" onClick={handleLogout} style={{ color: '#9f927d', fontSize: 12 }}>退出</Button>
            </div>
          ) : (
            <>
              <Button type="default" onClick={() => { setLoginError(''); setModal('login'); }}>登录</Button>
              <Button type="primary" onClick={() => { setRegError(''); setModal('register'); }}>免费注册</Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero 区 */}
      <section style={{
        textAlign: 'center', padding: '88px 24px 64px',
        background: 'linear-gradient(155deg, #e6f9f6 0%, #eef5e8 30%, #f0e8d8 70%, #f8f8f0 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 30, left: '8%', fontSize: 40, opacity: 0.15 }}>🌸</div>
        <div style={{ position: 'absolute', top: 60, right: '10%', fontSize: 32, opacity: 0.12 }}>🍃</div>
        <div style={{ position: 'absolute', bottom: 40, left: '15%', fontSize: 28, opacity: 0.10 }}>⭐</div>
        <div style={{ position: 'absolute', bottom: 60, right: '8%', fontSize: 36, opacity: 0.12 }}>🌿</div>

        <div style={{
          display: 'inline-block', fontSize: 12, color: '#19c8b9', fontWeight: 800,
          marginBottom: 16, letterSpacing: 2, padding: '6px 20px',
          background: '#e6f9f6', borderRadius: 20, border: '1px solid #b2ece7',
        }}>
          🌱 全新上线 · 积分制 · 按需消耗 · 注册送积分
        </div>

        <Typewriter
          text={APP_NAME + ' — ' + APP_SLOGAN}
          speed={45}
          style={{ fontSize: 46, fontWeight: 900, color: '#794f27', display: 'block', marginBottom: 20, lineHeight: 1.15 }}
        />

        <p style={{ fontSize: 18, color: '#725d42', maxWidth: 580, margin: '0 auto 16px', lineHeight: 1.85 }}>
          AI 文生图 · AI 图生视频 · AI 配乐配音
        </p>
        <p style={{ fontSize: 14, color: '#9f927d', maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.7 }}>
          无需订阅，购买积分按量消耗，随用随充，积分永不过期
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          {userInfo ? (
            <Button type="primary" size="large" onClick={() => { window.location.href = '/image'; }}>🚀 开始创作</Button>
          ) : (
            <Button type="primary" size="large" onClick={() => { setRegError(''); setModal('register'); }}>🚀 免费注册领积分</Button>
          )}
          <Button type="default" size="large" onClick={() => scrollTo('features')}>✨ 了解全部功能</Button>
        </div>

        <div style={{
          display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap',
          maxWidth: 640, margin: '0 auto',
          background: 'rgba(247,243,223,0.8)', borderRadius: 20, border: '1px solid #c4b89e',
          padding: '20px 32px',
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              flex: '1 1 120px', textAlign: 'center', padding: '0 16px',
              borderRight: i < stats.length - 1 ? '1px solid #e0d4c0' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#19c8b9', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#9f927d', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider type="wave" style={{ margin: 0 }} />

      {/* 功能区 */}
      <section id="features" style={{ padding: '64px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 6 }}>✨ 全套 AI 创作工具</h2>
        <p style={{ textAlign: 'center', color: '#9f927d', marginBottom: 32, fontSize: 15 }}>覆盖图片、视频、音频多个创作场景，一个平台全搞定</p>
        <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} animated />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20, marginTop: 28 }}>
          {filteredFeatures.map(f => (
            <div
              key={f.title}
              onMouseEnter={() => setHoveredFeature(f.title)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{ transform: hoveredFeature === f.title ? 'translateY(-4px)' : 'translateY(0)', transition: 'transform 0.2s ease' }}
            >
              <Card
                color={f.color}
                type="default"
                style={{ cursor: 'pointer', height: '100%', position: 'relative' }}
                onClick={() => userInfo ? (window.location.href = '/image') : setModal('register')}
              >
                {f.badge && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: 10, fontWeight: 800, color: '#fff',
                    background: f.badge === '热门' ? '#e05a5a' : '#19c8b9',
                    padding: '2px 8px', borderRadius: 10,
                  }}>{f.badge}</div>
                )}
                <div style={{ fontSize: 42, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#794f27', marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: '#725d42', fontSize: 14, lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: 12, color: '#9f927d', background: 'rgba(255,255,255,0.6)',
                    padding: '3px 10px', borderRadius: 20, border: '1px dashed #c4b89e',
                  }}>
                    {'💎 '}{f.cost}{' '}{f.unit}
                  </div>
                  <Button type="primary" size="small" onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    userInfo ? (window.location.href = '/image') : setModal('register');
                  }}>
                    立即体验
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <Divider type="leaf" style={{ margin: 0 }} />

      {/* 定价区 */}
      <section id="pricing" style={{ padding: '64px 48px', background: 'rgb(247,243,223)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 6 }}>💰 简单透明的定价</h2>
          <p style={{ textAlign: 'center', color: '#9f927d', marginBottom: 20, fontSize: 15 }}>注册即送20积分，随时充值，积分永不过期</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
            <span style={{ color: !yearlyBilling ? '#794f27' : '#9f927d', fontWeight: !yearlyBilling ? 700 : 400, fontSize: 14 }}>按月付</span>
            <Switch checked={yearlyBilling} onChange={setYearlyBilling} size="small" />
            <span style={{ color: yearlyBilling ? '#794f27' : '#9f927d', fontWeight: yearlyBilling ? 700 : 400, fontSize: 14 }}>
              按年付
              <span style={{ fontSize: 11, color: '#19c8b9', marginLeft: 6, fontWeight: 800 }}>省20%</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {plans.map(p => (
              <Card key={p.name} color={p.color} type="title" style={{ textAlign: 'center', position: 'relative' }}>
                {p.hot && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #19c8b9, #11a89b)', color: '#fff',
                    fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20,
                    boxShadow: '0 3px 8px rgba(25,200,185,0.4)', whiteSpace: 'nowrap',
                  }}>🔥 最受欢迎</div>
                )}
                <div style={{ fontSize: 20, fontWeight: 900, color: '#794f27', marginBottom: 2, marginTop: p.hot ? 8 : 0 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#9f927d', marginBottom: 12 }}>{p.desc}</div>
                <div style={{ fontSize: 46, fontWeight: 900, color: '#19c8b9', lineHeight: 1, marginBottom: 4 }}>
                  {'¥'}{getPrice(p.price)}
                  <span style={{ fontSize: 14, color: '#9f927d', fontWeight: 400 }}>{p.period}</span>
                </div>
                {yearlyBilling && (
                  <div style={{ fontSize: 12, color: '#9f927d', textDecoration: 'line-through', marginBottom: 2 }}>
                    {'原价 ¥'}{p.price}{'/月'}
                  </div>
                )}
                <div style={{
                  color: '#725d42', fontSize: 13, margin: '10px 0 16px', padding: '8px 0',
                  borderTop: '1px dashed #c4b89e', borderBottom: '1px dashed #c4b89e', fontWeight: 700,
                }}>
                  {'每月 '}{p.credits}{' 积分'}
                </div>
                {p.items.map(item => (
                  <div key={item} style={{
                    color: '#725d42', fontSize: 13, padding: '4px 0',
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start', paddingLeft: 16,
                  }}>
                    <span style={{ color: '#19c8b9', fontWeight: 900, fontSize: 15 }}>✓</span> {item}
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <Button type="primary" block onClick={() => userInfo ? alert('充值功能即将上线！') : setModal('register')}>
                    {p.hot ? '🚀 立即订阅' : '立即订阅'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider type="wave" style={{ margin: 0 }} />

      {/* FAQ */}
      <section id="faq" style={{ padding: '64px 48px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: '#794f27', marginBottom: 32 }}>🙋 常见问题</h2>
        <Collapse items={faqs} />
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: '#9f927d', fontSize: 14, marginBottom: 12 }}>还有其他问题？</p>
          <Button type="default" onClick={() => setModal('register')}>📬 联系客服</Button>
        </div>
      </section>

      {/* Footer */}
      <Divider type="sea" />
      <div style={{ textAlign: 'center', padding: '20px 0 10px', color: '#9f927d', fontSize: 12, lineHeight: 2 }}>
        {'© 2026 '}{APP_NAME}{' · AI创作平台 · '}
        <span style={{ cursor: 'pointer' }}>用户协议</span>
        {' · '}
        <span style={{ cursor: 'pointer' }}>隐私政策</span>
        {' · '}
        <span style={{ cursor: 'pointer' }}>联系我们</span>
      </div>
      <Footer type="sea" />

      {/* 登录弹窗 */}
      <Modal open={modal === 'login'} onClose={() => setModal(null)} title="🌿 登录账号">
        <div style={{ padding: '8px 0 16px' }}>
          {loginError && (
            <div style={{
              background: '#fff0f0', border: '1.5px solid #e05a5a', borderRadius: 10,
              padding: '8px 14px', color: '#e05a5a', fontSize: 13, marginBottom: 14,
            }}>
              {'⚠️ '}{loginError}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>手机号</div>
            <Input
              placeholder="请输入手机号"
              value={loginForm.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>密码</div>
            <Input
              placeholder="请输入登录密码"
              value={loginForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button type="primary" block onClick={handleLogin} disabled={loginLoading}>
            {loginLoading ? '登录中...' : '登录'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 12, color: '#9f927d', fontSize: 13 }}>
            还没有账号？{' '}
            <span style={{ color: '#19c8b9', cursor: 'pointer', fontWeight: 700 }} onClick={() => setModal('register')}>
              免费注册领积分 →
            </span>
          </div>
        </div>
      </Modal>

      {/* 注册弹窗 */}
      <Modal open={modal === 'register'} onClose={() => setModal(null)} title="🌱 注册新账号">
        <div style={{ padding: '8px 0 16px' }}>
          {regError && (
            <div style={{
              background: '#fff0f0', border: '1.5px solid #e05a5a', borderRadius: 10,
              padding: '8px 14px', color: '#e05a5a', fontSize: 13, marginBottom: 14,
            }}>
              {'⚠️ '}{regError}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>手机号</div>
            <Input
              placeholder="请输入手机号"
              value={regForm.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>验证码</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="请输入验证码"
                value={regForm.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegForm(f => ({ ...f, code: e.target.value }))}
                style={{ flex: 1 }}
              />
              <Button
                type="default"
                onClick={handleSendCode}
                disabled={regCodeCountdown > 0}
                style={{ whiteSpace: 'nowrap', minWidth: 90 }}
              >
                {regCodeCountdown > 0 ? `${regCodeCountdown}s` : '发送验证码'}
              </Button>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>密码</div>
            <Input
              placeholder="请设置登录密码（至8位）"
              value={regForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button type="primary" block onClick={handleRegister} disabled={regLoading}>
            {regLoading ? '注册中...' : '立即注册领积分'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: 12, color: '#9f927d', fontSize: 13 }}>
            已有账号？{' '}
            <span style={{ color: '#19c8b9', cursor: 'pointer', fontWeight: 700 }} onClick={() => setModal('login')}>
              直接登录 →
            </span>
          </div>
        </div>
      </Modal>

    </div>
  );
}
