import { useEffect, useRef } from 'react'

/** Postos / hemocentros da RMSP (coordenadas aproximadas) */
const LOCAIS = [
 {
    nome: 'Fundação Pró-Sangue (Barueri)',
    endereco: 'R. Guilhermina Carril Loureiro, 144 – Centro, Barueri – SP',
    lat: -23.5107,
    lng: -46.8761,
  },
  {
    nome: 'Fundação Pró-Sangue (Osasco – Hospital Regional)',
    endereco: 'R. Ari Barroso, 355 – Pres. Altino, Osasco – SP',
    lat: -23.5329,
    lng: -46.7795,
  },
  {
    nome: 'Fundação Pró-Sangue (Hospital das Clínicas – SP)',
    endereco: 'Av. Dr. Enéas Carvalho de Aguiar, 155, 1º andar – Cerqueira César, São Paulo – SP',
    lat: -23.5575,
    lng: -46.6689,
  },
  {
    nome: 'COLSAN (Santo André)',
    endereco: 'Rua Dr. Henrique Calderazzo, 321 – Paraíso, Santo André – SP',
    lat: -23.6638,
    lng: -46.5305,
  },
  {
    nome: 'COLSAN (São Bernardo – Hospital Estadual Mário Covas)',
    endereco: 'Rua Pedro Jacobucci, 440 – Vila Euclides, São Bernardo do Campo – SP',
    lat: -23.6995,
    lng: -46.5548,
  },
  {
    nome: 'COLSAN (São Caetano do Sul)',
    endereco: 'Av. Vital Brasil Filho, 300 – Osvaldo Cruz, São Caetano do Sul – SP',
    lat: -23.6229,
    lng: -46.5552,
  },
  {
    nome: 'COLSAN (Mauá)',
    endereco: 'Rua Luís Lacava, 229 – Vila Bocaina, Mauá – SP',
    lat: -23.6677,
    lng: -46.4613,
  },
  {
    nome: 'COLSAN (Jundiaí)',
    endereco: 'Rua XV de Novembro, 1848 – Vila Municipal, Jundiaí – SP',
    lat: -23.1864,
    lng: -46.8842,
  },
  {
    nome: 'COLSAN (SP – Hospital Municipal Dr. Carmino Caricchio)',
    endereco: 'Av. Celso Garcia, 4815 – Tatuapé, São Paulo – SP',
    lat: -23.5405,
    lng: -46.5465,
  },
  {
    nome: 'COLSAN (SP – Hospital Municipal Alípio Corrêa Netto)',
    endereco: 'Alameda Rodrigo de Brum, 1989 – Vila Paranaguá, São Paulo – SP',
    lat: -23.5195,
    lng: -46.4798,
  },
  {
    nome: 'COLSAN (SP – Hospital do Servidor Público)',
    endereco: 'Rua Castro Alves, 60 – Aclimação, São Paulo – SP',
    lat: -23.5733,
    lng: -46.6386,
  },
  {
    nome: 'Santa Casa de Misericórdia (São Paulo)',
    endereco: 'R. Dr. Cesário Mota Júnior, 112 – Vila Buarque, São Paulo – SP',
    lat: -23.5436,
    lng: -46.6498,
  },
  {
    nome: 'Santa Casa de Misericórdia (Mogi das Cruzes)',
    endereco: 'R. Barão de Jaceguai, 1148 – Centro, Mogi das Cruzes – SP',
    lat: -23.5225,
    lng: -46.1858,
  },
  {
    nome: 'Hemocentro São Lucas (Guarulhos – Centro)',
    endereco: 'Rua Santo Antônio, 95 – Centro, Guarulhos – SP',
    lat: -23.4675,
    lng: -46.5333,
  },
  {
    nome: 'Hemocentro São Lucas (Guarulhos – Hospital Stella Maris)',
    endereco: 'Rua Maria Cândida Pereira, 568 – Vila Itapegica, Guarulhos – SP',
    lat: -23.4552,
    lng: -46.5208,
  },
  {
    nome: 'Hemocentro HSP Unifesp (Diadema – Hospital Geral)',
    endereco: 'Av. José Bonifácio, 1641 – Serraria, Diadema – SP',
    lat: -23.6819,
    lng: -46.6205,
  },
  {
    nome: 'Hemocentro HSP Unifesp (Guarulhos – Hospital Geral)',
    endereco: 'Alameda dos Lírios, 200 – Parque CECAP, Guarulhos – SP',
    lat: -23.4408,
    lng: -46.5285,
  },
  {
    nome: 'Hemocentro HSP Unifesp (Taboão da Serra – Pirajuçara)',
    endereco: 'Av. Ibirama, 1214 – Jardim São Carlos, Taboão da Serra – SP',
    lat: -23.6125,
    lng: -46.7580,
  },
  {
    nome: 'Hemocentro HSP Unifesp (São Paulo)',
    endereco: 'Rua Dr. Diogo de Faria, 824 – Vila Clementino, São Paulo – SP',
    lat: -23.5986,
    lng: -46.6436,
  },
  {
    nome: 'Banco de Sangue de São Paulo (Paraíso)',
    endereco: 'R. Dr. Tomás Carvalhal, 711 – Paraíso, São Paulo – SP',
    lat: -23.5745,
    lng: -46.6480,
  },
  {
    nome: 'Banco de Sangue Beneficência Portuguesa',
    endereco: 'R. Maestro Cardim, 769 – Bela Vista, São Paulo – SP',
    lat: -23.5689,
    lng: -46.6405,
  },
  {
    nome: 'Banco de Sangue Centhro (Mogi das Cruzes)',
    endereco: 'R. Dona Afife Nassif Jafet, 223 – Vila Industrial, Mogi das Cruzes – SP',
    lat: -23.5238,
    lng: -46.1885,
  },
]

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L)
      return
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const existing = document.getElementById('leaflet-js')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export default function MapaRmsp() {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = L.map(containerRef.current, {
          center: [-23.55, -46.63],
          zoom: 10,
          scrollWheelZoom: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map)

        const icon = L.divIcon({
          className: 'hb-map-pin',
          html: '<span class="hb-map-pin-dot"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })

        LOCAIS.forEach((local) => {
          const marker = L.marker([local.lat, local.lng], { icon }).addTo(map)
          marker.bindTooltip(
            `<strong>${local.nome}</strong><br/><span style="opacity:.85">${local.endereco}</span>`,
            {
              direction: 'top',
              offset: [0, -8],
              opacity: 1,
              className: 'hb-map-tooltip',
            }
          )
        })

        const bounds = L.latLngBounds(LOCAIS.map((l) => [l.lat, l.lng]))
        map.fitBounds(bounds.pad(0.18))
        mapRef.current = map
      })
      .catch(() => {
        /* CDN bloqueado / sem internet */
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="mapa-rmsp-wrap">
      <div className="mapa-rmsp-header">
        <h3>
          <span className="i i-pin" /> Mapa da RMSP — locais de coleta
        </h3>
        <p>Passe o mouse sobre os pinos para ver o nome do hospital / hemocentro.</p>
      </div>
      <div
        ref={containerRef}
        className="mapa-rmsp"
        role="img"
        aria-label="Mapa da Região Metropolitana de São Paulo"
      >
        <div className="mapa-rmsp-fallback">Carregando mapa…</div>
      </div>
      <ul className="mapa-rmsp-legend">
        {LOCAIS.map((l) => (
          <li key={l.nome}>
            <span className="legend-dot" />
            {l.nome}
          </li>
        ))}
      </ul>
    </div>
  )
}
