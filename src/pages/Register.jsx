import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { QRCodeCanvas } from 'qrcode.react'
import html2canvas from 'html2canvas'
import './Register.css'

const statuts = [
  { value: 'diplome', label: 'Diplômé' },
  { value: 'invite', label: 'Invité' },
  { value: 'administration', label: 'Administration' }
]

export default function Register() {
  const [statut, setStatut] = useState('diplome')
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    // diplome
    classe: '', filiere: '', theme_soutenance: '', projet_propose: '',
    // invite
    invite_par: '', relation: '',
    // administration
    poste: ''
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [participantId, setParticipantId] = useState(null)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const badgeRef = useRef(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0])
  }

  const uploadPhoto = async (participantId) => {
    if (!photo) return null
    const fileExt = photo.name.split('.').pop()
    const fileName = `${participantId}/${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('photos').upload(fileName, photo)
    if (error) {
      console.error('Upload error:', error)
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Construire l'objet à insérer selon le statut
    const baseData = {
      statut,
      nom: form.nom,
      prenom: form.prenom,
      email: form.email
    }
    let extraData = {}
    if (statut === 'diplome') {
      extraData = {
        classe: form.classe,
        filiere: form.filiere,
        theme_soutenance: form.theme_soutenance,
        projet_propose: form.projet_propose
      }
    } else if (statut === 'invite') {
      extraData = {
        invite_par: form.invite_par,
        relation: form.relation
      }
    } else if (statut === 'administration') {
      extraData = {
        poste: form.poste
      }
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([{ ...baseData, ...extraData }])
      .select('id')
      .single()

    if (error) {
      console.error(error)
      alert("Erreur lors de l'enregistrement")
      setLoading(false)
      return
    }

    const id = data.id
    // Upload photo si présente
    if (photo) {
      const photoUrl = await uploadPhoto(id)
      if (photoUrl) {
        await supabase.from('participants').update({ photo_url: photoUrl }).eq('id', id)
      }
    }

    setParticipantId(id)
    setBadgeVisible(true)
    setLoading(false)
  }

  const downloadBadge = async () => {
    if (!badgeRef.current) return
    const canvas = await html2canvas(badgeRef.current, { scale: 2 })
    const link = document.createElement('a')
    link.download = `badge-${participantId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const verificationUrl = participantId ? `${window.location.origin}/verify/${participantId}` : ''

  return (
    <div className="register-page">
      <h1>Enregistrement Soutenance</h1>
      {!badgeVisible ? (
        <form onSubmit={handleSubmit}>
          <label>Statut *</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            {statuts.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input name="nom" placeholder="Nom *" value={form.nom} onChange={handleChange} required />
          <input name="prenom" placeholder="Prénom *" value={form.prenom} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />

          {/* Champs conditionnels */}
          {statut === 'diplome' && (
            <>
              <input name="classe" placeholder="Classe" value={form.classe} onChange={handleChange} />
              <input name="filiere" placeholder="Filière" value={form.filiere} onChange={handleChange} />
              <input name="theme_soutenance" placeholder="Thème de soutenance" value={form.theme_soutenance} onChange={handleChange} />
              <input name="projet_propose" placeholder="Projet proposé" value={form.projet_propose} onChange={handleChange} />
            </>
          )}
          {statut === 'invite' && (
            <>
              <input name="invite_par" placeholder="Invité par" value={form.invite_par} onChange={handleChange} />
              <select name="relation" value={form.relation} onChange={handleChange}>
                <option value="">Relation...</option>
                <option value="ami">Ami</option>
                <option value="parent">Parent</option>
                <option value="frere">Frère/Sœur</option>
                <option value="autre">Autre</option>
              </select>
            </>
          )}
          {statut === 'administration' && (
            <input name="poste" placeholder="Poste" value={form.poste} onChange={handleChange} />
          )}

          <label>Photo (pour le badge)</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />

          <button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Générer mon QR Code'}
          </button>
        </form>
      ) : (
        <div className="badge-section">
          <div className="badge" ref={badgeRef}>
            <img src="/logo.png" alt="Logo école" className="badge-logo" />
            <h2>{form.prenom} {form.nom}</h2>
            <p className="statut-badge">{statut}</p>
            {statut === 'diplome' && (
              <div className="badge-details">
                <p>{form.classe} - {form.filiere}</p>
                <p><strong>Sujet:</strong> {form.theme_soutenance}</p>
              </div>
            )}
            {statut === 'invite' && (
              <p>Invité par {form.invite_par} ({form.relation})</p>
            )}
            {statut === 'administration' && (
              <p>{form.poste}</p>
            )}
            <QRCodeCanvas value={verificationUrl} size={120} />
            <p className="verification-url">{verificationUrl}</p>
          </div>
          <button onClick={downloadBadge} className="download-btn">Télécharger le badge</button>
        </div>
      )}
    </div>
  )
}