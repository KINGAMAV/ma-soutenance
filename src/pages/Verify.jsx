// Verify.jsx
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './Verify.css'

export default function Verify() {
  const { id } = useParams()
  const [participant, setParticipant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParticipant = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single()
      if (!error) setParticipant(data)
      setLoading(false)
    }
    fetchParticipant()
  }, [id])

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <h2>Vérification en cours...</h2>
    </div>
  )

  if (!participant) return (
    <div className="verify-container">
      <div className="verify-card error-card">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
        <h2 style={{color: 'var(--error)'}}>Participant non trouvé</h2>
        <p className="verify-subtitle">Ce badge n'existe pas ou n'est plus valide.</p>
      </div>
    </div>
  )

  const formatStatut = (statut) => {
    switch(statut) {
      case 'diplome': return 'Diplômé';
      case 'invite': return 'Invité';
      case 'administration': return 'Administration';
      default: return statut;
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-card fade-in">
        <div className="verify-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h2 className="verify-title">Badge Valide</h2>
        <p className="verify-subtitle">Les informations de ce participant ont été vérifiées avec succès.</p>

        {participant.photo_url && (
          <img src={participant.photo_url} alt="Photo du participant" className="verify-photo" />
        )}

        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{participant.prenom} {participant.nom}</h3>
        <div className="verify-role">{formatStatut(participant.statut)}</div>

        <div className="verify-details">
          {participant.statut === 'diplome' && (
            <>
              <div className="verify-item">
                <div className="verify-label">Classe & Filière</div>
                <div className="verify-value">{participant.classe} - {participant.filiere}</div>
              </div>
              <div className="verify-item">
                <div className="verify-label">Thème de soutenance</div>
                <div className="verify-value">{participant.theme_soutenance}</div>
              </div>
              {participant.projet_propose && (
                <div className="verify-item">
                  <div className="verify-label">Projet proposé</div>
                  <div className="verify-value">{participant.projet_propose}</div>
                </div>
              )}
            </>
          )}

          {participant.statut === 'invite' && (
            <>
              <div className="verify-item">
                <div className="verify-label">Invité par</div>
                <div className="verify-value">{participant.invite_par}</div>
              </div>
              <div className="verify-item">
                <div className="verify-label">Relation</div>
                <div className="verify-value" style={{ textTransform: 'capitalize' }}>{participant.relation}</div>
              </div>
            </>
          )}

          {participant.statut === 'administration' && (
            <div className="verify-item">
              <div className="verify-label">Poste</div>
              <div className="verify-value">{participant.poste}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}