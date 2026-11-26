import { useEffect, useMemo, useState } from 'react'
import { doadoresApi, situacoesApi, tiposBloqueioApi } from '../lib/api'
import { digits, formatDate, formatDatesInText, maskCpf } from '../lib/utils'

export default function DoadoresBloqueados() {
  const [situacoes, setSituacoes] = useState([])
  const [doadores, setDoadores] = useState([])
  const [tiposBloqueio, setTiposBloqueio] = useState([])
  const [cpfBusca, setCpfBusca] = useState('')
  const [query, setQuery] = useState({ cpf: '', nome: '', motivo: '' })
  const [applied, setApplied] = useState({ cpf: '', nome: '', motivo: '' })
  const [form, setForm] = useState({
    doador_id: '',
    tipo_bloqueio_id: '',
    motivo: '',
    data_limite: '',
    descricao: 'Bloqueado temporariamente',
  })
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  async function carregar() {
    const [s, d, t] = await Promise.all([
      situacoesApi.listar(),
      doadoresApi.listar(),
      tiposBloqueioApi.listar(),
    ])
    setSituacoes(s || [])
    setDoadores(d || [])
    setTiposBloqueio(t || [])
  }

  useEffect(() => {
    carregar().catch((e) =>
      setAlert({ kind: 'error', text: formatDatesInText(`API: ${e.message}. Suba o backend na porta 3000.`) })
    )
  }, [])

  const doadorEncontrado = useMemo(() => {
    const cpf = digits(cpfBusca)
    if (cpf.length !== 11) return null
    return doadores.find((d) => digits(d.cpf || '') === cpf) || null
  }, [cpfBusca, doadores])

  const bloqueios = useMemo(
    () => (situacoes || []).filter((s) => s.tipo_bloqueio_id != null),
    [situacoes]
  )

  const filtrados = useMemo(() => {
    const cpf = digits(applied.cpf)
    const nome = applied.nome.trim().toLowerCase()
    const motivo = applied.motivo.trim().toLowerCase()
    return bloqueios.filter((s) => {
      const doador = doadores.find((d) => d.id === s.doador_id)
      if (cpf && !digits(doador?.cpf || '').includes(cpf)) return false
      if (nome && !(doador?.nome || '').toLowerCase().includes(nome)) return false
      if (motivo && !(s.motivo || s.descricao || '').toLowerCase().includes(motivo)) return false
      return true
    })
  }, [bloqueios, doadores, applied])

  function addDaysIso(days) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + Number(days))
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function motivoDoTipo(tipo) {
    if (!tipo) return ''
    const descricao = String(tipo.descricao || '').toLowerCase()
    const definitivo = tipo.prazo_dias == null || descricao.includes('definit') || descricao.includes('permanent')
    return definitivo ? 'Bloqueio Definitivo' : 'Bloqueio Temporário'
  }

  function onForm(field) {
    return (e) => {
      const value = e.target.value
      setForm((f) => {
        const next = { ...f, [field]: value }
        if (field === 'tipo_bloqueio_id') {
          const tipo = tiposBloqueio.find((t) => String(t.id) === String(value))
          if (tipo && tipo.prazo_dias != null && tipo.prazo_dias !== '') {
            next.data_limite = addDaysIso(tipo.prazo_dias)
          } else {
            next.data_limite = ''
          }
          next.motivo = motivoDoTipo(tipo)
          next.descricao = next.motivo === 'Bloqueio Definitivo' ? 'Bloqueado definitivamente' : 'Bloqueado temporariamente'
        }
        return next
      })
    }
  }

  function onCpfChange(e) {
    const value = maskCpf(e.target.value)
    setCpfBusca(value)
    const cpf = digits(value)
    const encontrado = cpf.length === 11
      ? doadores.find((d) => digits(d.cpf || '') === cpf)
      : null
    setForm((f) => ({ ...f, doador_id: encontrado ? String(encontrado.id) : '' }))
  }

  async function submitAdd(e) {
    e.preventDefault()
    setAlert(null)
    if (!form.doador_id || !form.tipo_bloqueio_id || !form.motivo) {
      setAlert({ kind: 'error', text: 'Informe um CPF cadastrado e selecione o tipo de bloqueio.' })
      return
    }
    setLoading(true)
    try {
      await situacoesApi.criar({
        descricao: form.descricao,
        tipo_bloqueio_id: Number(form.tipo_bloqueio_id),
        motivo: form.motivo,
        data_limite: form.data_limite || null,
        doador_id: Number(form.doador_id),
      })
      await carregar()
      setCpfBusca('')
      setForm({ doador_id: '', tipo_bloqueio_id: '', motivo: '', data_limite: '', descricao: 'Bloqueado temporariamente' })
      setAlert({ kind: 'success', text: 'Bloqueio registrado no banco (tabela situacoes).' })
    } catch (err) {
      setAlert({ kind: 'error', text: formatDatesInText(err.message || 'Erro ao bloquear doador.') })
    } finally {
      setLoading(false)
    }
  }

  async function remover(id) {
    try {
      await situacoesApi.deletar(id)
      await carregar()
      setAlert({ kind: 'success', text: 'Bloqueio removido.' })
    } catch (err) {
      setAlert({ kind: 'error', text: formatDatesInText(err.message) })
    }
  }

  const doadorLabel = (id) => {
    const d = doadores.find((x) => x.id === id)
    return d ? `${d.nome} (${d.cpf})` : `Doador #${id}`
  }
  const tipoLabel = (id) => tiposBloqueio.find((t) => t.id === id)?.descricao || id

  return (
    <section className="page-section">
      <h2 className="page-title">Doadores bloqueados</h2>
      {alert ? <div className={`alert alert-${alert.kind} show`}>{alert.text}</div> : null}

      <div className="form-container bloqueio-card">
        <h3 className="section-subtitle"><span className="i i-plus" /> Adicionar bloqueio (situações)</h3>
        <form onSubmit={submitAdd}>
          <div className="form-group">
            <label htmlFor="cpf-doador-bloqueio">Doador *</label>
            <input
              id="cpf-doador-bloqueio"
              value={cpfBusca}
              onChange={onCpfChange}
              placeholder="Digite o CPF do doador..."
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              required
            />
            {digits(cpfBusca).length === 11 && (
              <small style={{ display: 'block', marginTop: 6, color: doadorEncontrado ? '#218838' : '#b02a37' }}>
                {doadorEncontrado ? `Doador encontrado: ${doadorEncontrado.nome}` : 'Nenhum doador encontrado com este CPF.'}
              </small>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de bloqueio *</label>
              <select value={form.tipo_bloqueio_id} onChange={onForm('tipo_bloqueio_id')} required>
                <option value="">Selecione...</option>
                {tiposBloqueio.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descricao}{t.prazo_dias != null ? ` (${t.prazo_dias} dias)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Data limite <span style={{ fontWeight: 400, color: '#888' }}>(preenchida pelo tipo)</span></label>
              <input type="date" value={form.data_limite} onChange={onForm('data_limite')} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="motivo-bloqueio">Motivo *</label>
            <input
              id="motivo-bloqueio"
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
              placeholder="Digite o motivo do bloqueio..."
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-dark" disabled={loading || !doadorEncontrado}>
              {loading ? 'Salvando...' : 'Adicionar bloqueio'}
            </button>
          </div>
        </form>
      </div>

      <div className="form-container bloqueio-card" style={{ marginTop: 20 }}>
        <h3 className="section-subtitle"><span className="i i-search" /> Pesquisar</h3>
        <form onSubmit={(e) => { e.preventDefault(); setApplied(query) }}>
          <div className="form-row">
            <div className="form-group">
              <label>CPF</label>
              <input value={query.cpf} onChange={(e) => setQuery({ ...query, cpf: maskCpf(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Nome</label>
              <input value={query.nome} onChange={(e) => setQuery({ ...query, nome: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Motivo</label>
            <input value={query.motivo} onChange={(e) => setQuery({ ...query, motivo: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-dark">Pesquisar</button>
            <button type="button" className="btn btn-outline" style={{ marginLeft: 10 }}
              onClick={() => { setQuery({ cpf: '', nome: '', motivo: '' }); setApplied({ cpf: '', nome: '', motivo: '' }) }}>
              Limpar
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Doador</th><th>Tipo bloqueio</th><th>Motivo</th><th>Data limite</th><th /></tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} className="text-center">Nenhum bloqueio encontrado.</td></tr>
            ) : (
              filtrados.map((s) => (
                <tr key={s.id}>
                  <td>{doadorLabel(s.doador_id)}</td>
                  <td><span className="badge-motivo">{tipoLabel(s.tipo_bloqueio_id)}</span></td>
                  <td>{s.motivo || s.descricao}</td>
                  <td>{s.data_limite ? formatDate(s.data_limite) : 'Indeterminado'}</td>
                  <td><button type="button" className="btn-remover" title="Remover" onClick={() => remover(s.id)}><span className="i i-block" /></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
