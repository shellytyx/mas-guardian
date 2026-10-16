import { useState } from 'react'
import { useStore } from '../lib/store'

export function Onboarding() {
  const { navigate, updateProfile, addCheck } = useStore()
  const [name, setName] = useState('')
  const [age, setAge] = useState('6')
  const [sjiaStatus, setSjiaStatus] = useState<'confirmed' | 'suspected' | 'no'>('confirmed')
  const [hasFever, setHasFever] = useState(true)

  const handleSubmit = async () => {
    if (!name.trim()) return
    const profile = {
      id: 'p1',
      name: name.trim(),
      age: Number(age) || 6,
      diagnosis: 'sJIA',
      sjiaStatus,
      hasFever,
    }
    await updateProfile(profile)
    await addCheck({ date: '2026-10-15', temp: hasFever ? 38.5 : 36.8 })
    navigate({ name: 'home' })
  }

  return (
    <div className="page">
      <header className="page-head">
        <span>首次使用</span>
      </header>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>录入基本信息</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: -8 }}>
          这些信息用于个性化风险评估，仅保存在本机
        </p>

        <div className="form-group">
          <label className="form-label">姓名</label>
          <input
            className="form-input"
            placeholder="例如：QQ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">年龄</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="18"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">sJIA 状态</label>
          <div className="radio-group">
            {[
              { value: 'confirmed' as const, label: '已确诊 sJIA' },
              { value: 'suspected' as const, label: '疑似 sJIA' },
              { value: 'no' as const, label: '否' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`radio-btn ${sjiaStatus === opt.value ? 'active' : ''}`}
                onClick={() => setSjiaStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">当前是否发热</label>
          <div className="radio-group">
            {[
              { value: true, label: '有发热' },
              { value: false, label: '无发热' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                className={`radio-btn ${hasFever === opt.value ? 'active' : ''}`}
                onClick={() => setHasFever(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-primary btn-big" onClick={handleSubmit} disabled={!name.trim()}>
        保存并进入 →
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 12 }}>
        数据仅保存在本机浏览器，不会上传到服务器
      </p>
    </div>
  )
}
