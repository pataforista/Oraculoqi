import React, { useState, useEffect, useCallback } from 'https://esm.sh/react';
import Galaxy from './Galaxy.js';
import ElectricBorder from './ElectricBorder.js';
import ProfileCard from './ProfileCard.js';

const STATE_KEY = 'trozos_sabiduria_state_v1';
const FAVORITES_KEY = 'trozos_sabiduria_favorites';

export default function App() {
    const [card, setCard] = useState(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    });
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        // Load dataset and pick today's card
        if (window.QI_DATASET_V1) {
            const deck = window.QI_DATASET_V1.cards;
            const today = new Date().toISOString().split('T')[0];

            // Simple hash for daily card
            let hash = 0;
            for (let i = 0; i < today.length; i++) {
                hash = ((hash << 5) - hash) + today.charCodeAt(i);
                hash |= 0;
            }
            const index = Math.abs(hash) % deck.length;
            setCard(deck[index]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = useCallback(() => {
        if (!card) return;
        setFavorites(prev => {
            const exists = prev.find(f => f.id === card.id);
            if (exists) {
                return prev.filter(f => f.id !== card.id);
            } else {
                return [...prev, card];
            }
        });
    }, [card]);

    const shareCard = useCallback(async () => {
        if (!card) return;
        const shareData = {
            title: 'Trozos de Sabiduría',
            text: `"${card.frase}"\n\n- Trozos de Sabiduría`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert('Copiado al portapapeles');
            }
        } catch (err) {
            console.error(err);
        }
    }, [card]);

    if (!card) return <div className="loading">Cargando sabiduría...</div>;

    const isFav = favorites.some(f => f.id === card.id);

    return (
        <div className="app-container">
            <Galaxy
                speed={0.5}
                density={1.5}
                hueShift={140}
                twinkleIntensity={0.5}
            />

            <main className="main-content">
                <header className="brand-header">
                    <img src="logo_cacb.jpeg" className="brand-logo" alt="Logo" />
                    <div className="brand-info">
                        <h1>Trozos de Sabiduría</h1>
                        <p className="date-sync">Sincronía · {new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="card-stage">
                    <div className={`card-anim-container ${isRevealed ? 'is-revealed' : ''}`}>
                        {!isRevealed ? (
                            <div className="card-placeholder" onClick={() => setIsRevealed(true)}>
                                <ElectricBorder color="#c5a059" speed={0.8}>
                                    <div className="reveal-overlay">
                                        <span>Revelar vía</span>
                                    </div>
                                </ElectricBorder>
                            </div>
                        ) : (
                            <ProfileCard
                                name="Trozos de Sabiduría"
                                title={card.categoria.replace('_', ' ')}
                                title_alt={card.linaje}
                                handle="sabiduria"
                                status="Presente"
                                contactText="Ver más"
                                avatarUrl="logo_cacb.jpeg"
                                isFavorite={isFav}
                                onFavoriteToggle={toggleFavorite}
                                onShareClick={shareCard}
                                showUserInfo={true}
                            >
                                <div className="pc-text-container">
                                    <p className="card-frase">“{card.frase}”</p>
                                    <p className="card-interpretacion">{card.interpretacion}</p>
                                    <div className="card-practica">
                                        <label>Invitación hoy</label>
                                        <p>{card.practica_hoy}</p>
                                    </div>
                                </div>
                            </ProfileCard>
                        )}
                    </div>
                </div>

                {isRevealed && (
                    <button className="btn-another" onClick={() => window.location.reload()}>
                        Otra sincronía
                    </button>
                )}
            </main>

            <style>{`
        .app-container {
          min-height: 100vh;
          color: white;
          font-family: 'Noto Serif', serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          overflow-x: hidden;
        }
        .main-content {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          z-index: 10;
        }
        .brand-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding-top: 20px;
        }
        .brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .brand-info h1 {
          font-size: 1.2rem;
          margin: 0;
          font-weight: 600;
        }
        .date-sync {
          font-size: 0.75rem;
          opacity: 0.6;
          margin: 2px 0 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-stage {
          display: flex;
          justify-content: center;
          perspective: 1000px;
        }
        .card-anim-container {
          width: 100%;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-placeholder {
          aspect-ratio: 3 / 4.2;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          cursor: pointer;
        }
        .reveal-overlay {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #c5a059;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .pc-text-container {
          padding: 10px 0;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .card-frase {
          font-size: 1.3rem;
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
        }
        .card-interpretacion {
          font-size: 0.95rem;
          opacity: 0.8;
          line-height: 1.6;
          margin: 0;
        }
        .card-practica {
          background: rgba(197,160,89,0.1);
          padding: 15px;
          border-radius: 16px;
          border: 1px solid rgba(197,160,89,0.2);
        }
        .card-practica label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #c5a059;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .card-practica p {
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.5;
        }
        .btn-another {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 15px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-another:hover {
          background: rgba(255,255,255,0.1);
        }
        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          color: #c5a059;
        }
      `}</style>
        </div>
    );
}
