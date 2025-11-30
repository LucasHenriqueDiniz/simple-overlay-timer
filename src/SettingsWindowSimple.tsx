import { useEffect } from 'react';
import { useConfig } from './hooks/useConfig';

function SettingsWindowSimple() {
  const { config, loading } = useConfig();

  useEffect(() => {
    console.log('SettingsWindowSimple mounted');
    console.log('Loading:', loading);
    console.log('Config:', config);
  }, [loading, config]);

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh', 
      padding: '20px',
      width: '100%',
      height: '100%',
      color: '#000000'
    }}>
      <h1 style={{ color: '#000000', marginBottom: '20px' }}>Configurações - Overlay Timer</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <p>Configuração carregada!</p>
          <p>Número de ícones: {config.icons.length}</p>
          <div>
            <h2>Ícones:</h2>
            {config.icons.map((icon) => (
              <div key={icon.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                <p><strong>Nome:</strong> {icon.iconName || 'Custom'}</p>
                <p><strong>Keybind:</strong> {icon.keybind}</p>
                <p><strong>Timer:</strong> {icon.timerDuration}s</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsWindowSimple;


