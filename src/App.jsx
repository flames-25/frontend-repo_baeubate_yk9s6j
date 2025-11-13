import { useEffect, useMemo, useState } from 'react'

// Use env if provided; otherwise fall back to the live backend URL for this session
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim()) || 'https://ta-01k9ycp7k12zt5e97zx2mxrv43-8000.wo-3p56dl9pwyp08knmmgnls2ixq.w.modal.host'

function BusinessHeader() {
  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 text-white rounded-xl p-5 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide">Shah i Hamadan Trading Company</h1>
          <p className="opacity-90 text-sm sm:text-base">Kulgam Fruit Mandi • Forwarding & Commission Agents</p>
          <p className="opacity-90 text-sm sm:text-base">FUD No. C-24 • Shop No. A-148</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Phone</p>
          <a href="tel:6005491098" className="hover:underline block">6005491098</a>
          <a href="tel:7006225941" className="hover:underline block">7006225941</a>
        </div>
      </div>
    </div>
  )
}

function ItemRow({ index, item, onChange, onRemove }) {
  const amount = useMemo(() => {
    const boxes = Number(item.boxes || 0)
    const rate = Number(item.rate || 0)
    return +(boxes * rate).toFixed(2)
  }, [item.boxes, item.rate])

  useEffect(() => {
    if (amount !== item.amount) onChange(index, { ...item, amount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount])

  return (
    <tr className="bg-white/80 border-b">
      <td className="p-2">
        <input
          className="w-full border rounded px-2 py-1"
          value={item.variety}
          onChange={(e) => onChange(index, { ...item, variety: e.target.value })}
          placeholder="Apple Variety"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-right"
          value={item.boxes}
          onChange={(e) => onChange(index, { ...item, boxes: Number(e.target.value) })}
          placeholder="0"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-right"
          value={item.rate}
          onChange={(e) => onChange(index, { ...item, rate: Number(e.target.value) })}
          placeholder="0"
        />
      </td>
      <td className="p-2 text-right font-semibold">{amount.toFixed(2)}</td>
      <td className="p-2 text-center">
        <button onClick={() => onRemove(index)} className="text-rose-600 hover:text-rose-700 font-medium">Remove</button>
      </td>
    </tr>
  )
}

function App() {
  const today = new Date().toISOString().slice(0, 10)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [truckNo, setTruckNo] = useState('')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ variety: '', boxes: 0, rate: 0, amount: 0 }])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const totals = useMemo(() => {
    const total_boxes = items.reduce((s, it) => s + Number(it.boxes || 0), 0)
    const total_amount = items.reduce((s, it) => s + Number(it.amount || 0), 0)
    return { total_boxes, total_amount: +total_amount.toFixed(2) }
  }, [items])

  const resetForm = () => {
    setBuyerName('')
    setBuyerPhone('')
    setTruckNo('')
    setDate(today)
    setNotes('')
    setItems([{ variety: '', boxes: 0, rate: 0, amount: 0 }])
  }

  const addItem = () => setItems([...items, { variety: '', boxes: 0, rate: 0, amount: 0 }])
  const updateItem = (idx, next) => setItems(items.map((it, i) => (i === idx ? next : it)))
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const asPlainObject = () => ({
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    truck_no: truckNo,
    date,
    items: items.map(i => ({ variety: i.variety, boxes: Number(i.boxes||0), rate: Number(i.rate||0), amount: Number(i.amount||0) })),
    total_boxes: totals.total_boxes,
    total_amount: totals.total_amount,
    notes,
  })

  const saveToBackend = async () => {
    setLoading(true)
    setMessage('')
    try {
      if (!BACKEND_URL) throw new Error('Missing backend URL')
      const payload = {
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        truck_no: truckNo,
        date,
        items: items.map(i => ({ variety: i.variety, boxes: Number(i.boxes||0), rate: Number(i.rate||0), amount: Number(i.amount||0) })),
        notes,
      }
      const res = await fetch(`${BACKEND_URL}/api/wataks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setMessage('Saved successfully')
      return data?.id
    } catch (e) {
      console.error(e)
      setMessage('Could not save. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const recordData = () => {
    const record = asPlainObject()
    setRecords(prev => [record, ...prev])
    setMessage('Recorded locally')
    resetForm()
  }

  const shareTextFor = (rec) => {
    const lines = []
    lines.push('Shah i Hamadan Trading Company')
    lines.push('Kulgam Fruit Mandi • FUD C-24 • Shop A-148')
    lines.push('Phone: 6005491098, 7006225941')
    lines.push('------------------------------')
    lines.push(`Buyer: ${rec.buyer_name}`)
    if (rec.buyer_phone) lines.push(`Phone: ${rec.buyer_phone}`)
    if (rec.truck_no) lines.push(`Truck: ${rec.truck_no}`)
    lines.push(`Date: ${rec.date}`)
    lines.push('Items:')
    rec.items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.variety} — ${it.boxes} boxes x ${it.rate} = ${it.amount}`)
    })
    lines.push(`Total Boxes: ${rec.total_boxes}`)
    lines.push(`Total Amount: ₹${rec.total_amount}`)
    if (rec.notes) lines.push(`Notes: ${rec.notes}`)
    return lines.join('\n')
  }

  const shareCurrent = async () => {
    const rec = asPlainObject()
    const text = shareTextFor(rec)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Watak', text })
        setMessage('Shared')
      } catch (_) {
        await navigator.clipboard.writeText(text)
        setMessage('Copied to clipboard')
      }
    } else {
      await navigator.clipboard.writeText(text)
      setMessage('Copied to clipboard')
    }
  }

  const exportCSV = () => {
    const all = records.length ? records : [asPlainObject()]
    const header = ['Date','Buyer','Phone','Truck','Variety','Boxes','Rate','Amount','Total Boxes','Total Amount','Notes']
    const rows = [header]
    all.forEach(rec => {
      if (rec.items.length === 0) {
        rows.push([rec.date, rec.buyer_name, rec.buyer_phone||'', rec.truck_no||'', '', '', '', '', rec.total_boxes, rec.total_amount, rec.notes||''])
      } else {
        rec.items.forEach((it, idx) => {
          rows.push([idx===0?rec.date:'', idx===0?rec.buyer_name:'', idx===0?(rec.buyer_phone||''):'', idx===0?(rec.truck_no||''):'', it.variety, it.boxes, it.rate, it.amount, idx===0?rec.total_boxes:'', idx===0?rec.total_amount:'', idx===0?(rec.notes||''):''])
        })
      }
    })
    const csv = rows.map(r => r.map(v => `"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wataks_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Excel file prepared (CSV)')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-50 py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <BusinessHeader />

        <div className="bg-white/80 backdrop-blur rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-bold mb-3 text-stone-800">Create Watak</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-stone-600">Buyer Name</label>
              <input className="w-full border rounded px-3 py-2" value={buyerName} onChange={e=>setBuyerName(e.target.value)} placeholder="Enter buyer name"/>
            </div>
            <div>
              <label className="block text-sm text-stone-600">Buyer Phone</label>
              <input className="w-full border rounded px-3 py-2" value={buyerPhone} onChange={e=>setBuyerPhone(e.target.value)} placeholder="Phone number"/>
            </div>
            <div>
              <label className="block text-sm text-stone-600">Truck No.</label>
              <input className="w-full border rounded px-3 py-2" value={truckNo} onChange={e=>setTruckNo(e.target.value)} placeholder="JK** ****"/>
            </div>
            <div>
              <label className="block text-sm text-stone-600">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-stone-800">Items</h3>
              <button onClick={addItem} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded">Add Item</button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-100 text-stone-700">
                    <th className="p-2 text-left">Variety</th>
                    <th className="p-2 text-right">Boxes</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <ItemRow key={idx} index={idx} item={it} onChange={updateItem} onRemove={removeItem} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-end justify-between gap-2 mt-3">
              <div className="text-stone-700">
                <p>Total Boxes: <span className="font-semibold">{totals.total_boxes}</span></p>
                <p>Total Amount: <span className="font-semibold">₹{totals.total_amount.toFixed(2)}</span></p>
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-sm text-stone-600">Notes</label>
                <input className="w-full border rounded px-3 py-2" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes"/>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={async()=>{ const id = await saveToBackend(); if(id){ resetForm(); } }} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded font-semibold">
              {loading? 'Saving...' : 'Save'}
            </button>
            <button onClick={recordData} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded font-semibold">Record Data</button>
            <button onClick={shareCurrent} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded font-semibold">Share</button>
            <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold">Export Excel</button>
          </div>

          {message && (
            <div className="mt-3 text-sm text-stone-700">{message}</div>
          )}

          <div className="mt-3 text-xs text-stone-500">Backend: {BACKEND_URL || 'Not configured'}</div>
        </div>

        {records.length > 0 && (
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-bold mb-2 text-stone-800">Recorded Wataks (Local)</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-100 text-stone-700">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Buyer</th>
                    <th className="p-2 text-right">Boxes</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.buyer_name}</td>
                      <td className="p-2 text-right">{r.total_boxes}</td>
                      <td className="p-2 text-right">₹{r.total_amount.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={async()=>{ setBuyerName(r.buyer_name); setBuyerPhone(r.buyer_phone||''); setTruckNo(r.truck_no||''); setDate(r.date); setNotes(r.notes||''); setItems(r.items); window.scrollTo({top:0, behavior:'smooth'}) }} className="text-blue-600 hover:underline">Load</button>
                          <button onClick={()=>{ const text = shareTextFor(r); navigator.clipboard.writeText(text); setMessage('Copied this watak') }} className="text-rose-600 hover:underline">Copy</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-stone-500 py-4">Made easy for Apple Wataks • Best colors and simple to use</div>
      </div>
    </div>
  )
}

export default App
