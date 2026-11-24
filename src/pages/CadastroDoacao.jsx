import { useEffect, useMemo, useState } from 'react'
import { doacoesApi, doadoresApi, tiposDoacaoApi } from '../lib/api'
import { getUser } from '../lib/storage'
import { digits, formatDate, formatDatesInText, maskCpf, todayIso } from '../lib/utils'

export default function CadastroDoacao() {
  const user = getUser()
  const [doadores, setDoadores] = useState([])
  const [tipos, setTipos] = useState([])
  const [doacoes, setDoacoes] = useState([])
  const [form, setForm] = useState({
    cpf: '',
    data_doacao: todayIso(),
    tipo_doacao_id: '',
  })
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  async function carregar() {
    const [d, t, list] = await Promise.all([
      doadoresApi.listar(),
      tiposDoacaoApi.listar(),
      doacoesApi.listar(),
    ])
    setDoadores(d || [])
    setTipos(t || [])
    setDoacoes((list || []).slice().reverse())
  }

  useEffect(() => {
    carregar().catch((e) =>
      setAlert({ kind: 'error', text: formatDatesInText(`API: ${e.message}. Suba o backend na porta 3000.`) })
    )
  }, [])

  // Doador encontrado pelo CPF digitado
  const doadorEncontrado = useMemo(() => {
    const cpf = digits(form.cpf)
    if (cpf.length !== 11) return null
    return doadores.find((d) => digits(d.cpf) === cpf) || null
  }, [form.cpf, doadores])

  function onChange(field) {
    return (e) => {
      let value = e.target.value
      if (field === 'cpf') value = maskCpf(value)
      setForm((f) => ({ ...f, [field]: value }))
    }
  }

  async function submit(e) {
    e.preventDefault()
    setAlert(null)

    if (!doadorEncontrado) {
      setAlert({
        kind: 'error',
        text: 'Nenhum doador encontrado com este CPF. Cadastre o doador antes ou confira o número.',
      })
      return
    }
    if (!form.data_doacao || !form.tipo_doacao_id) {
      setAlert({ kind: 'error', text: 'Preencha data e tipo de doação.' })
      return
    }

    const funcionario_id = user?.funcionario_id
    if (!funcionario_id) {
      setAlert({
        kind: 'error',
        text: 'Faça login como Colaborador (matrícula, ex.: FUNC-0001) para registrar doações.',
      })
      return
    }

    setLoading(true)
    try {
      const data_doacao = form.data_doacao.includes('T')
        ? form.data_doacao
        : `${form.data_doacao}T10:00:00`

      await doacoesApi.criar({
        data_doacao,
        doador_id: Number(doadorEncontrado.id),
        funcionario_id: Number(funcionario_id),
        tipo_doacao_id: Number(form.tipo_doacao_id),
        situacao_id: null,
      })

      await carregar()
      setForm({ cpf: '', data_doacao: todayIso(), tipo_doacao_id: '' })
      setAlert({ kind: 'success', text: 'Doação registrada no banco!' })
    } catch (err) {
      let msg = err.message || 'Erro ao registrar doação.'
      // não exibe motivo clínico/detalhado do bloqueio
      if (/bloqueado/i.test(msg)) {
        const ate = msg.match(/\(até [^)]+\)/i)
        msg = ate
          ? `Doador está bloqueado para doação ${ate[0]}`
          : 'Doador está bloqueado para doação.'
      }
      setAlert({ kind: 'error', text: formatDatesInText(msg) })
    } finally {
      setLoading(false)
    }
  }

  const nomeDoador = (id) => doadores.find((d) => d.id === id)?.nome || id
  const tipoLabel = (id) => tipos.find((t) => t.id === id)?.descricao || id

  const cpfCompleto = digits(form.cpf).length === 11
  const textoDoador = !cpfCompleto
    ? 'Digite o CPF completo para localizar o doador'
    : doadorEncontrado
      ? doadorEncontrado.nome
      : 'Doador não encontrado neste CPF'

  return (
    <section className="page-section">
      <h2 className="page-title">Cadastro de doação</h2>
      {alert ? <div className={`alert alert-${alert.kind} show`}>{alert.text}</div> : null}

      <div className="form-container">
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>CPF do doador *</label>
              <input
                value={form.cpf}
                onChange={onChange('cpf')}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="form-group">
              <label>Doador</label>
              <input
                type="text"
                value={textoDoador}
                readOnly
                disabled
                className={
                  cpfCompleto
                    ? doadorEncontrado
                      ? 'campo-doador-ok'
                      : 'campo-doador-erro'
                    : ''
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data da doação *</label>
              <input
                type="date"
                value={form.data_doacao}
                onChange={onChange('data_doacao')}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo de doação *</label>
              <select value={form.tipo_doacao_id} onChange={onChange('tipo_doacao_id')} required>
                <option value="">Selecione...</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descricao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Regra: intervalo mínimo de <strong>4 meses</strong> entre doações do mesmo doador.
          </p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Funcionário logado: <strong>{user?.nome || '—'}</strong>
            {user?.funcionario_id
              ? ` (id ${user.funcionario_id})`
              : ' — login de colaborador necessário'}
          </p>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-dark"
              disabled={loading || !doadorEncontrado}
            >
              {loading ? 'Salvando...' : 'Registrar doação'}
            </button>
          </div>
        </form>
      </div>

      <h3 className="page-title" style={{ marginTop: 32, fontSize: 18 }}>
        Últimas doações (banco)
      </h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Doador</th>
              <th>Data</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {doacoes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center">
                  Nenhuma doação registrada.
                </td>
              </tr>
            ) : (
              doacoes.slice(0, 15).map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{nomeDoador(d.doador_id)}</td>
                  <td>{formatDate(String(d.data_doacao).slice(0, 10))}</td>
                  <td>{tipoLabel(d.tipo_doacao_id)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
