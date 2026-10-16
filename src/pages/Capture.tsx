import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { INDICATORS } from '../types'
import type { IndicatorKey } from '../types'
import { today } from '../data/mock'
import { parseOcrText } from '../lib/ocrParser'
import Tesseract from 'tesseract.js'

type Phase = 'upload' | 'recognizing' | 'confirm'

interface OcrItem {
  key: IndicatorKey
  value: number
  rawText: string
  accepted: boolean
}

export function Capture() {
  const { navigate, addVisit, visits } = useStore()
  const [phase, setPhase] = useState<Phase>('upload')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [items, setItems] = useState<OcrItem[]>([])
  const [progress, setProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const existing = visits.find((v) => v.date === today)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setPhase('recognizing')
    runOcr(url)
  }

  const runOcr = async (url: string) => {
    setOcrStatus('正在加载识别引擎…')
    setProgress(0)
    try {
      const result = await Tesseract.recognize(url, 'chi_sim+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
            setOcrStatus(`正在识别文字… ${Math.round(m.progress * 100)}%`)
          } else if (m.status === 'loading language traineddata') {
            setOcrStatus('正在加载语言包…')
          }
        },
      })
      setOcrStatus('识别完成，正在解析指标…')
      const parsed = parseOcrText(result.data.text)
      if (parsed.length === 0) {
        setItems([])
        setOcrStatus('未能自动识别出指标，请手动补录')
        setPhase('confirm')
        return
      }
      setItems(
        parsed.map((p) => ({
          key: p.key,
          value: p.value,
          rawText: p.rawText,
          accepted: true,
        })),
      )
      setPhase('confirm')
    } catch {
      setOcrStatus('识别失败，请重试或手动补录')
      setPhase('confirm')
    }
  }

  const toggle = (key: IndicatorKey) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, accepted: !x.accepted } : x)))

  const save = async () => {
    setSaving(true)
    const values: Partial<Record<IndicatorKey, number>> = {}
    items.filter((i) => i.accepted).forEach((i) => (values[i.key] = i.value))
    await addVisit({ date: today, values, source: 'photo', verified: false, rawPhoto: true })
    navigate({ name: 'home' })
  }

  if (phase === 'upload') {
    return (
      <div className="page">
        <header className="page-head">
          <button className="back" onClick={() => navigate({ name: 'home' })}>
            ‹ 返回
          </button>
          <span>拍化验单</span>
        </header>

        <div
          className="dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          <div className="drop-icon">📷</div>
          <div className="drop-title">点击选择或拖入化验单照片</div>
          <div className="drop-hint">支持中文 / 英文检验报告 · 自动识别铁蛋白、血小板、AST 等指标</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        <div className="card">
          <div className="drop-hint" style={{ marginBottom: 8 }}>
            💡 识别后请务必核对数字，OCR 可能读错小数点或单位
          </div>
          <div className="drop-hint">也可以跳过识别，直接手动补录：</div>
          <button className="btn-secondary" onClick={() => navigate({ name: 'entry' })}>
            手动补录 →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'recognizing') {
    return (
      <div className="page center-page">
        {imageUrl && (
          <div className="ocr-preview-img">
            <img src={imageUrl} alt="化验单预览" />
          </div>
        )}
        <div className="progress-ring">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#2563eb"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34 * progress / 100} ${2 * Math.PI * 34}`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="progress-num">{progress}%</div>
        </div>
        <div className="parsing-text">{ocrStatus || '正在识别…'}</div>
        <div className="parsing-sub">首次识别需要加载语言包，请耐心等待</div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={() => navigate({ name: 'home' })}>
          ‹ 返回
        </button>
        <span>确认识别结果</span>
      </header>

      {imageUrl && (
        <div className="ocr-preview-img">
          <img src={imageUrl} alt="化验单" />
        </div>
      )}

      <div className="card">
        <div className="ocr-date">
          采样日期 <b>{today}</b>
          <span className="hint">（可修改）</span>
        </div>
        {items.length === 0 ? (
          <div className="ocr-empty">
            <p>未能自动识别出指标数值</p>
            <p className="hint" style={{ marginBottom: 4 }}>
              可能原因：照片模糊、光线不足、或指标名称不在词库中
            </p>
            <p className="hint">建议：重新拍摄更清晰的照片，或直接手动补录</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setPhase('upload')}>
                重新拍照
              </button>
              <button className="btn-primary" onClick={() => navigate({ name: 'entry' })}>
                手动补录 →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ocr-summary">
              识别到 {items.length} 项指标，请核对：
            </div>
            <ul className="ocr-list">
              {items.map((it) => {
                const meta = INDICATORS[it.key]
                return (
                  <li key={it.key} className={it.accepted ? 'ok' : 'uncertain'}>
                    <div className="ocr-name">{meta.name}</div>
                    <div className="ocr-value">
                      <input
                        className="ocr-input"
                        value={it.value}
                        onChange={(e) =>
                          setItems((xs) =>
                            xs.map((x) =>
                              x.key === it.key
                                ? { ...x, value: Number(e.target.value), accepted: true }
                                : x,
                            ),
                          )
                        }
                      />
                      <span className="ocr-unit">{meta.unit}</span>
                    </div>
                    <button
                      className={`ocr-check ${it.accepted ? 'checked' : ''}`}
                      onClick={() => toggle(it.key)}
                    >
                      {it.accepted ? '✓' : '✕'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {existing && items.length > 0 && (
        <div className="card warn-card">
          <span className="warn-ico">ℹ</span>
          <div>
            <div className="warn-title">今天已有一条记录</div>
            <div className="warn-sub">再保存会覆盖今天的记录</div>
          </div>
        </div>
      )}

      <div className="capture-actions">
        {items.length > 0 && (
          <button className="btn-primary btn-big" onClick={save} disabled={saving}>
            {saving ? '保存中…' : `确认并保存（已选 ${items.filter((i) => i.accepted).length} 项）`}
          </button>
        )}
        <button className="btn-secondary" onClick={() => setPhase('upload')}>
          重新拍照
        </button>
      </div>
    </div>
  )
}
