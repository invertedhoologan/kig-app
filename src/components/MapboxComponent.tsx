'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapPin as MapPinType } from '@/types'

interface MapboxComponentProps {
  pins: MapPinType[]
  onPinClick: (pin: MapPinType) => void
  selectedPin: MapPinType | null
  className?: string
}

export default function MapboxComponent({ pins, onPinClick, selectedPin, className = '' }: MapboxComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [mapLoaded, setMapLoaded] = useState(false)

  // Knysna coordinates
  const KNYSNA_CENTER: [number, number] = [23.0474, -34.0373]

  useEffect(() => {
    // Check if Mapbox token is available
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token || token === 'your_mapbox_access_token_here') {
      console.warn('Mapbox access token not configured - showing fallback map')
      return
    }

    if (map.current) return // Initialize map only once

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: KNYSNA_CENTER,
      zoom: 13,
      attributionControl: false,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
      
      // Add navigation controls
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Add geolocate control
      map.current!.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      )
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current.clear()

    // Add new markers
    pins.forEach(pin => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.transition = 'all 0.2s'

      // Color based on status
      switch (pin.status) {
        case 'open':
          el.style.backgroundColor = '#ef4444' // red
          break
        case 'inProgress':
          el.style.backgroundColor = '#f59e0b' // yellow
          break
        case 'resolved':
          el.style.backgroundColor = '#10b981' // green
          break
        default:
          el.style.backgroundColor = '#6b7280' // gray
      }

      // Priority styling
      if (pin.priority === 'critical' || pin.priority === 'high') {
        el.style.transform = 'scale(1.2)'
        el.style.zIndex = '1000'
      }

      // Selected state
      if (selectedPin?.id === pin.id) {
        el.style.transform = 'scale(1.4)'
        el.style.zIndex = '1001'
        el.style.border = '4px solid #2563eb'
      }

      el.addEventListener('click', () => onPinClick(pin))

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!)

      markers.current.set(pin.id, marker)
    })
  }, [pins, selectedPin, onPinClick, mapLoaded])

  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedPin) return

    // Center map on selected pin
    map.current.flyTo({
      center: [selectedPin.longitude, selectedPin.latitude],
      zoom: 16,
      duration: 1000
    })
  }, [selectedPin, mapLoaded])

  // Fallback component when Mapbox is not configured
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
    return (
      <div className={`relative w-full h-full bg-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-600 font-medium">Interactive Map</p>
            <p className="text-sm text-gray-500 mt-1">Configure Mapbox token to enable</p>
            <p className="text-xs text-gray-400 mt-2">{pins.length} issues available</p>
          </div>
        </div>

        {/* Mock pins for fallback */}
        <div className="absolute inset-0 p-8">
          {pins.slice(0, 5).map((pin, index) => (
            <button
              key={pin.id}
              onClick={() => onPinClick(pin)}
              className={`absolute p-2 rounded-full shadow-lg transition-transform hover:scale-110 ${
                selectedPin?.id === pin.id ? 'scale-125 ring-4 ring-blue-500' : ''
              } ${
                pin.status === 'open' ? 'bg-red-500' :
                pin.status === 'inProgress' ? 'bg-yellow-500' :
                pin.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
              }`}
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`,
              }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className={`w-full h-full ${className}`} />
}
