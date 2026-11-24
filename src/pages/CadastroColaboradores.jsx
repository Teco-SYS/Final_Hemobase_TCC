import { useEffect, useState } from 'react'
import { funcionariosApi, instituicoesApi } from '../lib/api'
import { getUser } from '../lib/storage'

const empty = {
  nome: '',
  matricula: '',
  instituicao_id: '',
}

export default function CadastroColaboradores() {
  const user = getUser()
  const [form, setForm] = useState(empty)
  const [lista, setLista] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  async function carregar() {
    const [funcs, insts] = await Promise.all([
      funcionariosApi.listar(),
      instituicoesApi.listar(),
    ])
    setLista(funcs || [])
    setInstituicoes(insts || [])

    // se o hemocentro logado já tem instituicao_id, pré-seleciona
    if (user?.instituicao_id) {
      setForm((f) => ({
        ...f,
        instituicao_id: f.instituicao_id || String(user.instituicao_id),
      }))
    }
  }

  useEffect(() => {
    carregar().catch((e) =>
      setAlert({ kind: 'error', text: `API: ${e.message}. Suba o backend na porta 3000.` })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onChange(field) {
    return (e) => {
      let value = e.target.value
      if (field === 'matricula') value = value.toUpperCase().trim()
      setForm((f) => ({ ...f, [field]: value }))
    }
  }

  async function submit(e) {
    e.preventDefault()
    setAlert(null)

    if (!form.nome.trim() || !form.matricula.trim() || !form.instituicao_id) {
      setAlert({ kind: 'error', text: 'Preencha nome, matrícula e instituição.' })
      return
    }

    setLoading(true)
    try {
      await funcionariosApi.criar({
        nome: form.nome.trim(),
        matricula: form.matricula.trim(),
        instituicao_id: Number(form.instituicao_id),
      })
      await carregar()
      setForm({
        nome: '',
        matricula: '',
        instituicao_id: user?.instituicao_id ? String(user.instituicao_id) : '',
      })
      setAlert({ kind: 'success', text: 'Colaborador cadastrado no banco!' })
    } catch (err) {
      setAlert({ kind: 'error', text: err.message || 'Erro ao cadastrar colaborador.' })
    } finally {
      setLoading(false)
    }
  }

  async function remover(id) {
    if (!window.confirm('Remover este colaborador?')) return
    try {
      await funcionariosApi.deletar(id)
      await carregar()
      setAlert({ kind: 'success', text: 'Colaborador removido.' })
    } catch (err) {
      setAlert({ kind: 'error', text: err.message })
    }
  }

  const nomeInst = (id) => instituicoes.find((i) => i.id === id)?.nome || id

  return (
    <section className="page-section">
      <h2 className="page-title">Cadastro de colaboradores</h2>
      <p className="page-subtitle">
        Funcionários da instituição que operam o Hemobanco (matrícula usada no login).
      </p>
      {alert ? <div className={`alert alert-${alert.kind} show`}>{alert.text}</div> : null}

      <div className="form-container">
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nome completo *</label>
            <input value={form.nome} onChange={onChange('nome')} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Matrícula *</label>
              <input
                value={form.matricula}
                onChange={onChange('matricula')}
                placeholder="FUNC-0005"
                required
              />
            </div>
            <div className="form-group">
              <label>Instituição *</label>
              <select value={form.instituicao_id} onChange={onChange('instituicao_id')} required>
                <option value="">Selecione...</option>
                {instituicoes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-dark" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar colaborador'}
            </button>
          </div>
        </form>
      </div>

      <h3 className="page-title" style={{ marginTop: 32, fontSize: 18 }}>
        Colaboradores no banco
      </h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Instituição</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Nenhum colaborador cadastrado.
                </td>
              </tr>
            ) : (
              lista.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.nome}</td>
                  <td>{f.matricula}</td>
                  <td>{nomeInst(f.instituicao_id)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-remover"
                      title="Remover"
                      onClick={() => remover(f.id)}
                    >
                      <span className="i i-block" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
