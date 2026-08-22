import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../styles/map.css';

// Fix standard Leaflet default icon issues in bundlers
const createCustomMarker = (status, severity, category) => {
  let color = '#d97706'; // amber for Pending
  if (status === 'Resolved') color = '#059669'; // emerald
  else if (status === 'In Progress') color = '#2563eb'; // blue
  else if (severity === 'High') color = '#dc2626'; // red

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const DEFAULT_CENTER = [19.0760, 72.8777]; // Mumbai (BMC) default coordinates

export const MapView = ({ issues = [], onMarkerClick }) => {
  return (
    <div className="w-full h-[550px] rounded-xl overflow-hidden shadow-card border border-gov-border bg-white relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.map((issue) => {
          if (
            !issue.location ||
            !Array.isArray(issue.location.coordinates) ||
            issue.location.coordinates.length < 2
          ) {
            return null;
          }

          const [lng, lat] = issue.location.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number') {
            return null;
          }

          const customIcon = createCustomMarker(issue.status, issue.severity, issue.category);

          return (
            <Marker key={issue._id || issue.id} position={[lat, lng]} icon={customIcon}>
              <Popup className="custom-map-popup">
                <div className="p-3 max-w-[220px] font-sans">
                  {issue.imageUrl && (
                    <img
                      src={issue.imageUrl}
                      alt={issue.category}
                      className="w-full h-24 object-cover rounded-md mb-2 bg-gov-surface border border-gov-border"
                    />
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-xs text-gov-navy uppercase tracking-wider">{issue.category}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gov-text-body line-clamp-2 mb-2 font-medium">
                    {issue.description}
                  </p>
                  <button
                    onClick={() => onMarkerClick && onMarkerClick(issue)}
                    className="w-full text-center text-xs bg-gov-navy hover:bg-gov-navy/90 text-white font-bold py-1.5 px-2 rounded transition-colors cursor-pointer"
                  >
                    View Details & Update
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;

