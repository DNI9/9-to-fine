let audioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Create two oscillators for a pleasant two-note notification
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);

    // Set up sound parameters for first note (higher pitch)
    oscillator1.type = "sine";
    oscillator1.frequency.setValueAtTime(987.77, audioContext.currentTime); // B5 note

    // Set up sound parameters for second note (lower pitch)
    oscillator2.type = "sine";
    oscillator2.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5 note

    // Create a gentle attack and release envelope for first note
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode1.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gainNode1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    // Create a gentle attack and release envelope for second note, slightly delayed
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
    gainNode2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.12);
    gainNode2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    // Play the sounds
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime + 0.1);
    oscillator1.stop(audioContext.currentTime + 0.2);
    oscillator2.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};
