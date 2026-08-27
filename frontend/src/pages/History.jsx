import '../styles/history.css'

export default function History({ data, reload }) {
  const { goals, settings } = data

  const closed = goals.filter(g => g.status === 'done' || g.status === 'not_achieved')

  async function reopenGoal(id) {
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress', closedMonth: null })
    })
    reload()
  }

  return (
    <div className="history-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Histórico</h1>
          <p className="section-sub">Objetivos que já foram encerrados.</p>
        </div>
      </div>

      {closed.length === 0 ? (
        <div className="history-empty">
          <p>Quando os objetivos forem sendo encerrados, eles vão aparecer aqui.</p>
          <p className="section-sub" style={{ marginTop: '0.5rem' }}>
            Daqui a alguns meses, essa página vai contar uma história bonita ♡
          </p>
        </div>
      ) : (
        <div className="history-closed-list">
          {closed.map(goal => {
            const ownerLabel =
              goal.type === 'shared'  ? '♡ Nosso' :
              goal.type === 'person1' ? settings.person1 : settings.person2

            return (
              <div key={goal.id} className="history-closed-card card">
                <div className="history-closed-header">
                  <h3 className="history-closed-title">{goal.title}</h3>
                  <span className="goal-owner-tag">{ownerLabel}</span>
                </div>

                {goal.description && (
                  <p className="history-closed-desc">{goal.description}</p>
                )}

                <div className="goal-closed-info">
                  {goal.status === 'done'
                    ? <span className="closed-label achieved">✓ Conseguimos ♡</span>
                    : <span className="closed-label not-achieved">✗ Não conseguimos dessa vez</span>
                  }
                  {goal.closedMonth && (
                    <span className="closed-month">encerrado em {goal.closedMonth}</span>
                  )}
                </div>

                <div className="goal-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => reopenGoal(goal.id)}>
                    Reativar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}