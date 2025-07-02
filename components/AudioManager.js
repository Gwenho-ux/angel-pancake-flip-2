// AudioManager - Handles all game audio including background music and sound effects
class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentBgMusic = null;
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        this.isMusicMuted = false;
        
        this.initializeSounds();
    }

    initializeSounds() {
        // Define all game sounds
        const soundFiles = {
            background: 'assets/music/background.mp3',
            flip: 'assets/music/flip.mp3',
            cook: 'assets/music/cook.mp3',
            bling: 'assets/music/bling.mp3',
            fail: 'assets/music/fail.mp3',
            pour: 'assets/music/pour.mp3',
            click: 'assets/music/click.mp3',
            perfect: 'assets/music/perfect.mp3',
            good: 'assets/music/good.mp3',
            bad: 'assets/music/strained-gibberish-103110.mp3'
        };

        // Create audio objects for each sound
        Object.keys(soundFiles).forEach(key => {
            this.sounds[key] = new Audio(soundFiles[key]);
            this.sounds[key].preload = 'auto';
            
            // Set initial volumes
            if (key === 'background') {
                this.sounds[key].volume = this.musicVolume * this.masterVolume;
                this.sounds[key].loop = true;
            } else {
                this.sounds[key].volume = this.sfxVolume * this.masterVolume;
            }
        });

        // Special handling for cook sound (should loop during gameplay)
        this.sounds.cook.loop = true;
    }

    // Background music control
    playBackgroundMusic() {
        if (this.isMuted || this.isMusicMuted) return;
        
        this.stopBackgroundMusic(); // Stop any currently playing music
        this.currentBgMusic = this.sounds.background;
        
        const playPromise = this.currentBgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Background music autoplay prevented:', error);
            });
        }
    }

    stopBackgroundMusic() {
        if (this.currentBgMusic) {
            this.currentBgMusic.pause();
            this.currentBgMusic.currentTime = 0;
        }
    }

    // Cooking sound control (loops during gameplay)
    startCookingSound() {
        if (this.isMuted) return;
        
        const cookSound = this.sounds.cook;
        cookSound.currentTime = 0;
        const playPromise = cookSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Cooking sound play failed:', error);
            });
        }
    }

    stopCookingSound() {
        const cookSound = this.sounds.cook;
        cookSound.pause();
        cookSound.currentTime = 0;
    }

    // Sound effects
    playFlipSound() {
        this.playSound('flip');
    }

    playSuccessSound() {
        this.playSound('bling');
    }

    playFailSound() {
        this.playSound('fail');
    }

    playPourSound() {
        this.playSound('pour');
    }

    playClickSound() {
        this.playSound('click');
    }

    playPerfectResultSound() {
        this.playSound('perfect');
    }

    playGoodResultSound() {
        this.playSound('good');
    }

    playBadResultSound() {
        this.playSound('bad');
    }

    // Generic sound play method
    playSound(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log(`Sound ${soundName} play failed:`, error);
            });
        }
    }

    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateMusicVolume();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateSfxVolumes();
    }

    updateAllVolumes() {
        this.updateMusicVolume();
        this.updateSfxVolumes();
    }

    updateMusicVolume() {
        if (this.sounds.background) {
            this.sounds.background.volume = this.musicVolume * this.masterVolume;
        }
        if (this.sounds.cook) {
            this.sounds.cook.volume = this.sfxVolume * this.masterVolume * 0.6; // Cook sound slightly quieter
        }
    }

    updateSfxVolumes() {
        Object.keys(this.sounds).forEach(key => {
            if (key !== 'background') {
                this.sounds[key].volume = this.sfxVolume * this.masterVolume;
            }
        });
        
        // Special volume adjustment for cook sound
        if (this.sounds.cook) {
            this.sounds.cook.volume = this.sfxVolume * this.masterVolume * 0.6;
        }
    }

    // Mute controls
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.muteAll();
        } else {
            this.unmuteAll();
        }
        
        return this.isMuted;
    }

    muteAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.muted = true;
        });
    }

    unmuteAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.muted = false;
        });
    }

    // Music-only mute controls
    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        
        if (this.isMusicMuted) {
            this.stopBackgroundMusic();
        } else if (!this.isMuted) {
            // Only restart music if not globally muted
            this.playBackgroundMusic();
        }
        
        return this.isMusicMuted;
    }

    // Cleanup method
    destroy() {
        this.stopBackgroundMusic();
        this.stopCookingSound();
        
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    // Enable audio context (call this on first user interaction)
    enableAudio() {
        // This method can be called on first user interaction to enable audio context
        // Some browsers require user interaction before playing audio
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }
} 