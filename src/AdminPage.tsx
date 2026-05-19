import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Tabs, Divider, Input, Modal } from 'animal-island-ui';
import 'animal-island-ui/style';
import type { TabItem } from 'animal-island-ui';

const API_BASE = 'http://localhost:8000';

// ===== 工具函数 =====
function getToken() {
  return localStorage.getItem('access_token') || '';
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

// ===== 类型定义 =====
interface AdminStats {
  today: { new_users: number; orders: number; revenue: number; generated_images: number; generated_videos: number };
  total: { users: number; revenue: number };
}

interface AdminUser {
  id: number;
  phone: string;
  nickname: string;
  credits: number;
  status: string;
  created_at: string;
  last_login?: string;
}

interface GenRecord {
  id: string;
  user_id: number;
  phone: string;
  type: string;
  model: string;
  credit_cost: number;
  status: string;
  prompt: string;
  created_at: string;
}

// ===== 子组件 =====
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '2px solid #c4b89e' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '10px 16px', background: 'rgb(247,243,223)',
      color: '#794f27', fontWeight: 800, textAlign: 'left',
      borderBottom: '2px solid #c4b89e', whiteSpace: 'nowrap',
    }}>{children}</th>
  );
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td style={{
      padding: '10px 16px', color: '#725d42',
      borderBottom: '1px solid #ece8dc', whiteSpace: 'nowrap',
      textAlign: center ? 'center' : 'left',
    }}>{children}</td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'active': { bg: '#e6f9f6', color: '#19c8b9' },
    'normal': { bg: '#e6f9f6', color: '#19c8b9' },
    '正常': { bg: '#e6f9f6', color: '#19c8b9' },
    'banned': { bg: '#fde8e8', color: '#e05a5a' },
    '禁用': { bg: '#fde8e8', color: '#e05a5a' },
    'completed': { bg: '#e6f9f6', color: '#19c8b9' },
    '成功': { bg: '#e6f9f6', color: '#19c8b9' },
    'failed': { bg: '#fde8e8', color: '#e05a5a' },
    '失败': { bg: '#fde8e8', color: '#e05a5a' },
    'in_progress': { bg: '#fff8e0', color: '#dba90e' },
    '处理中': { bg: '#fff8e0', color: '#dba90e' },
  };
  const style = map[status] || { bg: '#f0ece2', color: '#9f927d' };
  const label = status === 'active' || status === 'normal' ? '正常'
    : status === 'banned' ? '禁用'
    : status === 'completed' ? '成功'
    : status === 'failed' ? '失败'
    : status === 'in_progress' ? '处理中'
    : status;
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    }}>{label}</span>
  );
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: 'center', padding: '32px', color: '#9f927d', fontSize: 14 }}>
        ⏳ 加载中...
      </td>
    </tr>
  );
}

function EmptyRow({ cols, msg }: { cols: number; msg?: string }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: 'center', padding: '32px', color: '#c4b89e', fontSize: 14 }}>
        {msg || '暂无数据'}
      </td>
    </tr>
  );
}

// ===== 数据概览 =====
function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/stats')
      .then(setStats)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#9f927d' }}>⏳ 加载统计数据...</div>;
  if (err) return <div style={{ padding: 16, color: '#e05a5a', background: '#fde8e8', borderRadius: 8 }}>❌ {err}</div>;
  if (!stats) return null;

  const cards = [
    { label: '总用户数', value: stats.total.users.toLocaleString(), unit: '人', color: '#19c8b9', icon: '👥' },
    { label: '今日新增', value: String(stats.today.new_users), unit: '人', color: '#6fba2c', icon: '🌱' },
    { label: '今日充值', value: `¥${stats.today.revenue.toFixed(2)}`, unit: '', color: '#f5c31c', icon: '💰' },
    { label: '今日订单', value: String(stats.today.orders), unit: '笔', color: '#794f27', icon: '📋' },
    { label: '今日生图', value: String(stats.today.generated_images), unit: '次', color: '#e05a5a', icon: '🖼️' },
    { label: '今日生视频', value: String(stats.today.generated_videos), unit: '次', color: '#9f927d', icon: '🎬' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map(s => (
          <div key={s.label} style={{
            background: 'rgb(247,243,223)', borderRadius: 16, padding: '20px 24px',
            border: '2px solid #c4b89e', display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 2px 8px rgba(121,79,39,0.08)',
          }}>
            <div style={{ fontSize: 36 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 13, color: '#9f927d', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: '#9f927d', marginLeft: 4 }}>{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Card color="app-green" type="title">
        <div style={{ fontWeight: 800, color: '#794f27', marginBottom: 8, fontSize: 15 }}>📊 积分规则说明</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: '#725d42' }}>
          <span>💡 100积分 = 1元人民币</span>
          <span>🖼️ 文生图 1K = <strong style={{ color: '#e05a5a' }}>8积分</strong></span>
          <span>🖼️ 文生图 2K = <strong style={{ color: '#e05a5a' }}>13积分</strong></span>
          <span>🖼️ 文生图 4K = <strong style={{ color: '#e05a5a' }}>20积分</strong></span>
        </div>
      </Card>
    </div>
  );
}

// ===== 用户管理 =====
function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [adjustModal, setAdjustModal] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [err, setErr] = useState('');

  const loadUsers = useCallback(() => {
    setLoading(true);
    setErr('');
    apiFetch(`/api/admin/users?page=${page}&keyword=${encodeURIComponent(search)}`)
      .then(data => { setUsers(data.records || []); setTotal(data.total || 0); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = () => { setPage(1); loadUsers(); };

  const handleAdjust = async () => {
    if (!adjustModal || !adjustAmount) return;
    setAdjustLoading(true);
    try {
      await apiFetch('/api/admin/adjust-credits', {
        method: 'POST',
        body: JSON.stringify({
          user_id: adjustModal.id,
          amount: Number(adjustAmount),
          reason: adjustReason || '管理员手动调整',
        }),
      });
      alert(`已为 ${adjustModal.nickname || adjustModal.phone} 调整积分：${Number(adjustAmount) > 0 ? '+' : ''}${adjustAmount}`);
      setAdjustModal(null);
      setAdjustAmount('');
      setAdjustReason('');
      loadUsers();
    } catch (e: unknown) {
      alert('调整失败：' + (e as Error).message);
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Input placeholder="搜索手机号或昵称" value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
          style={{ maxWidth: 260 }} />
        <Button type="primary" size="small" onClick={handleSearch}>搜索</Button>
        <span style={{ color: '#9f927d', fontSize: 13 }}>共 {total} 条</span>
        {err && <span style={{ color: '#e05a5a', fontSize: 12 }}>❌ {err}</span>}
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>ID</Th><Th>手机号</Th><Th>昵称</Th><Th>剩余积分</Th>
            <Th>状态</Th><Th>注册时间</Th><Th>操作</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? <LoadingRow cols={7} /> : users.length === 0 ? <EmptyRow cols={7} /> : users.map(u => (
            <tr key={u.id}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f6f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <Td>{u.id}</Td>
              <Td>{u.phone}</Td>
              <Td><strong style={{ color: '#794f27' }}>{u.nickname || '-'}</strong></Td>
              <Td><span style={{ color: '#19c8b9', fontWeight: 700 }}>{u.credits}</span></Td>
              <Td center><StatusBadge status={u.status} /></Td>
              <Td>{u.created_at ? u.created_at.slice(0, 10) : '-'}</Td>
              <Td>
                <Button type="primary" size="small" onClick={() => { setAdjustModal(u); setAdjustAmount(''); setAdjustReason(''); }}>
                  调积分
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button type="default" size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
        <span style={{ color: '#9f927d', fontSize: 13 }}>第 {page} 页</span>
        <Button type="default" size="small" onClick={() => setPage(p => p + 1)} disabled={users.length < 20}>下一页</Button>
      </div>

      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)} title={`⚡ 调整积分 — ${adjustModal?.nickname || adjustModal?.phone}`}>
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ color: '#725d42', marginBottom: 12, fontSize: 14 }}>
            当前积分：<strong style={{ color: '#19c8b9' }}>{adjustModal?.credits}</strong>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>调整数量（正数增加，负数扣减）</div>
            <Input placeholder="例如：50 或 -20" value={adjustAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustAmount(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>调整原因</div>
            <Input placeholder="例如：补偿生成失败" value={adjustReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustReason(e.target.value)} />
          </div>
          <Button type="primary" block onClick={handleAdjust} disabled={adjustLoading}>
            {adjustLoading ? '提交中...' : '确认调整'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ===== 生成记录 =====
function Generations() {
  const [records, setRecords] = useState<GenRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/generations?page=${page}`)
      .then(data => { setRecords(data.records || []); setTotal(data.total || 0); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: '#9f927d', fontSize: 13 }}>共 {total} 条生成记录</span>
        {err && <span style={{ color: '#e05a5a', fontSize: 12 }}>❌ {err}</span>}
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>任务ID</Th><Th>用户ID</Th><Th>类型</Th><Th>分辨率</Th>
            <Th>消耗积分</Th><Th>状态</Th><Th>提示词</Th><Th>时间</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? <LoadingRow cols={8} /> : records.length === 0 ? <EmptyRow cols={8} msg="暂无生成记录" /> : records.map(g => (
            <tr key={g.id}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f6f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <Td><span style={{ fontFamily: 'monospace', color: '#794f27', fontSize: 11 }}>{g.id.slice(0, 12)}...</span></Td>
              <Td>{g.user_id}</Td>
              <Td><strong style={{ color: '#794f27' }}>{g.type}</strong></Td>
              <Td>{g.model}</Td>
              <Td center><span style={{ color: '#e05a5a', fontWeight: 700 }}>-{g.credit_cost}</span></Td>
              <Td center><StatusBadge status={g.status} /></Td>
              <Td>
                <span style={{ color: '#725d42', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}
                  title={g.prompt}>{g.prompt}</span>
              </Td>
              <Td>{g.created_at ? g.created_at.slice(0, 16).replace('T', ' ') : '-'}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button type="default" size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
        <span style={{ color: '#9f927d', fontSize: 13 }}>第 {page} 页</span>
        <Button type="default" size="small" onClick={() => setPage(p => p + 1)} disabled={records.length < 20}>下一页</Button>
      </div>
    </div>
  );
}

// ===== 积分调整 =====
function CreditsAdjust() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone || !amount) { alert('请填写手机号和调整数量'); return; }
    setLoading(true);
    try {
      await apiFetch('/api/admin/adjust-credits', {
        method: 'POST',
        body: JSON.stringify({ phone, amount: Number(amount), reason: reason || '管理员手动调整' }),
      });
      alert(`已为 ${phone} 调整积分：${Number(amount) > 0 ? '+' : ''}${amount}`);
      setPhone(''); setAmount(''); setReason('');
    } catch (e: unknown) {
      alert('调整失败：' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <Card color="app-yellow" type="title">
        <div style={{ fontSize: 15, fontWeight: 800, color: '#794f27', marginBottom: 16 }}>⚡ 手动调整用户积分</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>用户手机号</div>
          <Input placeholder="请输入完整手机号" value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>调整数量（正数增加，负数扣减）</div>
          <Input placeholder="例如：100 或 -50" value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#794f27', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>调整原因</div>
          <Input placeholder="例如：补偿生成失败、人工充值等" value={reason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
        </div>
        <Button type="primary" block onClick={handleSubmit} disabled={loading}>
          {loading ? '提交中...' : '确认调整积分'}
        </Button>
        <div style={{ marginTop: 12, color: '#9f927d', fontSize: 12 }}>
          ⚠️ 100积分 = 1元人民币。操作不可撤销，请谨慎操作。
        </div>
      </Card>
    </div>
  );
}

// ===== Tab配置 =====
const tabs: TabItem[] = [
  { key: 'overview', label: '📊 数据概览' },
  { key: 'users', label: '👥 用户管理' },
  { key: 'generation', label: '✨ 生成记录' },
  { key: 'credits', label: '⚡ 积分调整' },
];

// ===== 主后台页面 =====
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
        <Card color="app-green" type="title" style={{ width: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#794f27', marginBottom: 4 }}>ViVa AI助手 后台管理</div>
          <div style={{ color: '#9f927d', fontSize: 13, marginBottom: 20 }}>请输入管理员密码</div>
          <Input
            placeholder="管理员密码"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { if (password === 'admin123') setAuthed(true); else alert('密码错误'); } }}
            style={{ marginBottom: 14 }}
          />
          <Button type="primary" block onClick={() => { if (password === 'admin123') setAuthed(true); else alert('密码错误'); }}>
            登录后台
          </Button>
          <div style={{ marginTop: 12, color: '#c4b89e', fontSize: 11 }}>演示密码：admin123</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f0', fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 40px', background: 'rgb(247,243,223)',
        borderBottom: '2px solid #c4b89e', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#794f27' }}>ViVa AI助手 · 后台管理</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#9f927d', fontSize: 13 }}>👤 管理员</span>
          <Button type="default" size="small" onClick={() => setAuthed(false)}>退出</Button>
          <Button type="text" size="small" onClick={() => window.open('/', '_blank')}>🌿 前台首页</Button>
        </div>
      </nav>

      <div style={{ padding: '28px 40px', maxWidth: 1300, margin: '0 auto' }}>
        <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} animated />
        <div style={{ marginTop: 24 }}>
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'generation' && <Generations />}
          {activeTab === 'credits' && <CreditsAdjust />}
        </div>
      </div>
    </div>
  );
}
