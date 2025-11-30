import { useState, useEffect, useRef } from 'react';
import { Card, Text, Button, Group, Select, Stack, Radio, NumberInput } from '@mantine/core';
import { AppConfig } from '../types/config';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useMonitors } from '../hooks/useMonitors';
import * as Icons from 'lucide-react';

// CSS para animação fade out
if (typeof document !== 'undefined' && !document.getElementById('fade-out-style')) {
  const style = document.createElement('style');
  style.id = 'fade-out-style';
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 0.6; }
      50% { opacity: 0.6; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

interface OverlayPositionEditorProps {
  config: AppConfig;
  onPositionChange: (x: number, y: number, corner?: string) => void;
  onMonitorChange?: (monitorIndex: number) => void;
}

export function OverlayPositionEditor({ config, onPositionChange, onMonitorChange }: OverlayPositionEditorProps) {
  const { monitors, loading: monitorsLoading } = useMonitors();
  const [selectedMonitorIndex, setSelectedMonitorIndex] = useState(config.overlayMonitor ?? 0);
  const [positionMode, setPositionMode] = useState<'preset' | 'custom'>(config.overlayCorner ? 'preset' : 'custom');
  const [customX, setCustomX] = useState(config.overlayPosition.x);
  const [customY, setCustomY] = useState(config.overlayPosition.y);
  const [isDragging, setIsDragging] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: config.overlayPosition.x, y: config.overlayPosition.y });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayPreviewRef = useRef<HTMLDivElement>(null);

  const getOverlaySize = () => {
    const iconSize = config.compactMode ? 60 : 80;
    const gap = 8;
    const iconCount = config.icons.length || 1;
    const padding = 4;
    const strokeWidth = config.overlayStrokeWidth ?? 0;

    if (config.overlayOrientation === 'vertical') {
      return {
        width: iconSize + padding * 2 + strokeWidth * 2,
        height: iconCount * iconSize + (iconCount > 0 ? (iconCount - 1) * gap : 0) + padding * 2 + strokeWidth * 2
      };
    } else {
      return {
        width: iconCount * iconSize + (iconCount > 0 ? (iconCount - 1) * gap : 0) + padding * 2 + strokeWidth * 2,
        height: iconSize + padding * 2 + strokeWidth * 2
      };
    }
  };

  const selectedMonitor = monitors[selectedMonitorIndex] || monitors[0];

  useEffect(() => {
    if (selectedMonitor && positionMode === 'custom') {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const scaleX = rect.width / selectedMonitor.size.width;
        const scaleY = rect.height / selectedMonitor.size.height;
        setPreviewPosition({
          x: customX * scaleX,
          y: customY * scaleY
        });
      }
    }
  }, [positionMode, selectedMonitorIndex, selectedMonitor, customX, customY]);

  useEffect(() => {
    if (selectedMonitor && positionMode === 'preset' && config.overlayCorner) {
      const overlaySize = getOverlaySize();
      const margin = 20;
      let relativeX = 0;
      let relativeY = 0;
      
      switch (config.overlayCorner) {
        case 'top-left':
          relativeX = margin;
          relativeY = margin;
          break;
        case 'top-right':
          relativeX = selectedMonitor.size.width - overlaySize.width - margin;
          relativeY = margin;
          break;
        case 'bottom-left':
          relativeX = margin;
          relativeY = selectedMonitor.size.height - overlaySize.height - margin;
          break;
        case 'bottom-right':
          relativeX = selectedMonitor.size.width - overlaySize.width - margin;
          relativeY = selectedMonitor.size.height - overlaySize.height - margin;
          break;
        case 'top-center':
          relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
          relativeY = margin;
          break;
        case 'bottom-center':
          relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
          relativeY = selectedMonitor.size.height - overlaySize.height - margin;
          break;
        case 'left-center':
          relativeX = margin;
          relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
          break;
        case 'right-center':
          relativeX = selectedMonitor.size.width - overlaySize.width - margin;
          relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
          break;
        case 'center':
          relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
          relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
          break;
      }
      
      applyPosition(relativeX, relativeY);
      onPositionChange(relativeX, relativeY, config.overlayCorner);
    }
  }, [selectedMonitorIndex, positionMode, config.overlayCorner, config.overlayOrientation, config.icons.length, config.compactMode, selectedMonitor]);

  const applyPosition = async (relativeX: number, relativeY: number) => {
    if (!selectedMonitor) return;

    try {
      let overlayWindow;
      try {
        overlayWindow = await WebviewWindow.getByLabel('overlay');
      } catch (err) {
        // Se não existir/erro, fallback para current window (caso o overlay seja a mesma webview)
        overlayWindow = await getCurrentWindow();
      }
      if (!overlayWindow) return;

      const overlaySz = getOverlaySize();
      const maxX = selectedMonitor.size.width - overlaySz.width;
      const maxY = selectedMonitor.size.height - overlaySz.height;
      const clampedX = Math.max(0, Math.min(relativeX, maxX));
      const clampedY = Math.max(0, Math.min(relativeY, maxY));
      const absoluteX = Math.round(selectedMonitor.position.x + clampedX);
      const absoluteY = Math.round(selectedMonitor.position.y + clampedY);

      // 1) Ajustar tamanho físico primeiro (evita efeitos estranhos)
      await overlayWindow.setSize(new PhysicalSize(overlaySz.width, overlaySz.height));

      // 2) Posicionar
      await overlayWindow.setPosition(new PhysicalPosition(absoluteX, absoluteY));

      // 3) Confirmar e aplicar no state local (sem salvar config ainda)
      setCustomX(clampedX);
      setCustomY(clampedY);

      // 4) Emitir evento position-changed ANTES de salvar config
      // Isso permite que o OverlayWindow ignore reposicionamentos manuais
      try {
        await invoke('emit_position_changed');
        console.log(`[POSITION] Position-changed event emitted`);
      } catch (err) {
        console.warn('[POSITION] Failed to emit position-changed event:', err);
      }

      // Isso evita recarregar tudo e re-registrar atalhos
      try {
        await invoke('save_config_silent', { 
          config: JSON.stringify({
            ...config,
            overlayPosition: { x: clampedX, y: clampedY }
          })
        });
        console.log(`[POSITION] Config saved silently (no config-changed event)`);
      } catch (err) {
        console.warn('[POSITION] Failed to save config silently:', err);
      }

      console.log(`[POSITION] Applied -> monitor=${selectedMonitorIndex} (${selectedMonitor.name}), ` +
        `absolute=(${absoluteX},${absoluteY}), relative=(${clampedX},${clampedY})`);
    } catch (error) {
      console.error('[POSITION] Failed to set overlay position, attempting retry...', error);

      try {
        await new Promise(res => setTimeout(res, 120));
        
        const overlayWindowRetry = await WebviewWindow.getByLabel('overlay').catch(() => getCurrentWindow());
        if (overlayWindowRetry) {
          const overlaySz = getOverlaySize();
          const maxX = selectedMonitor.size.width - overlaySz.width;
          const maxY = selectedMonitor.size.height - overlaySz.height;
          const clampedX = Math.max(0, Math.min(relativeX, maxX));
          const clampedY = Math.max(0, Math.min(relativeY, maxY));
          
          await overlayWindowRetry.setSize(new PhysicalSize(overlaySz.width, overlaySz.height));
          const absoluteX = Math.round(selectedMonitor.position.x + clampedX);
          const absoluteY = Math.round(selectedMonitor.position.y + clampedY);
          await overlayWindowRetry.setPosition(new PhysicalPosition(absoluteX, absoluteY));
          
          setCustomX(clampedX);
          setCustomY(clampedY);

          try {
            await invoke('emit_position_changed');
          } catch (e) {
            console.error('[POSITION] Failed to emit position-changed event on retry:', e);
          }

          try {
            await invoke('save_config_silent', { 
              config: JSON.stringify({
                ...config,
                overlayPosition: { x: clampedX, y: clampedY }
              })
            });
          } catch (e) {
            console.warn('[POSITION] Failed to save config silently on retry:', e);
          }

          console.log('[POSITION] Retry succeeded');
        }
      } catch (err2) {
        console.error('[POSITION] Retry also failed:', err2);
      }
    }
  };

  const handleMonitorChange = async (monitorIndex: number) => {
    const newMonitor = monitors[monitorIndex] || monitors[0];
    if (!newMonitor) {
      console.error(`[POSITION] Monitor ${monitorIndex} not found`);
      return;
    }

    console.log(`[POSITION] Request change to monitor ${monitorIndex}: ${newMonitor.name}, ` +
      `pos=(${newMonitor.position.x}, ${newMonitor.position.y}), ` +
      `size=${newMonitor.size.width}x${newMonitor.size.height}`);

    setSelectedMonitorIndex(monitorIndex);

    if (onMonitorChange) {
      onMonitorChange(monitorIndex);
    }
    const overlaySize = getOverlaySize();
    const margin = 20;
    let relativeX: number;
    let relativeY: number;

    if (positionMode === 'preset' && config.overlayCorner) {
      switch (config.overlayCorner) {
        case 'top-left':
          relativeX = margin;
          relativeY = margin;
          break;
        case 'top-right':
          relativeX = newMonitor.size.width - overlaySize.width - margin;
          relativeY = margin;
          break;
        case 'bottom-left':
          relativeX = margin;
          relativeY = newMonitor.size.height - overlaySize.height - margin;
          break;
        case 'bottom-right':
          relativeX = newMonitor.size.width - overlaySize.width - margin;
          relativeY = newMonitor.size.height - overlaySize.height - margin;
          break;
        case 'top-center':
          relativeX = (newMonitor.size.width - overlaySize.width) / 2;
          relativeY = margin;
          break;
        case 'bottom-center':
          relativeX = (newMonitor.size.width - overlaySize.width) / 2;
          relativeY = newMonitor.size.height - overlaySize.height - margin;
          break;
        case 'left-center':
          relativeX = margin;
          relativeY = (newMonitor.size.height - overlaySize.height) / 2;
          break;
        case 'right-center':
          relativeX = newMonitor.size.width - overlaySize.width - margin;
          relativeY = (newMonitor.size.height - overlaySize.height) / 2;
          break;
        case 'center':
          relativeX = (newMonitor.size.width - overlaySize.width) / 2;
          relativeY = (newMonitor.size.height - overlaySize.height) / 2;
          break;
        default:
          relativeX = newMonitor.size.width - overlaySize.width - margin;
          relativeY = margin;
      }
    } else {
      const maxX = newMonitor.size.width - overlaySize.width;
      const maxY = newMonitor.size.height - overlaySize.height;
      const adjustedX = Math.max(0, Math.min(customX, maxX));
      const adjustedY = Math.max(0, Math.min(customY, maxY));
      relativeX = adjustedX;
      relativeY = adjustedY;

      setCustomX(adjustedX);
      setCustomY(adjustedY);
    }

    onPositionChange(relativeX, relativeY, config.overlayCorner);

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const scaleX = rect.width / newMonitor.size.width;
      const scaleY = rect.height / newMonitor.size.height;
      setPreviewPosition({
        x: relativeX * scaleX,
        y: relativeY * scaleY
      });
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const currentMonitor = monitors[monitorIndex] || monitors[0];
    if (!currentMonitor) {
      console.error(`[POSITION] Monitor ${monitorIndex} not found after delay`);
      return;
    }
    
    console.log(`[POSITION] Applying position on monitor ${monitorIndex}: relative=(${relativeX},${relativeY})`);
    console.log(`[POSITION] Current monitor: ${currentMonitor.name}, pos=(${currentMonitor.position.x},${currentMonitor.position.y})`);
    
    const overlaySz = getOverlaySize();
    const maxX = currentMonitor.size.width - overlaySz.width;
    const maxY = currentMonitor.size.height - overlaySz.height;
    const finalX = Math.max(0, Math.min(relativeX, maxX));
    const finalY = Math.max(0, Math.min(relativeY, maxY));
    const absX = Math.round(currentMonitor.position.x + finalX);
    const absY = Math.round(currentMonitor.position.y + finalY);
    
    try {
      const overlayWindow = await WebviewWindow.getByLabel('overlay').catch(() => getCurrentWindow());
      if (overlayWindow) {
        await overlayWindow.setSize(new PhysicalSize(overlaySz.width, overlaySz.height));
        await overlayWindow.setPosition(new PhysicalPosition(absX, absY));
        console.log(`[POSITION] Directly applied: monitor=${monitorIndex}, absolute=(${absX},${absY}), relative=(${finalX},${finalY})`);
        
        // Emitir evento position-changed (separado de config-changed)
        try {
          await invoke('emit_position_changed');
        } catch (e) {
          console.error('[POSITION] Failed to emit position-changed event on direct apply:', e);
        }

        // Salvar config silenciosamente para não disparar reload completo
        const newConfig = {
          ...config,
          overlayPosition: { x: finalX, y: finalY },
          overlayCorner: positionMode === 'preset' ? config.overlayCorner : undefined, // Manter corner se for preset
          overlayMonitor: monitorIndex
        };
        await invoke('save_config_silent', { config: JSON.stringify(newConfig) });
      }
    } catch (err) {
      console.error('[POSITION] Failed to apply position directly:', err);
      // Fallback para applyPosition
      await applyPosition(relativeX, relativeY);
    }
  };

  const handleCornerClick = async (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'center') => {
    if (!selectedMonitor) return;
    
    const overlaySize = getOverlaySize();
    const margin = 20;
    
    let relativeX = 0;
    let relativeY = 0;
    
    switch (corner) {
      case 'top-left':
        relativeX = margin;
        relativeY = margin;
        break;
      case 'top-right':
        relativeX = selectedMonitor.size.width - overlaySize.width - margin;
        relativeY = margin;
        break;
      case 'bottom-left':
        relativeX = margin;
        relativeY = selectedMonitor.size.height - overlaySize.height - margin;
        break;
      case 'bottom-right':
        relativeX = selectedMonitor.size.width - overlaySize.width - margin;
        relativeY = selectedMonitor.size.height - overlaySize.height - margin;
        break;
      case 'top-center':
        relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
        relativeY = margin;
        break;
      case 'bottom-center':
        relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
        relativeY = selectedMonitor.size.height - overlaySize.height - margin;
        break;
      case 'left-center':
        relativeX = margin;
        relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
        break;
      case 'right-center':
        relativeX = selectedMonitor.size.width - overlaySize.width - margin;
        relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
        break;
      case 'center':
        relativeX = (selectedMonitor.size.width - overlaySize.width) / 2;
        relativeY = (selectedMonitor.size.height - overlaySize.height) / 2;
        break;
    }
    
    await applyPosition(relativeX, relativeY);
    onPositionChange(relativeX, relativeY, corner);
  };

  const handleCustomPositionApply = async () => {
    await applyPosition(customX, customY);
    onPositionChange(customX, customY, undefined);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || positionMode !== 'custom') return;
    setIsDragging(true);
    const container = containerRef.current;
    const preview = overlayPreviewRef.current;
    
    if (container && preview) {
      const previewRect = preview.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - previewRect.left,
        y: e.clientY - previewRect.top
      };
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !selectedMonitor || positionMode !== 'custom') return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const overlaySize = getOverlaySize();
    
    const scaleX = rect.width / selectedMonitor.size.width;
    const scaleY = rect.height / selectedMonitor.size.height;
    const scaledOverlayWidth = overlaySize.width * scaleX;
    const scaledOverlayHeight = overlaySize.height * scaleY;
    
    const newX = e.clientX - rect.left - dragStartPos.current.x;
    const newY = e.clientY - rect.top - dragStartPos.current.y;
    
    const maxX = rect.width - scaledOverlayWidth;
    const maxY = rect.height - scaledOverlayHeight;
    
    setPreviewPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = async () => {
    if (!isDragging || !selectedMonitor || positionMode !== 'custom') return;
    setIsDragging(false);
    
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      
      const scaleX = selectedMonitor.size.width / rect.width;
      const scaleY = selectedMonitor.size.height / rect.height;
      
      const relativeX = Math.round(previewPosition.x * scaleX);
      const relativeY = Math.round(previewPosition.y * scaleY);
      
      setCustomX(relativeX);
      setCustomY(relativeY);
      await applyPosition(relativeX, relativeY);
      onPositionChange(relativeX, relativeY, undefined);
    }
  };

  useEffect(() => {
    if (isDragging && positionMode === 'custom') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, previewPosition, selectedMonitor, positionMode]);

  if (monitorsLoading || !selectedMonitor) {
    return <Text>Loading monitors...</Text>;
  }

  return (
    <Card withBorder p="md" mb="md">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">Monitor</Text>
          <Select
            value={selectedMonitorIndex.toString()}
            onChange={(value) => {
              const index = parseInt(value || '0');
              handleMonitorChange(index);
            }}
            data={monitors.map((monitor, index) => ({
              value: index.toString(),
              label: `${monitor.name}${monitor.isPrimary ? ' (Primary)' : ''} - ${monitor.size.width}x${monitor.size.height}`
            }))}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">Position Type</Text>
          <Radio.Group
            value={positionMode}
            onChange={(value) => setPositionMode(value as 'preset' | 'custom')}
          >
            <Stack gap="xs" mt="xs">
              <Radio value="preset" label="Preset Position (Corners)" />
              <Radio value="custom" label="Custom Position" />
            </Stack>
          </Radio.Group>
        </div>

        {positionMode === 'preset' ? (
          <div>
            <Text size="sm" fw={500} mb="md">Choose Position</Text>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                height: selectedMonitor 
                  ? `${(400 * selectedMonitor.size.height) / selectedMonitor.size.width}px`
                  : '400px',
                maxHeight: '600px',
                border: '2px dashed #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                overflow: 'hidden',
                marginBottom: '12px'
              }}
            >
              {/* Ícones de posição clicáveis */}
              {[
                { corner: 'top-left' as const, icon: Icons.CornerUpLeft, x: 20, y: 20 },
                { corner: 'top-center' as const, icon: Icons.ArrowUp, x: 'calc(50% - 20px)', y: 20 },
                { corner: 'top-right' as const, icon: Icons.CornerUpRight, x: 'calc(100% - 40px)', y: 20 },
                { corner: 'left-center' as const, icon: Icons.ArrowLeft, x: 20, y: 'calc(50% - 20px)' },
                { corner: 'center' as const, icon: Icons.Move, x: 'calc(50% - 20px)', y: 'calc(50% - 20px)' },
                { corner: 'right-center' as const, icon: Icons.ArrowRight, x: 'calc(100% - 40px)', y: 'calc(50% - 20px)' },
                { corner: 'bottom-left' as const, icon: Icons.CornerDownLeft, x: 20, y: 'calc(100% - 40px)' },
                { corner: 'bottom-center' as const, icon: Icons.ArrowDown, x: 'calc(50% - 20px)', y: 'calc(100% - 40px)' },
                { corner: 'bottom-right' as const, icon: Icons.CornerDownRight, x: 'calc(100% - 40px)', y: 'calc(100% - 40px)' }
              ].map(({ corner, icon: IconComponent, x, y }) => {
                const overlaySize = getOverlaySize();
                const margin = 20;
                let previewX = 0;
                let previewY = 0;
                
                switch (corner) {
                  case 'top-left':
                    previewX = margin;
                    previewY = margin;
                    break;
                  case 'top-center':
                    previewX = (selectedMonitor.size.width - overlaySize.width) / 2;
                    previewY = margin;
                    break;
                  case 'top-right':
                    previewX = selectedMonitor.size.width - overlaySize.width - margin;
                    previewY = margin;
                    break;
                  case 'left-center':
                    previewX = margin;
                    previewY = (selectedMonitor.size.height - overlaySize.height) / 2;
                    break;
                  case 'center':
                    previewX = (selectedMonitor.size.width - overlaySize.width) / 2;
                    previewY = (selectedMonitor.size.height - overlaySize.height) / 2;
                    break;
                  case 'right-center':
                    previewX = selectedMonitor.size.width - overlaySize.width - margin;
                    previewY = (selectedMonitor.size.height - overlaySize.height) / 2;
                    break;
                  case 'bottom-left':
                    previewX = margin;
                    previewY = selectedMonitor.size.height - overlaySize.height - margin;
                    break;
                  case 'bottom-center':
                    previewX = (selectedMonitor.size.width - overlaySize.width) / 2;
                    previewY = selectedMonitor.size.height - overlaySize.height - margin;
                    break;
                  case 'bottom-right':
                    previewX = selectedMonitor.size.width - overlaySize.width - margin;
                    previewY = selectedMonitor.size.height - overlaySize.height - margin;
                    break;
                }
                
                const container = containerRef.current;
                let scaledX = previewX;
                let scaledY = previewY;
                if (container) {
                  const rect = container.getBoundingClientRect();
                  const scaleX = rect.width / selectedMonitor.size.width;
                  const scaleY = rect.height / selectedMonitor.size.height;
                  scaledX = previewX * scaleX;
                  scaledY = previewY * scaleY;
                }
                
                return (
                  <div key={corner}>
                    {/* Preview do overlay na posição */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${scaledX}px`,
                        top: `${scaledY}px`,
                        width: `${overlaySize.width * (containerRef.current ? containerRef.current.getBoundingClientRect().width / selectedMonitor.size.width : 1)}px`,
                        height: `${overlaySize.height * (containerRef.current ? containerRef.current.getBoundingClientRect().height / selectedMonitor.size.height : 1)}px`,
                        display: 'flex',
                        flexDirection: config.overlayOrientation === 'vertical' ? 'column' : 'row',
                        gap: '4px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        border: '1px dashed #2196F3',
                        borderRadius: '4px',
                        padding: '2px',
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Botão de posição */}
                    <button
                      onClick={() => handleCornerClick(corner)}
                      style={{
                        position: 'absolute',
                        left: typeof x === 'string' ? x : `${x}px`,
                        top: typeof y === 'string' ? y : `${y}px`,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(33, 150, 243, 0.9)',
                        border: '2px solid #2196F3',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 1)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <IconComponent size={20} color="white" />
                    </button>
                  </div>
                );
              })}
              
              {/* Texto "Monitor X" com fade out */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#666',
                  opacity: 0.6,
                  pointerEvents: 'none',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                  animation: 'fadeOut 3s ease-out forwards'
                }}
              >
                Monitor {selectedMonitorIndex + 1}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Text size="sm" fw={500} mb="xs">Custom Position</Text>
            <Text size="xs" c="dimmed" mb="md">
              Drag the overlay in the preview below to set its position on the selected monitor
            </Text>
            
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                // Calcular altura mantendo aspect ratio do monitor (suporta widescreen)
                height: selectedMonitor 
                  ? `${(400 * selectedMonitor.size.height) / selectedMonitor.size.width}px`
                  : '400px',
                maxHeight: '600px',
                border: '2px dashed #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                overflow: 'hidden',
                marginBottom: '12px'
              }}
            >
              <div
                ref={overlayPreviewRef}
                style={{
                  position: 'absolute',
                  left: `${previewPosition.x}px`,
                  top: `${previewPosition.y}px`,
                  width: `${(getOverlaySize().width * (containerRef.current ? containerRef.current.getBoundingClientRect().width / selectedMonitor.size.width : 1))}px`,
                  height: `${(getOverlaySize().height * (containerRef.current ? containerRef.current.getBoundingClientRect().height / selectedMonitor.size.height : 1))}px`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  flexDirection: config.overlayOrientation === 'vertical' ? 'column' : 'row',
                  gap: '4px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(33, 150, 243, 0.15)',
                  border: '2px solid #2196F3',
                  borderRadius: '8px',
                  transition: isDragging ? 'none' : 'all 0.2s',
                  userSelect: 'none',
                  padding: '2px'
                }}
                onMouseDown={handleMouseDown}
              >
                {config.icons.length > 0 ? (
                  config.icons.map((icon) => {
                    const IconComponent = icon.iconName && (Icons as any)[icon.iconName]
                      ? (Icons as any)[icon.iconName]
                      : Icons.Timer;
                    return (
                      <div
                        key={icon.id}
                        style={{
                          width: '12px',
                          height: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(33, 150, 243, 0.3)',
                          borderRadius: '2px'
                        }}
                      >
                        <IconComponent size={10} color="#2196F3" />
                      </div>
                    );
                  })
                ) : (
                  <Icons.Timer size={16} color="#2196F3" />
                )}
              </div>
              
              {/* Texto "Monitor X" com fade out */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#666',
                  opacity: 0.6,
                  pointerEvents: 'none',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                  animation: 'fadeOut 3s ease-out forwards'
                }}
              >
                Monitor {selectedMonitorIndex + 1}
              </div>
            </div>
            
            <Group gap="md" align="flex-end">
              <NumberInput
                label="X (pixels)"
                value={customX}
                onChange={(value) => {
                  const newX = typeof value === 'number' ? value : 0;
                  setCustomX(newX);
                  // Atualizar preview
                  const container = containerRef.current;
                  if (container && selectedMonitor) {
                    const rect = container.getBoundingClientRect();
                    const scaleX = rect.width / selectedMonitor.size.width;
                    setPreviewPosition(prev => ({ ...prev, x: newX * scaleX }));
                  }
                }}
                min={0}
                max={selectedMonitor.size.width - getOverlaySize().width}
                style={{ flex: 1 }}
              />
              <NumberInput
                label="Y (pixels)"
                value={customY}
                onChange={(value) => {
                  const newY = typeof value === 'number' ? value : 0;
                  setCustomY(newY);
                  // Atualizar preview
                  const container = containerRef.current;
                  if (container && selectedMonitor) {
                    const rect = container.getBoundingClientRect();
                    const scaleY = rect.height / selectedMonitor.size.height;
                    setPreviewPosition(prev => ({ ...prev, y: newY * scaleY }));
                  }
                }}
                min={0}
                max={selectedMonitor.size.height - getOverlaySize().height}
                style={{ flex: 1 }}
              />
              <Button onClick={handleCustomPositionApply}>Apply</Button>
            </Group>
            <Text size="xs" c="dimmed" mt="xs" ta="center">
              Position on monitor: X={customX}px, Y={customY}px
            </Text>
          </div>
        )}
      </Stack>
    </Card>
  );
}
