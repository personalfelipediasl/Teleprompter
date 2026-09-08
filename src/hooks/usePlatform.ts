import { useState, useEffect } from 'react';

export interface PlatformDetails {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  hasSpeechRecognition: boolean;
  hasWakeLock: boolean;
  hasPiP: boolean;
  hasMediaRecorder: boolean;
  hasCamera: boolean;
}

export function usePlatform(): PlatformDetails {
  const [platform, setPlatform] = useState<PlatformDetails>({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isStandalone: false,
    hasSpeechRecognition: false,
    hasWakeLock: false,
    hasPiP: false,
    hasMediaRecorder: false,
    hasCamera: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid || /mobile/.test(ua);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    const hasSpeechRecognition =
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    const hasWakeLock = 'wakeLock' in navigator;
    const hasPiP = 'pictureInPictureEnabled' in document;
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    setPlatform({
      isIOS,
      isAndroid,
      isMobile,
      isStandalone,
      hasSpeechRecognition,
      hasWakeLock,
      hasPiP,
      hasMediaRecorder,
      hasCamera,
    });
  }, []);

  return platform;
}
