import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurvePoint } from '@/engine/types'
import { inrShort } from '@/lib/format'

const axisInr = (v: number) => {
  const a = Math.abs(v), s = a >= 1e5 ? `₹${Math.round(a / 1e5)} L` : a >= 1e3 ? `₹${Math.round(a / 1e3)} K` : `₹${Math.round(a)}`
  return v < 0 ? `−${s}` : s
}

export function ProfitCurve({ pts, current, sweet, cliff, floorMax, onPick }: {
  pts: CurvePoint[]; current: number; sweet: number; cliff: number | null; floorMax: number; onPick: (d: number) => void
}) {
  const data = pts.map((p) => ({ d: Math.round(p.d * 100), net: Math.round(p.net) }))
  const max = Math.max(...data.map((x) => x.net), 1)
  const min = Math.min(...data.map((x) => x.net), -1)
  const zero = max / (max - min) // gradient split at ₹0
  const sweetPt = data.find((x) => x.d === Math.round(sweet * 100))

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}
          onClick={(e) => { const l = (e as { activeLabel?: string | number } | null)?.activeLabel; if (l !== undefined) onPick(Number(l) / 100) }}>
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#2e7a57" stopOpacity={0.32} />
              <stop offset={zero} stopColor="#2e7a57" stopOpacity={0.04} />
              <stop offset={zero} stopColor="#c2421c" stopOpacity={0.04} />
              <stop offset={1} stopColor="#c2421c" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="netLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset={zero} stopColor="#2e7a57" /><stop offset={zero} stopColor="#c2421c" />
            </linearGradient>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#c2421c" strokeOpacity=".22" strokeWidth="2" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="#e8e0cf" />
          <XAxis dataKey="d" type="number" domain={[0, 60]} ticks={[0, 10, 20, 30, 40, 50, 60]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#8a8274' }} axisLine={{ stroke: '#dcd2bf' }} tickLine={false} />
          <YAxis tickFormatter={axisInr} tick={{ fontSize: 11, fill: '#8a8274' }} axisLine={false} tickLine={false} width={64} />
          {floorMax < 0.6 && <ReferenceArea x1={Math.round(floorMax * 100)} x2={60} fill="url(#hatch)" label={{ value: 'below margin floor', position: 'insideTopRight', fontSize: 10.5, fill: '#c2421c' }} />}
          <ReferenceLine y={0} stroke="#8a8274" strokeDasharray="3 3" />
          {cliff !== null && <ReferenceLine x={Math.round(cliff * 100)} stroke="#c2421c" strokeDasharray="4 3" label={{ value: 'profit cliff', position: 'insideBottomLeft', fontSize: 10.5, fill: '#c2421c' }} />}
          <Tooltip cursor={{ stroke: '#1c1a17', strokeOpacity: 0.25 }} contentStyle={{ background: '#fbf8f1', border: '1px solid #dcd2bf', borderRadius: 10, fontSize: 12 }}
            labelFormatter={(v) => `${v}% off`} formatter={(v) => [inrShort(Number(v)), 'Net impact']} />
          <Area type="monotone" dataKey="net" stroke="url(#netLine)" strokeWidth={2.2} fill="url(#netFill)" isAnimationActive={false} />
          <ReferenceLine x={Math.round(current * 100)} stroke="#1c1a17" strokeWidth={1.5} label={{ value: 'you', position: 'top', fontSize: 11, fill: '#1c1a17', fontWeight: 600 }} />
          {sweetPt && sweet > 0 && <ReferenceDot x={sweetPt.d} y={sweetPt.net} r={6} fill="#d9a441" stroke="#1c1a17" strokeWidth={1.5} label={{ value: 'sweet spot', position: 'top', fontSize: 10.5, fill: '#7a5414', offset: 10 }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
