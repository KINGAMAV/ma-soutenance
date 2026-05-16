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
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [participantId, setParticipantId] = useState(null)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const badgeRef = useRef(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
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
    const canvas = await html2canvas(badgeRef.current, { scale: 3, useCORS: true })
    const link = document.createElement('a')
    link.download = `badge-${form.nom}-${form.prenom}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const resetForm = () => {
    setForm({
      nom: '', prenom: '', email: '',
      classe: '', filiere: '', theme_soutenance: '', projet_propose: '',
      invite_par: '', relation: '', poste: ''
    })
    setPhoto(null)
    setPhotoPreview(null)
    setBadgeVisible(false)
    setParticipantId(null)
  }

  const verificationUrl = participantId ? `${window.location.origin}/verify/${participantId}` : ''

  return (
    <div className="register-container">
      <div className="register-card fade-in">
        <div className="header-section">
          <img src="/logo.png" alt="CERCO Logo" className="school-logo" onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 className="header-title">Enregistrement</h1>
          <p className="header-subtitle">Plateforme officielle des soutenances</p>
        </div>

        {!badgeVisible ? (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Je suis un(e) *</label>
              <select className="form-control" value={statut} onChange={(e) => setStatut(e.target.value)}>
                {statuts.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nom *</label>
                <input className="form-control" name="nom" placeholder="Votre nom" value={form.nom} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Prénom *</label>
                <input className="form-control" name="prenom" placeholder="Votre prénom" value={form.prenom} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input className="form-control" name="email" type="email" placeholder="adresse@email.com" value={form.email} onChange={handleChange} />
            </div>

            {/* Champs conditionnels */}
            {statut === 'diplome' && (
              <div className="conditional-fields fade-in">
                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Classe</label>
                    <input className="form-control" name="classe" placeholder="Ex: Licence 3" value={form.classe} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Filière</label>
                    <input className="form-control" name="filiere" placeholder="Ex: Informatique" value={form.filiere} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Thème de soutenance</label>
                  <input className="form-control" name="theme_soutenance" placeholder="Sujet de votre mémoire" value={form.theme_soutenance} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Projet proposé (Optionnel)</label>
                  <input className="form-control" name="projet_propose" placeholder="Titre du projet" value={form.projet_propose} onChange={handleChange} />
                </div>
              </div>
            )}

            {statut === 'invite' && (
              <div className="conditional-fields fade-in">
                <div className="form-group">
                  <label>Invité par</label>
                  <input className="form-control" name="invite_par" placeholder="Nom de l'étudiant" value={form.invite_par} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <select className="form-control" name="relation" value={form.relation} onChange={handleChange}>
                    <option value="">Sélectionnez la relation...</option>
                    <option value="parent">Parent</option>
                    <option value="ami">Ami(e)</option>
                    <option value="frere_soeur">Frère/Sœur</option>
                    <option value="conjoint">Conjoint(e)</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
            )}

            {statut === 'administration' && (
              <div className="conditional-fields fade-in">
                <div className="form-group">
                  <label>Poste occupé</label>
                  <input className="form-control" name="poste" placeholder="Ex: Directeur des études, Jury..." value={form.poste} onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Photo pour le badge</label>
              <div className="file-input-wrapper">
                <input className="file-input" type="file" accept="image/*" onChange={handlePhotoChange} />
                {photoPreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={photoPreview} alt="Aperçu" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span><i className="spinner"></i> Génération en cours...</span>
              ) : 'Générer mon Badge'}
            </button>
          </form>
        ) : (
          <div className="badge-result-container">
            <div className="badge-wrapper" ref={badgeRef}>
              <div className="badge-header">
                <div className="badge-hole"></div>
                <img src="/logo.png" alt="CERCO Logo" className="badge-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              
              <div className="badge-body">
                {photoPreview ? (
                  <img src={photoPreview} alt="Photo du participant" className="badge-photo" />
                ) : (
                  <div className="badge-photo">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                )}
                
                <h2 className="badge-name">{form.prenom} {form.nom}</h2>
                <div className="badge-role">{statuts.find(s => s.value === statut)?.label}</div>
                
                <div className="badge-details">
                  {statut === 'diplome' && (
                    <>
                      {form.classe && form.filiere && <p><strong>Filière :</strong> {form.classe} - {form.filiere}</p>}
                      {form.theme_soutenance && <p><strong>Thème :</strong> {form.theme_soutenance}</p>}
                    </>
                  )}
                  {statut === 'invite' && (
                    <>
                      <p><strong>Invité(e) par :</strong> {form.invite_par}</p>
                      {form.relation && <p><strong>Relation :</strong> {form.relation}</p>}
                    </>
                  )}
                  {statut === 'administration' && (
                    <p><strong>Fonction :</strong> {form.poste}</p>
                  )}
                </div>

                <div className="badge-qr-section">
                  <div className="qr-code-wrapper">
                    <QRCodeCanvas value={verificationUrl} size={100} level="H" />
                  </div>
                  <p className="qr-url">ID: {participantId?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={downloadBadge} className="download-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Télécharger
              </button>
              <button onClick={resetForm} className="new-btn">
                Nouveau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}