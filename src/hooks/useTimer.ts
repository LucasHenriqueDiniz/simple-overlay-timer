import { useState, useEffect, useRef, useCallback } from 'react';
import { timerLogger } from '../utils/logger';

export interface TimerState {
  running: boolean;
  remaining: number;
  startTime: number | null;
  duration: number;
  isInInterval?: boolean;
  repeatCount?: number;
}

export interface RepeatConfig {
  enabled: boolean;
  times?: number;
  interval?: number;
  intervalColor?: string;
  intervalNotification?: boolean;
}

interface TimerCallbacks {
  onTimerComplete?: (info: { repeatCount: number }) => void;
  onIntervalComplete?: (info: { repeatCount: number }) => void;
  onFinalComplete?: (info: { repeatCount: number }) => void;
}

export function useTimer(
  initialDuration: number,
  repeatConfig?: RepeatConfig,
  timerType: 'countdown' | 'stopwatch' = 'countdown',
  callbacks?: TimerCallbacks
) {
  const timerId = useRef<string>(`timer-${Date.now()}-${Math.random()}`);
  const repeatCountRef = useRef<number>(0);
  const intervalTimeoutRef = useRef<number | null>(null);
  
  const [state, setState] = useState<TimerState>({
    running: false,
    remaining: timerType === 'stopwatch' ? 0 : initialDuration,
    startTime: null,
    duration: initialDuration,
    isInInterval: false,
    repeatCount: 0
  });

  const intervalRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state; // Sempre manter a referência atualizada
  const callbacksRef = useRef<TimerCallbacks | undefined>(callbacks);
  callbacksRef.current = callbacks;

  // Atualizar duração quando initialDuration mudar
  useEffect(() => {
    if (initialDuration !== state.duration) {
      timerLogger.info(`Timer ${timerId.current} duration updated from config: ${state.duration}s -> ${initialDuration}s`);
      setState(prev => ({
        ...prev,
        duration: initialDuration,
        remaining: prev.running ? prev.remaining : (timerType === 'stopwatch' ? 0 : initialDuration)
      }));
    }
  }, [initialDuration, timerType]);

  useEffect(() => {
    if (state.isInInterval && repeatConfig?.interval && state.startTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      intervalRef.current = window.setInterval(() => {
        const currentState = stateRef.current;
        if (!currentState.isInInterval || !currentState.startTime) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        
        const elapsed = Math.floor((Date.now() - currentState.startTime!) / 1000);
        const intervalRemaining = Math.max(0, repeatConfig.interval! - elapsed);
        
        setState(prev => ({
          ...prev,
          remaining: intervalRemaining,
          repeatCount: repeatCountRef.current
        }));
        
        if (intervalRemaining === 0) {
          timerLogger.info(`Timer ${timerId.current} interval completed, restarting...`);
          repeatCountRef.current += 1;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setState(prev => ({
            ...prev,
            isInInterval: false,
            remaining: prev.duration,
            running: true,
            startTime: Date.now()
          }));
        }
      }, 100);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    
    if (state.running && state.startTime && !state.isInInterval) {
      timerLogger.info(`Timer ${timerId.current} started, duration: ${state.duration}s`);
      
      // Limpar intervalo anterior se existir
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = window.setInterval(() => {
        const currentState = stateRef.current;
        if (!currentState.running || !currentState.startTime) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        
        const elapsed = Math.floor((Date.now() - currentState.startTime!) / 1000);
        let remaining: number;
        
        if (timerType === 'stopwatch') {
          remaining = elapsed;
        } else {
          remaining = Math.max(0, currentState.duration - elapsed);
        }
        
        // Log a cada 10 segundos ou quando próximo do fim
        setState(prev => ({
          ...prev,
          remaining,
          repeatCount: repeatCountRef.current
        }));

        if (timerType === 'countdown' && remaining === 0) {
          timerLogger.info(`Timer ${timerId.current} completed!`);
          callbacksRef.current?.onTimerComplete?.({ repeatCount: repeatCountRef.current });
          
          const shouldRepeat = repeatConfig?.enabled && 
            (repeatConfig.times === 0 || repeatCountRef.current < (repeatConfig.times || 1));
          
          if (shouldRepeat && repeatConfig.interval && repeatConfig.interval > 0) {
            timerLogger.info(`Timer ${timerId.current} entering interval period of ${repeatConfig.interval}s`);
            const intervalStartTime = Date.now();
            setState(prev => ({
              ...prev,
              running: false,
              startTime: intervalStartTime,
              isInInterval: true,
              remaining: repeatConfig.interval!
            }));
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            intervalRef.current = window.setInterval(() => {
              const currentState = stateRef.current;
              if (!currentState.isInInterval || !currentState.startTime) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                return;
              }
              
              const elapsed = Math.floor((Date.now() - currentState.startTime!) / 1000);
              const intervalRemaining = Math.max(0, repeatConfig.interval! - elapsed);
              
              setState(prev => ({
                ...prev,
                remaining: intervalRemaining,
                repeatCount: repeatCountRef.current
              }));
              
              if (intervalRemaining === 0) {
                timerLogger.info(`Timer ${timerId.current} interval completed, restarting silently...`);
                callbacksRef.current?.onIntervalComplete?.({ repeatCount: repeatCountRef.current });
                repeatCountRef.current += 1;
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                setState(prev => ({
                  ...prev,
                  isInInterval: false,
                  remaining: prev.duration,
                  running: true,
                  startTime: Date.now()
                }));
              }
            }, 100);
          } else if (shouldRepeat) {
            repeatCountRef.current += 1;
            timerLogger.info(`Timer ${timerId.current} restarting immediately (repeat ${repeatCountRef.current})`);
            setTimeout(() => {
              setState(prev => ({
                ...prev,
                running: true,
                startTime: Date.now(),
                remaining: prev.duration,
                isInInterval: false
              }));
            }, 50);
          } else {
            callbacksRef.current?.onFinalComplete?.({ repeatCount: repeatCountRef.current });
            timerLogger.info(`Timer ${timerId.current} final completion (no more repeats)`);
            setState(prev => ({
              ...prev,
              running: false,
              startTime: null,
              isInInterval: false
            }));
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        timerLogger.debug(`Timer ${timerId.current} stopped, clearing interval`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (intervalTimeoutRef.current) {
        clearTimeout(intervalTimeoutRef.current);
        intervalTimeoutRef.current = null;
      }
    };
  }, [state.running, state.startTime, state.duration, state.isInInterval, repeatConfig]);

  const start = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.running) {
      timerLogger.warn(`Timer ${timerId.current} already running, resetting...`);
      repeatCountRef.current = 0;
      setState(prev => ({
        ...prev,
        running: false,
        remaining: timerType === 'stopwatch' ? 0 : prev.duration,
        startTime: null,
        isInInterval: false,
        repeatCount: 0
      }));
      // Aguardar um pouco antes de reiniciar
      setTimeout(() => {
        const startTime = Date.now();
        timerLogger.info(`Timer ${timerId.current} starting (after reset), duration: ${stateRef.current.duration}s`);
        setState(prev => ({
          ...prev,
          running: true,
          startTime,
          remaining: timerType === 'stopwatch' ? 0 : prev.duration,
          isInInterval: false,
          repeatCount: 0
        }));
      }, 50);
    } else {
      repeatCountRef.current = 0;
      const startTime = Date.now();
      timerLogger.info(`Timer ${timerId.current} starting, duration: ${currentState.duration}s`);
      setState(prev => ({
        ...prev,
        running: true,
        startTime,
        remaining: timerType === 'stopwatch' ? 0 : prev.duration,
        isInInterval: false,
        repeatCount: 0
      }));
    }
  }, []);

  const stop = useCallback(() => {
    timerLogger.info(`Timer ${timerId.current} stopped manually`);
    setState(prev => ({
      ...prev,
      running: false,
      startTime: null
    }));
  }, []);

  const pause = useCallback(() => {
    timerLogger.info(`Timer ${timerId.current} paused`);
    setState(prev => ({
      ...prev,
      running: false
    }));
  }, []);

  const resume = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.running && currentState.remaining > 0) {
      const startTime = Date.now() - (currentState.duration - currentState.remaining) * 1000;
      timerLogger.info(`Timer ${timerId.current} resumed`);
      setState(prev => ({
        ...prev,
        running: true,
        startTime
      }));
    }
  }, []);

  const reset = useCallback(() => {
    timerLogger.info(`Timer ${timerId.current} reset to ${stateRef.current.duration}s`);
    repeatCountRef.current = 0;
    if (intervalTimeoutRef.current) {
      clearTimeout(intervalTimeoutRef.current);
      intervalTimeoutRef.current = null;
    }
    setState(prev => ({
      ...prev,
      running: false,
      remaining: timerType === 'stopwatch' ? 0 : prev.duration,
      startTime: null,
      isInInterval: false,
      repeatCount: 0
    }));
  }, [timerType]);

  const updateDuration = useCallback((newDuration: number) => {
    timerLogger.info(`Timer ${timerId.current} duration updated: ${stateRef.current.duration}s -> ${newDuration}s`);
    setState(prev => ({
      ...prev,
      duration: newDuration,
      remaining: prev.running ? prev.remaining : newDuration
    }));
  }, []);

  return {
    ...state,
    start,
    stop,
    pause,
    resume,
    reset,
    updateDuration
  };
}



