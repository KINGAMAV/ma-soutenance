import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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

  if (loading) return <p>Vérification...</p>
  if (!participant) return <p>Participant non trouvé</p>

  return (
    <div className="verify-page">
      <h2>Informations vérifiées</h2>
      <p><strong>Nom :</strong> {participant.prenom} {participant.nom}</p>
      <p><strong>Statut :</strong> {participant.statut}</p>
      {participant.photo_url && <img src={participant.photo_url} alt="Photo" style={{ width: 100 }} />}
      {participant.statut === 'diplome' && (
        <>
          <p>Classe : {participant.classe}</p>
          <p>Filière : {participant.filiere}</p>
          <p>Thème : {participant.theme_soutenance}</p>
          <p>Projet : {participant.projet_propose}</p>
        </>
      )}
      {participant.statut === 'invite' && (
        <p>Invité par : {participant.invite_par} ({participant.relation})</p>
      )}
      {participant.statut === 'administration' && (
        <p>Poste : {participant.poste}</p>
      )}
    </div>
  )
}