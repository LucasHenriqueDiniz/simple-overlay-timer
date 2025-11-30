import { useState, useEffect, useRef, useCallback } from 'react';
import { timerLogger } from '../utils/logger';

export interface TimerState {
  running: boolean;
  remaining: number;
  startTime: number | null;
  duration: number;
}

export function useTimer(initialDuration: number) {
  const timerId = useRef<string>(`timer-${Date.now()}-${Math.random()}`);
  
  const [state, setState] = useState<TimerState>({
    running: false,
    remaining: initialDuration,
    startTime: null,
    duration: initialDuration
  });

  const intervalRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state; // Sempre manter a referência atualizada

  // Atualizar duração quando initialDuration mudar
  useEffect(() => {
    if (initialDuration !== state.duration) {
      timerLogger.info(`Timer ${timerId.current} duration updated from config: ${state.duration}s -> ${initialDuration}s`);
      setState(prev => ({
        ...prev,
        duration: initialDuration,
        remaining: prev.running ? prev.remaining : initialDuration
      }));
    }
  }, [initialDuration]);

  useEffect(() => {
    if (state.running && state.startTime) {
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
        const remaining = Math.max(0, currentState.duration - elapsed);
        
        // Log a cada 10 segundos ou quando próximo do fim
        if (remaining % 10 === 0 || remaining <= 5) {
          timerLogger.debug(`Timer ${timerId.current} remaining: ${remaining}s`);
        }
        
        setState(prev => ({
          ...prev,
          remaining
        }));

        if (remaining === 0) {
          timerLogger.info(`Timer ${timerId.current} completed!`);
          setState(prev => ({
            ...prev,
            running: false,
            startTime: null
          }));
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
    };
  }, [state.running, state.startTime, state.duration]);

  const start = useCallback(() => {
    const currentState = stateRef.current;
    console.log(`[TIMER:${timerId.current}] Start called. Current state: running=${currentState.running}, remaining=${currentState.remaining}s, duration=${currentState.duration}s`);
    
    if (currentState.running) {
      timerLogger.warn(`Timer ${timerId.current} already running, resetting...`);
      console.log(`[TIMER:${timerId.current}] Already running, resetting...`);
      setState(prev => ({
        ...prev,
        running: false,
        remaining: prev.duration,
        startTime: null
      }));
      // Aguardar um pouco antes de reiniciar
      setTimeout(() => {
        const startTime = Date.now();
        timerLogger.info(`Timer ${timerId.current} starting (after reset), duration: ${stateRef.current.duration}s`);
        console.log(`[TIMER:${timerId.current}] Starting after reset, duration: ${stateRef.current.duration}s`);
        setState(prev => ({
          ...prev,
          running: true,
          startTime,
          remaining: prev.duration
        }));
      }, 50);
    } else {
      const startTime = Date.now();
      timerLogger.info(`Timer ${timerId.current} starting, duration: ${currentState.duration}s`);
      console.log(`[TIMER:${timerId.current}] Starting timer with duration ${currentState.duration}s, startTime: ${startTime}`);
      setState(prev => ({
        ...prev,
        running: true,
        startTime,
        remaining: prev.duration
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

  const reset = useCallback(() => {
    timerLogger.info(`Timer ${timerId.current} reset to ${stateRef.current.duration}s`);
    setState(prev => ({
      ...prev,
      running: false,
      remaining: prev.duration,
      startTime: null
    }));
  }, []);

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
    reset,
    updateDuration
  };
}



