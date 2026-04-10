'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  teachers: number
  parents: number
  admins: number
}

const COLORS = ['#10b981', '#3b82f6', '#ef4444']

const RADIAN = Math.PI / 180
function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function UsersRoleChart({ teachers, parents, admins }: Props) {
  const data = [
    { name: 'Enseignants', value: teachers },
    { name: 'Parents',     value: parents },
    { name: 'Admins',      value: admins },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Aucun utilisateur enregistré.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,.08)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
