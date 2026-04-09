/**
 * Utility to handle notification sounds across the application.
 */

const SOUNDS = {
    // Clear Chime for general notifications
    NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
    // Classic Message Received sound
    MESSAGE_RECEIVED: 'https://raw.githubusercontent.com/shixuewen/ios-message-sound/master/message.mp3',
    // Subtle send sound
    MESSAGE_SENT: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
};

let audioUnlocked = false;

/**
 * Unlocks audio on first user interaction to comply with browser policies.
 */
export const unlockAudio = () => {
    if (audioUnlocked) return;
    
    // Create a dummy audio to unlock the context
    const silentAudio = new Audio();
    silentAudio.play().then(() => {
        audioUnlocked = true;
    }).catch(() => {
        // Silently wait for another interaction
    });
};

/**
 * Plays a notification sound.
 * @param {('NOTIFICATION'|'MESSAGE_RECEIVED'|'MESSAGE_SENT')} type 
 */
export const playSound = (type = 'NOTIFICATION') => {
    try {
        const soundUrl = SOUNDS[type] || SOUNDS.NOTIFICATION;
        const audio = new Audio(soundUrl);
        audio.volume = 1.0; // Max volume for clarity
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Playback blocked by browser policy:', error);
            });
        }
    } catch (err) {
        console.error('Error playing sound:', err);
    }
};

export default {
    playSound,
    unlockAudio,
    types: {
        NOTIFICATION: 'NOTIFICATION',
        MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
        MESSAGE_SENT: 'MESSAGE_SENT'
    }
};
